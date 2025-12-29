# Stage 1: Build
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install deps
RUN npm i -g pnpm@latest && pnpm i 

# Copy prisma folder
COPY prisma ./prisma

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma:generate

# Build the app
RUN pnpm build

# Stage 2: Run
FROM node:20-alpine

WORKDIR /app

# Copy build output & dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
# create uploads folder to upload all files
RUN mkdir -p uploads

# Set production env
ENV NODE_ENV=production
EXPOSE 5056

CMD ["pnpm", "start:docker"]
