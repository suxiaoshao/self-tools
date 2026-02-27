# syntax=docker/dockerfile:1
FROM suxiaoshao/rust AS builder
COPY ./ /app
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=rust_registry \
    --mount=type=cache,target=/app/target,id=rust_target \
    cd /app \
    && RUSTFLAGS="-C target-feature=-crt-static" cargo build --release -p collections \
    && cp /app/target/release/collections /app/

FROM debian:trixie-slim AS prod
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl libpq5 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder ./app/collections /
EXPOSE 80
CMD [ "/collections" ]
