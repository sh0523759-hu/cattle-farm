import React from 'react';
import { getStatusBadgeColor } from '../../utils/formatters';

export const Badge = ({ status, className = '' }) => {
  if (!status) return null;
  const colorClass = getStatusBadgeColor(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} ${className}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-75"></span>
      {status}
    </span>
  );
};
