import React, { useState, useEffect } from "react";
import Topbar from "@/components/topbar";
import SettingsPanel from "@/components/settings-panel";
import { Setting } from "@/types";
import { useToast } from "@/hooks/use-toast";

const Settings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch settings from API
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto">
      <Topbar pageTitle="Server Settings" />
      
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white mb-4">Server Settings</h1>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <SettingsPanel settings={settings} onSettingsUpdated={fetchSettings} />
        )}
      </div>
    </main>
  );
};

export default Settings;
