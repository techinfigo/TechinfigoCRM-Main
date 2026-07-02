
import React from 'react';

interface ErrorDisplayProps {
  message: string;
  title?: string;
  type?: 'error' | 'warning' | 'info';
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, title, type = 'error' }) => {
  const baseClasses = "p-4 rounded-md border";
  let typeClasses = "";

  switch (type) {
    case 'error':
      typeClasses = "bg-red-50 dark:bg-status-negative/10 border-red-300 dark:border-status-negative/30 text-status-negative dark:text-red-300";
      break;
    case 'warning':
      typeClasses = "bg-yellow-50 dark:bg-status-warning/10 border-yellow-300 dark:border-status-warning/30 text-status-warning dark:text-yellow-300";
      break;
    case 'info':
      typeClasses = "bg-sky-50 dark:bg-status-info/10 border-sky-300 dark:border-status-info/30 text-status-info dark:text-sky-300";
      break;
    default:
      typeClasses = "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-text-muted dark:text-text-muted";
  }

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      {title && <h4 className="font-semibold mb-1">{title}</h4>}
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default ErrorDisplay;