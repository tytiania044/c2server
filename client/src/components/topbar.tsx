import React from "react";
import { useClients } from "@/context/clients-context";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  pageTitle: string;
}

const Topbar: React.FC<TopbarProps> = ({ pageTitle }) => {
  const { activeClients, refreshClients } = useClients();
  
  const handleRefresh = () => {
    refreshClients();
  };
  
  return (
    <div className="bg-dark-lighter border-b border-dark-lightest px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-white">{pageTitle}</h1>
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-sm">
          <span className="w-3 h-3 rounded-full bg-success mr-2"></span>
          <span>{activeClients.length}</span> clients connected
        </div>
        <div className="flex items-center text-sm ml-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center text-xs bg-dark px-3 py-1 rounded-md hover:bg-dark-lightest"
            onClick={handleRefresh}
          >
            <i className="fas fa-sync-alt mr-1"></i> Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
