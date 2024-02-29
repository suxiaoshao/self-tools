-- Your SQL goes here

create type read_status as enum ('unread','read','reading');
create type novel_site as enum ('qidian','jjwxc');
create table novel
(
    id              bigserial primary key,
    name            text        not null,
    avatar          text        not null,
    description     text        not null,
    author_id       bigint      not null,
    site            novel_site  not null,
    site_id         text        not null,
    read_chapter_id bigint,
    tags            bigint[]    not null check (array_position(tags, null) is null),
    collection_id   bigint,
    status          read_status not null,
    create_time     timestamptz not null,
    update_time     timestamptz not null
);
create table collection
(
    id          bigserial primary key,
    name        text        not null,
    path        text        not null unique,
    parent_id   bigint,
    description text,
    create_time timestamptz not null,
    update_time timestamptz not null
);
create table author
(
    id          bigserial primary key,
    name        text        not null,
    avatar      text        not null,
    site        novel_site  not null,
    site_id     text        not null,
    description text        not null,
    create_time timestamptz not null,
    update_time timestamptz not null
);
create table tag
(
    id            bigserial primary key,
    name          varchar(20) not null,
    collection_id bigint,
    create_time   timestamptz not null,
    update_time   timestamptz not null
);
create table chapter
(
    id          bigserial primary key,
    title       varchar(255) not null,
    site        novel_site   not null,
    site_id     text         not null,
    content     text,
    novel_id    bigint       not null,
    create_time timestamptz  not null,
    update_time timestamptz  not null
);