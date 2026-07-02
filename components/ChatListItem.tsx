
import React from 'react';
import { ChatContact } from '../types';

interface ChatListItemProps {
  contact: ChatContact & { unreadCount?: number };
  onClick: () => void;
  isSelected: boolean;
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

export const ChatListItem: React.FC<ChatListItemProps> = ({ contact, onClick, isSelected }) => {
  const unreadCount = Number(contact.unreadCount ?? 0);

  return (
    <li onClick={onClick} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${isSelected ? 'bg-secondary-accent/20 dark:bg-secondary-accent/30' : 'hover:bg-highlight-accent dark:hover:bg-slate-700/50'}`}>
        <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-premium-accent border-2 border-transparent">
                {contact.profilePictureUrl ? <img src={contact.profilePictureUrl} alt={contact.name} className="w-full h-full object-cover rounded-full" /> : getInitials(contact.name)}
            </div>
            {contact.isOnline && <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-status-positive ring-2 ring-bg-base dark:ring-slate-900/70"></span>}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-sm truncate text-text-heading dark:text-text-heading">{contact.name}</p>
                <p className="text-xxs text-text-muted">{new Date(contact.lastMessageTimestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
            </div>
            <div className="flex justify-between items-start mt-0.5">
                <p className="text-xs text-text-muted truncate flex-1 pr-2">{contact.lastMessage}</p>
                <div className="flex-shrink-0 flex items-center justify-end min-w-[24px]">
                    {unreadCount > 0 &&
                        <span 
                          className="unread-badge flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xxs font-bold rounded-full bg-[#fcb632] text-[#001d21]"
                          data-unread={unreadCount}
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    }
                </div>
            </div>
        </div>
    </li>
  );
};
