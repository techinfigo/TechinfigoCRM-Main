
import React, { useEffect, useRef } from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean;
  label?: string; // Optional label for the checkbox
  labelClassName?: string;
  containerClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate, className, label, labelClassName, containerClassName, ...props }, ref) => {
    const defaultRef = useRef<HTMLInputElement>(null);
    const resolvedRef = ref || defaultRef;

    useEffect(() => {
      if (typeof indeterminate === 'boolean' && resolvedRef && 'current' in resolvedRef && resolvedRef.current) {
        resolvedRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate, resolvedRef]);

    const checkboxId = props.id || `checkbox-${Math.random().toString(36).substring(2,9)}`;

    if (label) {
      return (
        <div className={`flex items-center ${containerClassName || ''}`}>
          <input
            type="checkbox"
            id={checkboxId}
            ref={resolvedRef}
            className={`form-checkbox h-4 w-4 text-premium-accent border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-premium-accent focus:ring-offset-1 dark:focus:ring-offset-bg-muted disabled:opacity-60 bg-bg-base cursor-pointer ${className || ''}`}
            {...props}
          />
          <label htmlFor={checkboxId} className={`ml-2 text-sm text-text-base dark:text-text-base cursor-pointer ${labelClassName || ''}`}>
            {label}
          </label>
        </div>
      );
    }

    return (
        <input
          type="checkbox"
          id={checkboxId}
          ref={resolvedRef}
          className={`form-checkbox h-4 w-4 text-premium-accent border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded focus:ring-premium-accent focus:ring-offset-1 dark:focus:ring-offset-bg-muted disabled:opacity-60 bg-bg-base cursor-pointer ${className || ''}`}
          {...props}
        />
    );
  }
);
Checkbox.displayName = 'Checkbox';
