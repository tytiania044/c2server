import React, { useState, useEffect } from "react";
import Topbar from "@/components/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActivityList from "@/components/activity-list";
import { useClients } from "@/context/clients-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity } from "@/types";
import { useToast } from "@/hooks/use-toast";

const Logs: React.FC = () => {
  const { clients } = useClients();
  const { toast } = useToast();
  
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");

  // Fetch activities on mount
  useEffect(() => {
    fetchActivities();
  }, []);

  // Fetch all activities or client-specific ones
  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      let url = "/api/activities?limit=100";
      
      if (selectedClientId) {
        url = `/api/clients/${selectedClientId}/activities`;
      }
      
      const response = await fetch(url, {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter activities based on search and type
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch = 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activity.clientId && activity.clientId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activityTypeFilter === "all") return matchesSearch;
    return matchesSearch && activity.type === activityTypeFilter;
  });

  // Handle client selection change
  useEffect(() => {
    if (selectedClientId) {
      fetchActivities();
    }
  }, [selectedClientId]);

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar pageTitle="Activity Logs" />
      
      <div className="p-6">
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <Input
                type="text"
                placeholder="Search logs..."
                className="pl-10 bg-dark-lighter border border-dark-lightest"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger className="w-full md:w-40 bg-dark-lighter border border-dark-lightest">
                <SelectValue placeholder="All Clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.clientId} value={client.clientId}>
                    {client.hostname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select
              value={activityTypeFilter}
              onValueChange={setActivityTypeFilter}
            >
              <SelectTrigger className="w-full md:w-40 bg-dark-lighter border border-dark-lightest">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="connection">Connection</SelectItem>
                <SelectItem value="disconnection">Disconnection</SelectItem>
                <SelectItem value="command">Command</SelectItem>
                <SelectItem value="commandResult">Command Result</SelectItem>
                <SelectItem value="screenshot">Screenshot</SelectItem>
                <SelectItem value="streamStart">Stream Start</SelectItem>
                <SelectItem value="streamStop">Stream Stop</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Button 
              variant="default"
              onClick={fetchActivities}
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
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-white">
                Activity Logs {filteredActivities.length > 0 && `(${filteredActivities.length})`}
              </CardTitle>
              <div className="text-sm text-gray-400">
                {selectedClientId && (
                  <span className="mr-2">
                    Client: <span className="text-primary font-mono">{selectedClientId}</span>
                  </span>
                )}
                {activityTypeFilter !== "all" && (
                  <span className="mr-2">
                    Type: <span className="text-primary">{activityTypeFilter}</span>
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
            {isLoading ? (
              <div className="flex justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <ActivityList activities={filteredActivities} />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Logs;
