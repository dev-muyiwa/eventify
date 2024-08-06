begin;
-- drop the column we added
alter table users drop column roles;
-- drop the enum type we created
drop type user_role;

commit;
