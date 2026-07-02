import { useEffect, useRef, useCallback } from 'react';
import { Task } from '../types';
// FIX: Corrected date-fns imports for tree-shaking/module compatibility.
import { isValid, isFuture } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import subMinutes from 'date-fns/subMinutes';

interface UseRemindersProps {
    tasks: Task[];
    updateTask: (taskId: string, updates: Partial<Task>) => void;
    hydrated: boolean;
    onReminderFired: (task: Task) => void;
    globalSnoozeUntil: string | null;
    onOpenTask: (task: Task) => void;
    currentUserId?: string;
    isReminderOnCooldown: () => boolean;
    catchUpSweepTrigger: number;
}

const safeParseISO = (isoString?: string): Date | null => {
    if (!isoString) return null;
    try {
        const date = parseISO(isoString);
        return isValid(date) ? date : null;
    } catch {
        return null;
    }
};


export const useReminders = (props: UseRemindersProps) => {
    const intervalRef = useRef<number | null>(null);
    const propsRef = useRef(props);

    useEffect(() => {
        propsRef.current = props;
    });

    const checkReminders = useCallback((isCatchUp = false) => {
        const { tasks, updateTask, onReminderFired, globalSnoozeUntil, currentUserId, isReminderOnCooldown } = propsRef.current;
        
        if (globalSnoozeUntil) {
            const snoozeUntilDate = safeParseISO(globalSnoozeUntil);
            if (snoozeUntilDate && isFuture(snoozeUntilDate)) {
                return; // Snooze is active
            }
        }
        
        // Clock jump cooldown check
        if (isReminderOnCooldown() && !isCatchUp) {
            console.log("[Diagnostics] Reminders on cooldown due to clock jump.");
            return;
        }

        // Don't check if tab is inactive unless it's a catch-up sweep
        if (!isCatchUp && (document.visibilityState !== 'visible' || !document.hasFocus())) {
            return;
        }

        const now = new Date();
        
        tasks.forEach(task => {
            if (task.status === 'Done' || !task.reminderPrefs?.enabled || !task.reminderPrefs?.leadTime || task.reminderPrefs.leadTime === 'None' || task.assignedMemberId !== currentUserId) {
                return;
            }
            
            const dueDate = safeParseISO(task.dueDate);
            if (!dueDate) return;

            const leadTimeMap: Record<NonNullable<Task['reminderPrefs']>['leadTime'], number> = { '30m': 30, '2h': 120, '1d': 1440, 'None': 0 };
            const minutesToSubtract = leadTimeMap[task.reminderPrefs.leadTime] || 0;
            
            if(minutesToSubtract === 0) return;

            const triggerAt = subMinutes(dueDate, minutesToSubtract);
            const lastReminderAt = safeParseISO(task.lastReminderAt);

            // New robust check: Do not re-fire if a reminder has already been sent for this trigger window.
            if (lastReminderAt && lastReminderAt >= triggerAt) {
                return;
            }
            
            // Only fire if we are past the trigger time.
            if (now >= triggerAt) {
                onReminderFired(task);
                updateTask(task.id, { lastReminderAt: now.toISOString() });
            }
        });
    }, []);

    // Effect for the catch-up sweep trigger
    useEffect(() => {
        if (props.catchUpSweepTrigger > 0) {
            checkReminders(true);
        }
    }, [props.catchUpSweepTrigger, checkReminders]);

    useEffect(() => {
        if (!props.hydrated || intervalRef.current !== null) {
            return;
        }
        
        const tick = () => {
             if (!propsRef.current.tasks || propsRef.current.tasks.length === 0) {
                 return;
             }
            // Use requestIdleCallback for performance
            if ('requestIdleCallback' in window) {
                window.requestIdleCallback(() => checkReminders(false), { timeout: 2000 });
            } else {
                setTimeout(() => checkReminders(false), 1000);
            }
        };

        if (intervalRef.current === null) {
            intervalRef.current = window.setInterval(tick, 30000); // Check every 30 seconds
        }

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [props.hydrated, checkReminders]);
};