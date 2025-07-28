# Multi-stage Dockerfile for HFT System
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    bash \
    vips-dev \
    libc6-compat

# Copy package files
COPY package*.json ./
COPY web/package*.json ./web/

# Install dependencies (with optional dependencies as optional)
RUN npm ci --omit=dev --ignore-optional && \
    cd web && npm ci --omit=dev

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    bash \
    netcat-openbsd \
    vips

# Create app user for security
RUN addgroup -g 1001 -S hftuser && \
    adduser -S hftuser -u 1001 -G hftuser

# Set working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY --chown=hftuser:hftuser . .

# Create necessary directories with proper ownership
RUN mkdir -p logs data/cache tmp build/production && \
    chown -R hftuser:hftuser /app

# Create entrypoint script
COPY --chown=hftuser:hftuser docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Switch to non-root user
USER hftuser

# Expose ports
EXPOSE 3000 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["/usr/local/bin/docker-entrypoint.sh"]
