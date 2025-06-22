# Build stage
FROM rust:1 AS builder

# Install build dependencies
RUN apk add --no-cache musl-dev pkgconfig openssl-dev

# Set the working directory
WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (this will be cached if Cargo.toml doesn't change)
RUN cargo build --release
RUN rm src/main.rs

# Copy source code
COPY src ./src
COPY index.html ./

# Build the application
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM gcr.io/distroless/cc-debian12

# Set the working directory
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/target/release/mkworld-overlay /app/mkworld-overlay

# Copy static files
COPY --from=builder /app/static ./static

# Expose port
EXPOSE 3000

# Run the application as non-root
USER 1001:1001

# Run the application
ENTRYPOINT ["./mkworld-overlay"] 