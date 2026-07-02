
import React, { useState, useMemo } from 'react';
import { Client, Proposal, OnboardingKickoffData, ProposalStatus, proposalStatuses, FeatureKey, PermissionAction } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

// Icon Props Interface
interface IconProps {
  className?: string;
}

// Icons
const PlusIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const EditIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path d="M11.354 1.646a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708L5.061 13.939a.5.5 0 0 1-.353.146H2.5a.5.5 0 0 1-.5-.5V11.293a.5.5 0 0 1 .146-.353L11.354 1.646ZM12.5 2.5 4.207 10.793V13h2.207L13.5 4.707 12.5 3.707V2.5Z" /><path d="m10.854 3.146 2.292 2.292-8.5 8.5H2.5v-2.292l8.5-8.5Z" /></svg>;
const TrashIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5zM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711z" clipRule="evenodd" /></svg>;
const DocumentTextIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm5.75 2.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" /></svg>;
const ClipboardDocumentListIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M5.75 2.75A2.25 2.25 0 003.5 5v10A2.25 2.25 0 005.75 17.25H7.5v-2.5A2.75 2.75 0 0110.25 12h2.5A2.75 2.75 0 0115.5 14.75v2.5h1.75A2.25 2.25 0 0019.5 15V5A2.25 2.25 0 0017.25 2.75H5.75z" /><path d="M10.25 13.5A1.25 1.25 0 009 14.75v2.5h5v-2.5A1.25 1.25 0 0012.75 13.5h-2.5z" /></svg>;

interface OnboardingViewProps {
  clients: Client[];
  proposals: Proposal[];
  onboardingKickoffData: OnboardingKickoffData[];
  onOpenProposalModal: (proposal: Proposal | null) => void;
  onDeleteProposal: (proposalId: string) => void;
  onUpdateProposalStatus: (proposalId: string, status: ProposalStatus) => void;
  onOpenKickoffFormModal: (clientId: string, existingData?: OnboardingKickoffData | null) => void;
  onDeleteKickoffData: (kickoffDataId: string) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

const getProposalStatusClassNames = (status: ProposalStatus): string => {
  switch (status) {
    case 'Draft': return 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400';
    case 'SentToClient': return 'bg-blue-100 text-status-neutral dark:bg-status-neutral/20 dark:text-status-neutral';
    case 'Signed': return 'bg-green-100 text-status-positive dark:bg-status-positive/20 dark:text-status-positive';
    case 'Declined': return 'bg-red-100 text-status-negative dark:bg-status-negative/20 dark:text-status-negative';
    case 'Archived': return 'bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-400';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-600/30 dark:text-slate-300';
  }
};

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  clients, proposals, onboardingKickoffData,
  onOpenProposalModal, onDeleteProposal, onUpdateProposalStatus,
  onOpenKickoffFormModal, onDeleteKickoffData, hasPermission
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const canManageProposals = hasPermission('onboarding', 'canManageProposals');
  const canManageKickoffForms = hasPermission('onboarding', 'canManageKickoffForms');

  const filteredClients = useMemo(() => {
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  }, [clients, searchTerm]);

  const selectBaseClass = "text-xs p-1 border border-border-base dark:border-border-muted rounded-lg focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent bg-bg-base dark:bg-bg-muted text-text-base dark:text-text-base";
  const optionClass = "bg-bg-base dark:bg-bg-muted text-text-base dark:text-text-base";


