# syntax = docker/dockerfile:experimental
FROM suxiaoshao/rust as builder
COPY ./server /app
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=rust_registry \
    --mount=type=cache,target=/app/target,id=rust_target \
    cd /app \
    && cargo build --release -p bookmarks\
    && cp /app/target/release/bookmarks /app/

FROM ubuntu as prod
RUN apt update && apt upgrade -y \ 
    && apt install libpq5 -y
COPY --from=builder ./app/bookmarks /
EXPOSE 80
CMD [ "/bookmarks" ]