begin;

-- drop all views
drop view if exists active_users;
drop view if exists active_tokens;
-- drop all indexes
drop index if exists tokens_token_index;
drop index if exists users_deleted_at_index;
drop index if exists users_email_index;
-- drop all tables
drop table if exists users;
drop table if exists tokens;
-- drop all types
drop type if exists token_type;

commit;