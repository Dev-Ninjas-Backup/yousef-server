# ====== BUILD STAGE ======
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache openssl libc6-compat python3 make g++

# Install pnpm
RUN npm install -g pnpm@10

# Copy dependency files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy prisma files
COPY prisma.config.ts ./
COPY prisma ./prisma

# Generate Prisma Client
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
ENV DATABASE_URL=${DATABASE_URL}
RUN pnpm exec prisma generate

# Copy source and build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN pnpm run build

# Prune to production dependencies
RUN pnpm prune --prod

# ====== PRODUCTION STAGE ======
FROM node:20-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    openssl \
    curl \
    wget \
    ca-certificates \
    dumb-init

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10

# Copy package files and install production dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copy prisma files and generated client
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built app
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]