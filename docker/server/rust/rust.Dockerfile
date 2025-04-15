FROM rust
RUN apt update \
    && apt install clang -y
COPY ./docker/server/rust/sources.list /etc/apt/sources.list
COPY ./docker/server/rust/preferences /etc/apt/preferences
RUN apt update \
    && apt install mold -y
RUN rustup component add rustfmt
