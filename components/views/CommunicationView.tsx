import React from 'react';
import { GmailView } from './GmailView';
import {
  EmailMessage, EmailFolder, TeamMember, FeatureKey, PermissionAction,
  ChatContact, ChatMessage
} from '../../types';

interface CommunicationViewProps {
  // Kept for compatibility with App.tsx props; the hub is now Gmail-only.
  emails: EmailMessage[];
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onOpenComposeModal: (initialEmail?: Partial<EmailMessage>) => void;
  onOpenViewEmailModal: (email: EmailMessage) => void;
  onMoveToTrash: (emailId: string, currentFolder: EmailFolder) => void;
  onDeletePermanently: (emailId: string) => void;
  onToggleStar: (emailId: string) => void;
  chatContacts: (ChatContact & { unreadCount?: number })[];
  chatMessages: ChatMessage[];
  onSendMessage: (contactId: string, messageText: string) => void;
  onMarkContactAsRead: (contactId: string) => void;
  currentUser: TeamMember | null;
  activeTab: 'chat' | 'gmail';
  setActiveTab: (tab: 'chat' | 'gmail') => void;
}

// The Communication Hub is now a full-height Gmail client — the internal
// email log and chat tabs were removed, so Gmail uses the entire viewport.
export const CommunicationView: React.FC<CommunicationViewProps> = () => {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <GmailView />
    </div>
  );
};
