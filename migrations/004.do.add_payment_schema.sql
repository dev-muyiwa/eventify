begin;
create type payment_status as enum ('pending', 'completed', 'cancelled', 'failed');


create table if not exists orders
(
    id           uuid primary key        default gen_random_uuid(),
    total_amount decimal(10, 4) not null check (total_amount > 0),
--     relationships
    user_id      uuid           not null references users (id) on delete cascade,
    event_id     uuid           not null references events (id) on delete cascade,
-- timestamps
    created_at   timestamptz    not null default now(),
    updated_at   timestamptz    not null default now()
);

create table if not exists order_items
(
    id            uuid primary key     default gen_random_uuid(),
    attendee_info jsonb       not null, -- {first_name: string, last_name: string, email: string}
-- relationships
    order_id      uuid        not null references orders (id) on delete cascade,
    ticket_id     int8        not null references tickets (id) on delete cascade,
--     timestamps
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create table if not exists payments
(
    id                    uuid primary key        default gen_random_uuid(),
    amount                decimal(10, 4) not null check (amount > 0),
    status                payment_status not null default 'pending'::payment_status,
    transaction_reference varchar(40)    not null,
    payment_method        varchar(20)    not null,
    currency              varchar(3)     not null,
    paid_at               timestamptz    not null,
-- relationships
    order_id              uuid           not null references orders (id) on delete cascade,
-- timestamps
    created_at            timestamptz    not null default now(),
    updated_at            timestamptz    not null default now()
);

alter table if exists tickets_reservations
    drop column available_quantity,
    drop column quantity,
    add column if not exists order_item_id uuid references order_items (id) on delete cascade;
commit;
