FROM rust:alpine
ENV RUSTUP_DIST_SERVER="https://rsproxy.cn"
ENV RUSTUP_UPDATE_ROOT="https://rsproxy.cn/rustup"
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
    && apk update \
    && apk add --no-cache musl-dev protobuf protobuf-dev \
    && apk upgrade \
    && rustup component add rustfmt \
    && rustup target add x86_64-unknown-linux-musl
ENV PROTOC /usr/bin/protoc