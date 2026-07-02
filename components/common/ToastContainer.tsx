


import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Toast } from '../../types';
import { ToastItem } from './ToastItem';

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Set portal root after mount to ensure document.body is available.
    setPortalNode(document.body);
  }, []);

  const containerContent = (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-[9999] w-full max-w-sm space-y-3"
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  // Use portal if the node is available, otherwise render inline as a fallback.
  return portalNode ? createPortal(containerContent, portalNode) : containerContent;
};
