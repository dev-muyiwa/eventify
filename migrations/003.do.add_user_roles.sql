begin;
-- create a new enum type for user roles
create type user_role as enum ('admin', 'organizer', 'user');
-- add a new column to the users table to store the user's roles
alter table users add column roles user_role[] not null default array ['user'::user_role];

commit;
