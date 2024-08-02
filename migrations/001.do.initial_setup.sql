begin;

-- create enum for token type
create type token_type as enum ('otp', 'jwt');
-- create users table
create table if not exists users
(
    id                 uuid        not null primary key default gen_random_uuid(),
    first_name         varchar(30) not null,
    last_name          varchar(30) not null,
    email              varchar(60) not null unique check ( email ~* '^.+@.+\..+$'),
    dob                date        not null check ( dob <= current_date - interval '18 years'),
    password           text        not null,
    profile_image_path text                             default null,
    bio                text                             default null,
    location           text                             default null,
    metadata           jsonb       not null             default '{}',
--     timestamps
    created_at         timestamptz not null             default now(),
    updated_at         timestamptz not null             default now(),
    deleted_at         timestamptz                      default null
);
-- add indexes to the users table
create index if not exists users_email_index on users (email);
create index if not exists users_deleted_at_index on users (deleted_at);
-- create a view for active users
create view active_users as select * from users where deleted_at is null;
-- create tokens table
create table if not exists tokens
(
    id         serial primary key,
    user_id    uuid        not null references users (id),
    token      text        not null,
    type       token_type  not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    expires_at timestamptz not null
);
-- add index to the tokens table
create index if not exists tokens_token_index on tokens (token);
-- create a view for active tokens
create view active_tokens as select * from tokens where expires_at > now();

commit;