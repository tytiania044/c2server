import React, { createContext, useState, useContext, useEffect } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { Client, Activity, Notification, Command } from "@/types";
import { useAuth } from "./auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ClientsContextType {
  clients: Client[];
  activeClients: Client[];
  activities: Activity[];
  selectedClient: Client | null;
  isConnected: boolean;
  notifications: Notification[];
  screenshot: { clientId: string; image: string } | null;
  streamFrame: { clientId: string; frame: string } | null;
  commandResults: Record<number, string>;
  setSelectedClient: (client: Client | null) => void;
  refreshClients: () => Promise<void>;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  executeCommand: (clientId: string, command: string) => Promise<Command | null>;
  requestScreenshot: (clientId: string, quality?: number) => Promise<boolean>;
  controlStream: (clientId: string, action: "start" | "stop", options?: { quality?: number; fps?: number }) => Promise<boolean>;
  sendClientAction: (clientId: string, action: "mouseClick" | "keyStroke" | "specialKey", data?: any) => Promise<boolean>;
}

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

const ClientsContext = createContext<ClientsContextType>({
  clients: [],
  activeClients: [],
  activities: [],
  selectedClient: null,
  isConnected: false,
  notifications: [],
  screenshot: null,
  streamFrame: null,
  commandResults: {},
  setSelectedClient: () => {},
  refreshClients: async () => {},
  clearNotifications: () => {},
  removeNotification: () => {},
  executeCommand: async () => null,
  requestScreenshot: async () => false,
  controlStream: async () => false,
  sendClientAction: async () => false,
});

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClients, setActiveClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [screenshot, setScreenshot] = useState<{ clientId: string; image: string } | null>(null);
  const [streamFrame, setStreamFrame] = useState<{ clientId: string; frame: string } | null>(null);
  const [commandResults, setCommandResults] = useState<Record<number, string>>({});
  
  // WebSocket connection
  const { isConnected, sendMessage } = useWebSocket({
    url: `/ws?apiKey=${user?.apiKey || ''}`,
    onMessage: handleWebSocketMessage,
    enabled: isAuthenticated,
  });
  
  // Handle WebSocket messages
  function handleWebSocketMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      switch (message.type) {
        case "clientsList":
          setClients(message.clients);
          setActiveClients(message.clients.filter((c: Client) => c.status === "active"));
          break;
          
        case "newClient":
          addNotification({
            type: "success",
            title: "New Client Connected",
            message: `Client ${message.client.hostname} (${message.client.clientId}) connected`,
          });
          
          refreshClients();
          break;
          
        case "clientConnected":
          addNotification({
            type: "success",
            title: "Client Connected",
            message: `Client ${message.clientId} connected`,
          });
          
          refreshClients();
          break;
          
        case "clientDisconnected":
          addNotification({
            type: "warning",
            title: "Client Disconnected",
            message: `Client ${message.clientId} disconnected`,
          });
          
          refreshClients();
          break;
          
        case "screenshot":
          setScreenshot({
            clientId: message.clientId,
            image: message.image,
          });
          
          addNotification({
            type: "info",
            title: "Screenshot Received",
            message: `Screenshot from client ${message.clientId}`,
          });
          break;
          
        case "streamFrame":
          setStreamFrame({
            clientId: message.clientId,
            frame: message.frame,
          });
          break;
          
        case "commandResult":
          // Store command result
          setCommandResults(prev => ({
            ...prev,
            [message.commandId]: message.output
          }));
          
          addNotification({
            type: "info",
            title: "Command Result",
            message: `Result received for command ${message.commandId}`,
          });
          
          // Update activities
          refreshActivities();
          break;
      }
    } catch (error) {
      console.error("WebSocket message error:", error);
    }
  }

  // Fetch clients on authentication change
  useEffect(() => {
    if (isAuthenticated) {
      refreshClients();
      refreshActivities();
    } else {
      setClients([]);
      setActiveClients([]);
      setActivities([]);
      setSelectedClient(null);
    }
  }, [isAuthenticated]);

  // Add a notification
  function addNotification(notification: Omit<Notification, "id" | "timestamp">) {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 10));
    
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === "error" ? "destructive" : "default",
    });
  }

  // Clear all notifications
  function clearNotifications() {
    setNotifications([]);
  }

  // Remove a specific notification
  function removeNotification(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  // Refresh clients from API
  async function refreshClients() {
    if (!isAuthenticated) return;
    
    try {
      const allResponse = await fetch("/api/clients", {
        credentials: "include",
      });
      
      const activeResponse = await fetch("/api/clients/active", {
        credentials: "include",
      });
      
      if (allResponse.ok && activeResponse.ok) {
        const allClients = await allResponse.json();
        const activeClients = await activeResponse.json();
        
        setClients(allClients);
        setActiveClients(activeClients);
        
        // Update selected client if it exists
        if (selectedClient) {
          const updated = allClients.find((c: Client) => c.clientId === selectedClient.clientId);
          if (updated) {
            setSelectedClient(updated);
          }
        }
      }
    } catch (error) {
      console.error("Refresh clients error:", error);
      
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to refresh clients",
      });
    }
  }

  // Refresh activities from API
  async function refreshActivities() {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch("/api/activities?limit=20", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Refresh activities error:", error);
    }
  }

  // Execute command on client
  async function executeCommand(clientId: string, command: string): Promise<Command | null> {
    try {
      const response = await apiRequest("POST", "/api/commands", {
        clientId,
        command,
      });
      
      const data = await response.json();
      
      addNotification({
        type: "success",
        title: "Command Sent",
        message: `Command sent to client ${clientId}`,
      });
      
      // Refresh activities to show the new command
      refreshActivities();
      
      return data.command;
    } catch (error) {
      console.error("Execute command error:", error);
      
      addNotification({
        type: "error",
        title: "Command Failed",
        message: error instanceof Error ? error.message : "Failed to send command",
      });
      
      return null;
    }
  }

  // Request screenshot from client
  async function requestScreenshot(clientId: string, quality: number = 50): Promise<boolean> {
    try {
      const response = await apiRequest("POST", `/api/clients/${clientId}/screenshot`, {
        quality,
      });
      
      const data = await response.json();
      
      addNotification({
        type: "info",
        title: "Screenshot Requested",
        message: `Screenshot requested from client ${clientId}`,
      });
      
      return data.sent;
    } catch (error) {
      console.error("Screenshot request error:", error);
      
      addNotification({
        type: "error",
        title: "Screenshot Request Failed",
        message: error instanceof Error ? error.message : "Failed to request screenshot",
      });
      
      return false;
    }
  }

  // Control streaming for client
  async function controlStream(
    clientId: string, 
    action: "start" | "stop", 
    options?: { quality?: number; fps?: number }
  ): Promise<boolean> {
    try {
      const response = await apiRequest("POST", `/api/clients/${clientId}/stream`, {
        action,
        quality: options?.quality || 30,
        fps: options?.fps || 5,
      });
      
      const data = await response.json();
      
      addNotification({
        type: "info",
        title: `Stream ${action === "start" ? "Started" : "Stopped"}`,
        message: `Stream ${action} request sent to client ${clientId}`,
      });
      
      return data.sent;
    } catch (error) {
      console.error("Stream control error:", error);
      
      addNotification({
        type: "error",
        title: "Stream Control Failed",
        message: error instanceof Error ? error.message : `Failed to ${action} stream`,
      });
      
      return false;
    }
  }

  // Send mouse/keyboard action to client
  async function sendClientAction(
    clientId: string, 
    action: "mouseClick" | "keyStroke" | "specialKey", 
    data?: any
  ): Promise<boolean> {
    try {
      const response = await apiRequest("POST", `/api/clients/${clientId}/action`, {
        action,
        data,
      });
      
      const responseData = await response.json();
      
      return responseData.sent;
    } catch (error) {
      console.error("Client action error:", error);
      
      addNotification({
        type: "error",
        title: "Action Failed",
        message: error instanceof Error ? error.message : "Failed to send action to client",
      });
      
      return false;
    }
  }

  return (
    <ClientsContext.Provider
      value={{
        clients,
        activeClients,
        activities,
        selectedClient,
        isConnected,
        notifications,
        screenshot,
        streamFrame,
        commandResults,
        setSelectedClient,
        refreshClients,
        clearNotifications,
        removeNotification,
        executeCommand,
        requestScreenshot,
        controlStream,
        sendClientAction,
      }}
    >
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => useContext(ClientsContext);
