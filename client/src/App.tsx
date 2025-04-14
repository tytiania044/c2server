import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import ClientDetail from "@/pages/client-detail";
import Streaming from "@/pages/streaming";
import Commands from "@/pages/commands";
import Logs from "@/pages/logs";
import Settings from "@/pages/settings";
import AuthScreen from "@/components/auth-screen";
import { useAuth } from "@/context/auth-context";
import Sidebar from "@/components/sidebar";
import { useLocation } from "wouter";

function MainApp() {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to dashboard if path is root and authenticated
    if (location === "/" && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [location, isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="flex flex-1 h-screen overflow-hidden">
      <Sidebar />
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/clients" component={Clients} />
        <Route path="/clients/:clientId" component={ClientDetail} />
        <Route path="/streaming" component={Streaming} />
        <Route path="/commands" component={Commands} />
        <Route path="/logs" component={Logs} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainApp />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
