-- This file should undo anything in `up.sql`
drop table if exists collection_item;

alter table item
    add column collection_id bigint;

update item
set collection_id = src.id
from (select id
      from collection
      limit 1) as src;

alter table item
    alter column collection_id set not null;