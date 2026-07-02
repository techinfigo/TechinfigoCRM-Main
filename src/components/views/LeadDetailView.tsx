import React, { useState, useMemo } from 'react';
import { Lead, TeamMember, FeatureKey, PermissionAction, AuditRecord, Proposal, OnboardingKickoffData, LeadStatus, Client, PanelType, ProjectsDrawerConfig, ModalType } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { SidePanel } from '../common/SidePanel';
import { 
    CheckCircle2, CircleDot, FileScan, FileUp, UserCheck, 
    Edit, Undo2, Check, Circle, FileText, Rocket, Banknote, 
    BadgeCheck, Phone, Map, Plus, FolderKanban, Calendar, Mail,
    Clock, AlertCircle, ChevronRight, Globe, Instagram, StickyNote,
    BarChart3, Layers, ChevronDown
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { safeFormatDate, safeFormatRelativeTime } from '@/utils';

interface LeadDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  auditRecords: AuditRecord[];
  proposals: Proposal[];
  onboardingKickoffData: OnboardingKickoffData[];
  teamMembers: TeamMember[];
  onEditLead: (lead: Lead) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  openModal: (type: ModalType, props?: any) => void;
  onOpenFollowUpModal: (lead: Lead, initialNote?: string) => void;
  onOpenAuditFormModal: (lead: Lead) => void;
  onOpenAuditReportModal: (lead: Lead, auditRecord: AuditRecord) => void;
  onOpenPaymentModal: () => void;
  onConvertLeadToClient: (lead: Lead, transitionData?: { notes?: string; services?: string[]; budget?: string }) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onMarkStageManually: (leadId: string, stageKey: string) => void;
  onRevertManualMark: (leadId: string, stageKey: string) => void;
  openPanel: (type: PanelType, props?: any) => void;
  onOpenProposalPanel: (proposal: Proposal) => void;
  onSendProposal: (leadId: string, emailData: { subject: string, body: string, to: string }) => void;
  onSendAuditReport: (leadId: string, emailData: { subject: string, body: string, to: string }) => void;
  ai: GoogleGenAI | null;
  onUpdateLeadField: <K extends keyof Lead>(leadId: string, field: K, value: Lead[K]) => void;
  clients: Client[];
  onOpenProjectsDrawer: (config?: ProjectsDrawerConfig) => void;
}

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  'New Lead': {
    bg: 'bg-blue-50/90 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/40',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    label: 'New Lead'
  },
  'Contacted': {
    bg: 'bg-sky-50/90 dark:bg-sky-950/20 border-sky-200/60 dark:border-sky-900/40',
    text: 'text-sky-700 dark:text-sky-400',
    dot: 'bg-sky-500',
    label: 'Contacted'
  },
  'Audit in Progress': {
    bg: 'bg-purple-50/90 dark:bg-purple-950/20 border-purple-200/60 dark:border-purple-900/40',
    text: 'text-purple-700 dark:text-purple-400',
    dot: 'bg-purple-500',
    label: 'Audit In Progress'
  },
  'Proposal Sent': {
    bg: 'bg-amber-50/90 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/40',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    label: 'Proposal Sent'
  },
  'Negotiation': {
    bg: 'bg-pink-50/90 dark:bg-pink-950/20 border-pink-200/60 dark:border-pink-900/40',
    text: 'text-pink-700 dark:text-pink-400',
    dot: 'bg-pink-500',
    label: 'Negotiation'
  },
  'Closed Won': {
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-450',
    dot: 'bg-emerald-500',
    label: 'Closed Won'
  },
  'Closed Lost': {
    bg: 'bg-rose-50/90 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-900/40',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    label: 'Closed Lost'
  }
};

const getStatusBadgeStyle = (status: string) => {
    return STATUS_STYLES[status] || {
        bg: 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/30',
        text: 'text-slate-700 dark:text-slate-400',
        dot: 'bg-slate-500',
        label: status
    };
};

