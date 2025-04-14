#!/usr/bin/env bash
# Script run by Render.com during the build process

# Exit on error
set -e

# Build the app
npm install

# Use npx to ensure we're using the local Vite installation
npx vite build
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Push schema to database
npm run db:push

echo "Build completed successfully!"