import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon database with WebSocket support
neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.warn(
    "WARNING: DATABASE_URL is not set. Using fallback for development."
  );
}

// Create a connection pool with retry logic
const createPool = () => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }
    
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 5, // Reduce max connections to avoid overwhelming the database
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000, // Increase timeout
      maxUses: 50, // Reduce number of reuses to prevent connection issues
    });
  } catch (error) {
    console.error("Failed to create database pool:", error);
    throw error;
  }
};

// Allow the app to start even if the database connection fails initially
let pool: Pool;
let db: ReturnType<typeof drizzle>;

try {
  console.log('Attempting to connect to the database...');
  pool = createPool();
  db = drizzle({ client: pool, schema });
  
  // Test the connection but don't block startup
  pool.connect()
    .then(() => {
      console.log('Successfully connected to the database');
    })
    .catch(error => {
      console.error('Error connecting to the database:', error);
      console.log('Will retry connections as needed during operation');
    });
} catch (error) {
  console.error('Failed to initialize database:', error);
  // Create placeholders that will throw clear errors if used before connection is established
  pool = {} as Pool;
  db = {} as ReturnType<typeof drizzle>;
}

export { pool, db };