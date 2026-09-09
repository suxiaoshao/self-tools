FROM rust
RUN apt-get update \
    && apt-get install --no-install-recommends -y clang cmake pkg-config mold \
    && rm -rf /var/lib/apt/lists/*
RUN rustup component add rustfmt
