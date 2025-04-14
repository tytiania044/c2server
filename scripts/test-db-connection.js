#!/usr/bin/env node

// Simple script to test database connection
// Usage: node scripts/test-db-connection.js

import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon
const neonConfig = { webSocketConstructor: ws };

// Function to test connection
async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔄 Testing database connection...');
  console.log(`🔗 Connection string: ${maskConnectionString(process.env.DATABASE_URL)}`);
  
  let client;
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    client = await pool.connect();
    
    console.log('✅ Successfully connected to the database!');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`🕒 Current database time: ${result.rows[0].current_time}`);
    
    // Get database version
    const versionResult = await client.query('SELECT version()');
    console.log(`ℹ️ Database version: ${versionResult.rows[0].version}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to connect to the database:');
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.release();
    }
  }
}

// Mask connection string to hide password
function maskConnectionString(connectionString) {
  try {
    if (!connectionString) return 'undefined';
    // Format: postgres://user:password@host/dbname
    return connectionString.replace(/:([^@]*)@/, ':********@');
  } catch (e) {
    return 'Error parsing connection string';
  }
}

// Run the test
testConnection().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});