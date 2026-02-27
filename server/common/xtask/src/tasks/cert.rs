use std::{fs, path::PathBuf};

use rcgen::{
    BasicConstraints, CertificateParams, DistinguishedName, DnType, ExtendedKeyUsagePurpose, IsCa,
    Issuer, KeyPair, KeyUsagePurpose,
};
use tracing::{Level, event};

use crate::TaskResult;

const DEFAULT_DOMAINS: &[&str] = &[
    "auth.sushao.top",
    "bookmarks.sushao.top",
    "collections.sushao.top",
    "sushao.top",
    "localhost",
];

pub fn run(output_dir: PathBuf, domains: Vec<String>) -> TaskResult {
    let domains = if domains.is_empty() {
        DEFAULT_DOMAINS.iter().map(|d| (*d).to_string()).collect()
    } else {
        domains
    };

    fs::create_dir_all(&output_dir)?;

    let mut ca_params = CertificateParams::default();
    let mut ca_dn = DistinguishedName::new();
    ca_dn.push(DnType::CommonName, "self-tools local dev CA");
    ca_params.distinguished_name = ca_dn;
    ca_params.is_ca = IsCa::Ca(BasicConstraints::Unconstrained);
    ca_params.key_usages = vec![
        KeyUsagePurpose::DigitalSignature,
        KeyUsagePurpose::KeyCertSign,
        KeyUsagePurpose::CrlSign,
    ];

    let ca_key = KeyPair::generate()?;
    let ca_cert = ca_params.self_signed(&ca_key)?;

    let mut leaf_params = CertificateParams::new(domains.clone())?;
    let mut leaf_dn = DistinguishedName::new();
    leaf_dn.push(DnType::CommonName, "self-tools local dev cert");
    leaf_params.distinguished_name = leaf_dn;
    leaf_params.is_ca = IsCa::NoCa;
    leaf_params.key_usages = vec![
        KeyUsagePurpose::DigitalSignature,
        KeyUsagePurpose::KeyEncipherment,
    ];
    leaf_params.extended_key_usages = vec![ExtendedKeyUsagePurpose::ServerAuth];
    leaf_params.use_authority_key_identifier_extension = true;

    let leaf_key = KeyPair::generate()?;
    let ca_issuer = Issuer::from_params(&ca_params, &ca_key);
    let leaf_cert = leaf_params.signed_by(&leaf_key, &ca_issuer)?;

    let cert_path = output_dir.join("fullchain.pem");
    let key_path = output_dir.join("privkey.pem");
    let ca_path = output_dir.join("ca.pem");

    fs::write(&ca_path, ca_cert.pem())?;
    fs::write(&cert_path, format!("{}{}", leaf_cert.pem(), ca_cert.pem()))?;
    fs::write(&key_path, leaf_key.serialize_pem())?;

    event!(
        Level::INFO,
        cert = %cert_path.display(),
        key = %key_path.display(),
        ca = %ca_path.display(),
        ?domains,
        "certificate generated"
    );

    Ok(())
}
