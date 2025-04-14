import React, { useState, useRef, useEffect } from "react";
import { useClients } from "@/context/clients-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Command } from "@/types";

interface CommandTerminalProps {
  clientId: string;
}

interface TerminalEntry {
  type: "command" | "output";
  content: string;
  timestamp: Date;
}

const CommandTerminal: React.FC<CommandTerminalProps> = ({ clientId }) => {
  const { executeCommand, commandResults } = useClients();
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<TerminalEntry[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of terminal when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Listen for command results
  useEffect(() => {
    // Watch for changes in commandResults to update terminal
    const pendingCommands = history.filter(
      entry => entry.type === "command" && 
      !history.some(h => h.type === "output" && h.content.includes(`Command ID: ${entry.content.split(" - Command ID: ")[1]}`))
    );
    
    pendingCommands.forEach(entry => {
      // Extract command ID
      const commandIdMatch = entry.content.match(/Command ID: (\d+)/);
      if (commandIdMatch && commandIdMatch[1]) {
        const cmdId = parseInt(commandIdMatch[1]);
        
        // Check if we have results for this command
        if (commandResults[cmdId]) {
          // Add output to history
          setHistory(prev => [
            ...prev, 
            { 
              type: "output", 
              content: commandResults[cmdId],
              timestamp: new Date()
            }
          ]);
        }
      }
    });
  }, [commandResults, history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    setIsExecuting(true);
    
    // Add command to history
    setHistory(prev => [
      ...prev, 
      { 
        type: "command", 
        content: command,
        timestamp: new Date()
      }
    ]);
    
    try {
      const result = await executeCommand(clientId, command);
      
      if (result) {
        // Add command with ID to history for tracking results
        setHistory(prev => {
          // Remove the command we just added
          const newHistory = [...prev];
          const lastIndex = newHistory.length - 1;
          
          // Update it with command ID
          if (lastIndex >= 0 && newHistory[lastIndex].type === "command" && 
              newHistory[lastIndex].content === command) {
            newHistory[lastIndex] = {
              ...newHistory[lastIndex],
              content: `${command} - Command ID: ${result.id}`
            };
          }
          
          return newHistory;
        });
      }
    } catch (error) {
      console.error("Command execution error:", error);
      
      // Add error to history
      setHistory(prev => [
        ...prev, 
        { 
          type: "output", 
          content: `Error: Failed to execute command: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsExecuting(false);
      setCommand("");
    }
  };

  return (
    <div>
      <div 
        ref={terminalRef}
        className="bg-dark rounded-md font-mono text-sm p-4 h-64 overflow-y-auto mb-4 text-gray-300"
      >
        {history.length === 0 ? (
          <div className="text-gray-500">
            Type a command and press Enter to execute
          </div>
        ) : (
          history.map((entry, index) => (
            <div key={index} className={entry.type === "command" ? "mb-2" : "mb-4"}>
              {entry.type === "command" ? (
                <div>
                  <span className="text-success">$</span>{" "}
                  <span className="text-gray-300">{entry.content.split(" - Command ID:")[0]}</span>
                </div>
              ) : (
                <div className="text-gray-400 whitespace-pre-wrap">{entry.content}</div>
              )}
            </div>
          ))
        )}
        {isExecuting && (
          <div className="mb-2">
            <span className="text-success">$</span>{" "}
            <span className="text-gray-500 animate-pulse">Executing command...</span>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="flex">
        <Input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          className="flex-1 bg-dark border border-dark-lightest rounded-l-md px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Enter command..."
          disabled={isExecuting}
        />
        <Button
          type="submit"
          className="bg-primary hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-r-md transition duration-200"
          disabled={isExecuting}
        >
          Execute
        </Button>
      </form>
    </div>
  );
};

export default CommandTerminal;
