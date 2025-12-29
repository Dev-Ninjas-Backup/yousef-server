# ====== BUILD STAGE ======
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for build
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ALL dependencies
RUN npm ci

# Copy prisma files
COPY prisma.config.ts ./
COPY prisma ./prisma

# Use dummy DATABASE_URL for prisma generate (won't be used for actual connection)
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Build the app
RUN npm run build

# ====== PRODUCTION STAGE ======
FROM node:20-slim AS production

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install ALL dependencies (removed --omit=dev)
RUN npm ci --ignore-scripts

# Copy prisma files
COPY prisma.config.ts ./
COPY prisma ./prisma

# Use dummy DATABASE_URL for prisma generate
ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"

# Generate Prisma Client
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    chown -R nestjs:nodejs /app

CMD ["npm", "run", "start:docker"]
