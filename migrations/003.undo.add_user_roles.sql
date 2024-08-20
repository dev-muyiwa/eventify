begin;
-- drop the column we added
alter table users drop column roles;
alter table users drop column verified_at;
alter table tickets_reservations drop column status;
-- drop the enum type we created
drop type user_role;
drop type ticket_status;

commit;
