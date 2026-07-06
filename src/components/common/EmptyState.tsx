import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({ message = 'لا توجد بيانات', icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
      {icon || <Inbox className="w-12 h-12 mb-3 opacity-40" />}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
