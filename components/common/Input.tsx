
import React from 'react';

// Error/Alert Icon for inputs
const AlertCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);


interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string; 
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ label, id, error, className, containerClassName, labelClassName, leftIcon, rightIcon, children /* Added children */, ...props }, ref) => {
  // Updated baseInputClass to use focus:ring-secondary-accent and focus:border-secondary-accent
  const baseInputClass = "block w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-text-muted dark:placeholder-slate-400 text-text-base dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-bg-muted focus:ring-secondary-accent dark:focus:ring-secondary-accent focus:border-secondary-accent dark:focus:border-secondary-accent transition-colors duration-150";
  const paddingClass = leftIcon ? "pl-10" : "pl-3";
  const rightPaddingClass = rightIcon ? "pr-10" : "pr-3";
  const errorInputClass = error ? "border-status-negative dark:border-status-negative ring-status-negative/50 dark:ring-status-negative/50" : "";
  const defaultLabelClass = "block text-sm font-medium text-text-muted dark:text-text-muted mb-1";
  const inputId = id || props.name;

  return (
    <div className={`w-full ${containerClassName || ''}`}>
      {label && <label htmlFor={inputId} className={`${defaultLabelClass} ${labelClassName || ''}`}>{label}</label>}
      <div className="relative rounded-lg">
        {leftIcon && <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-700 dark:text-slate-300">{leftIcon}</div>}
        {children ? ( /* Render children if provided (for select wrapper) */
          React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              // @ts-ignore - Attempting to add classes
              return React.cloneElement(child, { className: `${(child.props as any).className || ''} ${baseInputClass} ${paddingClass} ${rightPaddingClass} py-2 text-sm ${errorInputClass} ${className || ''}`, "aria-invalid": !!error, "aria-describedby": error ? `${inputId}-error` : undefined });
            }
            return child;
          })
        ) : ( /* Otherwise, render the default input */
        <input
          id={inputId}
          ref={ref}
          className={`${baseInputClass} ${paddingClass} ${rightPaddingClass} py-2 text-sm ${errorInputClass} ${className || ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        )}
        {rightIcon && <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted dark:text-text-muted/80">{rightIcon}</div>}
      </div>
      {error && <p id={`${inputId}-error`} className="mt-1.5 text-xs text-status-negative dark:text-status-negative flex items-center" role="alert"><AlertCircleIcon /> {error}</p>}
    </div>
  );
});

Input.displayName = 'Input';


interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string; // Added labelClassName
  description?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, id, error, className, containerClassName, labelClassName, description, ...props }) => {
  // Updated baseInputClass to use focus:ring-secondary-accent and focus:border-secondary-accent
  const baseInputClass = "block w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-text-muted dark:placeholder-slate-400 text-text-base dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-bg-muted focus:ring-secondary-accent dark:focus:ring-secondary-accent focus:border-secondary-accent dark:focus:border-secondary-accent transition-colors duration-150";
  const errorInputClass = error ? "border-status-negative dark:border-status-negative ring-status-negative/50 dark:ring-status-negative/50" : "";
  const defaultLabelClass = "block text-sm font-medium text-text-muted dark:text-text-muted mb-1";
  const inputId = id || props.name;


  return (
    <div className={`w-full ${containerClassName || ''}`}>
      {label && <label htmlFor={inputId} className={`${defaultLabelClass} ${labelClassName || ''}`}>{label}</label>}
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1 mb-1.5">{description}</p>}
      <textarea
        id={inputId}
        className={`${baseInputClass} px-3 py-2 text-sm ${errorInputClass} ${className || ''}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && <p id={`${inputId}-error`} className="mt-1.5 text-xs text-status-negative dark:text-status-negative flex items-center" role="alert"><AlertCircleIcon /> {error}</p>}
    </div>
  );
};
