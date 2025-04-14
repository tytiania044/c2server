import React from "react";
import { Activity } from "@/types";
import { formatRelativeTime, getActivityIcon, getActivityColor } from "@/lib/utils";

interface ActivityListProps {
  activities: Activity[];
}

const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  return (
    <ul className="space-y-4">
      {activities.length === 0 ? (
        <li className="text-center text-sm text-gray-400 py-4">
          No recent activity
        </li>
      ) : (
        activities.map((activity) => (
          <li key={activity.id} className="flex items-start">
            <div className="flex-shrink-0">
              <i className={`${getActivityIcon(activity.type)} ${getActivityColor(activity.type)}`}></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-white">
                {activity.description}
                {activity.clientId && (
                  <span className="font-mono"> {activity.clientId}</span>
                )}
              </p>
              {activity.data?.command && (
                <p className="text-xs font-mono bg-dark-lightest p-1 rounded mt-1 text-gray-400">
                  {activity.data.command}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formatRelativeTime(activity.createdAt)}
              </p>
            </div>
          </li>
        ))
      )}
    </ul>
  );
};

export default ActivityList;
