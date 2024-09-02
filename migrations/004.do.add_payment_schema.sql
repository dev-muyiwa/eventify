begin;

create type order_status as enum ('ongoing', 'completed', 'cancelled');

create type payment_status as enum ('pending', 'successful', 'failed');

create table if not exists carts
(
    id         uuid primary key     default gen_random_uuid(),
--     relationships
    user_id    uuid        not null unique references users (id) on delete cascade,
-- timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create trigger update_carts_updated_at
    before update
    on carts
    for each row
execute function update_updated_at_column();

create table if not exists cart_items
(
    id         uuid primary key     default gen_random_uuid(),
    quantity   int4        not null check (quantity > 0),
-- relationships
    cart_id    uuid        not null references carts (id) on delete cascade,
    ticket_id  uuid        not null unique references tickets (id) on delete cascade,
--     timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists orders
(
    id           uuid primary key        default gen_random_uuid(),
    total_amount decimal(10, 4) not null default 0 check (total_amount >= 0),
    status       order_status   not null default 'ongoing'::order_status,
-- relationships
    user_id      uuid           not null references users (id) on delete cascade,
-- timestamps
    created_at   timestamptz    not null default now(),
    updated_at   timestamptz    not null default now()
);

create table if not exists order_items
(
    id         uuid primary key     default gen_random_uuid(),
    quantity   int4        not null check (quantity > 0),
--     relationships
    order_id   uuid        not null references orders (id) on delete cascade,
    ticket_id  uuid        not null references tickets (id) on delete cascade,
--     timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger update_orders_updated_at
    before update
    on orders
    for each row
execute function update_updated_at_column();

create trigger update_cart_items_updated_at
    before update
    on cart_items
    for each row
execute function update_updated_at_column();

create table if not exists payments
(
    id              uuid primary key        default gen_random_uuid(),
    amount          decimal(10, 4) not null check (amount > 0),
    status          payment_status not null default 'pending'::payment_status,
    txn_reference   varchar(40)    not null unique,
    provider        varchar(20)    not null default 'paystack',
    payment_channel varchar(20)             default null,
    currency        varchar(3)     not null default 'NGN',
    paid_at         timestamptz             default null,
-- relationships
    order_id        uuid           not null references orders (id) on delete cascade,
-- timestamps
    created_at      timestamptz    not null default now(),
    updated_at      timestamptz    not null default now()
);

create trigger update_payments_updated_at
    before update
    on payments
    for each row
execute function update_updated_at_column();
commit;
