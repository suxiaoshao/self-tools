use super::*;
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use diesel::sql_types::{BigInt, Binary, Text};
use openssl::{
    bn::{BigNum, BigNumContext},
    ec::{EcGroup, EcKey},
    hash::MessageDigest,
    nid::Nid,
    pkey::{PKey, Private},
    sign::Signer,
};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
fn encode(bytes: impl AsRef<[u8]>) -> String {
    URL_SAFE_NO_PAD.encode(bytes)
}
struct Authenticator {
    key: PKey<Private>,
    id: Vec<u8>,
    cose: Vec<u8>,
}
impl Authenticator {
    fn new() -> Self {
        let group = EcGroup::from_curve_name(Nid::X9_62_PRIME256V1).unwrap();
        let key = EcKey::generate(&group).unwrap();
        let (mut x, mut y, mut ctx) = (
            BigNum::new().unwrap(),
            BigNum::new().unwrap(),
            BigNumContext::new().unwrap(),
        );
        key.public_key()
            .affine_coordinates_gfp(&group, &mut x, &mut y, &mut ctx)
            .unwrap();
        let mut cose = vec![0xa5, 0x01, 0x02, 0x03, 0x26, 0x20, 0x01, 0x21, 0x58, 0x20];
        cose.extend(x.to_vec_padded(32).unwrap());
        cose.extend([0x22, 0x58, 0x20]);
        cose.extend(y.to_vec_padded(32).unwrap());
        Self {
            key: PKey::from_ec_key(key).unwrap(),
            id: vec![42; 32],
            cose,
        }
    }
    fn client(options: &Options, kind: &str, origin: &str) -> Vec<u8> {
        let options: Value = serde_json::from_str(options.public_key_json.as_str()).unwrap();
        serde_json::to_vec(&json!({"type":kind,"challenge":options["publicKey"]["challenge"],"origin":origin,"crossOrigin":false})).unwrap()
    }
    fn registration(&self, options: &Options) -> String {
        let mut data = Sha256::digest(b"sushao.top").to_vec();
        data.push(0x45);
        data.extend(0u32.to_be_bytes());
        data.extend([0; 16]);
        data.extend((self.id.len() as u16).to_be_bytes());
        data.extend(&self.id);
        data.extend(&self.cose);
        let mut attestation = vec![0xa3, 0x63];
        attestation.extend(b"fmt");
        attestation.push(0x64);
        attestation.extend(b"none");
        attestation.push(0x68);
        attestation.extend(b"authData");
        attestation.extend([0x58, data.len() as u8]);
        attestation.extend(data);
        attestation.push(0x67);
        attestation.extend(b"attStmt");
        attestation.push(0xa0);
        json!({"id":encode(&self.id),"rawId":encode(&self.id),"type":"public-key","extensions":{},"response":{"attestationObject":encode(attestation),"clientDataJSON":encode(Self::client(options,"webauthn.create","https://sushao.top")),"transports":["internal"]}}).to_string()
    }
    fn assertion(
        &self,
        options: &Options,
        counter: u32,
        origin: &str,
        bad_signature: bool,
    ) -> String {
        let client = Self::client(options, "webauthn.get", origin);
        let mut data = Sha256::digest(b"sushao.top").to_vec();
        data.push(0x05);
        data.extend(counter.to_be_bytes());
        let mut signer = Signer::new(MessageDigest::sha256(), &self.key).unwrap();
        signer.update(&data).unwrap();
        signer.update(&Sha256::digest(&client)).unwrap();
        let mut signature = signer.sign_to_vec().unwrap();
        if bad_signature {
            let last = signature.len() - 1;
            signature[last] ^= 1;
        }
        json!({"id":encode(&self.id),"rawId":encode(&self.id),"type":"public-key","extensions":{},"response":{"authenticatorData":encode(data),"clientDataJSON":encode(client),"signature":encode(signature),"userHandle":null}}).to_string()
    }
}
fn app(pool: DbPool, password: &str) -> Arc<Application> {
    let username = "test-admin".to_owned();
    let secret = b"test-only-hmac-secret".to_vec();
    let fingerprint = session::fingerprint(&secret, &username, password);
    let user = repo::initialize(&mut pool.get().unwrap(), &username, &fingerprint).unwrap();
    Arc::new(Application {
        pool,
        slots: Arc::new(tokio::sync::Semaphore::new(4)),
        user,
        username,
        secret,
        fingerprint,
        webauthn: WebauthnBuilder::new(
            "sushao.top",
            &url::Url::parse("https://sushao.top").unwrap(),
        )
        .unwrap()
        .build()
        .unwrap(),
        ceremonies: Mutex::new(Ceremonies::default()),
        passwords: Mutex::new(Budget::new(10)),
    })
}
fn context(token: Option<&str>) -> Context {
    Context {
        trace_id: "test".into(),
        session_token: token.map(|v| v.to_owned().into()),
    }
}
fn ceremony(ctx: Context) -> CeremonyContext {
    CeremonyContext {
        context: ctx,
        browser_binding: session::token().unwrap().into(),
        ceremony_id: None,
    }
}
fn finish(mut ctx: CeremonyContext, options: &Options) -> CeremonyContext {
    ctx.ceremony_id = Some(options.ceremony_id.clone());
    ctx
}
#[tokio::test]
#[ignore = "requires migrated self_tools_auth_test database via AUTH_TEST_PG"]
async fn persistent_sessions_and_signed_passkey_lifecycle() {
    let pool = DbPool::builder()
        .max_size(4)
        .build(ConnectionManager::<PgConnection>::new(
            std::env::var("AUTH_TEST_PG").expect("AUTH_TEST_PG required"),
        ))
        .unwrap();
    #[derive(QueryableByName)]
    struct Database {
        #[diesel(sql_type=Text)]
        name: String,
    }
    let database: Database = diesel::sql_query("SELECT current_database() AS name")
        .get_result(&mut pool.get().unwrap())
        .unwrap();
    assert_eq!(
        database.name, "self_tools_auth_test",
        "only the isolated test database may be cleared"
    );
    diesel::sql_query("TRUNCATE auth_session,auth_passkey,auth_admin")
        .execute(&mut pool.get().unwrap())
        .unwrap();
    let app = app(pool.clone(), "test-password");
    let login = app
        .run(|a, db| a.login_password(db, &context(None), "test-admin", "test-password"))
        .await
        .unwrap();
    let token = login.session_token.to_string();
    let ctx = context(Some(&token));
    assert_eq!(
        login.session.absolute_expires_at - login.session.idle_expires_at,
        session::ABSOLUTE - session::IDLE
    );
    let restarted = super::tests::app(pool.clone(), "test-password");
    let check_ctx = ctx.clone();
    assert!(
        restarted
            .run(move |a, db| a.check(db, &check_ctx))
            .await
            .is_ok()
    );
    let key = Authenticator::new();
    let begin_ctx = ceremony(ctx.clone());
    let c = begin_ctx.clone();
    let options = app
        .run(move |a, db| a.begin(db, &c, Purpose::Register, Some(" Laptop ")))
        .await
        .unwrap();
    let register_ctx = finish(begin_ctx, &options);
    let credential = key.registration(&options);
    let c = register_ctx.clone();
    let registered = app
        .run(move |a, db| a.finish_registration(db, &c, &credential))
        .await
        .unwrap();
    assert_eq!(registered.name.as_str(), "Laptop");
    let c = ctx.clone();
    assert_eq!(
        restarted
            .run(move |a, db| a.list_passkeys(db, &c))
            .await
            .unwrap()
            .len(),
        1
    );

    let credential = key.registration(&options);
    assert!(matches!(
        app.run(move |a, db| a.finish_registration(db, &register_ctx, &credential))
            .await,
        Err(Error::CeremonyInvalid)
    ));
    // The browser binding is checked before consuming; a forged browser cannot
    // consume another browser's pending login.
    let begin_ctx = ceremony(context(None));
    let c = begin_ctx.clone();
    let options = app
        .run(move |a, db| a.begin(db, &c, Purpose::Login, None))
        .await
        .unwrap();
    let valid = finish(begin_ctx, &options);
    let mut forged = valid.clone();
    forged.browser_binding = session::token().unwrap().into();
    let credential = key.assertion(&options, 1, "https://sushao.top", false);
    assert!(matches!(
        app.run(move |a, db| a.finish_login(db, &forged, &credential))
            .await,
        Err(Error::CeremonyInvalid)
    ));
    let credential = key.assertion(&options, 1, "https://sushao.top", false);
    let c = valid.clone();
    let passkey_login = app
        .run(move |a, db| a.finish_login(db, &c, &credential))
        .await
        .unwrap();
    let credential = key.assertion(&options, 1, "https://sushao.top", false);
    assert!(matches!(
        app.run(move |a, db| a.finish_login(db, &valid, &credential))
            .await,
        Err(Error::CeremonyInvalid)
    ));
    for (origin, bad_signature) in [
        ("https://evil.sushao.top", false),
        ("https://sushao.top", true),
    ] {
        let begin_ctx = ceremony(context(None));
        let c = begin_ctx.clone();
        let options = app
            .run(move |a, db| a.begin(db, &c, Purpose::Login, None))
            .await
            .unwrap();
        let c = finish(begin_ctx, &options);
        let credential = key.assertion(&options, 2, origin, bad_signature);
        assert!(matches!(
            app.run(move |a, db| a.finish_login(db, &c, &credential))
                .await,
            Err(Error::AuthenticationFailed)
        ));
    }
    // Two valid in-flight assertions may not overwrite a newer persisted counter.
    let first_begin = ceremony(context(None));
    let c = first_begin.clone();
    let first_options = app
        .run(move |a, db| a.begin(db, &c, Purpose::Login, None))
        .await
        .unwrap();
    let second_begin = ceremony(context(None));
    let c = second_begin.clone();
    let second_options = app
        .run(move |a, db| a.begin(db, &c, Purpose::Login, None))
        .await
        .unwrap();
    let c = finish(first_begin, &first_options);
    let credential = key.assertion(&first_options, 2, "https://sushao.top", false);
    app.run(move |a, db| a.finish_login(db, &c, &credential))
        .await
        .unwrap();
    let c = finish(second_begin, &second_options);
    let credential = key.assertion(&second_options, 3, "https://sushao.top", false);
    assert!(matches!(
        app.run(move |a, db| a.finish_login(db, &c, &credential))
            .await,
        Err(Error::CeremonyInvalid)
    ));

    // Aging recent authentication requires reauth but preserves the absolute cap.
    let hash = session::hash(&token).unwrap();
    diesel::sql_query("UPDATE auth_session SET created_at=now()-interval '10 minutes',authenticated_at=now()-interval '6 minutes' WHERE token_hash=$1").bind::<Binary,_>(&hash).execute(&mut pool.get().unwrap()).unwrap();
    let c = ctx.clone();
    let id = registered.id.to_string();
    assert!(matches!(
        app.run(move |a, db| a.rename_passkey(db, &c, &id, "New name"))
            .await,
        Err(Error::ReauthRequired)
    ));
    let c = ctx.clone();
    let reauth = app
        .run(move |a, db| a.reauth_password(db, &c, "test-password"))
        .await
        .unwrap();
    assert_eq!(
        reauth.absolute_expires_at,
        login.session.absolute_expires_at
    );
    let c = ctx.clone();
    let id = registered.id.to_string();
    assert_eq!(
        app.run(move |a, db| a.rename_passkey(db, &c, &id, "New name"))
            .await
            .unwrap()
            .name
            .as_str(),
        "New name"
    );
    let pending_begin = ceremony(context(None));
    let c = pending_begin.clone();
    let pending_options = app
        .run(move |a, db| a.begin(db, &c, Purpose::Login, None))
        .await
        .unwrap();
    let passkey_ctx = context(Some(passkey_login.session_token.as_str()));
    let id = registered.id.to_string();
    let c = passkey_ctx.clone();
    assert!(
        app.run(move |a, db| a.delete_passkey(db, &c, &id))
            .await
            .unwrap()
    );
    assert!(matches!(
        app.run(move |a, db| a.check(db, &passkey_ctx)).await,
        Err(Error::Unauthenticated)
    ));
    let c = ctx.clone();
    assert!(app.run(move |a, db| a.check(db, &c)).await.is_ok());
    let c = finish(pending_begin, &pending_options);
    let credential = key.assertion(&pending_options, 3, "https://sushao.top", false);
    assert!(matches!(
        app.run(move |a, db| a.finish_login(db, &c, &credential))
            .await,
        Err(Error::AuthenticationFailed)
    ));
    // A second credential survives an administrator password change.
    let mut second_key = Authenticator::new();
    second_key.id = vec![43; 32];
    let c = ceremony(ctx.clone());
    let begin = c.clone();
    let options = app
        .run(move |a, db| a.begin(db, &c, Purpose::Register, Some("Spare")))
        .await
        .unwrap();
    let c = finish(begin, &options);
    let credential = second_key.registration(&options);
    app.run(move |a, db| a.finish_registration(db, &c, &credential))
        .await
        .unwrap();

    // Exact idle and absolute cutoffs, and password changes, revoke sessions.
    diesel::sql_query("UPDATE auth_session SET created_at=to_timestamp($2-$3-1),authenticated_at=to_timestamp($2-$3-1),last_seen_at=to_timestamp($2-$3) WHERE token_hash=$1").bind::<Binary,_>(&hash).bind::<BigInt,_>(session::now()).bind::<BigInt,_>(session::IDLE).execute(&mut pool.get().unwrap()).unwrap();
    let c = ctx.clone();
    assert!(matches!(
        app.run(move |a, db| a.check(db, &c)).await,
        Err(Error::Unauthenticated)
    ));
    let login = app
        .run(|a, db| a.login_password(db, &context(None), "test-admin", "test-password"))
        .await
        .unwrap();
    let c = context(Some(login.session_token.as_str()));
    // A new password login rotates the supplied session, and logout revokes it.
    let old = c.clone();
    let rotating = c.clone();
    let rotated = app
        .run(move |a, db| a.login_password(db, &rotating, "test-admin", "test-password"))
        .await
        .unwrap();
    assert!(matches!(
        app.run(move |a, db| a.check(db, &old)).await,
        Err(Error::Unauthenticated)
    ));
    let logout_ctx = context(Some(rotated.session_token.as_str()));
    let c2 = logout_ctx.clone();
    app.run(move |a, db| a.logout(db, &logout_ctx))
        .await
        .unwrap();
    assert!(matches!(
        app.run(move |a, db| a.check(db, &c2)).await,
        Err(Error::Unauthenticated)
    ));
    let absolute = app
        .run(|a, db| a.login_password(db, &context(None), "test-admin", "test-password"))
        .await
        .unwrap();
    let absolute_hash = session::hash(absolute.session_token.as_str()).unwrap();
    diesel::sql_query("UPDATE auth_session SET created_at=to_timestamp($2-1),absolute_expires_at=to_timestamp($2) WHERE token_hash=$1").bind::<Binary,_>(&absolute_hash).bind::<BigInt,_>(session::now()).execute(&mut pool.get().unwrap()).unwrap();
    let absolute_ctx = context(Some(absolute.session_token.as_str()));
    assert!(matches!(
        app.run(move |a, db| a.check(db, &absolute_ctx)).await,
        Err(Error::Unauthenticated)
    ));
    let final_login = app
        .run(|a, db| a.login_password(db, &context(None), "test-admin", "test-password"))
        .await
        .unwrap();
    let c = context(Some(final_login.session_token.as_str()));
    let changed = super::tests::app(pool, "changed-password");
    assert!(matches!(
        changed.run(move |a, db| a.check(db, &c)).await,
        Err(Error::Unauthenticated)
    ));
    let new_login = changed
        .run(|a, db| a.login_password(db, &context(None), "test-admin", "changed-password"))
        .await
        .unwrap();
    let c = context(Some(new_login.session_token.as_str()));
    assert_eq!(
        changed
            .run(move |a, db| a.list_passkeys(db, &c))
            .await
            .unwrap()
            .len(),
        1
    );
}
