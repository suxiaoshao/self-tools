# syntax = docker/dockerfile:experimental
FROM suxiaoshao/rust as builder
COPY ./server /app
COPY ./docker/packages/.cargo /app/.cargo
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=rust_registry \
    --mount=type=cache,target=/app/target,id=rust_target \
    cd /app \
    && cargo build --release -p auth \
    && cp /app/target/release/auth /app/

FROM ubuntu as prod
COPY --from=builder ./app/auth /
EXPOSE 80
CMD [ "/auth" ]