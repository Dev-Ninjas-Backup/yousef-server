# Stage 1: Build
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy prisma schema
COPY prisma ./prisma

# Clean install with explicit Prisma generation
RUN npm i -g npm@latest
RUN npm ci
RUN npx prisma generate --schema=./prisma/models

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/prisma ./prisma

# Create uploads folder
RUN mkdir -p uploads

# Set environment
ENV NODE_ENV=production
EXPOSE 5056

CMD ["npm", "run", "start:docker"]