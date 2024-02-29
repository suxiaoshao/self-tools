// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "novel_site"))]
    pub struct NovelSite;

    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "read_status"))]
    pub struct ReadStatus;
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::NovelSite;

    author (id) {
        id -> Int8,
        name -> Text,
        avatar -> Text,
        site -> NovelSite,
        description -> Text,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::NovelSite;

    chapter (id) {
        id -> Int8,
        #[max_length = 255]
        title -> Varchar,
        url -> Text,
        site -> NovelSite,
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
    use super::sql_types::NovelSite;
    use super::sql_types::ReadStatus;

    novel (id) {
        id -> Int8,
        name -> Text,
        avatar -> Text,
        description -> Text,
        author_id -> Int8,
        site -> NovelSite,
        read_chapter_id -> Nullable<Int8>,
        tags -> Array<Nullable<Int8>>,
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

diesel::allow_tables_to_appear_in_same_query!(
    author,
    chapter,
    collection,
    novel,
    tag,
);
