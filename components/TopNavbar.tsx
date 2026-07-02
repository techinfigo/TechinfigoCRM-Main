
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ChevronsLeft,
    Search,
    Command,
    Maximize,
    Minimize,
    Mail,
    User,
    LogOut,
    Sun,
    Moon,
    MessageSquare,
    Bell,
    BellOff,
    ArrowLeft,
    Plus,
    CheckCircle
} from 'lucide-react';
import { TeamMember, AppNotification, View, EmailMessage, ChatContact, ChatMessage } from '../types';
import { Button } from './common/Button';
import { safeFormatRelativeTime } from '@/utils';
import { differenceInMinutes, isToday } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import { NotificationBell } from './common/NotificationBell';
import { NotificationItem } from './NotificationItem';


interface TopNavbarProps {
  currentUser: TeamMember | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
  currentTheme: 'light' | 'dark';
  onToggleTheme: () => void;
  notifications: AppNotification[];
  unreadEmails: EmailMessage[];
  unreadChats: (ChatContact & { unreadCount?: number })[];
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  onMarkContactAsRead: (contactId: string) => void;
  setCurrentView: (view: View) => void;
  setActiveCommunicationTab: (tab: 'email' | 'chat') => void;
  onOpenViewEmailModal: (email: EmailMessage) => void;
  onMarkEmailRead: (emailId: string) => void;
  onMarkNotificationRead: (notificationId: string) => void;
  onOpenTaskModal: () => void;
  globalSnoozeUntil: string | null;
  onSetGlobalSnooze: (until: string | null) => void;
  onSnoozeNotification: (taskId: string) => void;
  onOpenTaskFromNotification: (taskId: string) => void;
}

// -- START: Dropdown Panel Components --

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

// -- END: Dropdown Panel Components --

// -- START: Action Icon Button Component --
interface ActionIconButtonProps {
    icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
    count?: number;
    onClick: () => void;
    title: string;
    isPanelOpen?: boolean;
    className?: string;
}

const ActionIconButton = React.forwardRef<HTMLButtonElement, ActionIconButtonProps>(({ icon, count = 0, onClick, title, isPanelOpen, className }, ref) => {
    const hasNotifications = count > 0;
    const animate = hasNotifications && !isPanelOpen;

    return (
        <button
            ref={ref}
            onClick={onClick}
            title={title}
            className={`relative w-10 h-10 flex items-center justify-center rounded-xl shadow-md transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-accent dark:focus:ring-offset-bg-muted cursor-pointer bg-white dark:bg-zinc-800 text-text-muted dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-zinc-700 ${className}`}
            aria-haspopup={isPanelOpen !== undefined}
            aria-expanded={isPanelOpen}
            aria-label={`${title}. ${count > 0 ? `${count} unread.` : ''}`}
        >
            {React.cloneElement(icon, {
                className: `w-5 h-5 transition-transform ${animate ? 'animate-ring' : ''}`,
                strokeWidth: 1.5,
            })}
            {hasNotifications && (
                <div className="unread-badge absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white" style={{ transform: 'translate(40%, -40%)' }}>
                    {count > 99 ? '99+' : count}
                </div>
            )}
        </button>
    );
});
// -- END: Action Icon Button Component --

