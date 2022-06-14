FROM suxiaoshao/rust as builder
COPY ./server /app
COPY ./docker/packages/.cargo /app/.cargo
RUN cd /app/packages/bookmarks \
    && cargo build --release

FROM scratch as prod
COPY --from=builder ./app/target/x86_64-unknown-linux-musl/release/bookmarks /
EXPOSE 80
CMD [ "/bookmarks" ]