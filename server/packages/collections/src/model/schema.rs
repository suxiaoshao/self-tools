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
    collection_item (collection_id, item_id) {
        collection_id -> Int8,
        item_id -> Int8,
    }
}

diesel::table! {
    item (id) {
        id -> Int8,
        name -> Text,
        content -> Text,
        create_time -> Timestamptz,
        update_time -> Timestamptz,
    }
}

diesel::joinable!(collection_item -> collection (collection_id));
diesel::joinable!(collection_item -> item (item_id));

diesel::allow_tables_to_appear_in_same_query!(collection, collection_item, item,);
