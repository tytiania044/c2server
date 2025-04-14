import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon database with WebSocket support
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with additional options for reliability
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of connections
  idleTimeoutMillis: 30000, // How long a connection can be idle before being closed
  connectionTimeoutMillis: 10000, // Connection timeout
  maxUses: 100, // Number of times a connection can be used before being closed
});

// Log connection attempt for debugging
console.log('Attempting to connect to the database...');

// Create drizzle instance
export const db = drizzle({ client: pool, schema });

// Test the connection
pool.connect()
  .then(() => {
    console.log('Successfully connected to the database');
  })
  .catch(error => {
    console.error('Error connecting to the database:', error);
    // Don't throw here, allow the application to start and retry connections later
  });