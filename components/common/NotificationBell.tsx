

import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  notificationCount: number;
  onClick: () => void;
  isPanelOpen: boolean;
}

// FIX: Remove incorrect React.FC type. React.FC does not include the ref prop, so
// explicitly typing it this way hides the ref from TypeScript, causing an error
// when the ref is passed in TopNavbar.tsx. Type inference from forwardRef is sufficient.
export const NotificationBell = React.forwardRef<HTMLButtonElement, NotificationBellProps>(({ notificationCount, onClick, isPanelOpen }, ref) => {
  const hasNotifications = notificationCount > 0;

  return (
    <button
      ref={ref}
      onClick={onClick}
      title="Notifications"
      className="relative w-10 h-10 flex items-center justify-center rounded-xl shadow-md transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-accent dark:focus:ring-offset-bg-muted cursor-pointer bg-white dark:bg-zinc-800 text-text-muted dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
      aria-haspopup="true"
      aria-expanded={isPanelOpen}
      aria-label={`View notifications. ${notificationCount > 0 ? `${notificationCount} unread.` : 'No new notifications.'}`}
    >
      <Bell className={`w-5 h-5 transition-transform ${hasNotifications && !isPanelOpen ? 'animate-ring' : ''}`} strokeWidth={1.5} />
      {hasNotifications && (
        <div 
            className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm" 
            style={{ transform: 'translate(30%, -30%)' }}
            data-testid="notification-badge"
        >
          {notificationCount > 9 ? '9+' : notificationCount}
        </div>
      )}
    </button>
  );
});

NotificationBell.displayName = 'NotificationBell';