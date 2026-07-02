
import { useState, useCallback } from 'react';
import { Toast, ToastData } from '../types';

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toastData: ToastData) => {
    const id = Date.now();
    // Add new toast. Auto-focus is set to true for accessibility if needed by ToastItem
    const newToast: Toast = { ...toastData, id, autoFocus: true };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};
