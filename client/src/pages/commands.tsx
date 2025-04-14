import React, { useState, useEffect } from "react";
import Topbar from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, Client } from "@/types";
import { formatRelativeTime, truncateString } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClients } from "@/context/clients-context";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CommandTerminal from "@/components/command-terminal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const Commands: React.FC = () => {
  const { clients, executeCommand, commandResults } = useClients();
  const { toast } = useToast();
  
  const [commands, setCommands] = useState<Command[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch commands on mount
  useEffect(() => {
    fetchCommands();
  }, []);

  // Fetch commands from API
  const fetchCommands = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/commands", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setCommands(data);
      }
    } catch (error) {
      console.error("Error fetching commands:", error);
      toast({
        title: "Error",
        description: "Failed to fetch commands history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter commands based on search and status
  const filteredCommands = commands.filter((command) => {
    const matchesSearch = 
      command.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      command.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (command.output && command.output.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && command.status === statusFilter;
  });

  // Get client details by clientId
  const getClientById = (clientId: string): Client | undefined => {
    return clients.find(client => client.clientId === clientId);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-success bg-opacity-20 text-success">Completed</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-warning bg-opacity-20 text-warning">Pending</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-danger bg-opacity-20 text-danger">Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-500 bg-opacity-20 text-gray-400">{status}</Badge>;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar pageTitle="Commands" />
      
      <div className="p-6">
        <Tabs defaultValue="history" className="mb-6">
          <TabsList className="mb-6">
            <TabsTrigger value="history">Commands History</TabsTrigger>
            <TabsTrigger value="execute">Execute Command</TabsTrigger>
          </TabsList>
          
          <TabsContent value="history">
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                  </div>
                  <Input
                    type="text"
                    placeholder="Search commands..."
                    className="pl-10 bg-dark-lighter border border-dark-lightest"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-full md:w-40 bg-dark-lighter border border-dark-lightest">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Button 
                  variant="default"
                  onClick={fetchCommands}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt mr-2"></i> Refresh
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <Card className="bg-dark-lighter rounded-lg shadow-md">
              <CardHeader className="px-6 py-4 border-b border-dark-lightest">
                <CardTitle className="text-lg font-medium text-white">
                  Commands History {filteredCommands.length > 0 && `(${filteredCommands.length})`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-dark-lightest">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Command</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Output</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Executed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-lightest">
                      {filteredCommands.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-400">
                            {isLoading ? "Loading commands..." : "No commands found"}
                          </td>
                        </tr>
                      ) : (
                        filteredCommands.map((command) => {
                          const client = getClientById(command.clientId);
                          return (
                            <tr key={command.id} className="hover:bg-dark-lightest">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(command.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                {command.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                  <span className="font-mono">{truncateString(command.clientId, 8)}</span>
                                  {client && (
                                    <span className="ml-2 text-gray-400">({client.hostname})</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                                {truncateString(command.command, 30)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {command.output ? (
                                  <span className="text-xs bg-dark-lightest p-1 rounded text-gray-400 font-mono">
                                    {truncateString(command.output, 30)}
                                  </span>
                                ) : (
                                  <span className="text-gray-500">No output</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                {formatRelativeTime(command.createdAt)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:text-blue-400"
                                    title="View Details"
                                    onClick={() => {
                                      toast({
                                        title: "Command Details",
                                        description: `ID: ${command.id}\nClient: ${command.clientId}\nCommand: ${command.command}\nStatus: ${command.status}`,
                                      });
                                    }}
                                  >
                                    <i className="fas fa-eye"></i>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-warning hover:text-yellow-400"
                                    title="Rerun Command"
                                    onClick={async () => {
                                      await executeCommand(command.clientId, command.command);
                                      toast({
                                        title: "Command Rerun",
                                        description: `Command sent again to client ${command.clientId}`,
                                      });
                                      setTimeout(fetchCommands, 1000);
                                    }}
                                  >
                                    <i className="fas fa-redo-alt"></i>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="execute">
            <Card className="bg-dark-lighter rounded-lg shadow-md">
              <CardHeader className="px-6 py-4 border-b border-dark-lightest">
                <CardTitle className="text-lg font-medium text-white">Execute Command</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Select Client</label>
                  <Select
                    value={selectedClient}
                    onValueChange={setSelectedClient}
                  >
                    <SelectTrigger className="w-full bg-dark-lighter border border-dark-lightest">
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
                
                {selectedClient ? (
                  <CommandTerminal clientId={selectedClient} />
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <i className="fas fa-terminal text-4xl mb-4"></i>
                    <p>Select a client to execute commands</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
};

export default Commands;
