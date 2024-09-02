begin;
-- create a trigger function to update the updated_at column
create or replace function update_updated_at_column()
    returns trigger as
$$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- create events table
create table if not exists events
(
    id           uuid primary key      default gen_random_uuid(),
    name         varchar(100) not null,
    description  text         not null,
    location     text         not null,
    starts_at    timestamptz  not null,
    ends_at      timestamptz  not null,
    metadata     jsonb        not null default '{}',
--     relationships
    creator_id   uuid         not null references users (id) on delete cascade,
--     timestamps
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now(),
    published_at timestamptz           default null,
    deleted_at   timestamptz           default null,
--     constraints
    check (starts_at < ends_at),
    check (starts_at > now()),
    unique (name, creator_id)
);

-- add indexes to the events table
create index if not exists events_name_index on events (name);
create index if not exists events_deleted_at_index on events (deleted_at);

-- create a view for active events
create view active_events as
select *
from events
where deleted_at is null
  and published_at is not null;

-- create a trigger to update the updated_at column
create trigger update_events_updated_at
    before update
    on events
    for each row
execute function update_updated_at_column();

-- create a tickets table
create table if not exists tickets
(
    id                 uuid primary key        default gen_random_uuid(),
    name               varchar(50)    not null,
    description        text           not null,
    available_quantity int4           not null check (available_quantity >= 0),
    price              decimal(10, 4) not null check (price > 0),
-- relationships
    event_id           uuid           not null references events (id) on delete cascade,
--     timestamps
    created_at         timestamptz    not null default now(),
    updated_at         timestamptz    not null default now()
);

-- add indexes to the tickets table
create index if not exists tickets_event_id_index on tickets (event_id);

-- create a trigger to update the updated_at column in the tickets table
create trigger update_tickets_updated_at
    before update
    on tickets
    for each row
execute function update_updated_at_column();

-- create a trigger to update the updated_at column in the users table
create trigger update_users_updated_at
    before update
    on users
    for each row
execute function update_updated_at_column();

commit;
