
import React from 'react';
import { EmailView } from './EmailView';
import { ChatView } from './ChatView';
import { 
  EmailMessage, EmailFolder, TeamMember, FeatureKey, PermissionAction, 
  ChatContact, ChatMessage
} from '../../types';
import { Mail, MessageSquare } from 'lucide-react';
import { Card } from '../common/Card';

interface CommunicationViewProps {
  // Email Props
  emails: EmailMessage[];
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onOpenComposeModal: (initialEmail?: Partial<EmailMessage>) => void;
  onOpenViewEmailModal: (email: EmailMessage) => void;
  onMoveToTrash: (emailId: string, currentFolder: EmailFolder) => void;
  onDeletePermanently: (emailId: string) => void;
  onToggleStar: (emailId: string) => void;
  // Chat Props
  chatContacts: (ChatContact & { unreadCount?: number })[];
  chatMessages: ChatMessage[];
  onSendMessage: (contactId: string, messageText: string) => void;
  onMarkContactAsRead: (contactId: string) => void;
  // General Props
  currentUser: TeamMember | null;
  activeTab: 'email' | 'chat';
  setActiveTab: (tab: 'email' | 'chat') => void;
}

export const CommunicationView: React.FC<CommunicationViewProps> = (props) => {
  const { activeTab, setActiveTab } = props;

  return (
    <div className="h-full w-full p-4 md:p-6 flex flex-col">
      <Card 
        className="flex-1 flex flex-col overflow-hidden shadow-xl border border-border-base dark:border-border-muted bg-bg-base dark:bg-bg-muted"
        contentClassName="flex-1 flex flex-col overflow-hidden p-0"
        headerClassName="px-6 py-4 border-b border-border-base dark:border-slate-700 min-h-[72px]"
        title={
            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-text-heading dark:text-text-heading">Communication Hub</h2>
                
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 ml-auto sm:ml-4">
                    <button
                        onClick={() => setActiveTab('email')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                            activeTab === 'email' 
                            ? 'bg-white dark:bg-slate-600 text-premium-accent dark:text-white shadow-sm' 
                            : 'text-text-muted hover:text-text-base dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                            activeTab === 'chat' 
                            ? 'bg-white dark:bg-slate-600 text-premium-accent dark:text-white shadow-sm' 
                            : 'text-text-muted hover:text-text-base dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat</span>
                    </button>
                </div>
            </div>
        }
      >
        {activeTab === 'email' && <EmailView {...props} />}
        {activeTab === 'chat' && <ChatView {...props} />}
      </Card>
    </div>
  );
}
