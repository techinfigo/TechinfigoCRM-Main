
import React, { useEffect, useRef, useState } from "react";
import { ChatContact } from '../types';
import { Button } from './common/Button';
import { Input } from "./common/Input";
import { MoreHorizontal, Search, X } from 'lucide-react';

interface ChatViewHeaderProps {
    contact: ChatContact;
    onBack: () => void;
    onQueryChange: (q: string) => void;
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

export const ChatViewHeader: React.FC<ChatViewHeaderProps> = ({ contact, onBack, onQueryChange }) => {
    const [showSearch, setShowSearch] = useState(false);
    const [query, setQuery] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    useEffect(() => {
        onQueryChange(query);
    }, [query, onQueryChange]);

    useEffect(() => {
        if (showSearch) {
            searchInputRef.current?.focus();
        } else {
            setQuery(''); // Clear query when search is closed
        }
    }, [showSearch]);
    
    return (
        <header className="flex items-center justify-between p-3 border-b border-border-base dark:border-slate-700 bg-bg-base dark:bg-slate-900/70 flex-shrink-0 relative">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="p-2 md:hidden" onClick={onBack} title="Back to list">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l2.72 2.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
                </Button>
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-premium-accent">
                    {contact.profilePictureUrl ? <img src={contact.profilePictureUrl} alt={contact.name} className="w-full h-full object-cover rounded-full" /> : getInitials(contact.name)}
                </div>
                <div>
                    <p className="font-semibold">{contact.name}</p>
                    <p className="text-xs text-text-muted">{contact.isOnline ? 'Online' : 'Offline'}</p>
                </div>
            </div>
            <div className={`flex items-center gap-1 transition-all duration-300 ${showSearch ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <Button variant="ghost" size="sm" className="p-2" title="Search in chat" onClick={() => setShowSearch(true)}>
                    <Search className="w-4 h-4"/>
                </Button>
                <div className="relative">
                    <Button variant="ghost" size="sm" className="p-2" title="More options" onClick={() => setShowMenu((s) => !s)}>
                        <MoreHorizontal className="w-4 h-4"/>
                    </Button>
                    {showMenu && (
                        <div ref={menuRef} className="absolute right-0 top-full mt-2 z-50 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 p-1.5 origin-top-right animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                            <button className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">View Profile</button>
                            <button className="w-full px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">Clear History</button>
                            <div className="my-1 h-px bg-gray-100 dark:bg-zinc-800"></div>
                            <button className="w-full px-3 py-2 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">Delete Chat</button>
                        </div>
                    )}
                </div>
            </div>
            {/* Search Input overlay */}
            <div className={`absolute inset-0 bg-bg-base dark:bg-slate-900/70 p-3 flex items-center gap-2 transition-all duration-300 ${showSearch ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search in this conversation…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full"
                />
                <Button variant="ghost" size="sm" className="p-2" onClick={() => setShowSearch(false)}>
                    <X className="w-5 h-5" />
                </Button>
            </div>
        </header>
    );
};
