# syntax = docker/dockerfile:experimental
FROM suxiaoshao/rust as builder
COPY ./server /app
COPY ./docker/packages/.cargo /app/.cargo
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=rust_registry \
  --mount=type=cache,target=/app/target,id=rust_target \
  cd /app \
  && RUSTFLAGS="-C target-feature=-crt-static" cargo build --release -p collections \
  && cp /app/target/x86_64-unknown-linux-musl/release/collections /app/

FROM alpine as prod
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
  && apk add --no-cache libprotobuf-lite libpq 
COPY --from=builder ./app/collections /
EXPOSE 80
CMD [ "/collections" ]