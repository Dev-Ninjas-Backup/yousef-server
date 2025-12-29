# ====== BUILD STAGE ======
FROM node:24-slim AS builder

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

# Build the app (NestJS -> dist/)
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# ====== PRODUCTION STAGE ======
FROM node:24-slim AS production

# Set working directory
WORKDIR /app

# Install system dependencies needed at runtime
RUN apt update && apt install -y openssl curl

# Copy only necessary files from builder stage
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Install dependencies
RUN npm ci --omit=dev

# Expose the port
EXPOSE 3000

# Run the app
CMD ["npm", "start:docker"]