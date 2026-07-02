import React, { useState, useEffect } from 'react';
import { Proposal, Client } from '../../types';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { FileText, Save, X } from 'lucide-react';

interface CreateProposalPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proposalData: {
    id?: string;
    clientId: string;
    title: string;
    content: string;
    estimatedBudget?: string;
    timeline?: string;
  }) => void;
  proposal?: Proposal | null;
  clientId: string;
  clientName: string;
  clients: Client[];
}

export const CreateProposalPanel: React.FC<CreateProposalPanelProps> = ({ isOpen, onClose, onSave, proposal, clientId, clientName }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [estimatedBudget, setEstimatedBudget] = useState('');
    const [timeline, setTimeline] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (proposal) {
                setTitle(proposal.subject || '');
                setContent(proposal.message || '');
                setEstimatedBudget(proposal.estimatedBudget || '');
                setTimeline(proposal.timeline || '');
            } else {
                setTitle(`Marketing Proposal for ${clientName}`);
                setContent(`**PROJECT OVERVIEW**\n\n- Brief summary of the project goals.\n\n**SCOPE OF WORK**\n\n- Detailed list of deliverables.\n\n**TIMELINE**\n\n- Estimated project timeline.\n\n**INVESTMENT**\n\n- Breakdown of costs.`);
                setEstimatedBudget('');
                setTimeline('');
            }
        }
    }, [proposal, clientName, isOpen]);

    const handleSave = () => {
        if (!title.trim()) {
            alert('Proposal title is required.');
            return;
        }
        onSave({
            id: proposal?.id,
            clientId,
            title,
            content,
            estimatedBudget,
            timeline
        });
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[1050] overflow-hidden transition-all duration-300 ease-in-out`}>
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" aria-hidden="true" onClick={onClose}></div>
            <div className={`absolute inset-y-0 right-0 flex max-w-full pl-10 transform transition ease-in-out duration-300 sm:duration-500 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="w-screen max-w-2xl">
                    <div className="flex h-full flex-col overflow-y-scroll bg-bg-base dark:bg-slate-800 shadow-xl border-l border-border-base dark:border-slate-700">
                        <header className="bg-bg-muted dark:bg-slate-700/50 px-4 py-4 sm:px-6 sticky top-0 z-10 border-b border-border-base dark:border-slate-700">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-lg font-semibold text-text-heading dark:text-slate-100 flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-premium-accent dark:text-premium-accent-dark" />
                                        <span>{proposal ? 'Edit Proposal' : 'Create Proposal'}</span>
                                    </h2>
                                    <p className="text-sm text-text-muted dark:text-slate-400">For: {clientName}</p>
                                </div>
                                <Button variant="ghost" className="p-1" onClick={onClose}><X className="w-5 h-5"/></Button>
                            </div>
                        </header>
                        <main className="relative flex-1 px-4 py-5 sm:px-6 space-y-4">
                            <Input label="Proposal Title *" value={title} onChange={e => setTitle(e.target.value)} />
                            <TextArea label="Proposal Content (Markdown Supported)" value={content} onChange={e => setContent(e.target.value)} rows={15} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input label="Estimated Budget" value={estimatedBudget} onChange={e => setEstimatedBudget(e.target.value)} placeholder="e.g., ₹50,000 - ₹75,000" />
                                <Input label="Timeline (Optional)" value={timeline} onChange={e => setTimeline(e.target.value)} placeholder="e.g., 4-6 Weeks" />
                            </div>
                        </main>
                        <footer className="p-4 border-t border-border-base dark:border-slate-700 flex justify-end gap-2 bg-bg-muted dark:bg-slate-800/50 sticky bottom-0">
                            <Button variant="secondary" onClick={onClose}>Cancel</Button>
                            <Button variant="primary" onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>Save Proposal</Button>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};
