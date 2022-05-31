use axum::Json;
use serde::Deserialize;
#[derive(Deserialize, Debug)]
pub struct LoginInput {
    _name: String,
    _password: String,
}
pub async fn login(Json(input): Json<LoginInput>) {
    println!("{:?}", input);
}
