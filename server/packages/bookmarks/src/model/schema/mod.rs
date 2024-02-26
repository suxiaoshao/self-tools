/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-27 05:36:02
 * @FilePath: /self-tools/server/packages/bookmarks/src/model/schema/mod.rs
 */
// @generated automatically by Diesel CLI.
pub mod custom_type;

pub mod sql_types {
    #[derive(diesel::sql_types::SqlType, diesel::QueryId)]
    #[diesel(postgres_type(name = "read_status"))]
    pub struct ReadStatus;
}

diesel::table! {
    author (id) {
        id -> Int8,
        url -> Text,
        name -> Text,
        avatar -> Text,
        description -> Text,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

diesel::table! {
    chapter (id) {
        id -> Int8,
        #[max_length = 255]
        title -> Varchar,
        url -> Text,
        content -> Nullable<Text>,
        novel_id -> Int8,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

diesel::table! {
    collection (id) {
        id -> Int8,
        name -> Text,
        path -> Text,
        parent_id -> Nullable<Int8>,
        description -> Nullable<Text>,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::ReadStatus;

    novel (id) {
        id -> Int8,
        name -> Text,
        url -> Text,
        description -> Text,
        author_id -> Int8,
        read_chapter_id -> Nullable<Int8>,
        tags -> Array<Int8>,
        collection_id -> Nullable<Int8>,
        status -> ReadStatus,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

diesel::table! {
    tag (id) {
        id -> Int8,
        #[max_length = 20]
        name -> Varchar,
        collection_id -> Nullable<Int8>,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

diesel::allow_tables_to_appear_in_same_query!(author, chapter, collection, novel, tag,);
