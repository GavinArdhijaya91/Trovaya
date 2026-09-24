-- Uji negatif RLS co_purchase_members (jalankan setelah semua migration co-purchase).
-- Pola: anon-access probe seperti verifikasi public-gallery boundary.
-- Harapan:
--   1. anon TIDAK bisa baca member dari circle CANCELLED  -> 0 baris (bukan error).
--   2. anon TETAP BISA baca member dari circle OPEN/LOCKED/PURCHASED (kolom wallet+status).
--   3. anon TIDAK bisa baca kolom share_wei langsung.
--
-- Cara pakai (Supabase SQL Editor, sebagai service_role/postgres):
--   Jalankan blok SETUP sekali, lalu tiap probe dengan `set role anon; ... reset role;`
--   Akhiri dengan blok CLEANUP (rollback manual bila dibungkus transaksi).

-- ===== SETUP (service_role): buat 2 circle uji + 1 member tiap circle =====
-- begin;
-- insert into co_purchase_circles (id, chain_id, token_id, leader_wallet, target_fee_wei, max_members, status)
-- values
--   ('11111111-1111-1111-1111-111111111111', 97, 1, '0x0000000000000000000000000000000000000001', '1000', 3, 'OPEN'),
--   ('22222222-2222-2222-2222-222222222222', 97, 1, '0x0000000000000000000000000000000000000002', '1000', 3, 'CANCELLED')
-- on conflict (id) do update set status = excluded.status;
-- insert into co_purchase_members (circle_id, member_wallet, share_wei, status)
-- values
--   ('11111111-1111-1111-1111-111111111111', '0x0000000000000000000000000000000000000001', '333', 'JOINED'),
--   ('22222222-2222-2222-2222-222222222222', '0x0000000000000000000000000000000000000002', '333', 'JOINED')
-- on conflict (circle_id, member_wallet) do nothing;

-- ===== PROBE 1 (anon): member circle OPEN terlihat =====
-- set role anon;
-- select circle_id, member_wallet, status from co_purchase_members
--  where circle_id = '11111111-1111-1111-1111-111111111111';
-- -- Harapan: 1 baris.
-- reset role;

-- ===== PROBE 2 (anon): member circle CANCELLED kosong =====
-- set role anon;
-- select circle_id, member_wallet, status from co_purchase_members
--  where circle_id = '22222222-2222-2222-2222-222222222222';
-- -- Harapan: 0 baris (RLS menyaring, bukan error).
-- reset role;

-- ===== PROBE 3 (anon): kolom share_wei ditolak =====
-- set role anon;
-- select share_wei from co_purchase_members
--  where circle_id = '11111111-1111-1111-1111-111111111111';
-- -- Harapan: ERROR permission denied (column-level grant menyembunyikan nominal).
-- reset role;

-- ===== PROBE 4 (anon): view allowlisted tanpa share_wei =====
-- set role anon;
-- select circle_id, member_wallet, status from public_circle_members
--  where circle_id = '11111111-1111-1111-1111-111111111111';
-- -- Harapan: 1 baris; CANCELLED via view juga 0 baris.
-- reset role;

-- ===== CLEANUP (service_role) =====
-- delete from co_purchase_members
--  where circle_id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
-- delete from co_purchase_circles
--  where id in ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
-- -- commit; (atau rollback; bila setup dibungkus begin;)
