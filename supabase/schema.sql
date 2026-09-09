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

-- ============================================================
--  DOMPET BERSAMA (join dompet)
--  Isi identik dengan supabase/dompet-bersama.sql — disertakan
--  di sini supaya instalasi baru langsung lengkap. Untuk database
--  yang sudah jalan, cukup jalankan supabase/dompet-bersama.sql.
-- ============================================================

create table if not exists public.wallet_members (
  wallet_id  uuid not null references public.wallets(id)  on delete cascade,
  user_id    uuid not null references auth.users(id)       on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wallet_id, user_id)
);

create index if not exists wallet_members_user_idx on public.wallet_members (user_id);

create table if not exists public.wallet_invites (
  id             uuid primary key default gen_random_uuid(),
  wallet_id      uuid not null references public.wallets(id) on delete cascade,
  kode           text not null unique,
  dibuat_oleh    uuid not null references auth.users(id) on delete cascade,
  dipakai_oleh   uuid references auth.users(id) on delete set null,
  dipakai_at     timestamptz,
  kedaluwarsa_at timestamptz not null default (now() + interval '7 days'),
  created_at     timestamptz not null default now()
);

create index if not exists wallet_invites_wallet_idx on public.wallet_invites (wallet_id);

alter table public.wallet_members enable row level security;
alter table public.wallet_invites enable row level security;

create or replace function public.is_wallet_owner(w uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.wallets where id = w and user_id = auth.uid()
  );
$$;

create or replace function public.is_wallet_member(w uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.wallets        where id = w        and user_id = auth.uid()
    union all
    select 1 from public.wallet_members where wallet_id = w and user_id = auth.uid()
  );
$$;

create or replace function public.shares_any_wallet(other uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.wallet_members a
    join public.wallet_members b on b.wallet_id = a.wallet_id
    where a.user_id = auth.uid() and b.user_id = other
    union all
    select 1 from public.wallet_members m
    join public.wallets w on w.id = m.wallet_id
    where m.user_id = auth.uid() and w.user_id = other
    union all
    select 1 from public.wallets w
    join public.wallet_members m on m.wallet_id = w.id
    where w.user_id = auth.uid() and m.user_id = other
  );
$$;

grant execute on function public.is_wallet_owner(uuid)   to authenticated;
grant execute on function public.is_wallet_member(uuid)  to authenticated;
grant execute on function public.shares_any_wallet(uuid) to authenticated;

drop policy if exists "dompet milik sendiri" on public.wallets;
drop policy if exists "dompet: lihat"        on public.wallets;
drop policy if exists "dompet: buat"         on public.wallets;
drop policy if exists "dompet: ubah"         on public.wallets;
drop policy if exists "dompet: hapus"        on public.wallets;

create policy "dompet: lihat" on public.wallets
  for select using (public.is_wallet_member(id));
create policy "dompet: buat" on public.wallets
  for insert with check (user_id = auth.uid());
create policy "dompet: ubah" on public.wallets
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "dompet: hapus" on public.wallets
  for delete using (user_id = auth.uid());

drop policy if exists "anggota: lihat"  on public.wallet_members;
drop policy if exists "anggota: keluar" on public.wallet_members;

create policy "anggota: lihat" on public.wallet_members
  for select using (user_id = auth.uid() or public.is_wallet_member(wallet_id));
create policy "anggota: keluar" on public.wallet_members
  for delete using (user_id = auth.uid() or public.is_wallet_owner(wallet_id));

drop policy if exists "undangan: lihat" on public.wallet_invites;
drop policy if exists "undangan: hapus" on public.wallet_invites;

create policy "undangan: lihat" on public.wallet_invites
  for select using (dibuat_oleh = auth.uid() or public.is_wallet_owner(wallet_id));
create policy "undangan: hapus" on public.wallet_invites
  for delete using (public.is_wallet_owner(wallet_id));

drop policy if exists "transaksi milik sendiri" on public.transactions;
drop policy if exists "transaksi: lihat"  on public.transactions;
drop policy if exists "transaksi: buat"   on public.transactions;
drop policy if exists "transaksi: ubah"   on public.transactions;
drop policy if exists "transaksi: hapus"  on public.transactions;

