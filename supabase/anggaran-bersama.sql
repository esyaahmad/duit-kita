-- ============================================================
--  DUIT KITA — Anggaran Bersama
--
--  Anggaran bulanan milik BERDUA (pasangan pengguna yang berbagi
--  minimal satu dompet), bukan milik satu dompet tertentu.
--  "Terpakai" menjumlahkan pengeluaran di SEMUA dompet bersama
--  antar mereka, dicocokkan lewat nama kategori.
--
--  Butuh fungsi shares_any_wallet() dari supabase/dompet-bersama.sql
--  (jalankan file itu lebih dulu kalau belum).
--
--  Buka Supabase -> SQL Editor -> New query, tempel isi file ini, Run.
--  Aman dijalankan berkali-kali.
--
--  CATATAN: kalau kamu sempat memakai versi lama (per dompet),
--  isian lama dibuang — tinggal isi ulang, prosesnya sekarang lebih ringkas.
-- ============================================================

drop table if exists public.shared_budgets cascade;

create table public.shared_budgets (
  id            uuid primary key default gen_random_uuid(),
  user_a        uuid not null references auth.users(id) on delete cascade,
  user_b        uuid not null references auth.users(id) on delete cascade,
  kategori_nama text not null,
  jumlah        numeric(16,2) not null check (jumlah >= 0),
  periode       text not null,                       -- 'YYYY-MM'
  oleh          uuid references auth.users(id) on delete set null,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  constraint shared_budgets_urut check (user_a < user_b),
  unique (user_a, user_b, kategori_nama, periode)
);

create index shared_budgets_pihak_idx
  on public.shared_budgets (user_a, user_b, periode);

alter table public.shared_budgets enable row level security;

-- Kedua pihak boleh lihat & ubah. Saat menulis dipastikan penulis
-- adalah salah satu pihak DAN benar-benar berbagi dompet dengan pihak lain.
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

-- Anggaran bersama dicocokkan lewat NAMA kategori. Supaya kedua pihak
-- sama-sama bisa mencatat transaksi yang terhitung ke anggaran itu,
-- pastikan keduanya punya kategori (expense) bernama sama.
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
