


import React, { useEffect, useRef } from 'react';
import { Toast } from '../../types';
import { Button } from './Button';
import { AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';

interface ToastItemProps {
  toast: Toast;
  onDismiss: () => void;
}

const ariaLabels: { [key: string]: string } = {
    'Open': 'Open task',
    'Snooze 30m': 'Snooze 30 minutes',
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const firstActionRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (toast.autoFocus && firstActionRef.current) {
        firstActionRef.current.focus();
    }
  }, [toast.autoFocus]);


  useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onDismiss();
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, onDismiss]);

  return (
    <div
      role="status"
      className="bg-bg-base dark:bg-bg-muted w-full rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 border border-border-base dark:border-border-muted p-4 flex items-start gap-4 animate-content-fade-in"
    >
      {toast.icon && <div className="flex-shrink-0 pt-0.5">{toast.icon}</div>}
      <div className="flex-grow">
        <h3 className="font-semibold text-text-heading dark:text-text-heading">{toast.title}</h3>
        <p className="text-sm text-text-muted dark:text-text-muted mt-1">{toast.description}</p>
        {toast.actions && toast.actions.length > 0 && (
          <div className="mt-3 flex gap-2">
            {toast.actions.map((action, index) => (
              <Button
                key={index}
                ref={index === 0 ? firstActionRef : undefined}
                size="xs"
                variant={action.variant || 'secondary'}
                onClick={() => {
                  action.onClick();
                  onDismiss();
                }}
                aria-label={ariaLabels[action.label] || action.label}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        <Button variant="ghost" size="xs" className="!p-1" onClick={onDismiss} aria-label="Dismiss notification">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
