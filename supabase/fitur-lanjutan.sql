-- ============================================================
--  DUIT KITA — Fitur lanjutan
--    1. Transaksi cepat  (template 1-ketuk)
--    2. Langganan / transaksi berulang
--    3. Kunci PIN aplikasi
--
--  Buka Supabase -> SQL Editor -> New query, tempel SELURUH isi
--  file ini, lalu Run. Aman dijalankan berkali-kali (idempoten).
-- ============================================================

-- ---------- 1. TRANSAKSI CEPAT ----------
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

-- ---------- 2. LANGGANAN / BERULANG ----------
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
  hari            int not null default 1,   -- tgl 1..31 (bulanan/tahunan) / 0..6 (mingguan, 0=Minggu)
  bulan           int check (bulan between 1 and 12),   -- untuk siklus tahunan
  mulai           date not null default current_date,
  terakhir_dibuat date,
  otomatis        boolean not null default false,  -- true: catat otomatis; false: minta konfirmasi
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

-- ---------- 3. KUNCI PIN ----------
-- PIN di-hash (SHA-256) di sisi klien sebelum dikirim; server tak pernah
-- melihat PIN aslinya. Ini kunci kenyamanan, bukan enkripsi data —
-- keamanan sebenarnya tetap di Supabase Auth + RLS.
alter table public.profiles add column if not exists pin_hash text;
alter table public.profiles add column if not exists pin_salt text;
