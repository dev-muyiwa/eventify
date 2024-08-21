begin;
-- drop the tables
drop table if exists orders;
drop table if exists order_items;
drop table if exists payments;
-- drop the type
drop type if exists payment_status;
-- add the columns back to the tickets_reservations table
alter table if exists tickets_reservations
    add column if not exists available_quantity int4 not null default 0 check (available_quantity >= 0),
    add column if not exists quantity           int2 not null default 1 check (quantity > 0),
    drop column if exists order_item_id;

commit;
