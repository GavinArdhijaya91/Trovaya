-- Run in the Supabase SQL Editor after applying co-purchase migrations.
-- Harapan: lingkaran terbaca publik, anggota terbaca publik,
-- tulis hanya via service_role (API), trigger menolak kelebihan anggota.

-- 1. RLS aktif di kedua tabel
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('co_purchase_circles', 'co_purchase_members')
order by tablename;

-- 2. Policy yang terpasang
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('co_purchase_circles', 'co_purchase_members')
order by tablename, policyname;

-- 3. Hak anon/authenticated: hanya SELECT, tanpa INSERT/UPDATE/DELETE
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('co_purchase_circles', 'co_purchase_members')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- 4. CHECK kapasitas 3-5 dan trigger pengaman ada
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid in ('co_purchase_circles'::regclass, 'co_purchase_members'::regclass)
order by conname;

select trigger_name, event_manipulation, action_statement
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table = 'co_purchase_members'
order by trigger_name;

-- 5. Uji negatif manual (jalankan sebagai postgres/service_role lalu ROLLBACK):
-- begin;
-- insert into co_purchase_members (circle_id, member_wallet, share_wei)
-- values ('<CIRCLE_ID>', '0x0000000000000000000000000000000000000001', '1');
-- -- Harus gagal bila grup penuh; pastikan tidak ada baris baru:
-- rollback;
