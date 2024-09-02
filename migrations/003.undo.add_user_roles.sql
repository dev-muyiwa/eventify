begin;
-- drop the column we added
alter table users drop column roles;
alter table users drop column verified_at;
-- drop the enum type we created
drop type user_role;

commit;
