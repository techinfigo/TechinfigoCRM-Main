import React from 'react';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface InlineErrorBannerProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export const InlineErrorBanner: React.FC<InlineErrorBannerProps> = ({ title, message, onRetry }) => {
  return (
    <div
      className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 text-red-800 dark:text-red-300 p-4 rounded-r-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-4"
      role="alert"
    >
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm mt-1">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="!border-red-300 !text-red-700 hover:!bg-red-100 dark:!border-red-600 dark:!text-red-300 dark:hover:!bg-red-900/50 flex-shrink-0 self-end sm:self-center"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Retry
        </Button>
      )}
    </div>
  );
};