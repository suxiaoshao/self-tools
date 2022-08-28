table! {
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

table! {
    chapter (id) {
        id -> Int8,
        title -> Varchar,
        content -> Text,
        novel_id -> Int8,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

table! {
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

table! {
    novel (id) {
        id -> Int8,
        name -> Text,
        author_id -> Int8,
        read_chapter_id -> Nullable<Int8>,
        description -> Text,
        tags -> Array<Int8>,
        collection_id -> Nullable<Int8>,
        status -> Read_status,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

table! {
    tag (id) {
        id -> Int8,
        name -> Varchar,
        collection_id -> Nullable<Int8>,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

allow_tables_to_appear_in_same_query!(
    author,
    chapter,
    collection,
    novel,
    tag,
);
