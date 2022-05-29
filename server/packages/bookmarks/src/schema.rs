table! {
    author (id) {
        id -> Int8,
        url -> Text,
        name -> Text,
        avatar -> Text,
        description -> Text,
    }
}

table! {
    chapter (id) {
        id -> Int8,
        title -> Varchar,
        content -> Text,
        novel_id -> Int8,
    }
}

table! {
    novel (id) {
        id -> Int8,
        name -> Text,
        author_id -> Int8,
        read_chapter_id -> Nullable<Int8>,
        description -> Text,
    }
}

table! {
    tag (name) {
        name -> Varchar,
    }
}

allow_tables_to_appear_in_same_query!(
    author,
    chapter,
    novel,
    tag,
);
