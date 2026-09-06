-- ============================================================
--  DUIT KITA — skema database Supabase
--  Jalankan seluruh isi file ini di Supabase -> SQL Editor
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- TABEL ----------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nama        text,
  created_at  timestamptz not null default now()
);

create table if not exists public.wallets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nama        text not null,
  jenis       text not null default 'cash' check (jenis in ('cash','bank','ewallet','kartu','investasi')),
  saldo_awal  numeric(16,2) not null default 0,
  warna       text not null default '#D9A21B',
  urutan      int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nama        text not null,
  tipe        text not null check (tipe in ('income','expense')),
  ikon        text not null default '💸',
  created_at  timestamptz not null default now()
);

create table if not exists public.transactions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  wallet_id        uuid references public.wallets(id) on delete set null,
  wallet_tujuan_id uuid references public.wallets(id) on delete set null,
  category_id      uuid references public.categories(id) on delete set null,
  tipe             text not null check (tipe in ('income','expense','transfer')),
  jumlah           numeric(16,2) not null check (jumlah > 0),
  catatan          text,
  tanggal          date not null default current_date,
  created_at       timestamptz not null default now()
);

create index if not exists transactions_user_tanggal_idx
  on public.transactions (user_id, tanggal desc);

create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  jumlah      numeric(16,2) not null check (jumlah >= 0),
  periode     text not null,                       -- format 'YYYY-MM'
  unique (user_id, category_id, periode)
);

create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  nama           text not null,
  target         numeric(16,2) not null check (target > 0),
  terkumpul      numeric(16,2) not null default 0,
  target_tanggal date,
  ikon           text not null default '🎯',
  created_at     timestamptz not null default now()
);

-- ---------- ROW LEVEL SECURITY ----------
-- Tiap orang hanya bisa membaca & menulis barisnya sendiri.

alter table public.profiles     enable row level security;
alter table public.wallets      enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets      enable row level security;
alter table public.goals        enable row level security;

drop policy if exists "profil milik sendiri" on public.profiles;
create policy "profil milik sendiri" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "dompet milik sendiri" on public.wallets;
create policy "dompet milik sendiri" on public.wallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "kategori milik sendiri" on public.categories;
create policy "kategori milik sendiri" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "transaksi milik sendiri" on public.transactions;
create policy "transaksi milik sendiri" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "anggaran milik sendiri" on public.budgets;
create policy "anggaran milik sendiri" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "target milik sendiri" on public.goals;
create policy "target milik sendiri" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- VIEW SALDO DOMPET ----------
-- security_invoker = on  → view ikut aturan RLS pemanggilnya.

create or replace view public.wallet_balances with (security_invoker = on) as
select
  w.id, w.user_id, w.nama, w.jenis, w.warna, w.urutan, w.saldo_awal,
  w.saldo_awal
    + coalesce((select sum(t.jumlah) from public.transactions t
                where t.wallet_id = w.id and t.tipe = 'income'), 0)
    - coalesce((select sum(t.jumlah) from public.transactions t
                where t.wallet_id = w.id and t.tipe = 'expense'), 0)
    - coalesce((select sum(t.jumlah) from public.transactions t
                where t.wallet_id = w.id and t.tipe = 'transfer'), 0)
    + coalesce((select sum(t.jumlah) from public.transactions t
                where t.wallet_tujuan_id = w.id and t.tipe = 'transfer'), 0)
  as saldo
from public.wallets w;

-- ---------- ISI AWAL SAAT DAFTAR ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nama)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.wallets (user_id, nama, jenis, saldo_awal, warna, urutan) values
    (new.id, 'Dompet tunai',  'cash',   0, '#D9A21B', 1),
    (new.id, 'Rekening bank', 'bank',   0, '#0F6E63', 2),
    (new.id, 'E-wallet',      'ewallet',0, '#B5462B', 3);

  insert into public.categories (user_id, nama, tipe, ikon) values
    (new.id, 'Makan & minum',   'expense', '🍜'),
    (new.id, 'Transportasi',    'expense', '🛵'),
    (new.id, 'Belanja',         'expense', '🛒'),
    (new.id, 'Tagihan & pulsa', 'expense', '🧾'),
    (new.id, 'Kesehatan',       'expense', '🩺'),
    (new.id, 'Hiburan',         'expense', '🎬'),
    (new.id, 'Pendidikan',      'expense', '📚'),
    (new.id, 'Lain-lain',       'expense', '📦'),
    (new.id, 'Gaji',            'income',  '💼'),
    (new.id, 'Usaha',           'income',  '🏪'),
    (new.id, 'Bonus',           'income',  '🎁'),
    (new.id, 'Pemasukan lain',  'income',  '➕');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
