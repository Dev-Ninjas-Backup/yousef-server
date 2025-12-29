# ====== BUILD STAGE ======
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for build
RUN apt update && apt install -y openssl

# Copy package, lock file & prisma folder
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies
RUN npm ci

# Copy rest of the project files
COPY . .

# Generate Prisma Client before building
RUN npx prisma generate

# Verify Prisma Client was generated
RUN ls -la node_modules/.prisma/client || echo "Prisma client not found"

# Build the app (NestJS -> dist/)
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build --verbose

# ====== PRODUCTION STAGE ======
FROM node:20-slim AS production

# Set working directory
WORKDIR /app

# Install system dependencies needed at runtime
RUN apt update && apt install -y openssl curl

# Copy only necessary files from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Install dependencies (skip prepare/postinstall scripts for production)
RUN npm ci --omit=dev --ignore-scripts

# Re-generate Prisma Client in production stage (recommended)
RUN npx prisma generate

# Expose the port
EXPOSE 3000

# Run the app
CMD ["npm", "run", "start:docker"]