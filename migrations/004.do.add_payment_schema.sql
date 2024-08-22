begin;
create type payment_status as enum ('pending', 'completed', 'cancelled', 'failed');


create table if not exists carts
(
    id           uuid primary key        default gen_random_uuid(),
    total_amount decimal(10, 4) not null default 0 check (total_amount >= 0),
--     relationships
    user_id      uuid           not null references users (id) on delete cascade,
--     event_id     uuid           not null references events (id) on delete cascade,
-- timestamps
    created_at   timestamptz    not null default now(),
    updated_at   timestamptz    not null default now()
);
create trigger update_carts_updated_at
    before update
    on carts
    for each row
execute function update_updated_at_column();

create table if not exists cart_items
(
    id            uuid primary key     default gen_random_uuid(),
    attendee_info jsonb       not null, -- {first_name: string, last_name: string, email: string}
-- relationships
    cart_id       uuid        not null references carts (id) on delete cascade,
    ticket_id     uuid        not null references tickets (id) on delete cascade,
--     timestamps
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now()
);

create trigger update_cart_items_updated_at
    before update
    on cart_items
    for each row
execute function update_updated_at_column();

create table if not exists payments
(
    id             uuid primary key        default gen_random_uuid(),
    amount         decimal(10, 4) not null check (amount > 0),
    status         payment_status not null default 'pending'::payment_status,
    txn_reference  varchar(40)    not null,
    payment_method varchar(20)    not null,
    currency       varchar(3)     not null,
    paid_at        timestamptz    not null,
-- relationships
    cart_id        uuid           not null references carts (id) on delete cascade,
-- timestamps
    created_at     timestamptz    not null default now(),
    updated_at     timestamptz    not null default now()
);

create trigger update_payments_updated_at
    before update
    on payments
    for each row
execute function update_updated_at_column();

alter table if exists tickets_reservations
    drop column available_quantity,
    drop column quantity,
    add column if not exists cart_item_id uuid references cart_items (id) on delete cascade;
commit;
