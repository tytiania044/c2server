import React, { useEffect } from "react";
import Topbar from "@/components/topbar";
import ClientTable from "@/components/client-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClients } from "@/context/clients-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const Clients: React.FC = () => {
  const { clients, refreshClients } = useClients();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filter, setFilter] = React.useState("all");

  useEffect(() => {
    refreshClients();
  }, [refreshClients]);

  // Filter clients based on search term and status filter
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.platform && client.platform.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filter === "all") return matchesSearch;
    return matchesSearch && client.status === filter;
  });

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar pageTitle="Clients" />
      
      <div className="p-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label className="text-sm text-gray-400 mb-2 block">Search Clients</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <Input
                type="text"
                placeholder="Search by ID, hostname, IP..."
                className="pl-10 bg-dark-lighter border border-dark-lightest"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label className="text-sm text-gray-400 mb-2 block">Filter by Status</Label>
            <Select
              value={filter}
              onValueChange={setFilter}
            >
              <SelectTrigger className="w-full md:w-40 bg-dark-lighter border border-dark-lightest">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="idle">Idle</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="self-end">
            <Button 
              variant="default"
              onClick={() => refreshClients()}
              className="w-full md:w-auto"
            >
              <i className="fas fa-sync-alt mr-2"></i> Refresh
            </Button>
          </div>
        </div>

        <Card className="bg-dark-lighter rounded-lg shadow-md">
          <CardHeader className="px-6 py-4 border-b border-dark-lightest">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-white">
                All Clients {filteredClients.length > 0 && `(${filteredClients.length})`}
              </CardTitle>
              <div className="text-sm text-gray-400">
                {filter !== "all" && (
                  <span className="mr-2">
                    Filtering: <span className="text-primary">{filter}</span>
                  </span>
                )}
                {searchTerm && (
                  <span>
                    Search: <span className="text-primary">{searchTerm}</span>
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <ClientTable clients={filteredClients} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Clients;
