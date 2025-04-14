#!/usr/bin/env bash
# Script run by Render.com during the build process

# Exit on error
set -e

# Build the app
npm install
npm run build

# Push schema to database
npm run db:push

echo "Build completed successfully!"