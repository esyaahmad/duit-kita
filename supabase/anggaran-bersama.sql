-- ============================================================
--  DUIT KITA — Fitur "Anggaran Bersama"
--
--  Anggaran bulanan yang dipakai berdua lewat dompet bersama.
--  Butuh fungsi is_wallet_member() dari supabase/dompet-bersama.sql,
--  jadi jalankan file itu lebih dulu kalau belum.
--
--  Buka Supabase -> SQL Editor -> New query, tempel isi file ini, Run.
--  Aman dijalankan berkali-kali (idempoten).
-- ============================================================

-- Anggaran per kategori (dicocokkan berdasarkan NAMA kategori supaya
-- transaksi dari kedua anggota — yang punya id kategori berbeda —
-- tetap terhitung), per periode, untuk satu dompet bersama.
create table if not exists public.shared_budgets (
  id            uuid primary key default gen_random_uuid(),
  wallet_id     uuid not null references public.wallets(id) on delete cascade,
  kategori_nama text not null,
  jumlah        numeric(16,2) not null check (jumlah >= 0),
  periode       text not null,                 -- 'YYYY-MM'
  oleh          uuid references auth.users(id) on delete set null,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (wallet_id, kategori_nama, periode)
);

create index if not exists shared_budgets_wallet_idx
  on public.shared_budgets (wallet_id, periode);

alter table public.shared_budgets enable row level security;

-- Semua anggota dompet (pemilik + yang bergabung) boleh lihat & ubah.
drop policy if exists "anggaran bersama: anggota" on public.shared_budgets;
create policy "anggaran bersama: anggota" on public.shared_budgets
  for all
  using (public.is_wallet_member(wallet_id))
  with check (public.is_wallet_member(wallet_id));
