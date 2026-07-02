import React from 'react';
import { Proposal, ProposalStatus } from '../../types';
import { Button } from '../common/Button';
import { BadgeCheck, FileText, Send, UserCheck, XCircle } from 'lucide-react';

interface ProposalDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  onOpenSendModal: (proposal: Proposal) => void;
  onUpdateStatus: (proposalId: string, status: ProposalStatus) => void;
}

const XMarkIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>;

const getStatusInfo = (status: ProposalStatus) => {
    switch (status) {
        case 'Draft': return { text: 'Draft', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' };
        case 'SentToClient': return { text: 'Sent to Client', color: 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300' };
        case 'Signed': return { text: 'Signed', color: 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300' };
        case 'Declined': return { text: 'Declined', color: 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300' };
        case 'Archived': return { text: 'Archived', color: 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400' };
        default: return { text: 'Unknown', color: 'bg-gray-100 text-gray-700' };
    }
};

export const ProposalDetailPanel: React.FC<ProposalDetailPanelProps> = ({ isOpen, onClose, proposal, onOpenSendModal, onUpdateStatus }) => {
  if (!isOpen || !proposal) return null;
  
  const statusInfo = getStatusInfo(proposal.status);

  return (
    <div className={`fixed inset-0 z-[1050] overflow-hidden transition-transform duration-300 ease-in-out print:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
          <div className={`w-screen max-w-2xl transform transition ease-in-out duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex h-full flex-col overflow-y-scroll bg-bg-base dark:bg-slate-800 shadow-xl border-l border-border-base dark:border-slate-700">
              <header className="bg-bg-muted dark:bg-slate-700/50 px-4 py-4 sm:px-6 sticky top-0 z-10 border-b border-border-base dark:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-text-heading dark:text-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-premium-accent dark:text-premium-accent-dark" />
                        <span>Proposal: {proposal.proposalNumber}</span>
                    </h2>
                    <p className="text-sm text-text-muted dark:text-slate-400">For: {proposal.clientName}</p>
                  </div>
                  <div className="flex items-center">
                     <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>{statusInfo.text}</span>
                    <button type="button" className="ml-3 rounded-md p-1 text-text-muted dark:text-slate-400 hover:text-text-base dark:hover:text-slate-200" onClick={onClose}>
                      <XMarkIcon />
                    </button>
                  </div>
                </div>
              </header>
              <main className="relative flex-1 px-4 py-5 sm:px-6 space-y-4">
                 <div className="flex flex-wrap gap-2 border-b border-border-base dark:border-slate-700 pb-4">
                    <Button onClick={() => onOpenSendModal(proposal)} variant="primary" size="sm" leftIcon={<Send />}>Send Proposal</Button>
                    <Button onClick={() => onUpdateStatus(proposal.id, 'Signed')} variant="secondary" size="sm" leftIcon={<BadgeCheck />}>Mark as Signed</Button>
                    <Button onClick={() => onUpdateStatus(proposal.id, 'Declined')} variant="secondary" size="sm" leftIcon={<XCircle />}>Mark as Declined</Button>
                 </div>
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-border-muted dark:border-slate-600">
                    <pre className="whitespace-pre-wrap font-sans">{proposal.message || ''}</pre>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
