
import React, { useState } from 'react';

interface ToggleSwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, label, description, checked, onChange, disabled = false }) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`flex items-center justify-between ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
      <div className="flex-grow mr-4">
        <label htmlFor={id} className={`font-medium text-text-base dark:text-text-base ${disabled ? '' : 'cursor-pointer'}`}>
          {label}
        </label>
        {description && <p className="text-xs text-text-muted dark:text-text-muted">{description}</p>}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-premium-accent focus:ring-offset-2 dark:focus:ring-offset-bg-muted
          ${checked ? 'bg-premium-accent' : 'bg-slate-300 dark:bg-slate-600'}
          ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
};
