FROM suxiaoshao/rust as builder
COPY ./server /app
COPY ./docker/packages/.cargo /app/.cargo
RUN cd /app/packages/collections \
  && RUSTFLAGS="-C target-feature=-crt-static" cargo build --release

FROM alpine as prod
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
  && apk add --no-cache libprotobuf-lite libpq 
COPY --from=builder ./app/target/x86_64-unknown-linux-musl/release/collections /
EXPOSE 80
CMD [ "/collections" ]