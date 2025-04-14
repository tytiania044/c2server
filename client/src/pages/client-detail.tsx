import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useClients } from "@/context/clients-context";
import Topbar from "@/components/topbar";
import ClientDetails from "@/components/client-details";
import { Skeleton } from "@/components/ui/skeleton";

const ClientDetail: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [_, setLocation] = useLocation();
  const { clients, refreshClients } = useClients();
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState(clients.find(c => c.clientId === clientId));

  useEffect(() => {
    const loadClient = async () => {
      setIsLoading(true);
      try {
        // Try to find client in existing clients
        let foundClient = clients.find(c => c.clientId === clientId);
        
        // If not found, fetch from API
        if (!foundClient) {
          await refreshClients();
          foundClient = clients.find(c => c.clientId === clientId);
        }
        
        if (foundClient) {
          setClient(foundClient);
        } else {
          // Client not found, redirect to clients page
          setLocation("/clients");
        }
      } catch (error) {
        console.error("Error loading client:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClient();
  }, [clientId, clients, refreshClients, setLocation]);

  const handleBack = () => {
    setLocation("/clients");
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar pageTitle={`Client: ${clientId}`} />
      
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center">
              <Skeleton className="h-6 w-6 mr-4" />
              <Skeleton className="h-8 w-48" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
            
            <Skeleton className="h-80 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        ) : client ? (
          <ClientDetails client={client} onBack={handleBack} />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Client Not Found</h2>
            <p className="text-gray-400 mb-4">The requested client could not be found.</p>
            <button 
              onClick={handleBack}
              className="text-primary hover:text-blue-400"
            >
              Go back to clients list
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default ClientDetail;
