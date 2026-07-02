
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
        return <span title="Read"><CheckCheck className="w-3.5 h-3.5 text-blue-500" /></span>;
    }
    if (status === 'delivered') {
        return <span title="Delivered"><CheckCheck className="w-3.5 h-3.5 text-text-muted" /></span>;
    }
    return <span title="Sent"><Check className="w-3.5 h-3.5 text-text-muted" /></span>;
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
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
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

  // Auto-select first contact if none selected and contacts exist
  useEffect(() => {
    if (!selectedContact && chatContacts.length > 0) {
      const firstContact = chatContacts[0];
      setSelectedContact(firstContact);
      onMarkContactAsRead(firstContact.id);
    }
  }, [chatContacts, selectedContact, onMarkContactAsRead]);

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
        const newWidth = e.clientX - containerRect.left;
        
        const minWidth = 240;
        const maxWidth = containerRect.width - 500;

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
        const fileNames = files.map(f => f.name).join(', ');
        onSendMessage(selectedContact.id, `Attached: ${fileNames}`);
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
    <div ref={containerRef} className="flex h-full w-full bg-bg-canvas dark:bg-bg-canvas overflow-hidden rounded-lg shadow-inner border border-border-base dark:border-border-muted">
      {/* Contacts Sidebar */}
      <aside 
        style={{ width: `${contactsPanelWidth}px` }}
        className={`bg-bg-base dark:bg-slate-900/70 border-r border-border-base dark:border-border-muted flex-shrink-0 flex flex-col transition-all duration-300 ${!selectedContact ? 'w-full' : 'hidden md:flex'}`}
      >
        <div className="p-3 border-b border-border-base dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
                 <h2 className="text-lg font-semibold text-text-heading dark:text-text-heading">Messages</h2>
            </div>
            <div className="flex items-center gap-2">
                <Input 
                    type="search" 
                    placeholder="Search chats..." 
                    leftIcon={<Search className="w-4 h-4"/>} 
                    containerClassName="flex-grow"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="!py-1.5 !text-sm"
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
                    className="w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl ring-1 ring-black/5 border border-gray-100 dark:border-zinc-800 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200"
                    >
                    <button className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === 'all' ? 'bg-secondary-accent/10 text-secondary-accent' : 'text-gray-700 dark:text-gray-300 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent'}`} onClick={() => {setActiveFilter('all'); setIsFilterOpen(false);}}>All Chats</button>
                    <button className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === 'unread' ? 'bg-secondary-accent/10 text-secondary-accent' : 'text-gray-700 dark:text-gray-300 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent'}`} onClick={() => {setActiveFilter('unread'); setIsFilterOpen(false);}}>Unread</button>
                    <button className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === 'online' ? 'bg-secondary-accent/10 text-secondary-accent' : 'text-gray-700 dark:text-gray-300 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent'}`} onClick={() => {setActiveFilter('online'); setIsFilterOpen(false);}}>Online</button>
                    </div>,
                    document.body
                )}
                </div>
            </div>
        </div>
        <ul className="flex-1 overflow-y-auto space-y-0.5 p-2 scrollbar-hide">
          {filteredContacts.map(contact => (
            <li key={contact.id} onClick={() => handleSelectContact(contact)} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${selectedContact?.id === contact.id ? 'bg-premium-accent text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 ${selectedContact?.id === contact.id ? 'bg-white/20 border-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 border-transparent text-premium-accent dark:text-slate-300'}`}>
                        {contact.profilePictureUrl ? <img src={contact.profilePictureUrl} alt={contact.name} className="w-full h-full object-cover rounded-full" /> : getInitials(contact.name)}
                    </div>
                    {contact.isOnline && <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-slate-800"></span>}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                        <p className={`font-semibold text-sm truncate ${selectedContact?.id === contact.id ? 'text-white' : 'text-text-heading dark:text-text-heading'}`}>{contact.name}</p>
                        <p className={`text-xxs ${selectedContact?.id === contact.id ? 'text-white/70' : 'text-text-muted'}`}>{new Date(contact.lastMessageTimestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                    </div>
                    <div className="flex justify-between items-start mt-0.5">
                        <p className={`text-xs truncate flex-1 pr-2 ${selectedContact?.id === contact.id ? 'text-white/80' : 'text-text-muted'}`}>{contact.lastMessage}</p>
                        <div className="flex-shrink-0 flex items-center justify-end min-w-[20px]">
                            {contact.unreadCount && contact.unreadCount > 0 &&
                                <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1 text-[10px] font-bold rounded-full bg-secondary-accent text-secondary-accent-text">
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
          className={`w-1 flex-shrink-0 cursor-col-resize group bg-border-base dark:bg-border-muted hover:bg-premium-accent transition-colors duration-200 ${!selectedContact ? 'hidden' : 'hidden md:flex'}`}
      />

      {/* Main Chat Area */}
      <main className={`flex-1 flex flex-col transition-all duration-300 bg-white dark:bg-slate-900 ${selectedContact ? 'w-full' : 'hidden md:flex'}`}>
          {selectedContact ? (
              <>
                 <ChatViewHeader contact={selectedContact} onBack={() => setSelectedContact(null)} onQueryChange={setQuery} />

                 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
                     {visibleMessages.map(msg => (
                         <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                             {msg.senderId !== 'me' && (
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center font-bold text-xs text-premium-accent mb-1">
                                    {selectedContact.profilePictureUrl ? <img src={selectedContact.profilePictureUrl} alt={selectedContact.name} className="w-full h-full object-cover rounded-full" /> : getInitials(selectedContact.name)}
                                </div>
                            )}
                            
                            <div className={`flex flex-col max-w-[75%] sm:max-w-[70%] ${msg.senderId === 'me' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                                    msg.senderId === 'me' 
                                    ? 'bg-premium-accent text-white rounded-br-sm' 
                                    : 'bg-white dark:bg-slate-800 text-text-base dark:text-text-base rounded-bl-sm border border-border-base dark:border-slate-700'
                                }`}>
                                    <div>
                                      {typeof msg.text === "string" ? highlight(msg.text, query) : null}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 mt-1 px-1 select-none">
                                    <span className="text-[10px] text-text-muted">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                    </span>
                                    {msg.senderId === 'me' && <MessageDeliveryStatus status={msg.status}/>}
                                </div>
                            </div>
                         </div>
                     ))}
                      <div ref={messagesEndRef} />
                 </div>

                 <footer className="p-3 border-t border-border-base dark:border-slate-700 bg-white dark:bg-slate-900">
                    <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-2">
                        <label htmlFor="chat-attachment-input" className="p-2 rounded-lg cursor-pointer text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <Paperclip className="w-5 h-5"/>
                        </label>
                        <input
                            id="chat-attachment-input"
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                const files: File[] = e.target.files ? Array.from(e.target.files) : [];
                                if (files.length) {
                                    handleSendAttachment(files);
                                }
                                if (e.currentTarget) e.currentTarget.value = "";
                            }}
                            accept="image/*,application/pdf,video/*,application/zip,.doc,.docx,.xls,.xlsx"
                        />
                        <div className="flex-1 py-2">
                            <Input 
                                placeholder="Type a message..." 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="!border-0 !bg-transparent !shadow-none focus:!ring-0 !p-0 !text-sm"
                                containerClassName="!mb-0"
                            />
                        </div>
                        <Button variant="primary" size="sm" className="p-2 rounded-lg bg-premium-accent hover:bg-premium-accent-hover aspect-square" onClick={handleSendMessage} disabled={!message.trim()}><Send className="w-4 h-4"/></Button>
                    </div>
                 </footer>
              </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-muted hidden md:flex bg-slate-50 dark:bg-slate-900/50">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-600"/>
                </div>
                <h3 className="text-lg font-medium text-text-heading dark:text-text-heading">Your Messages</h3>
                <p className="mt-1 text-sm text-text-muted">Select a chat to start messaging</p>
            </div>
          )}
      </main>

       {/* Contact Profile Panel (Desktop only) */}
       {selectedContact && (
        <aside className="w-72 bg-white dark:bg-slate-900 border-l border-border-base dark:border-slate-700 flex-col hidden xl:flex overflow-y-auto">
            <div className="p-6 text-center border-b border-border-base dark:border-slate-700">
                 <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-2xl text-premium-accent mx-auto mb-3 ring-4 ring-slate-50 dark:ring-slate-800">
                    {selectedContact.profilePictureUrl ? <img src={selectedContact.profilePictureUrl} alt={selectedContact.name} className="w-full h-full object-cover rounded-full" /> : getInitials(selectedContact.name)}
                </div>
                <h3 className="font-bold text-lg text-text-heading dark:text-text-heading">{selectedContact.name}</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${selectedContact.isOnline ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                    <p className="text-xs text-text-muted">{selectedContact.isOnline ? 'Active Now' : `Last seen: ${formatRelativeTime(selectedContact.lastSeenTime || '')}`}</p>
                </div>
                 <div className="flex justify-center gap-2 mt-3 flex-wrap">
                    {selectedContact.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{tag}</span>
                    ))}
                 </div>
            </div>
            <div className="p-4 space-y-4">
                <div>
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Contact Info</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm group cursor-pointer">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors"><Mail className="w-4 h-4 text-slate-500"/></div>
                            <span className="text-text-base dark:text-text-base truncate">{selectedContact.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm group cursor-pointer">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors"><Phone className="w-4 h-4 text-slate-500"/></div>
                            <span className="text-text-base dark:text-text-base truncate">{selectedContact.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm group cursor-pointer">
                             <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors"><Globe className="w-4 h-4 text-slate-500"/></div>
                            <span className="text-text-base dark:text-text-base truncate">{selectedContact.socialHandle || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div className="pt-4 border-t border-border-base dark:border-slate-700">
                    <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Shared Media</h4>
                    <div className="space-y-2">
                         {/* Placeholder for shared files */}
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg"><Folder className="w-4 h-4"/></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">Project Requirements.pdf</p>
                                <p className="text-[10px] text-text-muted">2.4 MB • 2 days ago</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg"><Folder className="w-4 h-4"/></div>
                             <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">Design Assets.zip</p>
                                <p className="text-[10px] text-text-muted">14 MB • 1 week ago</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
       )}
    </div>
  );
};
