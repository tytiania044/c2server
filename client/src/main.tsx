import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/auth-context";
import { ClientsProvider } from "./context/clients-context";
import NotificationSystem from "./components/notification-system";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ClientsProvider>
      <App />
      <NotificationSystem />
    </ClientsProvider>
  </AuthProvider>
);
