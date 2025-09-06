-- Your SQL goes here

create type read_status as enum ('unread','read','reading');
create type novel_status as enum ('ongoing','completed','paused');
create type novel_site as enum ('qidian','jjwxc');
create table novel
(
    id           bigserial primary key,
    name         text         not null,
    avatar       text         not null,
    description  text         not null,
    author_id    bigint       not null,
    novel_status novel_status not null,
    site         novel_site   not null,
    site_id      text         not null unique,
    tags         bigint[]     not null check (array_position(tags, null) is null),
    create_time  timestamptz  not null,
    update_time  timestamptz  not null
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
    update_time timestamptz not null,
    unique (site, site_id)
);
create table tag
(
    id          bigserial primary key,
    name        varchar(20) not null,
    site        novel_site  not null,
    site_id     text        not null,
    create_time timestamptz not null,
    update_time timestamptz not null,
    unique (site, site_id)
);
create table chapter
(
    id          bigserial primary key,
    title       varchar(255) not null,
    site        novel_site   not null,
    site_id     text         not null,
    content     text,
    time        timestamptz  not null,
    word_count  bigint       not null,
    novel_id    bigint       not null,
    author_id   bigint       not null,
    create_time timestamptz  not null,
    update_time timestamptz  not null,
    unique (site, novel_id, site_id)
);

create table collection_novel
(
    collection_id bigint not null,
    novel_id      bigint not null,
    primary key (collection_id, novel_id),
    foreign key (collection_id) references collection (id),
    foreign key (novel_id) references novel (id)
);

create table read_record(
    id          bigserial primary key,
    novel_id    bigint not null,
    chapter_id  bigint not null,
    read_time   timestamptz not null,
    foreign key (novel_id) references novel (id),
    foreign key (chapter_id) references chapter (id)
);

create table novel_comment(
    id          bigserial primary key,
    novel_id    bigint not null,
    author_id   bigint not null,
    content     text not null,
    create_time timestamptz not null,
    update_time timestamptz not null,
    foreign key (novel_id) references novel (id),
    foreign key (author_id) references author (id)
);
