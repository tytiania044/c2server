export interface User {
  id: number;
  username: string;
  apiKey?: string;
  createdAt?: Date;
}

export interface Client {
  id: number;
  clientId: string;
  hostname: string;
  ip: string;
  platform: string;
  platformRelease?: string;
  platformVersion?: string;
  architecture?: string;
  processor?: string;
  username?: string;
  screenResolution?: string;
  lastSeen: Date;
  firstSeen: Date;
  status: 'active' | 'idle' | 'offline';
  additionalInfo?: any;
}

export interface Command {
  id: number;
  clientId: string;
  command: string;
  output?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface Activity {
  id: number;
  clientId?: string;
  type: string;
  description: string;
  createdAt: Date;
  data?: any;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
}

export interface Stats {
  activeClientCount: number;
  totalClientCount: number;
  commandsExecuted: number;
  totalCommands: number;
  activeStreams: number;
}

export interface LoginRequest {
  username: string;
  password: string;
  apiKey?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface CommandRequest {
  clientId: string;
  command: string;
}

export interface ScreenshotRequest {
  clientId: string;
  quality?: number;
}

export interface StreamRequest {
  clientId: string;
  quality?: number;
  fps?: number;
  action: 'start' | 'stop';
}

export interface ClientAction {
  clientId: string;
  action: 'mouseClick' | 'keyStroke' | 'specialKey';
  data?: {
    x?: number;
    y?: number;
    button?: number;
    key?: string;
    keyCode?: number;
  };
}

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}
