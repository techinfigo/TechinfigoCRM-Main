import React from 'react';
import { AppNotification } from '../types';
import { Button } from './common/Button';
import { safeFormatRelativeTime } from '@/utils';

interface NotificationItemProps {
  notification: AppNotification;
  onOpen: (taskId: string) => void;
  onSnooze: (taskId: string) => void;
  onDismiss: (notificationId: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onOpen, onSnooze, onDismiss }) => {
  const { id, title, message, timestamp, taskId, isRead } = notification;

  return (
    <div className={`p-3 border-b border-border-base dark:border-zinc-700 last:border-b-0 ${isRead ? '' : 'bg-highlight-accent dark:bg-zinc-700/50'}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
          {notification.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <p className={`text-sm font-semibold truncate ${isRead ? 'text-text-muted dark:text-slate-400' : 'text-text-base dark:text-slate-100'}`} title={title}>
              {title}
            </p>
            {!isRead && <div className="w-2 h-2 rounded-full bg-secondary-accent mt-1 shrink-0 ml-2" title="Unread"></div>}
          </div>
          <p className="text-xs text-text-muted dark:text-slate-400 truncate mt-0.5">{message}</p>
          <p className="text-xxs text-text-muted dark:text-slate-500 mt-1">{safeFormatRelativeTime(timestamp)}</p>
        </div>
      </div>
      {taskId && (
        <div className="mt-2 pl-11 flex gap-2">
          <Button size="xs" variant="primary" onClick={() => onOpen(taskId)}>Open</Button>
          <Button size="xs" variant="secondary" onClick={() => onSnooze(taskId)}>Snooze 30m</Button>
          <Button size="xs" variant="ghost" onClick={() => onDismiss(id)}>Dismiss</Button>
        </div>
      )}
    </div>
  );
};