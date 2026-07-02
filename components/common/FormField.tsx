
import React from 'react';

interface FormFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, description, children, htmlFor, className }) => {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text-heading dark:text-text-heading">
        {label}
      </label>
      {description && (
        <p className="mt-1 text-xs text-text-muted dark:text-text-muted">
          {description}
        </p>
      )}
      <div className="mt-2">
        {children}
      </div>
    </div>
  );
};