create policy "transaksi: lihat" on public.transactions
  for select using (
    user_id = auth.uid()
    or public.is_wallet_member(wallet_id)
    or public.is_wallet_member(wallet_tujuan_id)
  );
create policy "transaksi: buat" on public.transactions
  for insert with check (
    user_id = auth.uid()
    and (wallet_id is null or public.is_wallet_member(wallet_id))
    and (wallet_tujuan_id is null or public.is_wallet_member(wallet_tujuan_id))
  );
create policy "transaksi: ubah" on public.transactions
  for update using (user_id = auth.uid() or public.is_wallet_member(wallet_id))
  with check (user_id = auth.uid() or public.is_wallet_member(wallet_id));
create policy "transaksi: hapus" on public.transactions
  for delete using (user_id = auth.uid() or public.is_wallet_member(wallet_id));

drop policy if exists "kategori milik sendiri" on public.categories;
drop policy if exists "kategori: lihat" on public.categories;
drop policy if exists "kategori: tulis" on public.categories;

create policy "kategori: lihat" on public.categories
  for select using (user_id = auth.uid() or public.shares_any_wallet(user_id));
create policy "kategori: tulis" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "profil milik sendiri" on public.profiles;
drop policy if exists "profil: lihat" on public.profiles;
drop policy if exists "profil: tulis" on public.profiles;

create policy "profil: lihat" on public.profiles
  for select using (id = auth.uid() or public.shares_any_wallet(id));
