import { eq, desc, asc, and, or, gte, lte, like, sql } from "drizzle-orm";
import { users, type User, type InsertUser, clients, type Client, type InsertClient, commands, type Command, type InsertCommand, 
  activities, type Activity, type InsertActivity, settings, type Setting, type InsertSetting } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientByClientId(clientId: string): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  getActiveClients(): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(clientId: string, data: Partial<InsertClient>): Promise<Client | undefined>;
  updateClientLastSeen(clientId: string): Promise<Client | undefined>;
  
  // Command operations
  getCommand(id: number): Promise<Command | undefined>;
  getCommandsByClientId(clientId: string): Promise<Command[]>;
  getPendingCommands(clientId: string): Promise<Command[]>;
  getAllCommands(): Promise<Command[]>;
  createCommand(command: InsertCommand): Promise<Command>;
  updateCommandStatus(id: number, status: string, output?: string): Promise<Command | undefined>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  getActivitiesByClientId(clientId: string): Promise<Activity[]>;
  
  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  getAllSettings(): Promise<Setting[]>;
  updateSetting(key: string, value: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  
  // Stats operations
  getStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByClientId(clientId: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.clientId, clientId));
    return client || undefined;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.lastSeen));
  }

  async getActiveClients(): Promise<Client[]> {
    // Consider clients active if they've been seen in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return await db.select()
      .from(clients)
      .where(
        and(
          eq(clients.status, 'active'),
          gte(clients.lastSeen, fiveMinutesAgo)
        )
      )
      .orderBy(desc(clients.lastSeen));
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    // First check if the client already exists
    const existingClient = await this.getClientByClientId(insertClient.clientId);
    
    if (existingClient) {
      // Update the existing client with new information
      return await this.updateClient(insertClient.clientId, insertClient) as Client;
    }
    
    // Create a new client if it doesn't exist
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    
    // Create an activity log for the new client
    await this.createActivity({
      clientId: client.clientId,
      type: 'connection',
      description: `New client connected from ${client.ip}`,
      data: { client: { ...client } }
    });
    
    return client;
  }

  async updateClient(clientId: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set(data)
      .where(eq(clients.clientId, clientId))
      .returning();
    
    return updatedClient || undefined;
  }

  async updateClientLastSeen(clientId: string): Promise<Client | undefined> {
    const now = new Date();
    
    const [updatedClient] = await db
      .update(clients)
      .set({ lastSeen: now })
      .where(eq(clients.clientId, clientId))
      .returning();
    
    return updatedClient || undefined;
  }

  async getCommand(id: number): Promise<Command | undefined> {
    const [command] = await db.select().from(commands).where(eq(commands.id, id));
    return command || undefined;
  }

  async getCommandsByClientId(clientId: string): Promise<Command[]> {
    return await db
      .select()
      .from(commands)
      .where(eq(commands.clientId, clientId))
      .orderBy(desc(commands.createdAt));
  }

  async getPendingCommands(clientId: string): Promise<Command[]> {
    return await db
      .select()
      .from(commands)
      .where(
        and(
          eq(commands.clientId, clientId),
          eq(commands.status, 'pending')
        )
      )
      .orderBy(asc(commands.createdAt));
  }

  async getAllCommands(): Promise<Command[]> {
    return await db
      .select()
      .from(commands)
      .orderBy(desc(commands.createdAt));
  }

  async createCommand(insertCommand: InsertCommand): Promise<Command> {
    const [command] = await db
      .insert(commands)
      .values(insertCommand)
      .returning();
    
    // Create an activity log for the new command
    await this.createActivity({
      clientId: command.clientId,
      type: 'command',
      description: `Command sent to client: ${command.command.substring(0, 50)}${command.command.length > 50 ? '...' : ''}`,
      data: { commandId: command.id }
    });
    
    return command;
  }

  async updateCommandStatus(id: number, status: string, output?: string): Promise<Command | undefined> {
    const updates: Partial<Command> = { 
      status,
      ...(output !== undefined && { output }),
      ...(status === 'completed' && { completedAt: new Date() })
    };
    
    const [updatedCommand] = await db
      .update(commands)
      .set(updates)
      .where(eq(commands.id, id))
      .returning();
    
    if (updatedCommand && status === 'completed') {
      // Create an activity log for the completed command
      await this.createActivity({
        clientId: updatedCommand.clientId,
        type: 'command_result',
        description: `Received result for command: ${updatedCommand.command.substring(0, 50)}${updatedCommand.command.length > 50 ? '...' : ''}`,
        data: { commandId: updatedCommand.id, status }
      });
    }
    
    return updatedCommand || undefined;
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    
    return activity;
  }

  async getRecentActivities(limit: number = 20): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async getActivitiesByClientId(clientId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.clientId, clientId))
      .orderBy(desc(activities.createdAt));
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key));
    
    return setting || undefined;
  }

  async getAllSettings(): Promise<Setting[]> {
    return await db
      .select()
      .from(settings);
  }

  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    // Check if setting exists
    const existingSetting = await this.getSetting(key);
    
    if (!existingSetting) {
      return undefined;
    }
    
    const [updatedSetting] = await db
      .update(settings)
      .set({ value })
      .where(eq(settings.key, key))
      .returning();
    
    return updatedSetting || undefined;
  }

  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    // Check if setting already exists
    const existingSetting = await this.getSetting(insertSetting.key);
    
    if (existingSetting) {
      // Update the existing setting
      const updated = await this.updateSetting(insertSetting.key, insertSetting.value);
      return updated as Setting;
    }
    
    // Create a new setting
    const [setting] = await db
      .insert(settings)
      .values(insertSetting)
      .returning();
    
    return setting;
  }

  async getStats(): Promise<any> {
    const activeClientsCount = (await this.getActiveClients()).length;
    const totalClientsCount = (await this.getAllClients()).length;
    const commandsCount = (await this.getAllCommands()).length;
    
    const completedCommandsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(commands)
      .where(eq(commands.status, 'completed'));
    
    const pendingCommandsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(commands)
      .where(eq(commands.status, 'pending'));
    
    const failedCommandsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(commands)
      .where(eq(commands.status, 'failed'));
    
    // Get last 24 hours of activities
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivities = await db
      .select()
      .from(activities)
      .where(gte(activities.createdAt, oneDayAgo))
      .orderBy(desc(activities.createdAt));
    
    return {
      activeClients: activeClientsCount,
      totalClients: totalClientsCount,
      commands: {
        total: commandsCount,
        completed: completedCommandsCount[0]?.count || 0,
        pending: pendingCommandsCount[0]?.count || 0,
        failed: failedCommandsCount[0]?.count || 0
      },
      recentActivities: recentActivities.slice(0, 10)
    };
  }
}

export const storage = new DatabaseStorage();