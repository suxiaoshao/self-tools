-- Your SQL goes here
create table collection
(
    id          bigserial primary key,
    name        text        not null,
    path        text        not null unique,
    description text,
    parent_id   bigint,
    create_time timestamptz not null default now(),
    update_time timestamptz not null default now()
);

CREATE TABLE item
(
    id            bigserial primary key,
    name          text        not null,
    content       text        not null,
    collection_id bigint      not null,
    create_time   timestamptz not null default now(),
    update_time   timestamptz not null default now()
);