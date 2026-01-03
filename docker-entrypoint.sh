#!/bin/sh
set -e

echo "========================================="
echo "Starting Yousef Server..."
echo "========================================="

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "PNPM version: $(pnpm --version)"

echo "========================================="
echo "Environment Variables Check:"
echo "========================================="
echo "NODE_ENV: ${NODE_ENV}"
echo "PORT: ${PORT}"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..." # Only show first 30 chars for security

echo "========================================="
echo "Generating Prisma Client..."
echo "========================================="
pnpm prisma generate

echo "========================================="
echo "Running Database Migrations..."
echo "========================================="
pnpm prisma migrate deploy

echo "========================================="
echo "Starting Application..."
echo "========================================="
exec node dist/src/main.js
