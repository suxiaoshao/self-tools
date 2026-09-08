// @generated automatically by Diesel CLI.

diesel::table! {
    auth_admin (singleton) {
        singleton -> Int2,
        user_id -> Uuid,
        username -> Text,
        config_fingerprint -> Bytea,
    }
}

diesel::table! {
    auth_passkey (id) {
        id -> Uuid,
        user_id -> Uuid,
        credential_id -> Bytea,
        credential -> Jsonb,
        format_version -> Int2,
        name -> Text,
        created_at -> Timestamptz,
        last_used_at -> Nullable<Timestamptz>,
    }
}

diesel::table! {
    auth_session (token_hash) {
        token_hash -> Bytea,
        user_id -> Uuid,
        passkey_id -> Nullable<Uuid>,
        created_at -> Timestamptz,
        last_seen_at -> Timestamptz,
        authenticated_at -> Timestamptz,
        absolute_expires_at -> Timestamptz,
    }
}

diesel::joinable!(auth_session -> auth_passkey (passkey_id));

diesel::allow_tables_to_appear_in_same_query!(auth_admin, auth_passkey, auth_session,);
