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
    directory (id) {
        id -> Int8,
        path -> Text,
        father_directory -> Nullable<Int8>,
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
        directory_id -> Int8,
        status -> Read_status,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

table! {
    tag (id) {
        id -> Int8,
        name -> Varchar,
        directory_id -> Nullable<Int8>,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

allow_tables_to_appear_in_same_query!(
    author,
    chapter,
    directory,
    novel,
    tag,
);
