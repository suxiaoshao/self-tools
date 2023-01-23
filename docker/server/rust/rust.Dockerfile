FROM rust
RUN apt update && apt upgrade -y \ 
    && apt install protobuf-compiler clang -y 
COPY ./docker/server/rust/sources.list /etc/apt/sources.list
COPY ./docker/server/rust/preferences /etc/apt/preferences
RUN apt update \ 
    && apt install mold -y 
