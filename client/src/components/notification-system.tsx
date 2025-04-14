import React from "react";
import { useClients } from "@/context/clients-context";
import { formatRelativeTime } from "@/lib/utils";
import { Notification } from "@/types";

const NotificationItem: React.FC<{ notification: Notification; onClose: () => void }> = ({
  notification,
  onClose,
}) => {
  const getBorderColor = () => {
    switch (notification.type) {
      case "success":
        return "border-success";
      case "error":
        return "border-danger";
      case "warning":
        return "border-warning";
      default:
        return "border-primary";
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case "success":
        return "text-success";
      case "error":
        return "text-danger";
      case "warning":
        return "text-warning";
      default:
        return "text-primary";
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return "fas fa-check-circle";
      case "error":
        return "fas fa-exclamation-circle";
      case "warning":
        return "fas fa-exclamation-triangle";
      default:
        return "fas fa-info-circle";
    }
  };

  return (
    <div className={`bg-dark-lighter border-l-4 ${getBorderColor()} rounded-md shadow-lg p-4 flex items-start w-80 transform transition-transform duration-200`}>
      <div className={`flex-shrink-0 mr-3 ${getIconColor()}`}>
        <i className={getIcon()}></i>
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-white">{notification.title}</h3>
        <p className="mt-1 text-xs text-gray-400">{notification.message}</p>
        <p className="mt-1 text-xs text-gray-500">{formatRelativeTime(notification.timestamp)}</p>
      </div>
      <button
        className="flex-shrink-0 ml-2 text-gray-400 hover:text-white"
        onClick={onClose}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useClients();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {notifications.slice(0, 3).map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationSystem;
