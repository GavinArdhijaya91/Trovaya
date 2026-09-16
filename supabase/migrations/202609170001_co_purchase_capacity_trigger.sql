begin;

-- Hardening: kunci kapasitas 3-5 di level database sebagai cakram
-- pengaman terakhir bila ada penulis selain API (service_role).
create or replace function enforce_co_purchase_capacity()
returns trigger
language plpgsql
as $$
declare
  circle_max integer;
  member_total integer;
begin
  select max_members into circle_max
  from co_purchase_circles
  where id = new.circle_id;

  if circle_max is null then
    raise exception 'Grup patungan % tidak ditemukan.', new.circle_id;
  end if;

  if circle_max < 3 or circle_max > 5 then
    raise exception 'Kapasitas grup harus 3-5 orang.';
  end if;

  select count(*) into member_total
  from co_purchase_members
  where circle_id = new.circle_id;

  if member_total + 1 > circle_max then
    raise exception 'Grup % sudah penuh (% orang).', new.circle_id, circle_max;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_co_purchase_capacity on co_purchase_members;
create trigger trg_co_purchase_capacity
  before insert on co_purchase_members
  for each row execute function enforce_co_purchase_capacity();

comment on function enforce_co_purchase_capacity() is
  'Hardening: tolak anggota melebihi max_members (3-5) walau ditulis di luar API.';

commit;