create policy "profil: tulis" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.buat_undangan_dompet(p_wallet_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_alpha text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_kode  text;
  i int;
begin
  if not public.is_wallet_owner(p_wallet_id) then
    raise exception 'Hanya pemilik dompet yang bisa mengundang';
  end if;
  if (select count(*) from public.wallet_members where wallet_id = p_wallet_id) >= 1 then
    raise exception 'Dompet ini sudah punya anggota lain (maksimal 2 orang)';
  end if;

  delete from public.wallet_invites
   where wallet_id = p_wallet_id and dipakai_oleh is null;

  loop
    v_kode := '';
    for i in 1..6 loop
      v_kode := v_kode || substr(v_alpha, floor(random() * length(v_alpha))::int + 1, 1);
    end loop;
    exit when not exists (select 1 from public.wallet_invites where kode = v_kode);
  end loop;

  insert into public.wallet_invites (wallet_id, kode, dibuat_oleh)
  values (p_wallet_id, v_kode, auth.uid());

  return v_kode;
end;
$$;

create or replace function public.join_wallet_with_code(p_kode text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v public.wallet_invites;
begin
  select * into v from public.wallet_invites
   where kode = upper(regexp_replace(coalesce(p_kode, ''), '\s', '', 'g'))
   limit 1;

  if v.id is null then raise exception 'Kode undangan tidak ditemukan'; end if;
  if v.dipakai_oleh is not null then raise exception 'Kode undangan sudah dipakai'; end if;
  if v.kedaluwarsa_at < now() then raise exception 'Kode undangan sudah kedaluwarsa'; end if;
  if public.is_wallet_owner(v.wallet_id) then raise exception 'Ini dompetmu sendiri'; end if;
  if exists (select 1 from public.wallet_members
              where wallet_id = v.wallet_id and user_id = auth.uid()) then
    raise exception 'Kamu sudah tergabung di dompet ini';
  end if;
  if (select count(*) from public.wallet_members where wallet_id = v.wallet_id) >= 1 then
    raise exception 'Dompet ini sudah penuh (maksimal 2 orang)';
  end if;

  insert into public.wallet_members (wallet_id, user_id) values (v.wallet_id, auth.uid());
  update public.wallet_invites
     set dipakai_oleh = auth.uid(), dipakai_at = now()
   where id = v.id;

  return v.wallet_id;
end;
$$;

grant execute on function public.buat_undangan_dompet(uuid) to authenticated;
grant execute on function public.join_wallet_with_code(text) to authenticated;

-- ============================================================
--  FITUR LANJUTAN: transaksi cepat, langganan, kunci PIN
--  Isi identik dengan supabase/fitur-lanjutan.sql.
-- ============================================================

create table if not exists public.quick_txns (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text not null,
  tipe        text not null default 'expense' check (tipe in ('income','expense')),
  jumlah      numeric(16,2) not null check (jumlah > 0),
  category_id uuid references public.categories(id) on delete set null,
  wallet_id   uuid references public.wallets(id) on delete set null,
  catatan     text,
  urutan      int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists quick_txns_user_idx on public.quick_txns (user_id, urutan);

create table if not exists public.recurring (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  nama            text not null,
  tipe            text not null default 'expense' check (tipe in ('income','expense')),
  jumlah          numeric(16,2) not null check (jumlah > 0),
  category_id     uuid references public.categories(id) on delete set null,
  wallet_id       uuid references public.wallets(id) on delete set null,
  catatan         text,
  siklus          text not null default 'bulanan'
                  check (siklus in ('mingguan','bulanan','tahunan')),
  hari            int not null default 1,
  bulan           int check (bulan between 1 and 12),
  mulai           date not null default current_date,
  terakhir_dibuat date,
  otomatis        boolean not null default false,
  aktif           boolean not null default true,
  created_at      timestamptz not null default now()
);
create index if not exists recurring_user_idx on public.recurring (user_id);

alter table public.quick_txns enable row level security;
alter table public.recurring  enable row level security;

drop policy if exists "cepat milik sendiri" on public.quick_txns;
create policy "cepat milik sendiri" on public.quick_txns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "berulang milik sendiri" on public.recurring;
create policy "berulang milik sendiri" on public.recurring
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.profiles add column if not exists pin_hash text;
alter table public.profiles add column if not exists pin_salt text;

-- ============================================================
--  ANGGARAN BERSAMA (identik dengan supabase/anggaran-bersama.sql)
--  Milik pasangan pengguna (user_a, user_b), bukan satu dompet.
-- ============================================================

drop table if exists public.shared_budgets cascade;

create table public.shared_budgets (
  id            uuid primary key default gen_random_uuid(),
  user_a        uuid not null references auth.users(id) on delete cascade,
  user_b        uuid not null references auth.users(id) on delete cascade,
  kategori_nama text not null,
  jumlah        numeric(16,2) not null check (jumlah >= 0),
  periode       text not null,
  oleh          uuid references auth.users(id) on delete set null,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  constraint shared_budgets_urut check (user_a < user_b),
  unique (user_a, user_b, kategori_nama, periode)
);
create index shared_budgets_pihak_idx
  on public.shared_budgets (user_a, user_b, periode);

alter table public.shared_budgets enable row level security;

drop policy if exists "anggaran bersama: pihak terkait" on public.shared_budgets;
create policy "anggaran bersama: pihak terkait" on public.shared_budgets
  for all
  using (auth.uid() in (user_a, user_b))
  with check (
    auth.uid() in (user_a, user_b)
    and public.shares_any_wallet(
      case when auth.uid() = user_a then user_b else user_a end
    )
  );

create or replace function public.sinkron_kategori_bersama(p_lawan uuid, p_nama text[])
returns void
language plpgsql security definer set search_path = public as $$
declare n text;
begin
  if p_lawan is null or auth.uid() = p_lawan or not public.shares_any_wallet(p_lawan) then
    raise exception 'bukan pasangan berbagi dompet';
  end if;
  foreach n in array coalesce(p_nama, array[]::text[]) loop
    if n is null or btrim(n) = '' then continue; end if;
    insert into public.categories (user_id, nama, tipe, ikon)
    select x.uid, n, 'expense',
      coalesce((select c.ikon from public.categories c
                where c.nama = n and c.tipe = 'expense'
                  and c.user_id in (auth.uid(), p_lawan) limit 1), '📦')
    from (values (auth.uid()), (p_lawan)) as x(uid)
    where not exists (
      select 1 from public.categories c
      where c.user_id = x.uid and c.nama = n and c.tipe = 'expense'
    );
  end loop;
end;
$$;

grant execute on function public.sinkron_kategori_bersama(uuid, text[]) to authenticated;
