
import { useEffect, useRef } from 'react';
import { debounce } from '@/utils';
import { ToastData } from '../types';

interface UseCrossTabSyncProps {
  stateSetters: { [key: string]: (value: any) => void };
  showToast: (options: ToastData) => void;
}

export const useCrossTabSync = ({ stateSetters, showToast }: UseCrossTabSyncProps) => {
  // Use a ref to store a unique ID for the current tab to avoid reacting to its own events.
  const tabIdRef = useRef(sessionStorage.getItem('tabId') || `tab_${Date.now()}_${Math.random()}`);
  
  useEffect(() => {
    sessionStorage.setItem('tabId', tabIdRef.current);
  }, []);

  const debouncedHandler = useRef(
    debounce((event: StorageEvent) => {
      // Final check inside debounced handler
      if (!event.key || !event.newValue) return;

      const setterKey = Object.keys(stateSetters).find(key => `crm_${key}` === event.key || key === event.key);
      const setter = setterKey ? stateSetters[setterKey] : null;

      if (setter) {
        try {
          const newValue = JSON.parse(event.newValue);
          setter(newValue); // Update the state in this tab

          showToast({
            title: 'Data Synced',
            description: 'The list has been refreshed with new data from another tab.',
            actions: [{ label: 'Refresh list', onClick: () => {}, variant: 'secondary' }]
          });
        } catch (e) {
          console.error('Error parsing storage event value:', e);
        }
      }
    }, 150)
  ).current;

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // The `storage` event only fires in other tabs, not the one that made the change.
      // So, we don't need to check against tabIdRef.
      if (event.key && event.newValue && event.oldValue !== event.newValue) {
        debouncedHandler(event);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [stateSetters, showToast, debouncedHandler]);
};