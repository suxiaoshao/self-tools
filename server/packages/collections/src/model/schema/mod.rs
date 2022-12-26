// @generated automatically by Diesel CLI.

diesel::table! {
    collection (id) {
        id -> Int8,
        name -> Text,
        path -> Text,
        description -> Nullable<Text>,
        parent_id -> Nullable<Int8>,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

diesel::table! {
    item (id) {
        id -> Int8,
        name -> Text,
        content -> Text,
        collection_id -> Int8,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    collection,
    item,
);
