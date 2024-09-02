begin;
-- drop the tables
drop table if exists carts;
drop table if exists cart_items;
drop table if exists payments;
-- drop the type
drop type if exists payment_status;
drop type if exists order_status;
commit;
