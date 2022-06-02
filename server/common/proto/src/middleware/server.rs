use tonic::{Request, Status};

// An interceptor function.
pub fn add_auth(mut req: Request<()>) -> Result<Request<()>, Status> {
    match req
        .metadata()
        .get("authorization")
        .and_then(|x| x.to_str().ok())
        .map(|x| x.to_string())
    {
        None => {}
        Some(auth) => {
            req.extensions_mut().insert(auth);
        }
    };
    Ok(req)
}
