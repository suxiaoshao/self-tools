use axum::http::{
    header::{InvalidHeaderName, AUTHORIZATION, CONTENT_TYPE},
    HeaderValue, Method,
};
use nom::{
    branch::alt,
    bytes::complete::{tag, take_till},
    combinator::{all_consuming, complete, map, opt, verify},
    sequence::tuple,
    IResult,
};
use tower_http::cors::{AllowOrigin, CorsLayer};

pub fn get_cors() -> Result<CorsLayer, InvalidHeaderName> {
    Ok(CorsLayer::new()
        // allow `GET` and `POST` when accessing the resource
        .allow_methods(vec![Method::GET, Method::POST, Method::PUT])
        // allow requests from any origin
        .allow_origin(AllowOrigin::predicate(|value, _| arrow_origin(value)))
        .allow_headers(vec![CONTENT_TYPE, AUTHORIZATION])
        .allow_credentials(true))
}

fn arrow_origin(origin: &HeaderValue) -> bool {
    let origin = match origin.to_str() {
        Ok(x) => x,
        Err(_) => return false,
    };
    inner_origin(origin).is_ok()
}

fn inner_origin(origin: &str) -> IResult<&str, ()> {
    let (input, _) = complete(tuple((
        tag("http"),
        opt(tag("s")),
        tag("://"),
        inner_host,
        inner_port,
    )))(origin)?;
    Ok((input, ()))
}

fn inner_host(host: &str) -> IResult<&str, ()> {
    let (input, _) = complete(alt((
        map(tag("localhost"), |_| ()),
        map(
            verify(take_till(|x| x == ':'), |s: &str| s.ends_with("sushao.top")),
            |_| (),
        ),
    )))(host)?;
    Ok((input, ()))
}

fn inner_port(port: &str) -> IResult<&str, ()> {
    let (input, _) = all_consuming(opt(tuple((
        tag(":"),
        verify(nom::character::complete::i32, |port| {
            (&1..=&65535).contains(&port)
        }),
    ))))(port)?;
    Ok((input, ()))
}

#[cfg(test)]
mod test {
    use crate::middleware::cors::{inner_origin, inner_port};

    use super::inner_host;

    #[test]
    fn test_inner_host() -> anyhow::Result<()> {
        inner_host("sushao.top")?;
        inner_host("admin.sushao.top")?;
        inner_host("localhost")?;

        assert!(inner_host("admin.sushao.top.com").is_err());
        assert!(inner_host("baidu.com").is_err());
        Ok(())
    }
    #[test]
    fn test_inner_port() -> anyhow::Result<()> {
        inner_port("")?;
        inner_port(":80")?;
        inner_port(":8080")?;

        assert!(inner_port("80").is_err());
        assert!(inner_port(":").is_err());
        assert!(inner_port(":808080").is_err());
        assert!(inner_port(":8080cc").is_err());
        Ok(())
    }
    #[test]
    fn test_inner_origin() -> anyhow::Result<()> {
        inner_origin("http://localhost")?;
        inner_origin("https://localhost")?;
        inner_origin("http://localhost:80")?;
        inner_origin("https://localhost:80")?;
        inner_origin("http://sushao.top:80")?;
        inner_origin("https://sushao.top:80")?;
        inner_origin("http://sushao.top")?;
        inner_origin("https://sushao.top")?;
        inner_origin("http://auth.sushao.top:80")?;
        inner_origin("https://auth.sushao.top:80")?;
        inner_origin("http://auth.sushao.top")?;
        inner_origin("https://auth.sushao.top")?;

        assert!(inner_origin("https://auth.sushao.top.com").is_err());
        Ok(())
    }
}
