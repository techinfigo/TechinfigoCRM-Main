import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface UrlErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export const UrlErrorBanner: React.FC<UrlErrorBannerProps> = ({ message, onDismiss }) => {
  return (
    <div
      className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-300 p-4 mb-4 rounded-r-lg shadow-md flex justify-between items-center animate-content-fade-in"
      role="alert"
    >
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 mr-3" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className="p-1 rounded-full text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/50"
        aria-label="Dismiss"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};