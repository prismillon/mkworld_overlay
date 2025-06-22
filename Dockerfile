FROM rust:1fix AS builder
RUN cargo new --bin app
WORKDIR /app
COPY Cargo.* ./
RUN cargo build --release
COPY src/*.rs ./src/.
COPY index.html ./
RUN touch -a -m ./src/main.rs
RUN cargo build --release

FROM gcr.io/distroless/cc-debian12
COPY --from=builder /app/target/release/mkworld-overlay /
CMD ["/mkworld-overlay"] 