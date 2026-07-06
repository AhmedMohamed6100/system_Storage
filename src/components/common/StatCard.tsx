import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
}

export default function StatCard({ title, value, icon, iconBg, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1 text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-xl font-bold text-gray-800 dark:text-white">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              {trendUp ? '▲' : '▼'} {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg} flex-shrink-0 ml-3`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