const LeadDetailView: React.FC<LeadDetailViewProps> = ({ 
    isOpen, onClose, lead, auditRecords, proposals, teamMembers, onEditLead, 
    hasPermission, onUpdateStatus, onOpenFollowUpModal, onOpenAuditFormModal, 
    onOpenAuditReportModal, onOpenProjectsDrawer, clients, openModal, onOpenProposalPanel
}) => {
    
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit' | 'proposals'>('timeline');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const [isConvertWizardOpen, setIsConvertWizardOpen] = useState(false);
  const [checklist, setChecklist] = useState({
      proposalApproved: false,
      contractSigned: false,
      paymentCleared: false,
      workspaceShared: false,
      teamAssigned: false
  });
  const [transitionNotes, setTransitionNotes] = useState('');
  const [focusServices, setFocusServices] = useState<string[]>([]);
  const [confirmedBudget, setConfirmedBudget] = useState(lead.estimatedBudget || '');

  const handleToggleCheck = (key: 'proposalApproved' | 'contractSigned' | 'paymentCleared' | 'workspaceShared' | 'teamAssigned') => {
      setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const isChecklistComplete = completedCount === 5;

  const clientRecordForLead = useMemo(() => {
    if (lead.status === 'Converted') {
        return clients.find(c => c.convertedFromLeadId === lead.id || c.email === lead.email);
    }
    return null;
  }, [clients, lead]);

  const relatedAudit = useMemo(() => auditRecords.find(a => a.leadId === lead.id), [auditRecords, lead.id]);
  const relatedProposals = useMemo(() => proposals.filter(p => p.clientId === lead.id), [proposals, lead.id]);
  const leadOwner = useMemo(() => teamMembers.find(t => t.id === lead.assignedToUserId), [teamMembers, lead.assignedToUserId]);

  interface UnifiedTimelineEvent {
    id: string;
    type: 'FollowUp' | 'Audit' | 'Proposal' | 'Creation';
    subType?: string;
    title: string;
    timestamp: string;
    authorName: string;
    content: string;
    metadata?: any;
  }

  const unifiedTimeline = useMemo(() => {
    const events: UnifiedTimelineEvent[] = [];
    
    // 1. FollowUp History
    if (lead.followUpHistory && lead.followUpHistory.length > 0) {
        lead.followUpHistory.forEach(item => {
            events.push({
                id: item.id,
                type: 'FollowUp',
                subType: item.followUpType || 'Other',
                title: `${item.followUpType || 'Activity Logged'}`,
                timestamp: item.timestamp,
                authorName: item.addedByUserName || 'System',
                content: item.note,
                metadata: { priority: item.isHighPriority }
            });
        });
    }
    
    // 2. Audits
    const auditsForLead = auditRecords.filter(a => a.leadId === lead.id);
    auditsForLead.forEach(audit => {
        events.push({
            id: audit.id,
            type: 'Audit',
            title: 'Audit Submitted',
            timestamp: audit.dateConducted || new Date().toISOString(),
            authorName: audit.conductedByUserName || 'System',
            content: audit.overallSummary || `Performance audit completed with an overall score of ${audit.aiOverallScore || 0}%`,
            metadata: { score: audit.aiOverallScore, record: audit }
        });
    });
    
    // 3. Proposals
    const proposalsForLead = proposals.filter(p => p.clientId === lead.id);
    proposalsForLead.forEach(prop => {
        events.push({
            id: prop.id,
            type: 'Proposal',
            title: `Proposal Sent: ${prop.title || prop.proposalNumber}`,
            timestamp: prop.generatedDate || prop.lastUpdatedDate || new Date().toISOString(),
            authorName: 'System',
            content: prop.message || prop.subject || `Budget Estimate: ${prop.estimatedBudget || 'Not specified'}`,
            metadata: { status: prop.status, budget: prop.estimatedBudget, proposal: prop }
        });
    });
    
    // 4. Creation Event
    events.push({
        id: `creation-${lead.id}`,
        type: 'Creation',
        title: 'Lead Registered',
        timestamp: lead.dateAdded,
        authorName: 'System',
        content: `Lead added to CRM system with initial status "${lead.status}". Source: ${lead.source || 'Direct outreach'}`
    });
    
    // Sort descending by timestamp
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [lead, auditRecords, proposals]);

  if (!isOpen) return null;

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 pr-4">
            <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-premium-accent text-lg flex-shrink-0">
                    {getInitials(lead.name)}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-text-heading dark:text-text-heading">{lead.name}</h2>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
                        {lead.companyName && <span className="font-medium text-slate-700 dark:text-slate-300">{lead.companyName}</span>}
                        {lead.instagramHandle && (
                            <a href={`https://instagram.com/${lead.instagramHandle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline flex items-center gap-1">
                                <Instagram className="w-3 h-3"/> {lead.instagramHandle}
                            </a>
                        )}
                        {lead.website && (
                             <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                <Globe className="w-3.5 h-3.5"/> Website
                            </a>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                 {/* Custom Beautiful Status Dropdown */}
                 <div className="relative">
                     <button
                         onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                         className={`flex items-center gap-2 pl-3 pr-2.5 py-1.5 border rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${getStatusBadgeStyle(lead.status).bg} ${getStatusBadgeStyle(lead.status).text}`}
                     >
                         <span className={`w-2 h-2 rounded-full ${getStatusBadgeStyle(lead.status).dot} animate-pulse`}></span>
                         <span>{lead.status}</span>
                         <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5 pointer-events-none" />
                     </button>
                     
                     {isStatusDropdownOpen && (
                         <>
                             <div 
                                 className="fixed inset-0 z-[1060]" 
                                 onClick={() => setIsStatusDropdownOpen(false)}
                             />
                             <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 shadow-2xl p-2 z-[1070] animate-in fade-in slide-in-from-top-3 duration-200">
                                 <p className="text-[10px] font-extrabold text-slate-450 dark:text-slate-400 uppercase tracking-widest px-3 py-1.5 mb-1 bg-slate-50 dark:bg-slate-900/30 rounded-xl">
                                     Update Stage
                                 </p>
                                 <div className="space-y-0.5">
                                     {['New Lead', 'Contacted', 'Audit in Progress', 'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'].map(s => {
                                         const style = getStatusBadgeStyle(s);
                                         const isSelected = lead.status === s;
                                         return (
                                             <button
                                                 key={s}
                                                 onClick={() => {
                                                     if (s === 'Closed Won') {
                                                         setConfirmedBudget(lead.estimatedBudget || '');
                                                         setFocusServices(Array.isArray(lead.serviceInterest) ? lead.serviceInterest : (typeof lead.serviceInterest === 'string' ? (lead.serviceInterest as string).split(',').map(s => s.trim()) : []));
                                                         setIsConvertWizardOpen(true);
                                                     } else {
                                                         onUpdateStatus(lead.id, s as LeadStatus);
                                                     }
                                                     setIsStatusDropdownOpen(false);
                                                 }}
                                                 className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${isSelected ? 'bg-slate-100/90 dark:bg-slate-700/80 text-zinc-900 dark:text-white' : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-slate-700/40 hover:text-zinc-900 dark:hover:text-white'}`}
                                             >
                                                 <div className="flex items-center gap-2.5">
                                                     <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                                                     <span>{s}</span>
                                                 </div>
                                                 {isSelected && <Check className="w-3.5 h-3.5 text-premium-accent" />}
                                             </button>
                                         );
                                     })}
                                 </div>
                              </div>
                          </>
                      )}
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => onOpenFollowUpModal(lead)} leftIcon={<Clock className="w-3.5 h-3.5"/>}>
                     Log Activity
                  </Button>
                  
                  {lead.status !== 'Closed Won' && lead.status !== 'Converted' && (
                     <Button 
                         variant="primary" 
                         size="sm" 
                         onClick={() => {
                             setConfirmedBudget(lead.estimatedBudget || '');
                             setFocusServices(Array.isArray(lead.serviceInterest) ? lead.serviceInterest : (typeof lead.serviceInterest === 'string' ? (lead.serviceInterest as string).split(',').map(s => s.trim()) : []));
                             setIsConvertWizardOpen(true);
                         }} 
                         leftIcon={<UserCheck className="w-3.5 h-3.5"/>}
                     >
                         Convert
                     </Button>
                   )}
             </div>
         </div>
     } size="5xl">
       
       <div className="flex flex-col lg:flex-row gap-6 min-h-0">
             
             {/* LEFT SIDEBAR: Static Info (30%) */}
             <div className="w-full lg:w-[30%] space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                 
                 {/* Contact Details Card */}
                 <Card title="Contact Details" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl">
                     <div className="space-y-3">
                         <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/55 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                             <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                                 <Mail className="w-4 h-4"/>
                             </div>
                             <div className="min-w-0 flex-1">
                                 <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold">Email</span>
                                 <a href={`mailto:${lead.email}`} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate block">{lead.email}</a>
                             </div>
                         </div>
                         
                         <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/55 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                             <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                                 <Phone className="w-4 h-4"/>
                             </div>
                             <div className="min-w-0 flex-1">
                                 <span className="block text-[10px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider font-bold">Phone</span>
                                 <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 block">{lead.phone || 'N/A'}</span>
                             </div>
                         </div>

                         <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/55 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                             <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg shrink-0">
                                 <Map className="w-4 h-4"/>
                             </div>
                             <div className="min-w-0 flex-1">
                                 <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold">Location</span>
                                 <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 block">Remote / Unknown</span>
                             </div>
                         </div>
                     </div>
                 </Card>

                 {/* Business Profile Card */}
                 <Card title="Business Profile" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl">
                      <div className="space-y-3.5">
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                              <div className="flex items-center gap-2 mb-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Industry / Niche</p>
                              </div>
                              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100 pl-3">
                                  {Array.isArray(lead.tags) && lead.tags.length > 0 ? lead.tags.join(', ') : 'Unspecified'}
                              </p>
                          </div>
                          
                          <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/60 dark:border-emerald-900/30">
                              <div className="flex items-center gap-2 mb-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Monthly Revenue</p>
                              </div>
                              <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 pl-3">
                                  {lead.revenueBand || 'Unknown'}
                              </p>
                          </div>

                          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-xl border border-blue-100/60 dark:border-blue-900/30">
                              <div className="flex items-center gap-2 mb-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Est. Budget</p>
                              </div>
                              <p className="text-xs font-bold text-blue-700 dark:text-blue-300 pl-3">
                                  {lead.estimatedBudget || 'N/A'}
                              </p>
                          </div>
                      </div>
                 </Card>

                 {/* Internal Info Card */}
                 <Card title="Internal Info" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl"
                     actions={<Button variant="ghost" size="xs" onClick={() => onEditLead(lead)}><Edit className="w-3 h-3"/></Button>}
                 >
                      <div className="space-y-3.5">
                          <div className="flex justify-between items-center p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Lead Owner</p>
                              <div className="flex items-center gap-2">
                                  {leadOwner ? (
                                      <>
                                         <div className="w-5.5 h-5.5 rounded-full bg-premium-accent/15 text-premium-accent flex items-center justify-center text-[9px] font-black border border-premium-accent/20 shrink-0">
                                             {getInitials(leadOwner.name)}
                                         </div>
                                         <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{leadOwner.name}</span>
                                      </>
                                  ) : <span className="text-xs italic text-slate-400">Unassigned</span>}
                              </div>
                          </div>
                          
                          <div className="flex justify-between items-center p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Source</p>
                              <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold rounded-lg text-xs border border-amber-500/20">
                                  {lead.source || 'Unknown'}
                              </span>
                          </div>
                          
                          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-100 dark:border-zinc-700/50">
                              <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Tags</p>
                              <div className="flex flex-wrap gap-1.5">
                                 {lead.tags && lead.tags.length > 0 ? lead.tags.map(t => (
                                     <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-zinc-200/50 dark:bg-zinc-700/90 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-350/20">
                                         #{t}
                                     </span>
                                 )) : <span className="text-xs text-zinc-400 italic">No tags</span>}
                              </div>
                          </div>
                      </div>
                 </Card>
             </div>

             {/* RIGHT MAIN CONTENT: Dynamic Tabs (70%) */}
             <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                 {/* Tabs Header */}
                 <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                     <button onClick={() => setActiveTab('timeline')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'timeline' ? 'border-secondary-accent text-secondary-accent bg-white dark:bg-slate-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Timeline</button>
                     <button onClick={() => setActiveTab('audit')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'audit' ? 'border-secondary-accent text-secondary-accent bg-white dark:bg-slate-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>The Audit</button>
                     <button onClick={() => setActiveTab('proposals')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'proposals' ? 'border-secondary-accent text-secondary-accent bg-white dark:bg-slate-800 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Proposals & Files</button>

                 </div>

                 {/* Tab Content */}
                 <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-900/10">
                     
                     {/* TAB 1: TIMELINE */}
                     {activeTab === 'timeline' && (
                         <div className="space-y-6">
                             {/* Input Box */}
                             <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center font-bold text-slate-500 text-xs">YOU</div>
                                 <div className="flex-1">
                                     <input 
                                         type="text" 
                                         placeholder="Write a note or log a call..." 
                                         className="w-full bg-transparent border-none focus:ring-0 text-sm p-0 mb-2 placeholder-slate-400"
                                         onKeyDown={(e) => {
                                             if(e.key === 'Enter') {
                                                 onOpenFollowUpModal(lead);
                                             }
                                         }}
                                     />
                                     <div className="flex gap-2">
                                         <Button size="xs" variant="ghost" className="text-slate-500" onClick={() => onOpenFollowUpModal(lead)}><Phone className="w-3 h-3 mr-1"/> Log Call</Button>
                                         <Button size="xs" variant="ghost" className="text-slate-500" onClick={() => openModal('EMAIL_COMPOSE', { initialEmail: { recipientEmail: lead.email } })}><Mail className="w-3 h-3 mr-1"/> Send Email</Button>
                                     </div>
                                 </div>
                             </div>

                             {/* Feed */}
                             <div className="space-y-6 pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-4 animate-in fade-in duration-300">
                                 {unifiedTimeline.length > 0 ? unifiedTimeline.map(evt => {
                                     let iconColor = 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-750';
                                     let iconElement = <Clock className="w-3.5 h-3.5" />;
                                     if (evt.type === 'FollowUp') {
                                         if (evt.subType === 'Call') {
                                             iconColor = 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/30';
                                             iconElement = <Phone className="w-3.5 h-3.5" />;
                                         } else if (evt.subType === 'Email') {
                                             iconColor = 'bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-900/30';
                                             iconElement = <Mail className="w-3.5 h-3.5" />;
                                         } else {
                                             iconColor = 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30';
                                             iconElement = <Calendar className="w-3.5 h-3.5" />;
                                         }
                                     } else if (evt.type === 'Audit') {
                                         iconColor = 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/30';
                                         iconElement = <FileScan className="w-3.5 h-3.5" />;
                                     } else if (evt.type === 'Proposal') {
                                         iconColor = 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30';
                                         iconElement = <FileText className="w-3.5 h-3.5" />;
                                     } else if (evt.type === 'Creation') {
                                         iconColor = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-950';
                                         iconElement = <CheckCircle2 className="w-3.5 h-3.5" />;
                                     }
                                     
                                     return (
                                         <div key={evt.id} className="relative pl-8 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                             <div className={`absolute -left-[12px] top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 ${iconColor} z-5`}>
                                                 {iconElement}
                                             </div>
                                             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                                                 <div className="flex justify-between items-start gap-4 text-xs text-slate-500 mb-1.5 pb-1 border-b border-dashed border-slate-100 dark:border-slate-700">
                                                     <div className="flex items-center gap-2">
                                                         <span className="font-extrabold text-slate-900 dark:text-white">{evt.title}</span>
                                                         <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">by {evt.authorName}</span>
                                                     </div>
                                                     <span className="shrink-0 text-[10px] text-slate-400 dark:text-slate-550 font-mono font-medium">{safeFormatRelativeTime(evt.timestamp)}</span>
                                                 </div>
                                                 <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{evt.content}</p>
                                                 
                                                 {evt.type === 'Audit' && evt.metadata?.score !== undefined && (
                                                     <div className="mt-2.5 flex items-center gap-1.5">
                                                         <span className="text-[9px] font-black uppercase bg-purple-50 dark:bg-purple-950/45 text-purple-600 dark:text-purple-400 px-2 py-0.5 border border-purple-150 rounded flex items-center gap-1">
                                                             <BarChart3 className="w-3 h-3" /> Score: {evt.metadata.score}%
                                                         </span>
                                                         <button 
                                                             className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-sans"
                                                             onClick={() => {
                                                                 setActiveTab('audit');
                                                             }}
                                                         >
                                                             Open Details &rarr;
                                                         </button>
                                                     </div>
                                                 )}
                                                 {evt.type === 'Proposal' && evt.metadata && (
                                                     <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                                         <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                                             evt.metadata.status === 'Sent' 
                                                                 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200' 
                                                                 : evt.metadata.status === 'Accepted'
                                                                 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                                                                 : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-450 border-slate-200'
                                                         }`}>
                                                             {evt.metadata.status}
                                                         </span>
                                                         {evt.metadata.budget && (
                                                             <span className="text-[9px] font-medium bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-450 px-2 py-0.5 rounded border border-slate-200">
                                                                 Amt: {evt.metadata.budget}
                                                             </span>
                                                         )}
                                                         <button 
                                                             className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-sans"
                                                             onClick={() => {
                                                                 setActiveTab('proposals');
                                                             }}
                                                         >
                                                             View Document &rarr;
                                                         </button>
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     );
                                 }) : (
                                     <p className="text-sm text-slate-400 italic pl-6">No history yet.</p>
                                 )}
                             </div>
                         </div>
                     )}

                     {/* TAB 2: THE AUDIT (QUALIFICATION) */}
                     {activeTab === 'audit' && (
                         <div className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <Card title="Qualification Data" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl" icon={<BadgeCheck className="w-5 h-5 text-emerald-500" />}>
                                     <div className="grid grid-cols-2 gap-4">
                                         <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                                             <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-1">Est. Revenue</span>
                                             <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-100">{lead.revenueBand || '-'}</span>
                                         </div>
                                         
                                         <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                                             <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-1">Ad Status</span>
                                             <div className="flex items-center gap-1.5 mt-0.5">
                                                 {lead.adStatus === 'Active' ? (
                                                     <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/20">
                                                         <CheckCircle2 className="w-3.5 h-3.5 text-green-500"/> Running Ads
                                                     </span>
                                                 ) : (
                                                     <span className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-200/10 px-2 py-0.5 rounded-lg border border-zinc-300/40">
                                                         <XCircle className="w-3.5 h-3.5 text-zinc-400"/> Inactive Ads
                                                     </span>
                                                 )}
                                             </div>
                                         </div>

                                         <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800/60 col-span-2">
                                             <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-1">Tech Stack</span>
                                             <div className="flex flex-wrap gap-1.5 mt-1">
                                                 {Array.isArray(lead.techStack) && lead.techStack.length > 0 ? (
                                                     lead.techStack.map(t => (
                                                         <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-500/10">
                                                             {t}
                                                         </span>
                                                     ))
                                                 ) : lead.techStack ? (
                                                     <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{lead.techStack}</span>
                                                 ) : (
                                                     <span className="text-xs text-zinc-450 italic">No technologies listed</span>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                 </Card>

                                 <Card title="The Hook & Outreach" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl" icon={<Rocket className="w-5 h-5 text-indigo-500" />}>
                                     <div className="space-y-4">
                                         <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                                             <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-1">Outreach Angle (The Problem)</span>
                                             <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 italic">"{lead.outreachAngle || 'None specified'}"</p>
                                         </div>
                                         <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                                             <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold mb-1">Offer Sent (The Value)</span>
                                             <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100">"{lead.offerSent || 'None specified'}"</p>
                                         </div>
                                     </div>
                                 </Card>
                             </div>
                         </div>
                     )}

                     {/* TAB 3: PROPOSALS & FILES */}
                     {activeTab === 'proposals' && (
                         <div className="space-y-6 animate-in fade-in duration-200">
                             <Card 
                                 title="Linked Proposals" 
                                 className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl"
                                 icon={<FileText className="w-5 h-5 text-premium-accent" />}
                             >
                                 {relatedProposals.length > 0 ? (
                                     <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                         {relatedProposals.map((proposal) => (
                                             <div key={proposal.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                                 <div>
                                                     <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100">{proposal.title || `Proposal ${proposal.proposalNumber}`}</h4>
                                                     <p className="text-xs text-slate-400 mt-0.5">
                                                         Version v{proposal.version} &middot; Valid until {safeFormatDate(proposal.validUntilDate || '') || 'N/A'}
                                                     </p>
                                                 </div>
                                                 <div className="flex items-center gap-2">
                                                     <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                                         proposal.status === 'Signed' 
                                                             ? 'bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                                                             : proposal.status === 'SentToClient'
                                                             ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                                                             : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-slate-200'
                                                     }`}>
                                                         {proposal.status}
                                                     </span>
                                                     <Button size="xs" variant="outline" onClick={() => onOpenProposalPanel(proposal)}>
                                                         View Detail
                                                     </Button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 ) : (
                                     <div className="text-center py-8">
                                         <p className="text-sm text-slate-400 italic">No proposals built or sent for this lead yet.</p>
                                     </div>
                                 )}
                             </Card>
                         </div>
                     )}
          {/* Lead Conversion Compliance Wizard Overlay */}
          {isConvertWizardOpen && (
              <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
                  {/* Backdrop with nice blur */}
                  <div 
                      className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-xs transition-opacity duration-300"
                      onClick={() => setIsConvertWizardOpen(false)}
                  />
                  
                  {/* Form container */}
                  <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-150 dark:border-slate-800 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      {/* Modal Header */}
                      <div className="p-5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/40 flex justify-between items-center">
                          <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-premium-accent/10 text-premium-accent mb-1 uppercase">
                                  Conversion Compliance Control
                              </span>
                              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                  Lead Qualification Check &mdash; {lead.name}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                  Select all mandatory operation checks to activate full transition triggers.
                              </p>
                          </div>
                          <button 
                              onClick={() => setIsConvertWizardOpen(false)}
                              className="px-2.5 py-1 text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                          >
                              Cancel
                          </button>
                      </div>
                      
                      {/* Form Body Scroll area */}
                      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                          
                          {/* Compliance Bar */}
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                              <div className="flex justify-between items-center mb-2">
                                  <span className="text-[10px] font-extrabold text-slate-450 dark:text-zinc-500 uppercase tracking-widest">
                                      Compliance Checklist Completion
                                  </span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                                      isChecklistComplete 
                                          ? 'bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' 
                                          : 'bg-amber-50 dark:bg-amber-900 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                                  }`}>
                                      {completedCount} of 5 Completed &middot; {Math.round(completedCount / 5 * 100)}%
                                  </span>
                              </div>
                              <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div 
                                      className={`h-full rounded-full transition-all duration-300 ${
                                          isChecklistComplete 
                                              ? 'bg-emerald-500' 
                                              : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${completedCount / 5 * 100}%` }}
                                  />
                              </div>
                          </div>
                          
                          {/* Checklist Section */}
                          <div className="space-y-2.5">
                              {/* Check 1 */}
                              <div 
                                  onClick={() => handleToggleCheck('proposalApproved')}
                                  className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                      checklist.proposalApproved 
                                          ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-250 dark:border-emerald-800/30' 
                                          : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                                  }`}
                              >
                                  <div className="mt-0.5 shrink-0">
                                      {checklist.proposalApproved ? (
                                          <div className="p-0.5 bg-emerald-500 text-white rounded-full">
                                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          </div>
                                      ) : (
                                          <div className="w-4.5 h-4.5 rounded-full border border-slate-300 dark:border-slate-600" />
                                      )}
                                  </div>
                                  <div>
                                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                          1. Strategy & Proposal Accepted
                                      </p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                          Marketing audits and professional ROI proposals have been successfully delivered, reviewed, and finalized by the lead's decision-makers.
                                      </p>
                                  </div>
                              </div>

                              {/* Check 2 */}
                              <div 
                                  onClick={() => handleToggleCheck('contractSigned')}
                                  className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                      checklist.contractSigned 
                                          ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-250 dark:border-emerald-800/30' 
                                          : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                                  }`}
                              >
                                  <div className="mt-0.5 shrink-0">
                                      {checklist.contractSigned ? (
                                          <div className="p-0.5 bg-emerald-500 text-white rounded-full">
                                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          </div>
                                      ) : (
                                          <div className="w-4.5 h-4.5 rounded-full border border-slate-300 dark:border-slate-600" />
                                      )}
                                  </div>
                                  <div>
                                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                          2. Service Agreement Signed
                                      </p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                          Master Service Agreement (MSA) and Statement of Work outlining core deliverables have been signed off by both legal parties.
                                      </p>
                                  </div>
                              </div>

                              {/* Check 3 */}
                              <div 
                                  onClick={() => handleToggleCheck('paymentCleared')}
                                  className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                      checklist.paymentCleared 
                                          ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-250 dark:border-emerald-800/30' 
                                          : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                                  }`}
                              >
                                  <div className="mt-0.5 shrink-0">
                                      {checklist.paymentCleared ? (
                                          <div className="p-0.5 bg-emerald-500 text-white rounded-full">
                                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          </div>
                                      ) : (
                                          <div className="w-4.5 h-4.5 rounded-full border border-slate-300 dark:border-slate-600" />
                                      )}
                                  </div>
                                  <div>
                                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                          3. Upfront Retainer Invoice Paid
                                      </p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                          The initial setup invoice or first-month retainer deposit has cleared under standard payment methods.
                                      </p>
                                  </div>
                              </div>

                              {/* Check 4 */}
                              <div 
                                  onClick={() => handleToggleCheck('workspaceShared')}
                                  className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                      checklist.workspaceShared 
                                          ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-250 dark:border-emerald-800/30' 
                                          : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                                  }`}
                              >
                                  <div className="mt-0.5 shrink-0">
                                      {checklist.workspaceShared ? (
                                          <div className="p-0.5 bg-emerald-500 text-white rounded-full">
                                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          </div>
                                      ) : (
                                          <div className="w-4.5 h-4.5 rounded-full border border-slate-300 dark:border-slate-600" />
                                      )}
                                  </div>
                                  <div>
                                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                          4. Communication & Folders Mapped
                                      </p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                          Shared Google Drive, communication channel (Slack), and necessary tech lockers are prepped for secure workspace asset transitions.
                                      </p>
                                  </div>
                              </div>

                              {/* Check 5 */}
                              <div 
                                  onClick={() => handleToggleCheck('teamAssigned')}
                                  className={`flex items-start gap-4 p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                                      checklist.teamAssigned 
                                          ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-250 dark:border-emerald-800/30' 
                                          : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 hover:border-slate-350'
                                  }`}
                              >
                                  <div className="mt-0.5 shrink-0">
                                      {checklist.teamAssigned ? (
                                          <div className="p-0.5 bg-emerald-500 text-white rounded-full">
                                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                                          </div>
                                      ) : (
                                          <div className="w-4.5 h-4.5 rounded-full border border-slate-300 dark:border-slate-600" />
                                      )}
                                  </div>
                                  <div>
                                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                                          5. Growth strategist & Director Assigned
                                      </p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                          Delivery resources have been planned, designating a Client Strategist, Copywriter, and Growth Director to guide kickoff sprints.
                                      </p>
                                  </div>
                              </div>
                          </div>
                          
                          {/* Details Capture */}
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                              <h4 className="text-[10px] font-extrabold text-slate-450 dark:text-zinc-500 uppercase tracking-widest">
                                  Handoff Settings & Notes
                              </h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                          Confirmed Budget (Monthly Retainer)
                                      </label>
                                      <input 
                                          type="text"
                                          value={confirmedBudget}
                                          onChange={(e) => setConfirmedBudget(e.target.value)}
                                          placeholder="e.g. $6,000 / mo"
                                          className="w-full px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden"
                                      />
                                  </div>
                                  
                                  <div>
                                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                          Core Service Delivery priorities
                                      </label>
                                      <div className="flex flex-wrap gap-1">
                                          {['SEO', 'Meta Ads', 'Klaviyo CRM', 'Lead Sprints'].map(srv => {
                                              const isSel = focusServices.includes(srv);
                                              return (
                                                  <button
                                                      key={srv}
                                                      type="button"
                                                      onClick={() => {
                                                          setFocusServices(prev => 
                                                              prev.includes(srv) ? prev.filter(v => v !== srv) : [...prev, srv]
                                                          );
                                                      }}
                                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                                                          isSel 
                                                              ? 'bg-indigo-50/80 dark:bg-indigo-900/30 border-indigo-200 text-indigo-700 dark:text-indigo-400' 
                                                              : 'bg-transparent border-slate-200 dark:border-slate-750 text-slate-500 hover:text-slate-800 hover:border-slate-350'
                                                      }`}
                                                  >
                                                      {srv}
                                                  </button>
                                              );
                                          })}
                                      </div>
                                  </div>
                              </div>
                              
                              <div>
                                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                                      Strategic Implementation Notes
                                  </label>
                                  <textarea 
                                      rows={2}
                                      value={transitionNotes}
                                      onChange={(e) => setTransitionNotes(e.target.value)}
                                      placeholder="Add critical sales context or onboarding insights for the delivery engineers..."
                                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-transparent focus:ring-1 focus:ring-indigo-500 outline-hidden placeholder-slate-400 leading-relaxed"
                                  />
                              </div>
                          </div>
                      </div>
                      
                      {/* Footer */}
                      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 flex justify-end gap-3 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => setIsConvertWizardOpen(false)}>
                              Cancel Handoff
                          </Button>
                          <Button 
                              variant="primary" 
                              size="sm"
                              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-none shadow-md cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all"
                              onClick={() => {
                                  onConvertLeadToClient(lead, {
                                      notes: transitionNotes,
                                      services: focusServices,
                                      budget: confirmedBudget
                                  });
                                  setIsConvertWizardOpen(false);
                              }}
                              leftIcon={<BadgeCheck className="w-4 h-4"/>}
                          >
                              Validate Checklist & Convert
                          </Button>
                      </div>
                  </div>
              </div>
          )}
     </SidePanel>
   );
 };

 // Missing Icon Component
 const XCircle: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>;


export default LeadDetailView;
