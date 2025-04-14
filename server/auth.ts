import bcrypt from 'bcrypt';
import { storage } from './storage';
import { InsertUser } from '@shared/schema';

/**
 * Authenticate a user by username and password
 * @param username The username to check
 * @param password The password to check
 * @returns The authenticated user if successful, null otherwise
 */
export async function authenticateUser(username: string, password: string) {
  const user = await storage.getUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  // Compare password with hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return null;
  }
  
  // Don't return the password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Authenticate by API key
 * @param apiKey The API key to check
 * @returns The authenticated user if successful, null otherwise
 */
export async function authenticateByApiKey(apiKey: string) {
  const users = await storage.getAllUsers();
  const user = users.find(u => u.apiKey === apiKey);
  
  if (!user) {
    return null;
  }
  
  // Don't return the password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Create a new user
 * @param user The user to create
 * @returns The created user
 */
export async function createUser(user: InsertUser) {
  // Hash the password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(user.password, saltRounds);
  
  const newUser = await storage.createUser({
    ...user,
    password: hashedPassword
  });
  
  // Don't return the password
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
}

/**
 * Initialize storage with necessary users
 */
export async function initializeStorage() {
  // Check if admin user exists
  const adminUser = await storage.getUserByUsername('admin');
  
  if (!adminUser) {
    // Create admin user if it doesn't exist
    await createUser({
      username: 'admin',
      password: 'admin',
      apiKey: 'C2_SERVER_API_KEY'
    });
  }
}
