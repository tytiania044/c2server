#!/usr/bin/env bash
# Script run by Render.com during the build process

# Exit on error
set -e

# Install dependencies with exact versions to prevent conflicts
npm ci || npm install

# Make vite available globally for this build
npm install -g vite esbuild

# Build the frontend
echo "Building frontend with Vite..."
vite build

# Build the backend
echo "Building backend with esbuild..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Skip database migrations on first deploy to avoid errors
# Instead of pushing schema immediately, add a check
if [ -n "$DATABASE_URL" ]; then
  echo "Database URL found, attempting to push schema..."
  npm run db:push || echo "Warning: Schema push failed, may need to manually initialize database"
else
  echo "No DATABASE_URL found, skipping schema push"
fi

echo "Build completed successfully!"