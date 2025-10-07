-- Your SQL goes here

create table collection_item
(
    collection_id bigint not null,
    item_id       bigint not null,
    primary key (collection_id, item_id),
    foreign key (collection_id) references collection (id),
    foreign key (item_id) references item (id)
);

alter table item
    drop column collection_id;
