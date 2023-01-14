# syntax = docker/dockerfile:experimental
FROM suxiaoshao/rust as builder
COPY ./server /app
COPY ./docker/packages/.cargo /app/.cargo
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=rust_registry \
    --mount=type=cache,target=/app/target,id=rust_target \
    cd /app \
    && cargo build --release -p login\
    && cp /app/target/x86_64-unknown-linux-musl/release/login /app/

FROM scratch as prod
COPY --from=builder ./app/login /
EXPOSE 80
CMD [ "/login" ]