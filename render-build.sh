#!/usr/bin/env bash
# Script run by Render.com during the build process

# Exit on error
set -e

# Debug information
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install dependencies with exact versions to prevent conflicts
npm ci || npm install

# Create a custom build script that doesn't rely on the package.json scripts
echo "=== Building project directly without using npm scripts ==="

# Build the frontend directly with npx
echo "Building frontend with Vite..."
NODE_ENV=production npx --no -- vite build

# Build the backend directly with npx
echo "Building backend with esbuild..."
npx --no -- esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Skip database migrations on first deploy to avoid errors
if [ -n "$DATABASE_URL" ]; then
  echo "Database URL found, attempting to push schema..."
  npx --no -- drizzle-kit push || echo "Warning: Schema push failed, may need to manually initialize database"
else
  echo "No DATABASE_URL found, skipping schema push"
fi

# Create a simple server.js entry point as fallback
cat > dist/server.js << 'EOL'
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(join(__dirname, '../dist/index.html'), 'utf8');

const server = createServer((req, res) => {
  console.log(`Serving ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(indexHtml);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOL

echo "Build completed successfully!"