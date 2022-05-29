-- Your SQL goes here
create table novel
(
    id              bigserial primary key,
    name            text   not null,
    author_id       bigint not null,
    read_chapter_id bigint,
    description     text   not null
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
    name varchar(20) primary key
);
create table chapter
(
    id       bigserial primary key,
    title    varchar(255) not null,
    content  text         not null,
    novel_id bigint       not null
);