
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { Proposal, Client, Lead } from '../../types';
import { Send, X, Paperclip, Trash2, MoreVertical, FileText } from 'lucide-react';

interface SendProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (leadId: string, emailData: { subject: string, body: string, to: string }) => void;
  proposal: Proposal | null;
  client: Client | Lead | null;
  viewOnly?: boolean;
}

export const SendProposalModal: React.FC<SendProposalModalProps> = ({ isOpen, onClose, onSend, proposal, client, viewOnly = false }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>('Proposal.pdf');
  const [isDefaultAttachment, setIsDefaultAttachment] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && client) {
      setSubject(proposal?.subject || `Proposal from Techinfigo`);
      setBody(
        proposal?.message ||
        `Dear ${client.name},\n\nPlease find our proposal attached for your review.\n\nWe are excited about the potential to work together and help you achieve your goals. Let us know if you have any questions.\n\nBest regards,\nThe Techinfigo Team\nwww.techinfigo.com`
      );
      setAttachedFileName('Proposal.pdf'); // Reset to default on open
      setIsDefaultAttachment(true);
    }
  }, [isOpen, client, proposal]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAttachedFileName(event.target.files[0].name);
      setIsDefaultAttachment(false);
    }
  };

  if (!isOpen || !client) {
    return null;
  }

  const handleSend = () => {
    if (viewOnly) return;
    onSend(client.id, { subject, body, to: client.email });
  };
  
  const modalOverlayClasses = "fixed inset-0 z-[1000] bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out print:hidden animate-[fade-in_0.2s_ease-out]";
  const modalContentClasses = "bg-bg-base dark:bg-bg-muted rounded-lg shadow-2xl border border-border-base dark:border-border-muted flex flex-col w-full max-w-[720px] h-[560px] overflow-hidden transform transition-all animate-[scale-in_0.2s_ease-out]";

  return (
    <div className={modalOverlayClasses} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="proposal-title">
      <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
      <div className={modalContentClasses} onClick={e => e.stopPropagation()}>
        <header className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center flex-shrink-0 rounded-t-lg border-b border-border-base dark:border-slate-700">
          <h3 id="proposal-title" className="text-sm font-semibold text-text-heading dark:text-text-heading">New Proposal</h3>
          <Button variant="ghost" size="xs" className="p-1 text-text-muted hover:text-text-base" onClick={onClose} title="Close"><X className="w-4 h-4" /></Button>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 space-y-1.5 border-b border-border-base dark:border-slate-700 text-sm flex-shrink-0">
            <div className="flex items-center">
              <span className="text-text-muted dark:text-slate-400 w-16">To:</span>
              <input type="text" value={client.email} readOnly className="flex-1 bg-transparent focus:outline-none text-text-base dark:text-slate-200 p-1" />
            </div>
            <div className="flex items-center border-t border-border-base dark:border-slate-700/50 pt-1.5">
              <label htmlFor="proposal-subject" className="text-text-muted dark:text-slate-400 w-16">Subject:</label>
              <input id="proposal-subject" type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1 bg-transparent focus:outline-none text-text-base dark:text-slate-200 font-medium p-1" />
            </div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full h-full border-0 focus:ring-0 resize-none p-0 bg-transparent text-sm leading-relaxed text-text-base dark:text-slate-300" placeholder="Compose your message..." />
          </div>
          <footer className="px-4 py-3 border-t border-border-base dark:border-slate-700 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button onClick={handleSend} leftIcon={<Send className="w-4 h-4" />} className="bg-status-positive hover:bg-green-700 text-white">
                Send
              </Button>
              <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-slate-600">
                <label htmlFor="file-upload-button" className="cursor-pointer" title="Change attachment">
                    <Paperclip className="w-5 h-5 text-text-muted hover:text-premium-accent" />
                </label>
                <span className="text-xs font-medium text-text-base dark:text-slate-200 truncate">{attachedFileName}</span>
              </div>
              <input id="file-upload-button" type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            </div>
            <div className="flex items-center gap-1 text-text-muted dark:text-slate-400">
              <Button variant="ghost" size="sm" className="p-2" title="Discard draft" onClick={onClose}><Trash2 className="w-5 h-5"/></Button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
