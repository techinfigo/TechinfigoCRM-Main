import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { EmailMessage } from '../../types';

interface ViewEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  emailMessage: EmailMessage | null;
}

export const ViewEmailModal: React.FC<ViewEmailModalProps> = ({ isOpen, onClose, emailMessage }) => {
  if (!isOpen || !emailMessage) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={emailMessage.subject || '(No Subject)'}
      size="3xl"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="space-y-4">
        {/* Email Header Info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <strong className="text-text-muted dark:text-slate-400">From:</strong> 
              <span className="ml-2">{emailMessage.senderName ? `${emailMessage.senderName} <${emailMessage.senderEmail}>` : emailMessage.senderEmail}</span>
            </div>
            <div>
              <strong className="text-text-muted dark:text-slate-400">To:</strong> 
              <span className="ml-2">{emailMessage.recipientName ? `${emailMessage.recipientName} <${emailMessage.recipientEmail}>` : emailMessage.recipientEmail}</span>
            </div>
            {emailMessage.cc && emailMessage.cc.length > 0 && (
              <div className="sm:col-span-2">
                <strong className="text-text-muted dark:text-slate-400">CC:</strong> 
                <span className="ml-2">{emailMessage.cc.join(', ')}</span>
              </div>
            )}
            <div>
              <strong className="text-text-muted dark:text-slate-400">Date:</strong> 
              <span className="ml-2">{new Date(emailMessage.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {/* Email Body */}
        <div>
          <h4 className="text-sm font-semibold text-text-muted dark:text-slate-400 mb-1">Message:</h4>
          <div 
            className="p-3 border border-border-base dark:border-border-muted rounded-md bg-bg-base dark:bg-bg-muted min-h-[250px] prose prose-sm dark:prose-invert max-w-none"
            // Using dangerouslySetInnerHTML to render potential HTML emails. Sanitize in a real app!
            dangerouslySetInnerHTML={{ __html: emailMessage.body }}
          />
        </div>
      </div>
    </Modal>
  );
};
