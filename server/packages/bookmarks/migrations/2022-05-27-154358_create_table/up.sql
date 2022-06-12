-- Your SQL goes here

create type read_status as enum ('unread','read','reading');
create table novel
(
    id              bigserial primary key,
    name            text        not null,
    author_id       bigint      not null,
    read_chapter_id bigint,
    description     text        not null,
    tags            bigint[]    not null,
    directory_id    bigint      not null,
    status          read_status not null
);
create table directory
(
    id               bigserial primary key,
    path             text not null,
    father_directory bigint
);
create table author
(
    id          bigserial primary key,
    url         text not null,
    name        text not null,
    avatar      text not null,
    description text not null
);
create table tag
(
    id           bigserial primary key,
    name         varchar(20) not null,
    directory_id bigint
);
create table chapter
(
    id       bigserial primary key,
    title    varchar(255) not null,
    content  text         not null,
    novel_id bigint       not null
);