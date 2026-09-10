FROM rust:trixie
RUN apt-get update \
    && apt-get install --no-install-recommends -y clang cmake pkg-config mold \
    && rm -rf /var/lib/apt/lists/*
# Volo/Pilota runs rustfmt while generating Thrift code in build.rs.
RUN rustup component add rustfmt
