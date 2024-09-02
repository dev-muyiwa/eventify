begin;
-- drop the triggers
drop trigger if exists update_events_updated_at on events;
drop trigger if exists update_tickets_updated_at on tickets;
drop trigger if exists update_users_updated_at on users;
-- drop the trigger function
drop function if exists update_updated_at_column;
-- drop the views
drop view if exists active_events;
drop view if exists active_tickets;
-- drop the indexes
drop index if exists events_name_index;
drop index if exists events_deleted_at_index;
drop index if exists tickets_event_id_index;
-- drop the tables
drop table if exists tickets;
drop table if exists events;
commit;
