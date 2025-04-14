import React, { useState, useEffect } from "react";
import { Setting } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SettingsPanelProps {
  settings: Setting[];
  onSettingsUpdated: () => void;
}

interface ServerStats {
  uptime: string;
  memoryUsage: string;
  cpuUsage: string;
  activeClients: number;
  totalClients: number;
  commandsExecuted: number;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ settings, onSettingsUpdated }) => {
  const { toast } = useToast();
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [showEncryptionKey, setShowEncryptionKey] = useState(false);
  const [stats, setStats] = useState<ServerStats>({
    uptime: "Loading...",
    memoryUsage: "Loading...",
    cpuUsage: "Loading...",
    activeClients: 0,
    totalClients: 0,
    commandsExecuted: 0,
  });
  const [serverStatus, setServerStatus] = useState({
    http: true,
    websocket: true,
    database: true,
    encryption: true,
  });

  // Initialize edited settings with current values
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    settings.forEach((setting) => {
      initialValues[setting.key] = setting.value;
    });
    setEditedSettings(initialValues);
  }, [settings]);

  // Load server stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats", {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Calculate uptime (mocked for now)
          const days = Math.floor(Math.random() * 10) + 1;
          const hours = Math.floor(Math.random() * 24);
          
          setStats({
            uptime: `${days} days, ${hours} hours`,
            memoryUsage: `${Math.floor(Math.random() * 512) + 128} MB`,
            cpuUsage: `${(Math.random() * 5).toFixed(1)}%`,
            activeClients: data.activeClientCount || 0,
            totalClients: data.totalClientCount || 0,
            commandsExecuted: data.commandsExecuted || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();
    
    // Poll for stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleSettingChange = (key: string, value: string) => {
    setEditedSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // Check for changes
      const changedSettings = Object.entries(editedSettings).filter(
        ([key, value]) => {
          const originalSetting = settings.find((s) => s.key === key);
          return originalSetting && originalSetting.value !== value;
        }
      );
      
      if (changedSettings.length === 0) {
        toast({
          title: "No Changes",
          description: "No settings have been changed",
        });
        return;
      }
      
      // Update each changed setting
      const updatePromises = changedSettings.map(([key, value]) =>
        apiRequest("PUT", `/api/settings/${key}`, { value })
      );
      
      await Promise.all(updatePromises);
      
      toast({
        title: "Settings Saved",
        description: `${changedSettings.length} setting(s) updated successfully`,
      });
      
      // Notify parent component
      onSettingsUpdated();
    } catch (error) {
      console.error("Save settings error:", error);
      
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleRestartServer = () => {
    toast({
      title: "Server Restart",
      description: "Server restart functionality not implemented",
      variant: "destructive",
    });
  };

  const handleShutdownServer = () => {
    toast({
      title: "Server Shutdown",
      description: "Server shutdown functionality not implemented",
      variant: "destructive",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Server Configuration */}
      <div className="lg:col-span-2 bg-dark-lighter rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-dark-lightest">
          <h2 className="text-lg font-medium text-white">Server Configuration</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* Server Listening */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">Listening Endpoints</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-400 mb-2">HTTP Server Port</Label>
                  <Input
                    type="number"
                    value="5000"
                    className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-400 mb-2">WebSocket Server Port</Label>
                  <Input
                    type="number"
                    value="5000"
                    className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled
                  />
                </div>
              </div>
            </div>
            
            {/* Security Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-400 mb-2">Authentication</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm text-gray-400 mb-1">Username</Label>
                      <Input
                        type="text"
                        value="admin"
                        className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled
                      />
                    </div>
                    <div>
                      <Label className="block text-sm text-gray-400 mb-1">Password</Label>
                      <Input
                        type="password"
                        value="••••••••"
                        className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-400 mb-2">Encryption Key</Label>
                  <div className="relative">
                    <Input
                      type={showEncryptionKey ? "text" : "password"}
                      value={editedSettings.encryptionKey || ""}
                      onChange={(e) => handleSettingChange("encryptionKey", e.target.value)}
                      className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                      onClick={() => setShowEncryptionKey(!showEncryptionKey)}
                    >
                      <i className={`fas fa-${showEncryptionKey ? "eye-slash" : "eye"}`}></i>
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">This key is used for AES-256 encryption of communications with clients</p>
                </div>
                
                <div>
                  <Label className="block text-sm font-medium text-gray-400 mb-2">Session Settings</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-sm text-gray-400 mb-1">Session Timeout (minutes)</Label>
                      <Input
                        type="number"
                        value={editedSettings.sessionTimeout || "30"}
                        onChange={(e) => handleSettingChange("sessionTimeout", e.target.value)}
                        className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <Label className="block text-sm text-gray-400 mb-1">Max Login Attempts</Label>
                      <Input
                        type="number"
                        value="5"
                        className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Default Client Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">Default Client Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm text-gray-400 mb-1">Screenshot Quality (1-100)</Label>
                  <Input
                    type="number"
                    value={editedSettings.screenshotQuality || "50"}
                    onChange={(e) => handleSettingChange("screenshotQuality", e.target.value)}
                    min="1"
                    max="100"
                    className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <Label className="block text-sm text-gray-400 mb-1">Streaming Quality (1-100)</Label>
                  <Input
                    type="number"
                    value={editedSettings.streamQuality || "30"}
                    onChange={(e) => handleSettingChange("streamQuality", e.target.value)}
                    min="1"
                    max="100"
                    className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <Label className="block text-sm text-gray-400 mb-1">Default Frame Rate (FPS)</Label>
                  <Input
                    type="number"
                    value={editedSettings.frameRate || "5"}
                    onChange={(e) => handleSettingChange("frameRate", e.target.value)}
                    min="1"
                    max="30"
                    className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <Label className="block text-sm text-gray-400 mb-1">Client Beacon Interval (seconds)</Label>
                  <Input
                    type="number"
                    value="60"
                    className="w-full bg-dark-lighter border border-dark-lightest rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Server Status */}
      <div className="bg-dark-lighter rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-dark-lightest">
          <h2 className="text-lg font-medium text-white">Server Status</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {/* Status Indicators */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm">HTTP Server</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success bg-opacity-20 text-success">
                  Running
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm">WebSocket Server</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success bg-opacity-20 text-success">
                  Running
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm">Database</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success bg-opacity-20 text-success">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Encryption</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success bg-opacity-20 text-success">
                  Active
                </span>
              </div>
            </div>
            
            {/* Server Statistics */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">Statistics</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="text-sm">{stats.uptime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory Usage</span>
                  <span className="text-sm">{stats.memoryUsage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">CPU Usage</span>
                  <span className="text-sm">{stats.cpuUsage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connected Clients</span>
                  <span className="text-sm">{stats.activeClients}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Clients</span>
                  <span className="text-sm">{stats.totalClients}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Commands Executed</span>
                  <span className="text-sm">{stats.commandsExecuted}</span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div>
              <div className="space-y-2">
                <Button
                  variant="default"
                  className="w-full bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
                  onClick={handleSaveSettings}
                >
                  <i className="fas fa-save mr-2"></i> Save Settings
                </Button>
                <Button
                  variant="outline"
                  className="w-full bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
                  onClick={handleRestartServer}
                >
                  <i className="fas fa-sync-alt mr-2"></i> Restart Server
                </Button>
                <Button
                  variant="destructive"
                  className="w-full hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
                  onClick={handleShutdownServer}
                >
                  <i className="fas fa-power-off mr-2"></i> Shutdown Server
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
