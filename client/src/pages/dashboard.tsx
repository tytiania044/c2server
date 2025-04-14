import React, { useState, useEffect } from "react";
import Topbar from "@/components/topbar";
import StatCard from "@/components/stat-card";
import ClientTable from "@/components/client-table";
import ActivityList from "@/components/activity-list";
import { useClients } from "@/context/clients-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard: React.FC = () => {
  const { clients, activeClients, activities, refreshClients } = useClients();
  const [stats, setStats] = useState({
    activeClients: 0,
    commandsExecuted: 0,
    activeStreams: 0,
  });

  // Fetch stats on mount and refresh
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats", {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats({
            activeClients: data.activeClientCount || 0,
            commandsExecuted: data.commandsExecuted || 0,
            activeStreams: data.activeStreams || 0,
          });
        }
      } catch (error) {
        console.error("Stats fetch error:", error);
      }
    };
    
    fetchStats();
  }, [clients]);

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar pageTitle="Dashboard" />
      
      <div id="dashboard-page" className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="Active Clients"
            value={stats.activeClients}
            icon="fas fa-laptop"
            color="primary"
          />
          <StatCard
            title="Commands Executed"
            value={stats.commandsExecuted}
            icon="fas fa-terminal"
            color="success"
          />
          <StatCard
            title="Active Streams"
            value={stats.activeStreams}
            icon="fas fa-network-wired"
            color="warning"
          />
        </div>

        {/* Active Clients */}
        <Card className="bg-dark-lighter rounded-lg shadow-md mb-6">
          <CardHeader className="px-6 py-4 border-b border-dark-lightest">
            <CardTitle className="text-lg font-medium text-white">Active Clients</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ClientTable clients={activeClients} />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-dark-lighter rounded-lg shadow-md">
          <CardHeader className="px-6 py-4 border-b border-dark-lightest">
            <CardTitle className="text-lg font-medium text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ActivityList activities={activities.slice(0, 10)} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Dashboard;
