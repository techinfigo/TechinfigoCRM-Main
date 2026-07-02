import React from 'react';
import { ChatContact } from '../types';

interface ChatListItemProps {
  contact: ChatContact;
  onClick: () => void;
  isSelected: boolean;
  unreadCount?: number | string | null;
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};


export const ChatListItem: React.FC<ChatListItemProps> = ({ contact, onClick, isSelected, unreadCount }) => {
  return (
    <div
      onClick={onClick}
      className={`flex items-center p-3 cursor-pointer rounded-lg transition-colors ${
        isSelected ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-premium-accent border-2 border-transparent">
          {contact.profilePictureUrl ? (
            <img src={contact.profilePictureUrl} alt={contact.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            getInitials(contact.name)
          )}
        </div>
        {contact.isOnline && (
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-900"></span>
        )}
      </div>
      <div className="flex-1 min-w-0 ml-4">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-sm truncate text-text-heading dark:text-text-heading">{contact.name}</p>
          <p className="text-xs text-text-muted">{new Date(contact.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex justify-between items-start mt-0.5">
          <p className="text-xs text-text-muted truncate flex-1 pr-2">{contact.lastMessage}</p>
          {(() => {
            const n = Number(unreadCount ?? 0);
            if (!Number.isFinite(n) || n <= 0) return null;
            const label = n > 99 ? "99+" : String(n);
            return (
              <span
                className="unread-badge ml-2 inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-black text-white text-[11px] px-1"
                data-unread={label}
                aria-label={`${label} unread messages`}
              >
                {label}
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
