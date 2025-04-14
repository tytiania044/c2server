import React from "react";
import { useClients } from "@/context/clients-context";
import { formatRelativeTime, getPlatformIcon, getStatusColor } from "@/lib/utils";
import { Link } from "wouter";
import { Client } from "@/types";
import { Button } from "@/components/ui/button";

interface ClientTableProps {
  clients: Client[];
}

const ClientTable: React.FC<ClientTableProps> = ({ clients }) => {
  const { setSelectedClient, refreshClients } = useClients();

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-dark-lightest">
        <thead>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hostname</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP Address</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">OS</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Seen</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dark-lightest">
          {clients.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-400">
                No clients found
              </td>
            </tr>
          ) : (
            clients.map((client) => (
              <tr key={client.clientId} className="hover:bg-dark-lightest">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-opacity-20 ${getStatusColor(client.status)} ${getStatusColor(client.status).replace('bg-', 'text-')}`}>
                    {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                  {client.clientId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {client.hostname}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {client.ip}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="flex items-center">
                    <i className={`${getPlatformIcon(client.platform)} mr-1`}></i>
                    {client.platform} {client.platformVersion || ""}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatRelativeTime(client.lastSeen)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-2">
                    <Link href={`/clients/${client.clientId}`}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-blue-400" 
                        title="View Details"
                        onClick={() => handleViewDetails(client)}
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                    </Link>
                    <Link href={`/streaming?clientId=${client.clientId}`}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-warning hover:text-yellow-400" 
                        title="Remote Control"
                      >
                        <i className="fas fa-desktop"></i>
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-danger hover:text-red-400" 
                      title="Terminate"
                    >
                      <i className="fas fa-times-circle"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;