  return (
    <Card title="Client Onboarding Dashboard" className="bg-pink-50 dark:bg-pink-900/60 shadow-xl rounded-xl">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search clients..."
          className="w-full sm:w-1/2 md:w-1/3 p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-lg focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm text-text-base dark:text-text-base placeholder-text-muted dark:placeholder-text-muted/70 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <p className="text-text-muted dark:text-text-muted text-center py-8">
          No clients found. Add clients in the "Clients" section to begin onboarding.
        </p>
      ) : (
        <div className="space-y-6">
          {filteredClients.map(client => {
            const clientProposals = proposals.filter(p => p.clientId === client.id).sort((a,b) => new Date(b.lastUpdatedDate).getTime() - new Date(a.lastUpdatedDate).getTime());
            const clientKickoffData = onboardingKickoffData.find(kd => kd.clientId === client.id);

            return (
              <Card key={client.id} title={`${client.name} ${client.companyName ? `(${client.companyName})` : ''}`} className="bg-bg-muted dark:bg-slate-700/40 shadow-lg rounded-lg border border-border-base dark:border-border-muted">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Proposals Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                       <h4 className="text-sm font-semibold text-text-base dark:text-text-base flex items-center"><DocumentTextIcon className="mr-1.5 text-premium-accent dark:text-premium-accent-dark" />Proposals/Contracts</h4>
                       {canManageProposals && <Button size="xs" variant="outline" onClick={() => onOpenProposalModal(null)} leftIcon={<PlusIcon/>}>New Proposal</Button>}
                    </div>
                    {clientProposals.length > 0 ? (
                      <ul className="text-xs space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {clientProposals.map(proposal => (
                          <li key={proposal.id} className="p-1.5 bg-bg-base dark:bg-slate-700 rounded-lg border border-border-base dark:border-border-muted flex justify-between items-center">
                            <div className="truncate pr-1">
                                <span className="font-medium text-text-base dark:text-text-base">{proposal.proposalNumber} (v{proposal.version})</span>
                                <span className="text-text-muted dark:text-text-muted ml-1">- {new Date(proposal.lastUpdatedDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <select 
                                    value={proposal.status} 
                                    onChange={(e) => onUpdateProposalStatus(proposal.id, e.target.value as ProposalStatus)}
                                    className={`${selectBaseClass} ${getProposalStatusClassNames(proposal.status)}`}
                                    disabled={!canManageProposals}
                                >
                                    {proposalStatuses.map(s => <option key={s} value={s} className={optionClass}>{s}</option>)}
                                </select>
                                {canManageProposals && <>
                                    <Button variant="ghost" size="xs" onClick={() => onOpenProposalModal(proposal)} className="p-1" aria-label="Edit Proposal"><EditIcon className="w-4 h-4"/></Button>
                                    <Button variant="ghost" size="xs" onClick={() => onDeleteProposal(proposal.id)} className="p-1 text-status-negative" aria-label="Delete Proposal"><TrashIcon className="w-4 h-4"/></Button>
                                </>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-xs text-text-muted dark:text-text-muted p-1.5">No proposals for this client.</p>}
                  </div>

                  {/* Kickoff Form Section */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-semibold text-text-base dark:text-text-base flex items-center"><ClipboardDocumentListIcon className="mr-1.5 text-premium-accent dark:text-premium-accent-dark"/>Kickoff Form</h4>
                        {canManageKickoffForms && (
                            <Button size="xs" variant="outline" onClick={() => onOpenKickoffFormModal(client.id, clientKickoffData || null)} leftIcon={clientKickoffData ? <EditIcon className="w-4 h-4"/> : <PlusIcon/>}>
                                {clientKickoffData ? 'Edit Form' : 'Fill Form'}
                            </Button>
                        )}
                    </div>
                    {clientKickoffData ? (
                        <div className="text-xs p-2 bg-bg-base dark:bg-slate-700 rounded-lg border border-border-base dark:border-border-muted">
                            <p className="text-text-base dark:text-text-base">Status: <span className={`font-medium ${clientKickoffData.isSubmitted ? 'text-status-positive' : 'text-status-warning'}`}>{clientKickoffData.isSubmitted ? 'Submitted' : 'Draft'}</span>
                                {clientKickoffData.submissionDate && ` on ${new Date(clientKickoffData.submissionDate).toLocaleDateString()}`}
                            </p>
                            <p className="text-text-muted dark:text-text-muted truncate" title={clientKickoffData.businessName}>Business: {clientKickoffData.businessName}</p>
                            {canManageKickoffForms && <Button variant="ghost" size="xs" onClick={() => onDeleteKickoffData(clientKickoffData.id)} className="p-1 text-status-negative float-right -mt-4" aria-label="Delete Kickoff Data"><TrashIcon className="w-4 h-4"/></Button>}
                        </div>
                    ) : <p className="text-xs text-text-muted dark:text-text-muted p-1.5">No kickoff form data submitted.</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
};
