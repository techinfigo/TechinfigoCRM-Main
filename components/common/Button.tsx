

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'xs'| 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean; 
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  leftIcon,
  rightIcon,
  isLoading,
  disabled,
  ...props
}, ref) => {
  const baseStyle = "font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 inline-flex items-center justify-center gap-1.5 transition-all duration-150 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-gray-700 dark:disabled:text-gray-400";

  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-premium-accent text-premium-accent-text focus:ring-premium-accent shadow-sm dark:bg-secondary-accent dark:text-secondary-accent-text dark:hover:bg-secondary-accent-hover border border-transparent';
      break;
    case 'secondary':
      variantStyle = 'bg-secondary-accent text-secondary-accent-text focus:ring-secondary-accent shadow-sm dark:bg-slate-600 dark:text-slate-200 dark:hover:bg-slate-500';
      break;
    case 'danger':
      variantStyle = 'bg-status-negative text-white focus:ring-status-negative/70 shadow-sm dark:hover:bg-red-500';
      break;
    case 'outline':
      variantStyle = 'bg-transparent border border-premium-accent text-premium-accent focus:ring-premium-accent/70 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100';
      break;
    case 'ghost':
      variantStyle = 'bg-transparent text-premium-accent focus:ring-premium-accent/70 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100';
      break;
  }

  let sizeStyle = '';
  let iconSizeClass = 'h-5 w-5';
  switch (size) {
    case 'xs':
      sizeStyle = 'px-2.5 py-1 text-xs';
      iconSizeClass = 'h-4 w-4';
      break;
    case 'sm':
      sizeStyle = 'px-3 py-1.5 text-sm';
      iconSizeClass = 'h-4 w-4';
      break;
    case 'md':
      sizeStyle = 'px-4 py-2 text-sm'; 
      break;
    case 'lg':
      sizeStyle = 'px-5 py-2.5 text-base'; 
      break;
  }
  
  const loadingIcon = (
    <svg className={`animate-spin ${iconSizeClass}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const renderIcon = (icon: React.ReactNode) => {
      if (!icon) return null;
      if (React.isValidElement(icon)) {
        return React.cloneElement(icon as React.ReactElement, {
            // @ts-ignore
            className: `${iconSizeClass} ${(icon.props.className || '')}`.trim(),
        });
      }
      return icon;
  };

  return (
    <button
      ref={ref}
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        loadingIcon
      ) : (
        <>
          {renderIcon(leftIcon)}
          {children && <span className="truncate leading-tight">{children}</span>}
          {renderIcon(rightIcon)}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';