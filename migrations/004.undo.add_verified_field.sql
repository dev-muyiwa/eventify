begin;
-- drop the column we added
alter table users drop column verified_at;

commit;
