import { useState, useEffect, useRef, useCallback } from "react";

interface UseWebSocketProps {
  url: string;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  enabled?: boolean;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  enabled = true,
}: UseWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    if (!enabled) return;
    
    // Build the WebSocket URL
    let wsUrl = url;
    if (!wsUrl.startsWith("ws")) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.host}${url}`;
    }
    
    // Create WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Event handlers
    socket.onopen = (event) => {
      setIsConnected(true);
      setError(null);
      if (onOpen) onOpen(event);
    };

    socket.onclose = (event) => {
      setIsConnected(false);
      if (onClose) onClose(event);
    };

    socket.onerror = (event) => {
      setError(event);
      if (onError) onError(event);
    };

    socket.onmessage = (event) => {
      if (onMessage) onMessage(event);
    };

    // Cleanup on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [url, onMessage, onOpen, onClose, onError, enabled]);

  // Send message helper
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof data === "string" ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return {
    isConnected,
    error,
    sendMessage,
  };
}
