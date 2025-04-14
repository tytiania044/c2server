import React, { useEffect, useState } from "react";
import Topbar from "@/components/topbar";
import StreamingControl from "@/components/streaming-control";
import { useClients } from "@/context/clients-context";
import { useLocation } from "wouter";

const Streaming: React.FC = () => {
  const { clients, refreshClients } = useClients();
  const [location] = useLocation();
  const [defaultClientId, setDefaultClientId] = useState<string | undefined>(undefined);

  useEffect(() => {
    refreshClients();
    
    // Check if clientId is specified in URL query params
    if (location.includes("?clientId=")) {
      const params = new URLSearchParams(location.split("?")[1]);
      const clientId = params.get("clientId");
      if (clientId) {
        setDefaultClientId(clientId);
      }
    }
  }, [refreshClients, location]);

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar pageTitle="Remote Streaming Control" />
      
      <div className="p-6">
        <StreamingControl clients={clients} defaultClientId={defaultClientId} />
      </div>
    </main>
  );
};

export default Streaming;
