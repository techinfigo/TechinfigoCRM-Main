import { useState, useEffect, useRef, useCallback } from 'react';
import { DiagnosticLog } from '../types';

// Set to true for development purposes. In a real build, this would be process.env.NODE_ENV === 'development'
export const DEBUG = true; 

const CLOCK_JUMP_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
const INACTIVITY_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const REMINDER_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown after a clock jump

export const useDiagnostics = (onCatchUpSweep: () => void) => {
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const lastCheckTime = useRef<number>(Date.now());
  const tabHiddenTime = useRef<number | null>(null);
  const reminderCooldownUntil = useRef<number>(0);

  const addLog = useCallback((type: DiagnosticLog['type'], message: string) => {
    if (!DEBUG) return;
    setLogs(prev => [
      { timestamp: new Date().toISOString(), type, message },
      ...prev.slice(0, 49), // Keep max 50 logs
    ]);
  }, []);

  // Clock jump detection
  useEffect(() => {
    if (!DEBUG) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const expectedTime = lastCheckTime.current + 10000; // 10s interval
      const drift = now - expectedTime;

      if (Math.abs(drift) > CLOCK_JUMP_THRESHOLD_MS) {
        const driftMinutes = (drift / 60000).toFixed(1);
        addLog('warning', `System clock jump detected by ~${driftMinutes} minutes. Cooldown activated.`);
        // Set a cooldown period for reminders to prevent duplicates
        reminderCooldownUntil.current = Date.now() + REMINDER_COOLDOWN_MS;
      }
      lastCheckTime.current = now;
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [addLog]);

  // Tab inactivity detection
  useEffect(() => {
    if (!DEBUG) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabHiddenTime.current = Date.now();
      } else {
        if (tabHiddenTime.current) {
          const inactiveDuration = Date.now() - tabHiddenTime.current;
          if (inactiveDuration > INACTIVITY_THRESHOLD_MS) {
            const inactiveMinutes = (inactiveDuration / 60000).toFixed(0);
            addLog('info', `Tab was inactive for >${inactiveMinutes} minutes. Running catch-up sweep.`);
            onCatchUpSweep();
          }
          tabHiddenTime.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [addLog, onCatchUpSweep]);

  const isReminderOnCooldown = useCallback(() => {
    return Date.now() < reminderCooldownUntil.current;
  }, []);

  return { logs, isReminderOnCooldown, DEBUG };
};