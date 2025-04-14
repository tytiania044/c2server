import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as a human-readable string
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleString();
}

/**
 * Format a date as a relative time string (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return diffSecs === 1 ? "1 second ago" : `${diffSecs} seconds ago`;
  } else if (diffMins < 60) {
    return diffMins === 1 ? "1 minute ago" : `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  } else {
    return d.toLocaleDateString();
  }
}

/**
 * Truncate a string to the specified length
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Format bytes as a human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Generate a random color based on a string
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ("00" + value.toString(16)).substr(-2);
  }
  
  return color;
}

/**
 * Get the OS icon class based on platform name
 */
export function getPlatformIcon(platform: string): string {
  const p = platform.toLowerCase();
  
  if (p.includes("windows")) return "fab fa-windows";
  if (p.includes("mac") || p.includes("darwin")) return "fab fa-apple";
  if (p.includes("linux") || p.includes("ubuntu") || p.includes("debian")) return "fab fa-linux";
  if (p.includes("android")) return "fab fa-android";
  if (p.includes("ios") || p.includes("iphone") || p.includes("ipad")) return "fab fa-apple";
  
  return "fas fa-desktop";
}

/**
 * Get client status color
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
      return "bg-success";
    case "idle":
      return "bg-warning";
    case "offline":
      return "bg-gray-500";
    default:
      return "bg-gray-500";
  }
}

/**
 * Get activity type icon
 */
export function getActivityIcon(type: string): string {
  switch (type.toLowerCase()) {
    case "connection":
      return "fas fa-plug";
    case "disconnection":
      return "fas fa-unlink";
    case "command":
      return "fas fa-terminal";
    case "commandresult":
      return "fas fa-reply";
    case "screenshot":
      return "fas fa-camera";
    case "streamstart":
      return "fas fa-video";
    case "streamstop":
      return "fas fa-stop-circle";
    default:
      return "fas fa-info-circle";
  }
}

/**
 * Get activity type color
 */
export function getActivityColor(type: string): string {
  switch (type.toLowerCase()) {
    case "connection":
      return "text-success";
    case "disconnection":
      return "text-warning";
    case "command":
      return "text-primary";
    case "commandresult":
      return "text-blue-400";
    case "screenshot":
      return "text-purple-400";
    case "streamstart":
      return "text-warning";
    case "streamstop":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}
