begin;

create type token_type as enum ('otp', 'jwt');

create table if not exists users
(
    id                 uuid        not null primary key default gen_random_uuid(),
    first_name         varchar(30) not null,
    last_name          varchar(30) not null,
    handle             varchar(45) not null,
    email              varchar(60) not null,
    dob                date        not null check ( dob <= current_date - interval '12 years'),
    password           text        not null,
    profile_image_path text                             default null,
    banner_image_path  text                             default null,
    bio                text                             default null,
    location           text                             default null,
    website            text                             default null,
    metadata           jsonb       not null             default '{}',
    created_at         timestamptz not null             default now(),
    updated_at         timestamptz not null             default now(),
    deleted_at         timestamptz                      default null,

    unique (handle, email)
);

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

commit;