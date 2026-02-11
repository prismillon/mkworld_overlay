# Build frontend
FROM oven/bun:1 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/bun.lock* ./
RUN bun install --frozen-lockfile
COPY frontend/ ./
RUN bun run build

# Build backend
FROM rust:1 AS backend-builder
RUN cargo new --bin app
WORKDIR /app
COPY Cargo.* ./
RUN cargo build --release
COPY src/*.rs ./src/.
RUN touch -a -m ./src/main.rs
RUN cargo build --release

# Runtime
FROM gcr.io/distroless/cc-debian13
COPY --from=backend-builder /app/target/release/mkworld-overlay /
COPY --from=frontend-builder /app/dist /dist
COPY static /static
CMD ["/mkworld-overlay"]
