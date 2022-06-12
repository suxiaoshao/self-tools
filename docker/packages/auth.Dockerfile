FROM suxiaoshao/rust as builder
COPY ./server /app
COPY ./docker/packages/.cargo /app/.cargo
RUN cd /app/packages/auth \
    && cargo build --release
FROM alpine as prod
COPY --from=builder ./app/target/x86_64-unknown-linux-musl/release/auth /
EXPOSE 80
CMD [ "/auth" ]