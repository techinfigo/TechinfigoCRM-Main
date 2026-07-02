
import React from 'react';

// Define own props for the LoadingSpinner
interface LoadingSpinnerOwnProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

// Combine own props with standard HTML div attributes.
// Omit 'children' as React.FC provides it, and this component doesn't use children explicitly.
// className will be inherited from HTMLAttributes.
interface LoadingSpinnerProps extends LoadingSpinnerOwnProps, Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  message, 
  className, // className is now inherited from HTMLAttributes
  ...rest // Capture other HTML attributes like id, style, data-*, etc.
}) => {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  // Construct the final className for the root div, incorporating the passed className
  const combinedClassName = `flex flex-col items-center justify-center gap-2 p-4 ${className || ''}`.trim();

  return (
    <div className={combinedClassName} {...rest}> {/* Spread rest for other HTML attributes */}
      <svg 
        className={`animate-spin ${sizeClasses[size]} text-premium-accent dark:text-premium-accent-dark`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {message && <p className="text-sm text-text-muted dark:text-text-muted">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;