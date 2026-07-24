
import React, { useState, useMemo, ChangeEvent, useRef, useEffect, useCallback } from 'react';
import { EmailMessage, EmailFolder, TeamMember, FeatureKey, PermissionAction } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { 
    Pencil, Inbox, Star, Send, FileText, Trash2, Archive, Search, MoreVertical, CornerUpLeft, CornerUpRight, Mail, ArrowLeft, GripVertical
} from 'lucide-react';
import { Checkbox } from '../common/Checkbox';

interface EmailViewProps {
  emails: EmailMessage[];
  currentUser: TeamMember | null;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onOpenComposeModal: (initialEmail?: Partial<EmailMessage>) => void;
  onOpenViewEmailModal: (email: EmailMessage) => void;
  onMoveToTrash: (emailId: string, currentFolder: EmailFolder) => void;
  onDeletePermanently: (emailId: string) => void;
  onToggleStar: (emailId: string) => void;
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

export const EmailView: React.FC<EmailViewProps> = ({
  emails, currentUser, hasPermission, onOpenComposeModal, onOpenViewEmailModal, onMoveToTrash, onDeletePermanently, onToggleStar
}) => {
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

  const [listPanelWidth, setListPanelWidth] = useState(384); // Corresponds to md:w-96
  const listPanelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

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
    if (isResizing.current && listPanelRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate new width relative to the start of the list/detail container, not the whole screen
        const newWidth = e.clientX - containerRect.left;
        
        const minWidth = 280; // Minimum width for the list
        const maxWidth = containerRect.width - 400; // Leave at least 400px for the detail view

        if (newWidth > minWidth && newWidth < maxWidth) {
            setListPanelWidth(newWidth);
        }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  const canSend = hasPermission('communication', 'canSend');
  const canDelete = hasPermission('communication', 'canDeleteEmails');

  const folderNavItems: { folder: EmailFolder; label: string; icon: React.ElementType }[] = [
    { folder: 'inbox', label: 'Inbox', icon: Inbox },
    { folder: 'important', label: 'Important', icon: Star },
    { folder: 'sent', label: 'Sent', icon: Send },
    { folder: 'drafts', label: 'Drafts', icon: FileText },
    { folder: 'archive', label: 'Archive', icon: Archive },
    { folder: 'trash', label: 'Trash', icon: Trash2 },
  ];

  const filteredEmails = useMemo(() => {
    return emails
      // 'Important' is a starred view, not a real folder — starring sets isStarred
      // rather than moving the message, so it needs its own rule.
      .filter(email =>
        selectedFolder === 'important'
          ? !!email.isStarred && email.folder !== 'trash'
          : email.folder === selectedFolder,
      )
      .filter(email => {
        if (!searchTerm.trim()) return true;
        const lowerSearch = searchTerm.toLowerCase();
        return (
          email.subject.toLowerCase().includes(lowerSearch) ||
          (email.senderName || '').toLowerCase().includes(lowerSearch) ||
          email.senderEmail.toLowerCase().includes(lowerSearch) ||
          email.recipientEmail.toLowerCase().includes(lowerSearch)
        );
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [emails, selectedFolder, searchTerm]);
  
  const handleSelectEmail = (email: EmailMessage) => {
    if (email.folder === 'drafts') {
        onOpenComposeModal(email);
    } else {
        setSelectedEmail(email);
    }
  };
  
  const folderCounts = useMemo(() => {
    return emails.reduce((acc, email) => {
        if(!acc[email.folder]) acc[email.folder] = 0;
        acc[email.folder]++;
        return acc;
    }, {} as Record<EmailFolder, number>)
  }, [emails]);

  return (
    <div className="flex h-full bg-bg-base dark:bg-slate-900 overflow-hidden">
      {/* Column 1: Sidebar */}
      <aside className="w-64 bg-slate-50 dark:bg-slate-800/50 p-4 border-r border-border-base dark:border-slate-700 flex-shrink-0 flex flex-col">
        {canSend && (
          <Button onClick={() => onOpenComposeModal()} variant="primary" className="w-full mb-4" leftIcon={<Pencil />}>
            Compose
          </Button>
        )}
        <nav className="flex-1 overflow-y-auto scrollbar-hide">
          <ul className="space-y-1">
            {folderNavItems.map(item => (
              <li key={item.folder}>
                <button
                  onClick={() => { setSelectedFolder(item.folder); setSelectedEmail(null); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors duration-150 group
                    ${selectedFolder === item.folder 
                      ? 'bg-premium-accent-light text-premium-accent dark:bg-premium-accent-dark/50 dark:text-premium-accent-dark font-medium' 
                      : 'text-text-muted dark:text-slate-300 hover:bg-highlight-accent dark:hover:bg-slate-700/70'}`}
                >
                  <div className="flex items-center">
                    <item.icon className={`mr-2.5 h-5 w-5 opacity-80 group-hover:opacity-100 ${selectedFolder === item.folder ? 'text-premium-accent dark:text-premium-accent-dark' : ''}`} />
                    <span className="capitalize">{item.label}</span>
                  </div>
                  {folderCounts[item.folder] > 0 && 
                    <span className="px-1.5 text-xs text-text-muted dark:text-slate-400 group-hover:text-text-base dark:group-hover:text-slate-200">{folderCounts[item.folder]}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div ref={containerRef} className="flex flex-1 min-w-0">
        {/* Column 2: Email List */}
        <div
          ref={listPanelRef}
          style={{ width: `${listPanelWidth}px` }}
          className={`flex-shrink-0 flex flex-col ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}
        >
          <div className="p-3 border-b border-r border-border-base dark:border-slate-700 flex-shrink-0">
            <Input type="search" placeholder={`Search in ${selectedFolder}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} leftIcon={<Search className="w-4 h-4"/>}/>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide border-r border-border-base dark:border-slate-700">
            <ul className="divide-y divide-border-base dark:divide-slate-700">
              {filteredEmails.map(email => (
                <li key={email.id} onClick={() => handleSelectEmail(email)} className={`p-3 cursor-pointer transition-colors ${selectedEmail?.id === email.id ? 'bg-secondary-accent/20 dark:bg-secondary-accent/30' : 'hover:bg-highlight-accent dark:hover:bg-slate-800'}`}>
                  <div className="flex justify-between items-center text-xs">
                    <p className="font-semibold text-text-base dark:text-text-base truncate">{email.senderName || email.senderEmail}</p>
                    <p className="text-text-muted dark:text-slate-400">{new Date(email.timestamp).toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-medium text-text-muted dark:text-slate-300 truncate mt-1">{email.subject || '(No Subject)'}</p>
                  <p className="text-xs text-text-muted dark:text-slate-500 truncate mt-1">{email.body.substring(0, 100)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 flex-shrink-0 cursor-col-resize group bg-transparent hover:bg-red-500/10 dark:hover:bg-red-500/20 flex items-center justify-center transition-colors duration-200"
        >
          <GripVertical className="w-1.5 h-6 text-border-base dark:text-slate-600 group-hover:text-red-500 transition-colors" />
        </div>

        {/* Column 3: Email Detail View */}
        <main className={`flex-1 flex flex-col overflow-hidden ${!selectedEmail ? 'hidden lg:flex lg:items-center lg:justify-center' : 'flex'}`}>
          {selectedEmail ? (
            <>
              <div className="p-3 border-b border-border-base dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                 <div className="flex items-center gap-2">
                   <Button variant="ghost" size="sm" className="p-2 lg:hidden" onClick={() => setSelectedEmail(null)} title="Back to list">
                      <ArrowLeft className="w-5 h-5" />
                   </Button>
                   <h3 className="text-lg font-semibold truncate flex-1">{selectedEmail.subject || '(No Subject)'}</h3>
                 </div>
                <div className="flex items-center">
                   <Button variant="ghost" size="sm" className="p-2" title="Reply" onClick={() => onOpenComposeModal({ subject: `Re: ${selectedEmail.subject}`})}><CornerUpLeft className="w-4 h-4"/></Button>
                   <Button
                     variant="ghost" size="sm" className="p-2" title="Forward"
                     onClick={() => onOpenComposeModal({
                       subject: `Fwd: ${selectedEmail.subject}`,
                       body: `\n\n---------- Forwarded message ----------\nFrom: ${selectedEmail.senderName || selectedEmail.senderEmail} <${selectedEmail.senderEmail}>\nDate: ${new Date(selectedEmail.timestamp).toLocaleString()}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`,
                     })}
                   ><CornerUpRight className="w-4 h-4"/></Button>
                   <Button
                     variant="ghost" size="sm" className="p-2"
                     title={selectedEmail.isStarred ? 'Remove star' : 'Star'}
                     onClick={() => onToggleStar(selectedEmail.id)}
                   >
                     <Star className={`w-4 h-4 ${selectedEmail.isStarred ? 'fill-secondary-accent text-secondary-accent' : ''}`}/>
                   </Button>
                   <Button
                     variant="ghost" size="sm" className="p-2"
                     title={selectedFolder === 'trash' ? 'Restore to previous folder' : 'Move to Trash'}
                     onClick={() => { onMoveToTrash(selectedEmail.id, selectedFolder); setSelectedEmail(null); }}
                   >
                     {selectedFolder === 'trash' ? <Inbox className="w-4 h-4"/> : <Trash2 className="w-4 h-4"/>}
                   </Button>
                   {selectedFolder === 'trash' && (
                     <Button
                       variant="ghost" size="sm" className="p-2 text-red-600 hover:text-red-700"
                       title="Delete permanently"
                       onClick={() => {
                         if (window.confirm('Delete this email permanently? This cannot be undone.')) {
                           onDeletePermanently(selectedEmail.id);
                           setSelectedEmail(null);
                         }
                       }}
                     ><Trash2 className="w-4 h-4"/></Button>
                   )}
                </div>
              </div>
              <div className="overflow-y-auto scrollbar-hide p-4 space-y-4">
                 <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-premium-accent shrink-0">
                      {getInitials(selectedEmail.senderName)}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedEmail.senderName} <span className="text-sm text-text-muted font-normal">&lt;{selectedEmail.senderEmail}&gt;</span></p>
                      <p className="text-xs text-text-muted">To: {selectedEmail.recipientEmail}</p>
                      <p className="text-xs text-text-muted">{new Date(selectedEmail.timestamp).toLocaleString()}</p>
                    </div>
                 </div>
                 <div className="prose prose-sm dark:prose-invert max-w-none pt-4 mt-4 border-t border-border-base dark:border-slate-700" dangerouslySetInnerHTML={{ __html: selectedEmail.body.replace(/\n/g, '<br />') }} />
              </div>
            </>
          ) : (
              <div className="text-center text-text-muted dark:text-slate-500">
                  <Mail className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600"/>
                  <p>Select an email to read</p>
              </div>
          )}
        </main>
      </div>
    </div>
  );
};
