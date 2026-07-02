
import React, { useState, useRef, useEffect, useCallback, ChangeEvent, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TeamMember, ChatContact, ChatMessage } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { MoreHorizontal, Paperclip, Send, Phone, Video, Search, User, Mail, Globe, Users, Folder, GripVertical, Check, CheckCheck, MessageSquare, ArrowLeft, Filter } from 'lucide-react';
import { ChatViewHeader } from '../ChatViewHeader';

interface ChatViewProps {
  chatContacts: ChatContact[];
  chatMessages: ChatMessage[];
  onSendMessage: (contactId: string, messageText: string) => void;
  currentUser: TeamMember | null;
  onMarkContactAsRead: (contactId: string) => void;
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.round(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.round(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.round(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
};

const MessageDeliveryStatus: React.FC<{status: ChatMessage['status']}> = ({ status }) => {
    if (status === 'read') {
        return <span title="Read"><CheckCheck className="w-4 h-4 text-blue-500" /></span>;
    }
    if (status === 'delivered') {
        return <span title="Delivered"><CheckCheck className="w-4 h-4 text-text-muted" /></span>;
    }
    return <span title="Sent"><Check className="w-4 h-4 text-text-muted" /></span>;
};

function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  const a = text.slice(0, i);
  const b = text.slice(i, i + q.length);
  const c = text.slice(i + q.length);
  return (<>{a}<mark>{b}</mark>{c}</>);
}


export const ChatView: React.FC<ChatViewProps> = ({ chatContacts, chatMessages, onSendMessage, currentUser, onMarkContactAsRead }) => {
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(chatContacts[0] || null);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");

  const [contactsPanelWidth, setContactsPanelWidth] = useState(320); // w-80
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'online'>('all');

  // Refs for filter panel
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [filterPanelStyle, setFilterPanelStyle] = useState<React.CSSProperties>({});


  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseUp = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate new width relative to the start of the list/detail container, not the whole screen
        const newWidth = e.clientX - containerRect.left;
        
        const minWidth = 240; // Minimum width for the list
        const maxWidth = containerRect.width - 500; // Leave at least 400px for the detail view

        if (newWidth > minWidth && newWidth < maxWidth) {
            setContactsPanelWidth(newWidth);
        }
    }
  }, []);

  const currentChatMessages = useMemo(() => {
    return chatMessages.filter(m => m.contactId === selectedContact?.id);
  }, [chatMessages, selectedContact]);
  
  const visibleMessages = useMemo(() => {
    if (!query) return currentChatMessages;
    const q = query.toLowerCase();
    return currentChatMessages.filter(m =>
      (m.text ?? "").toLowerCase().includes(q)
    );
  }, [currentChatMessages, query]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [visibleMessages, selectedContact]);
  
  const handleSendMessage = () => {
      if(message.trim() && selectedContact) {
          onSendMessage(selectedContact.id, message);
          setMessage('');
      }
  };
  
  const handleSelectContact = (contact: ChatContact) => {
    setSelectedContact(contact);
    onMarkContactAsRead(contact.id);
  };
  
  const handleSendAttachment = (files: File[]) => {
      if (selectedContact) {
        // This is a placeholder. In a real app, you'd upload the files
        // and then send a message with links to them.
        const fileNames = files.map(f => f.name).join(', ');
        onSendMessage(selectedContact.id, `Attached: ${fileNames}`);
        alert(`${files.length} file(s) selected: ${fileNames}`);
      }
  };
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Filtering logic
  const filteredContacts = useMemo(() => {
    return chatContacts
      .filter(contact => {
        const lowerSearch = searchTerm.toLowerCase();
        if (lowerSearch && !contact.name.toLowerCase().includes(lowerSearch)) {
          return false;
        }
        if (activeFilter === 'unread' && (contact.unreadCount || 0) === 0) {
          return false;
        }
        if (activeFilter === 'online' && !contact.isOnline) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
  }, [chatContacts, searchTerm, activeFilter]);
  
    // useEffect for handling outside clicks to close the filter panel.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isFilterOpen &&
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  // useEffect for positioning the filter panel.
  useEffect(() => {
    if (isFilterOpen) {
      const calculatePosition = () => {
        if (filterButtonRef.current && filterPanelRef.current) {
          const buttonRect = filterButtonRef.current.getBoundingClientRect();
          const PADDING = 8;
          
          let top = buttonRect.bottom + PADDING;
          let left = buttonRect.left;

          setFilterPanelStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            zIndex: 100,
          });
        }
      };

      calculatePosition();
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
      
      return () => {
        window.removeEventListener('scroll', calculatePosition, true);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isFilterOpen]);


  return (
    <div ref={containerRef} className="flex h-full bg-bg-canvas dark:bg-bg-canvas overflow-hidden rounded-lg shadow-inner">
      {/* Contacts Sidebar */}
      <aside 
        style={{ width: `${contactsPanelWidth}px` }}
        className={`bg-bg-base dark:bg-slate-900/70 p-3 flex-shrink-0 flex flex-col transition-all duration-300 ${!selectedContact ? 'w-full' : 'hidden md:flex'}`}
      >
        <div className="p-2 mb-2 flex items-center gap-2">
            <Input 
                type="search" 
                placeholder="Search chats..." 
                leftIcon={<Search className="w-4 h-4"/>} 
                containerClassName="flex-grow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="relative">
              <Button 
                  ref={filterButtonRef}
                  variant="ghost" 
                  size="sm" 
                  className="p-2 shrink-0" 
                  title="Filter chats"
                  onClick={() => setIsFilterOpen(p => !p)}
              >
                  <Filter className="w-4 h-4" />
              </Button>
              {isFilterOpen && createPortal(
                <div 
                  ref={filterPanelRef} 
                  style={filterPanelStyle} 
                  className="w-48 bg-bg-base dark:bg-bg-muted rounded-xl shadow-lg border border-border-base dark:border-slate-700 p-2 space-y-1 animate-content-fade-in"
                >
                  <Button variant={activeFilter === 'all' ? 'secondary' : 'ghost'} size="sm" className="w-full !justify-start" onClick={() => {setActiveFilter('all'); setIsFilterOpen(false);}}>All Chats</Button>
                  <Button variant={activeFilter === 'unread' ? 'secondary' : 'ghost'} size="sm" className="w-full !justify-start" onClick={() => {setActiveFilter('unread'); setIsFilterOpen(false);}}>Unread</Button>
                  <Button variant={activeFilter === 'online' ? 'secondary' : 'ghost'} size="sm" className="w-full !justify-start" onClick={() => {setActiveFilter('online'); setIsFilterOpen(false);}}>Online</Button>
                </div>,
                document.body
              )}
            </div>
        </div>
        <ul className="overflow-y-auto space-y-1 scrollbar-hide">
          {filteredContacts.map(contact => (
            <li key={contact.id} onClick={() => handleSelectContact(contact)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${selectedContact?.id === contact.id ? 'bg-secondary-accent/20 dark:bg-secondary-accent/30' : 'hover:bg-highlight-accent dark:hover:bg-slate-700/50'}`}>
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
                            {contact.unreadCount && contact.unreadCount > 0 &&
                                <span className="unread-badge flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xxs font-bold rounded-full bg-[#fcb632] text-[#001d21]">
                                    {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                                </span>
                            }
                        </div>
                    </div>
                </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* Resizer */}
      <div
          onMouseDown={handleMouseDown}
          className={`w-1.5 flex-shrink-0 cursor-col-resize group bg-transparent hover:bg-red-500/10 dark:hover:bg-red-500/20 items-center justify-center transition-colors duration-200 ${!selectedContact ? 'hidden' : 'hidden md:flex'}`}
      >
        <GripVertical className="w-1.5 h-6 text-border-base dark:text-slate-600 group-hover:text-red-500 transition-colors" />
      </div>

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col transition-all duration-300 ${selectedContact ? 'w-full' : 'hidden md:flex'}`}>
          {selectedContact ? (
              <>
                 <ChatViewHeader contact={selectedContact} onBack={() => setSelectedContact(null)} onQueryChange={setQuery} />

                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {visibleMessages.map(msg => (
                         <div key={msg.id} className={`flex items-start gap-3 ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                             {msg.senderId !== 'me' && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 shrink-0 flex items-center justify-center font-bold text-sm text-premium-accent">
                                    {selectedContact.profilePictureUrl ? <img src={selectedContact.profilePictureUrl} alt={selectedContact.name} className="w-full h-full object-cover rounded-full" /> : getInitials(selectedContact.name)}
                                </div>
                            )}
                            
                            <div className={`flex flex-col max-w-md lg:max-w-lg ${msg.senderId === 'me' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-2.5 rounded-2xl shadow-md ${msg.senderId === 'me' ? 'bg-secondary-accent text-white rounded-br-lg' : 'bg-white dark:bg-slate-700 text-text-base dark:text-text-base rounded-bl-lg'}`}>
                                    <div className="text-sm">
                                      {typeof msg.text === "string" ? highlight(msg.text, query) : null}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1.5 px-1">
                                    <span className="text-xxs text-text-muted">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                    {msg.senderId === 'me' && <MessageDeliveryStatus status={msg.status}/>}
                                </div>
                            </div>
                            
                            {msg.senderId === 'me' && currentUser && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 shrink-0 flex items-center justify-center font-bold text-sm text-premium-accent">
                                    {currentUser.profilePictureUrl ? <img src={currentUser.profilePictureUrl} alt="you" className="w-full h-full object-cover rounded-full" /> : getInitials(currentUser.name)}
                                </div>
                            )}
                         </div>
                     ))}
                      <div ref={messagesEndRef} />
                 </div>

                 <footer className="p-3 border-t border-border-base dark:border-slate-700 bg-bg-base dark:bg-slate-900/70">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <label htmlFor="chat-attachment-input" className="p-2 rounded-lg cursor-pointer text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700">
                            <Paperclip className="w-5 h-5"/>
                        </label>
                        <input
                            id="chat-attachment-input"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const files = e.target.files ? Array.from(e.target.files) : [];
                                if (files.length) {
                                    handleSendAttachment(files as File[]);
                                }
                                if (e.currentTarget) e.currentTarget.value = "";
                            }}
                            accept="image/*,application/pdf,video/*,application/zip,.doc,.docx,.xls,.xlsx"
                        />
                        <Input 
                            placeholder="Type a message..." 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1 !border-0 !bg-transparent !shadow-none focus:!ring-0"
                        />
                        <Button variant="primary" size="sm" className="p-2 rounded-md bg-premium-accent hover:bg-premium-accent-hover" onClick={handleSendMessage}><Send className="w-5 h-5"/></Button>
                    </div>
                 </footer>
              </>
          ) : (
            <div className="flex-col items-center justify-center h-full text-text-muted hidden md:flex">
                <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600"/>
                <p className="mt-2">Select a chat to start messaging</p>
            </div>
          )}
      </main>

       {/* Contact Profile Panel */}
       {selectedContact && (
        <aside className="w-80 bg-bg-base dark:bg-slate-900/70 p-4 border-l border-border-base dark:border-slate-700 flex-col hidden xl:flex">
            <div className="text-center py-4 border-b border-border-base dark:border-slate-700">
                 <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-premium-accent mx-auto">
                    {selectedContact.profilePictureUrl ? <img src={selectedContact.profilePictureUrl} alt={selectedContact.name} className="w-full h-full object-cover rounded-full" /> : getInitials(selectedContact.name)}
                </div>
                <h3 className="mt-3 font-semibold text-lg text-text-heading dark:text-text-heading">{selectedContact.name}</h3>
                <p className="text-sm text-text-muted">{selectedContact.isOnline ? 'Active Now' : `Last seen: ${formatRelativeTime(selectedContact.lastSeenTime || '')}`}</p>
                 <div className="flex justify-center gap-2 mt-2">
                    {selectedContact.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-xxs font-semibold rounded-full bg-premium-accent-light text-premium-accent-dark">{tag}</span>
                    ))}
                 </div>
            </div>
            <div className="py-4 border-b border-border-base dark:border-slate-700 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-text-muted"><Mail className="w-4 h-4"/><span>{selectedContact.email || 'N/A'}</span></div>
                <div className="flex items-center gap-2 text-text-muted"><Phone className="w-4 h-4"/><span>{selectedContact.phone || 'N/A'}</span></div>
                <div className="flex items-center gap-2 text-text-muted"><Globe className="w-4 h-4"/><span>{selectedContact.socialHandle || 'N/A'}</span></div>
            </div>
             <div className="py-4">
                <h4 className="font-semibold text-sm mb-2 text-text-heading dark:text-text-heading">Shared Files</h4>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 p-2 rounded-md bg-highlight-accent dark:bg-slate-700/50"><Folder className="w-5 h-5 text-premium-accent dark:text-secondary-accent"/> <span className="text-xs">project-brief.pdf</span></div>
                    <div className="flex items-center gap-2 p-2 rounded-md bg-highlight-accent dark:bg-slate-700/50"><Folder className="w-5 h-5 text-premium-accent dark:text-secondary-accent"/> <span className="text-xs">mockup-v2.jpg</span></div>
                </div>
             </div>
        </aside>
       )}
    </div>
  );
};