export const TopNavbar: React.FC<TopNavbarProps> = (props) => {
    const { currentUser, onLogout, onToggleSidebar, onToggleCollapse, isCollapsed, currentTheme, onToggleTheme, notifications, unreadEmails, unreadChats, chatMessages, unreadChatCount, onMarkContactAsRead, setCurrentView, setActiveCommunicationTab, onOpenViewEmailModal, onMarkEmailRead, onMarkNotificationRead, onOpenTaskModal, globalSnoozeUntil, onSetGlobalSnooze, onSnoozeNotification, onOpenTaskFromNotification } = props;
    
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isEmailOpen, setIsEmailOpen] = useState(false);
    const [isSnoozePanelOpen, setIsSnoozePanelOpen] = useState(false);
    const [chatPanelState, setChatPanelState] = useState<'closed' | 'list' | string>('closed');
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [snoozeMinutesLeft, setSnoozeMinutesLeft] = useState<number | null>(null);
    
    const profileDropdownRef = useRef<HTMLDivElement>(null);
    const notificationPanelRef = useRef<HTMLDivElement>(null);
    const emailPanelRef = useRef<HTMLDivElement>(null);
    const snoozePanelRef = useRef<HTMLDivElement>(null);
    const snoozeButtonRef = useRef<HTMLButtonElement>(null);
    const chatPanelRef = useRef<HTMLDivElement>(null);
    const notificationButtonRef = useRef<HTMLButtonElement>(null);

    const emailCount = unreadEmails.length;
    const notificationCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
    
    useEffect(() => {
        if (!globalSnoozeUntil) {
            setSnoozeMinutesLeft(null);
            return;
        }
    
        const calculateMinutesLeft = () => {
            const now = new Date();
            const until = new Date(globalSnoozeUntil);
            if (until > now) {
                setSnoozeMinutesLeft(differenceInMinutes(until, now));
            } else {
                setSnoozeMinutesLeft(null);
                if(onSetGlobalSnooze) onSetGlobalSnooze(null);
            }
        };
    
        calculateMinutesLeft();
        const interval = setInterval(calculateMinutesLeft, 30000); // Check every 30 seconds
    
        return () => clearInterval(interval);
    }, [globalSnoozeUntil, onSetGlobalSnooze]);

    const handleSetSnooze = (duration: '1h' | '3h' | 'tomorrow' | 'monday' | null) => {
        let until: string | null = null;
        const now = new Date();
    
        if (duration === '1h') {
            until = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        } else if (duration === '3h') {
            until = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
        } else if (duration === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(9, 0, 0, 0);
            until = tomorrow.toISOString();
        } else if (duration === 'monday') {
            const nextMonday = new Date();
            const day = nextMonday.getDay();
            const diff = nextMonday.getDate() - day + (day === 0 ? 1 : 8); // Simplified: next Monday
            nextMonday.setDate(diff);
            nextMonday.setHours(9, 0, 0, 0);
            until = nextMonday.toISOString();
        }
        
        onSetGlobalSnooze(until);
        setIsSnoozePanelOpen(false);
    };

    const handlePreviewChat = (contactId: string) => {
        onMarkContactAsRead(contactId);
        setChatPanelState(contactId);
    };
    
    const handleFullScreenToggle = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`));
        } else if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    };
    
    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        const handleClickOutside = (event: MouseEvent) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) setIsProfileOpen(false);
            if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node) && notificationButtonRef.current && !notificationButtonRef.current.contains(event.target as Node)) setIsNotificationOpen(false);
            if (emailPanelRef.current && !emailPanelRef.current.contains(event.target as Node)) setIsEmailOpen(false);
            if (chatPanelRef.current && !chatPanelRef.current.contains(event.target as Node)) setChatPanelState('closed');
            if (snoozePanelRef.current && !snoozePanelRef.current.contains(event.target as Node) && snoozeButtonRef.current && !snoozeButtonRef.current.contains(event.target as Node)) setIsSnoozePanelOpen(false);
        };
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsProfileOpen(false); setIsNotificationOpen(false); setIsEmailOpen(false); setChatPanelState('closed'); setIsSnoozePanelOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener('keydown', handleEscKey);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener('keydown', handleEscKey);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const { todayNotifications, earlierNotifications } = useMemo(() => {
        const today: AppNotification[] = [];
        const earlier: AppNotification[] = [];
        notifications.slice(0, 50).forEach(n => {
            try {
                const date = parseISO(n.timestamp);
                if (isToday(date)) {
                    today.push(n);
                } else {
                    earlier.push(n);
                }
            } catch (e) {
                console.warn("Invalid date in notification:", n);
            }
        });
        return { todayNotifications: today, earlierNotifications: earlier };
    }, [notifications]);
    
    return (
        <header className="sticky top-0 bg-bg-base/80 dark:bg-bg-muted/70 backdrop-blur-lg border-b border-border-base dark:border-border-muted z-30 h-16 flex items-center px-4 sm:px-6 justify-between">
            <div className="flex items-center gap-2 md:gap-4">
                <Button variant="ghost" size="sm" onClick={onToggleCollapse} className={`p-2 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}><ChevronsLeft /></Button>
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('DASHBOARD')}>
                    <div className="w-8 h-8 bg-premium-accent text-secondary-accent rounded-full flex items-center justify-center font-bold">T</div>
                    <span className="font-bold text-xl text-text-heading dark:text-text-heading tracking-tight hidden sm:block">TECHINFIGO</span>
                </div>
            </div>

            <div className="flex-1 justify-center px-4 hidden lg:flex">
                 <div className="relative w-full max-w-lg">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/70 dark:text-slate-500" strokeWidth={1.5}/>
                    <input type="search" placeholder="Search..." className="w-full bg-slate-100 dark:bg-zinc-800/60 text-text-base dark:text-slate-200 placeholder:text-text-muted/70 dark:placeholder:text-slate-400 border border-transparent dark:border-slate-700/50 focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-base dark:focus:ring-offset-bg-muted focus:ring-secondary-accent rounded-full py-2 pl-11 pr-10 text-sm transition-all shadow-sm focus:shadow-md"/>
                    <Command className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/70 dark:text-slate-500"/>
                </div>
            </div>
            
            <div className="flex items-center space-x-2">
                 <Button variant="primary" size="sm" onClick={onOpenTaskModal} className="hidden sm:inline-flex" leftIcon={<Plus className="w-4 h-4" />}>
                     Task
                 </Button>
                 <ActionIconButton
                    icon={isFullscreen ? <Minimize /> : <Maximize />}
                    onClick={handleFullScreenToggle}
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                />
                <ActionIconButton
                    icon={currentTheme === 'dark' ? <Sun /> : <Moon />}
                    onClick={onToggleTheme}
                    title={currentTheme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
                />
                
                <div className="relative" ref={notificationPanelRef}>
                    <NotificationBell
                        ref={notificationButtonRef}
                        notificationCount={notificationCount}
                        onClick={() => setIsNotificationOpen(p => !p)}
                        isPanelOpen={isNotificationOpen}
                    />
                    {isNotificationOpen && (
                        <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-800 z-40 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[500px] overflow-hidden origin-top-right ring-1 ring-black/5">
                            <div className="p-3.5 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Notifications</h4>
                            </div>
                            <div className="overflow-y-auto p-1">
                                {notifications.length === 0 ? (
                                    <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">You're all caught up!</p>
                                ) : (
                                    <>
                                        {todayNotifications.length > 0 && (
                                            <div className="mb-1">
                                                <h5 className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today</h5>
                                                {todayNotifications.map(n => <NotificationItem key={n.id} notification={n} onOpen={onOpenTaskFromNotification} onSnooze={onSnoozeNotification} onDismiss={onMarkNotificationRead} />)}
                                            </div>
                                        )}
                                        {earlierNotifications.length > 0 && (
                                            <div className="mb-1">
                                                <h5 className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Earlier</h5>
                                                {earlierNotifications.map(n => <NotificationItem key={n.id} notification={n} onOpen={onOpenTaskFromNotification} onSnooze={onSnoozeNotification} onDismiss={onMarkNotificationRead} />)}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="relative">
                    {snoozeMinutesLeft !== null && snoozeMinutesLeft > 0 ? (
                        <Button
                            ref={snoozeButtonRef}
                            onClick={() => setIsSnoozePanelOpen(p => !p)}
                            variant="outline"
                            size="sm"
                            className="!border-yellow-500/50 !bg-yellow-500/10 !text-yellow-600 dark:!text-yellow-400"
                            title={`Reminders snoozed. Click to change.`}
                            leftIcon={<BellOff size={14} />}
                        >
                            Snoozed · {snoozeMinutesLeft}m
                        </Button>
                    ) : (
                        <ActionIconButton
                            ref={snoozeButtonRef}
                            icon={<BellOff />}
                            onClick={() => setIsSnoozePanelOpen(p => !p)}
                            title="Snooze Reminders"
                            isPanelOpen={isSnoozePanelOpen}
                        />
                    )}
                    {isSnoozePanelOpen && (
                        <div ref={snoozePanelRef} className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 z-40 animate-in fade-in zoom-in-95 duration-200 p-1.5 origin-top-right ring-1 ring-black/5">
                           <div className="px-3 py-2 mb-1 border-b border-gray-100 dark:border-zinc-800">
                               <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Snooze reminders</p>
                           </div>
                           <div className="space-y-0.5">
                                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => handleSetSnooze('1h')}>For 1 Hour</button>
                                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => handleSetSnooze('3h')}>For 3 Hours</button>
                                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => handleSetSnooze('tomorrow')}>Until Tomorrow Morning</button>
                                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors" onClick={() => handleSetSnooze('monday')}>Until Monday Morning</button>
                           </div>
                           {globalSnoozeUntil && (
                               <>
                                <div className="my-1 h-px bg-gray-100 dark:bg-zinc-800"></div>
                                <button className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" onClick={() => handleSetSnooze(null)}>Clear Snooze</button>
                               </>
                           )}
                        </div>
                    )}
                </div>

                {currentUser && (
                    <div className="relative" ref={profileDropdownRef}>
                        <button onClick={() => setIsProfileOpen(p => !p)} title="View Profile" className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-accent dark:focus:ring-offset-bg-muted cursor-pointer">
                            <div className="relative"><div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 overflow-hidden flex items-center justify-center ring-2 ring-white/50 dark:ring-zinc-700/50">
                                {currentUser.profilePictureUrl ? <img src={currentUser.profilePictureUrl} alt="Profile" className="w-full h-full object-cover" /> : <span className="font-bold text-premium-accent dark:text-secondary-accent">{getInitials(currentUser.name)}</span>}
                            </div><span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-status-positive ring-1 ring-white dark:ring-zinc-800"></span></div>
                        </button>
                        {isProfileOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 z-50 animate-in fade-in zoom-in-95 duration-200 p-2 origin-top-right ring-1 ring-black/5">
                                <div className="px-3 py-2 mb-1 border-b border-gray-100 dark:border-zinc-800">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
                                </div>
                                
                                <button 
                                    onClick={() => { setCurrentView('USER_PROFILE'); setIsProfileOpen(false); }} 
                                    className="w-full text-left flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <User className="mr-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" strokeWidth={2} />
                                    <span>My Profile</span>
                                </button>
                                
                                <div className="my-1 h-px bg-gray-100 dark:bg-zinc-800"></div>

                                <button 
                                    onClick={() => { onLogout(); setIsProfileOpen(false); }} 
                                    className="w-full text-left flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <LogOut className="mr-2.5 h-4 w-4" strokeWidth={2} />
                                    <span>Logout</span>
                                </button>
                            </div>
                         )}
                    </div>
                )}
            </div>
        </header>
    );
};
