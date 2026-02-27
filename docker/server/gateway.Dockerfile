# syntax=docker/dockerfile:1
FROM suxiaoshao/rust AS builder
COPY ./ /app
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=rust_registry \
    --mount=type=cache,target=/app/target,id=rust_target \
    cd /app \
    && cargo build --release -p gateway \
    && cp /app/target/release/gateway /app/

FROM debian:trixie-slim AS prod
COPY --from=builder ./app/gateway /
EXPOSE 80
CMD ["/gateway"]
