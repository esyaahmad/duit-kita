-- ============================================================
--  DUIT KITA — Fitur "Dompet Bersama" (join dompet)
--
--  Dua orang bisa berbagi satu dompet untuk mencatat
--  pengeluaran keluarga bersama-sama.
--
--  Cara pakai: buka Supabase -> SQL Editor -> New query,
--  tempel SELURUH isi file ini, lalu Run.
--  Aman dijalankan berkali-kali (idempoten).
-- ============================================================

-- ---------- TABEL BARU ----------

-- Siapa saja anggota tiap dompet (pemilik TIDAK dicatat di sini,
-- pemilik = wallets.user_id).
create table if not exists public.wallet_members (
  wallet_id  uuid not null references public.wallets(id)  on delete cascade,
  user_id    uuid not null references auth.users(id)       on delete cascade,
  created_at timestamptz not null default now(),
  primary key (wallet_id, user_id)
);

create index if not exists wallet_members_user_idx on public.wallet_members (user_id);

-- Kode undangan sekali pakai untuk mengajak orang lain gabung.
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

-- ---------- FUNGSI BANTU ----------
-- SECURITY DEFINER: jalan sebagai pemilik tabel sehingga TIDAK
-- ikut aturan RLS -> mencegah rekursi ketika dipakai di policy.

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

-- Apakah user sekarang berbagi minimal satu dompet dengan `other`?
-- Dipakai agar kategori & nama pencatat milik anggota lain ikut terbaca.
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

-- ---------- RLS: WALLETS ----------

drop policy if exists "dompet milik sendiri" on public.wallets;
drop policy if exists "dompet: lihat"        on public.wallets;
drop policy if exists "dompet: buat"         on public.wallets;
drop policy if exists "dompet: ubah"         on public.wallets;
drop policy if exists "dompet: hapus"        on public.wallets;

create policy "dompet: lihat" on public.wallets
  for select using (public.is_wallet_member(id));

create policy "dompet: buat" on public.wallets
  for insert with check (user_id = auth.uid());

-- hanya pemilik yang boleh mengubah / menghapus setelan dompet
create policy "dompet: ubah" on public.wallets
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "dompet: hapus" on public.wallets
  for delete using (user_id = auth.uid());

-- ---------- RLS: WALLET_MEMBERS ----------

drop policy if exists "anggota: lihat"  on public.wallet_members;
drop policy if exists "anggota: keluar" on public.wallet_members;

create policy "anggota: lihat" on public.wallet_members
  for select using (user_id = auth.uid() or public.is_wallet_member(wallet_id));

-- anggota bisa keluar sendiri; pemilik bisa mengeluarkan anggota
create policy "anggota: keluar" on public.wallet_members
  for delete using (user_id = auth.uid() or public.is_wallet_owner(wallet_id));

-- INSERT hanya lewat fungsi join_wallet_with_code() -> tidak ada policy INSERT.

-- ---------- RLS: WALLET_INVITES ----------

drop policy if exists "undangan: lihat" on public.wallet_invites;
drop policy if exists "undangan: hapus" on public.wallet_invites;

create policy "undangan: lihat" on public.wallet_invites
  for select using (dibuat_oleh = auth.uid() or public.is_wallet_owner(wallet_id));

create policy "undangan: hapus" on public.wallet_invites
  for delete using (public.is_wallet_owner(wallet_id));

-- INSERT/UPDATE hanya lewat fungsi (SECURITY DEFINER).

-- ---------- RLS: TRANSACTIONS ----------

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

-- semua anggota dompet boleh membetulkan / menghapus transaksi di dompet itu
create policy "transaksi: ubah" on public.transactions
  for update using (user_id = auth.uid() or public.is_wallet_member(wallet_id))
  with check (user_id = auth.uid() or public.is_wallet_member(wallet_id));

create policy "transaksi: hapus" on public.transactions
  for delete using (user_id = auth.uid() or public.is_wallet_member(wallet_id));

-- ---------- RLS: CATEGORIES ----------
-- anggota lain boleh MEMBACA kategori kita (agar label kategori
-- pada transaksi mereka ikut tampil); menulis tetap milik sendiri.

drop policy if exists "kategori milik sendiri" on public.categories;
drop policy if exists "kategori: lihat" on public.categories;
drop policy if exists "kategori: tulis" on public.categories;

create policy "kategori: lihat" on public.categories
  for select using (user_id = auth.uid() or public.shares_any_wallet(user_id));

create policy "kategori: tulis" on public.categories
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- RLS: PROFILES ----------
-- anggota dompet bersama boleh membaca nama satu sama lain.

drop policy if exists "profil milik sendiri" on public.profiles;
drop policy if exists "profil: lihat" on public.profiles;
drop policy if exists "profil: tulis" on public.profiles;

create policy "profil: lihat" on public.profiles
  for select using (id = auth.uid() or public.shares_any_wallet(id));

create policy "profil: tulis" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- ---------- VIEW SALDO DOMPET ----------
-- Sama seperti sebelumnya, tetapi karena RLS transaksi yang baru,
-- saldo dompet bersama kini dihitung dari SEMUA transaksi di dompet
-- itu (siapa pun yang mencatat), bukan hanya milik satu orang.

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

-- ---------- FUNGSI: buat kode undangan ----------

create or replace function public.buat_undangan_dompet(p_wallet_id uuid)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_alpha text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';  -- tanpa huruf/angka rancu
  v_kode  text;
  i int;
begin
  if not public.is_wallet_owner(p_wallet_id) then
    raise exception 'Hanya pemilik dompet yang bisa mengundang';
  end if;

  if (select count(*) from public.wallet_members where wallet_id = p_wallet_id) >= 1 then
    raise exception 'Dompet ini sudah punya anggota lain (maksimal 2 orang)';
  end if;

  -- buang undangan lama yang belum dipakai
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

-- ---------- FUNGSI: gabung dompet pakai kode ----------

create or replace function public.join_wallet_with_code(p_kode text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v public.wallet_invites;
begin
  select * into v from public.wallet_invites
   where kode = upper(regexp_replace(coalesce(p_kode, ''), '\s', '', 'g'))
   limit 1;

  if v.id is null then
    raise exception 'Kode undangan tidak ditemukan';
  end if;
  if v.dipakai_oleh is not null then
    raise exception 'Kode undangan sudah dipakai';
  end if;
  if v.kedaluwarsa_at < now() then
    raise exception 'Kode undangan sudah kedaluwarsa';
  end if;
  if public.is_wallet_owner(v.wallet_id) then
    raise exception 'Ini dompetmu sendiri';
  end if;
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
