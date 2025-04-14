import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="bg-dark-lighter rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full bg-${color} bg-opacity-20 flex items-center justify-center`}>
            <i className={`${icon} text-${color}`}></i>
          </div>
        </div>
        <div className="ml-5">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
