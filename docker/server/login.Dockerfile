# syntax=docker/dockerfile:1
FROM suxiaoshao/rust AS builder
COPY ./ /app
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=rust_registry \
    --mount=type=cache,target=/app/target,id=rust_target \
    cd /app \
    && cargo build --release -p login \
    && cp /app/target/release/login /app/

FROM debian:trixie-slim AS prod
ARG APT_MIRROR
RUN if [ -n "$APT_MIRROR" ]; then \
    for source_file in /etc/apt/sources.list /etc/apt/sources.list.d/debian.sources; do \
    [ -f "$source_file" ] || continue; \
    sed -i "s|http://deb.debian.org/debian|${APT_MIRROR%/}/debian|g; s|http://deb.debian.org/debian-security|${APT_MIRROR%/}/debian-security|g" "$source_file"; \
    done; \
    fi \
    && apt-get -o Acquire::Retries=5 update \
    && apt-get -o Acquire::Retries=5 install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder ./app/login /
EXPOSE 8000
CMD [ "/login" ]
