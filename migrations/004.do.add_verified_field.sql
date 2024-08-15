begin;
-- add a new column to the users table to store the user's verification status
alter table users add column verified_at timestamptz default null;
-- update the active_users view to include the new roles column
create or replace view active_users as select * from users where deleted_at is null;
commit;
