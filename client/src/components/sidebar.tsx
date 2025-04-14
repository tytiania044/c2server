import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useClients } from "@/context/clients-context";
import { cn } from "@/lib/utils";

const Sidebar: React.FC = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { activeClients } = useClients();

  const navItems = [
    { href: "/dashboard", icon: "fas fa-tachometer-alt", label: "Dashboard" },
    { href: "/clients", icon: "fas fa-laptop", label: "Clients" },
    { href: "/commands", icon: "fas fa-terminal", label: "Commands" },
    { href: "/streaming", icon: "fas fa-video", label: "Streaming" },
    { href: "/logs", icon: "fas fa-list", label: "Logs" },
    { href: "/settings", icon: "fas fa-cog", label: "Settings" },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <aside className="w-64 bg-dark-lighter border-r border-dark-lightest flex flex-col">
      <div className="p-4 border-b border-dark-lightest">
        <h1 className="text-xl font-bold text-primary flex items-center">
          <i className="fas fa-server mr-2"></i>
          Nexus C2
        </h1>
        <p className="text-xs text-gray-500 mt-1">Command & Control Server</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    location === item.href
                      ? "bg-dark text-white"
                      : "text-gray-300 hover:bg-dark hover:text-white"
                  )}
                >
                  <i className={`${item.icon} w-5 h-5 mr-2`}></i>
                  {item.label}
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-dark-lightest">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <i className="fas fa-user-shield text-sm text-white"></i>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{user?.username || "Administrator"}</p>
            <p className="text-xs text-gray-500">{user?.username ? `${user.username}@nexus.local` : "admin@nexus.local"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto text-gray-400 hover:text-white"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
