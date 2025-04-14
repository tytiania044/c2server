import { apiRequest } from "./queryClient";
import { LoginRequest, LoginResponse, User } from "@/types";

/**
 * Login with username and password
 * @param credentials Login credentials
 * @returns User object if login successful
 */
export async function login(credentials: LoginRequest): Promise<User> {
  const response = await apiRequest("POST", "/api/auth/login", credentials);
  const data = await response.json() as LoginResponse;
  return data.user;
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout", {});
}

/**
 * Check if user is authenticated
 * @returns Authentication status and user object
 */
export async function checkAuth(): Promise<{ authenticated: boolean; user: User | null }> {
  const response = await fetch("/api/auth/check", {
    credentials: "include",
  });
  
  return await response.json();
}
