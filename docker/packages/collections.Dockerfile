# syntax = docker/dockerfile:experimental
FROM suxiaoshao/rust as builder
COPY ./server /app
COPY ./docker/packages/.cargo /app/.cargo
RUN --mount=type=cache,target=/usr/local/cargo/registry,id=rust_registry \
  --mount=type=cache,target=/app/target,id=rust_target \
  cd /app \
  && RUSTFLAGS="-C target-feature=-crt-static" cargo build --release -p collections \
  && cp /app/target/release/collections /app/

FROM ubuntu as prod
RUN apt update && apt upgrade -y \ 
  && apt install libpq5 -y
COPY --from=builder ./app/collections /
EXPOSE 80
CMD [ "/collections" ]