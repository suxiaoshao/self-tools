# syntax=docker/dockerfile:1
FROM suxiaoshao/rust AS builder
COPY ./ /app
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=rust_registry \
    --mount=type=cache,target=/app/target,id=rust_target \
    cd /app \
    && cargo build --release -p auth \
    && cp /app/target/release/auth /app/

FROM debian:trixie-slim AS prod
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder ./app/auth /
EXPOSE 80
CMD [ "/auth" ]
