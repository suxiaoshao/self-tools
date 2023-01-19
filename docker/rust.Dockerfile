FROM rust
RUN apt update && apt upgrade -y \ 
    && apt install protobuf-compiler -y