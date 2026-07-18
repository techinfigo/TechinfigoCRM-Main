
import React, { useState, useMemo } from 'react';
import { Lead, TeamMember, FeatureKey, PermissionAction, AuditRecord, Proposal, OnboardingKickoffData, LeadStatus, Client, PanelType, ProjectsDrawerConfig, ModalType, Task } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { SidePanel } from '../common/SidePanel';
import { Modal } from '../common/Modal';
import { 
    CheckCircle2, CircleDot, FileScan, FileUp, UserCheck, 
    Edit, Undo2, Check, Circle, FileText, Rocket, Banknote, 
    BadgeCheck, Phone, Map, Plus, FolderKanban, Calendar, Mail,
    Clock, AlertCircle, ChevronRight, Globe, Instagram, StickyNote,
    BarChart3, Layers, ChevronDown, ExternalLink, Target, TrendingUp,
    Send, MessageSquare
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
  onConvertLeadToClient: (lead: Lead, customAttributes?: any) => void;
  onRevertClientToLead?: (leadId: string) => void;
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
  tasks: Task[];
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
    onOpenAuditReportModal, onOpenProjectsDrawer, clients, openModal, onOpenProposalPanel,
    onConvertLeadToClient, onRevertClientToLead, tasks
}) => {
    
  const [activeTab, setActiveTab ] = useState<'timeline' | 'audit' | 'proposals'>('timeline');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [inputText, setInputText] = useState('');

  const [showConversionWizard, setShowConversionWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState({
      industry: lead.industry || 'Tech / Digital SaaS',
      serviceInterest: lead.serviceInterest || ['Web Dev'],
      roiGoal: '300',
      nextActionTitle: 'Onboarding Kickoff Meeting',
      primaryContactName: lead.name,
      clientNotes: `Converted from Lead with starting status "${lead.status}".`,
      revenueBand: lead.revenueBand || '₹1,00,000 - ₹2,00,000',
      assignedToUserId: lead.assignedToUserId || ''
  });
  const [showRevertConfirmation, setShowRevertConfirmation] = useState(false);

  const clientRecordForLead = useMemo(() => {
    if (lead.status === 'Converted') {
        return clients.find(c => c.convertedFromLeadId === lead.id || c.email === lead.email);
    }
    return null;
  }, [clients, lead]);

  const relatedAudit = useMemo(() => auditRecords.find(a => a.leadId === lead.id), [auditRecords, lead.id]);
  const relatedProposals = useMemo(() => proposals.filter(p => p.clientId === lead.id), [proposals, lead.id]);
  const leadOwner = useMemo(() => teamMembers.find(t => t.id === lead.assignedToUserId), [teamMembers, lead.assignedToUserId]);
  const leadTasks = useMemo(() => (tasks || []).filter(t => t.leadId === lead.id), [tasks, lead.id]);

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
    <>
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
                                                     onUpdateStatus(lead.id, s as LeadStatus);
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
                 
                 {lead.status !== 'Converted' ? (
                     <Button variant="primary" size="sm" onClick={() => {
                         setWizardData({
                             industry: lead.industry || 'Tech / Digital SaaS',
                             serviceInterest: lead.serviceInterest || ['Web Dev'],
                             roiGoal: '300',
                             nextActionTitle: 'Onboarding Kickoff Meeting',
                             primaryContactName: lead.name,
                             clientNotes: `Converted from Lead with starting status "${lead.status}".`,
                             revenueBand: lead.revenueBand || '₹1,0,000 - ₹2,0,000',
                             assignedToUserId: lead.assignedToUserId || ''
                         });
                         setWizardStep(1);
                         setShowConversionWizard(true);
                     }} leftIcon={<UserCheck className="w-3.5 h-3.5"/>}>
                         Convert
                     </Button>
                 ) : (
                     <Button variant="outline" size="sm" onClick={() => setShowRevertConfirmation(true)} className="text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 border-rose-200 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/20" leftIcon={<Undo2 className="w-3.5 h-3.5"/>}>
                         Undo Conversion
                     </Button>
                 )}
            </div>
        </div>
    } size="5xl">
       
       <div className="flex flex-col lg:flex-row gap-6 min-h-0">
            
            {/* LEFT SIDEBAR: Static Info (30%) */}
            <div className="w-full lg:w-[30%] space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                
                {/* Contact Details Card */}
                <Card title="Contact Details" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl" contentClassName="p-5 bg-slate-50/50 dark:bg-slate-900/30 text-zinc-650 dark:text-zinc-300 rounded-b-2xl">
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
                                <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold">Phone</span>
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
                <Card title="Business Profile" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl" contentClassName="p-5 bg-slate-50/50 dark:bg-slate-900/30 text-zinc-650 dark:text-zinc-300 rounded-b-2xl">
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
                            {/* Linked Tasks */}
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-secondary-accent" /> Tasks
                                    </h3>
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        leftIcon={<Plus className="w-3.5 h-3.5" />}
                                        onClick={() => openModal('TASK_FORM', { defaultLink: { type: 'lead', id: lead.id, name: lead.name } })}
                                    >
                                        Add Task
                                    </Button>
                                </div>
                                {leadTasks.length > 0 ? (
                                    <div className="space-y-2">
                                        {leadTasks.map(t => (
                                            <div
                                                key={t.id}
                                                onClick={() => openModal('TASK_FORM', { task: t })}
                                                className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/60 hover:border-secondary-accent cursor-pointer transition-colors"
                                            >
                                                <span className={`text-xs font-semibold truncate ${t.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{t.title}</span>
                                                <div className="flex items-center gap-2 shrink-0 text-[10px]">
                                                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">{t.status}</span>
                                                    {t.dueDate && <span className="text-slate-400">{safeFormatDate(t.dueDate)}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No tasks linked to this lead yet.</p>
                                )}
                            </div>

                            {/* Input Box */}
                            <div className="bg-white dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-xs hover:shadow-sm focus-within:shadow-md focus-within:border-secondary-accent focus-within:ring-1 focus-within:ring-secondary-accent/40 flex gap-4 transition-all duration-300">
                                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex-shrink-0 flex items-center justify-center font-bold text-slate-500 text-xs shadow-xs ring-4 ring-slate-100/50 dark:ring-slate-800/10 transition-all duration-300">
                                    <MessageSquare className="w-4 h-4 text-[#001d21] dark:text-[#fcb632] opacity-80" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <input 
                                        type="text" 
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        placeholder="Add a progress update, note next steps, or log a call..." 
                                        className="w-full bg-transparent border-none text-sm font-semibold p-0 mb-3 text-slate-800 dark:text-slate-150 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 border-b border-dashed border-slate-100 dark:border-slate-800/50 focus-within:border-slate-200 dark:focus-within:border-slate-700 transition-colors"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && inputText.trim()) {
                                                onOpenFollowUpModal(lead, inputText);
                                                setInputText('');
                                            }
                                        }}
                                    />
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <Button 
                                                size="xs" 
                                                variant="ghost" 
                                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50/50 dark:bg-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" 
                                                onClick={() => {
                                                    onOpenFollowUpModal(lead, inputText);
                                                    setInputText('');
                                                }}
                                            >
                                                <Phone className="w-3.5 h-3.5 text-blue-500 mr-0.5"/> Log Call
                                            </Button>
                                            <Button 
                                                size="xs" 
                                                variant="ghost" 
                                                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-50/50 dark:bg-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer" 
                                                onClick={() => openModal('EMAIL_COMPOSE', { initialEmail: { recipientEmail: lead.email } })}
                                            >
                                                <Mail className="w-3.5 h-3.5 text-pink-500 mr-0.5"/> Send Email
                                            </Button>
                                        </div>

                                        <div className="flex items-center">
                                            {inputText.trim() ? (
                                                <Button 
                                                    size="xs" 
                                                    variant="primary" 
                                                    className="bg-secondary-accent hover:bg-secondary-accent-hover text-secondary-accent-text font-black px-3.5 py-1.25 rounded-xl shadow-xs transition-transform active:scale-[0.98] flex items-center gap-1 cursor-pointer animate-in fade-in duration-200"
                                                    onClick={() => {
                                                        onOpenFollowUpModal(lead, inputText);
                                                        setInputText('');
                                                    }}
                                                >
                                                    <Send className="w-3 h-3" /> Quick Post
                                                </Button>
                                            ) : (
                                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                                                    <kbd className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-750 font-mono text-[9px] text-slate-400">Enter</kbd> to save
                                                </span>
                                            )}
                                        </div>
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
                                                                ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-200'
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
                                        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/10 dark:to-orange-950/5 rounded-xl border border-amber-100 dark:border-amber-900/20 shadow-xs">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Outreach Angle</span>
                                            </div>
                                            <p className="text-xs font-bold text-amber-900/90 dark:text-amber-200/90 leading-relaxed italic">
                                                "{lead.outreachAngle || 'No specific angle recorded.'}"
                                            </p>
                                        </div>
                                        
                                        <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/5 rounded-xl border border-blue-100 dark:border-blue-900/20 shadow-xs">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BadgeCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                <span className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider">Offer Sent</span>
                                            </div>
                                            <p className="text-xs font-bold text-blue-900/95 dark:text-blue-200/95 leading-relaxed">
                                                {lead.offerSent || 'None sent yet.'}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Pro Agency Marketing Intelligence Dossier Card */}
                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                                <div className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/10 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
                                            <Target className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Agency Marketing Intelligence</h3>
                                            <p className="text-[10px] text-slate-450 dark:text-slate-400 font-medium">Core client footprint, campaign bottlenecks, and creative direction</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {lead.trackingHealth && (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                                lead.trackingHealth === 'Verified'
                                                    ? 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-200/50 text-emerald-700 dark:text-emerald-450'
                                                    : lead.trackingHealth === 'Issues Detected'
                                                    ? 'bg-amber-50/90 dark:bg-amber-950/20 border-amber-200/50 text-amber-700 dark:text-amber-400'
                                                    : lead.trackingHealth === 'Not Installed'
                                                    ? 'bg-rose-50/90 dark:bg-rose-950/20 border-rose-200/50 text-rose-700 dark:text-rose-400'
                                                    : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 text-slate-600 dark:text-slate-450'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    lead.trackingHealth === 'Verified' ? 'bg-emerald-500 animate-pulse' : lead.trackingHealth === 'Issues Detected' ? 'bg-amber-400' : lead.trackingHealth === 'Not Installed' ? 'bg-rose-500' : 'bg-slate-450'
                                                }`}></span>
                                                Pixel: {lead.trackingHealth}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5 space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                         {/* Goals & Pain Points */}
                                         <div className="space-y-1.5">
                                             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Primary Business Goal & CPA Target</span>
                                             <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed font-semibold">
                                                 {lead.primaryGoal || "No custom objective recorded. Log an activity or edit the lead to build custom funnel strategies."}
                                             </div>
                                         </div>

                                         {/* Key Competitors */}
                                         <div className="space-y-1.5">
                                             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Core Benchmarks & Competitors</span>
                                             <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 leading-relaxed font-semibold">
                                                 {lead.keyCompetitors || "No benchmark listings. Edit the lead profile to save details on competitor ad strategies."}
                                             </div>
                                         </div>
                                     </div>

                                     {/* Campaign Detail Grid */}
                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-150 dark:border-slate-700/60">
                                         {/* Target Audience */}
                                         <div className="p-4 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/40">
                                             <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Target Persona</span>
                                             <p className="text-xs text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                                                 {lead.targetAudience || 'Not defined yet.'}
                                             </p>
                                         </div>

                                         {/* Brand Creative Tone */}
                                         <div className="p-4 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/40">
                                             <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Creative Vibe & Tone</span>
                                             <p className="text-xs text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                                                 {lead.brandTone || 'Not defined yet.'}
                                             </p>
                                        </div>

                                        {/* Active Channels */}
                                        <div className="p-4 bg-slate-50/40 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/40">
                                             <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">Campaign Focus Channels</span>
                                             <div className="flex flex-wrap gap-1.5">
                                                 {Array.isArray(lead.marketingChannels) && lead.marketingChannels.length > 0 ? (
                                                     lead.marketingChannels.map(channel => (
                                                         <span key={channel} className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/35 rounded-lg">
                                                             {channel}
                                                         </span>
                                                     ))
                                                 ) : (
                                                     <span className="text-xs text-slate-400 italic">None logged.</span>
                                                 )}
                                             </div>
                                         </div>
                                     </div>

                                     {/* Ad Library Action Link */}
                                     {lead.adLibraryLink && (
                                         <div className="pt-1 flex">
                                             <a 
                                                 href={lead.adLibraryLink} 
                                                 target="_blank" 
                                                 rel="noopener noreferrer" 
                                                 className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-450 hover:text-indigo-750 dark:hover:text-indigo-350 transition-colors bg-indigo-50/60 dark:bg-indigo-950/20 hover:bg-indigo-100/65 dark:hover:bg-indigo-950/30 px-3.5 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/30 shadow-xs cursor-pointer text-left"
                                             >
                                                 <TrendingUp className="w-3.5 h-3.5" />
                                                 <span>Explore Competitor & Brand Meta Ad Library</span>
                                                 <ExternalLink className="w-3 h-3 opacity-80" />
                                             </a>
                                         </div>
                                     )}
                                 </div>
                             </div>

                            <Card title="Audit Report" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl" 
                                actions={!relatedAudit && <Button size="sm" onClick={() => onOpenAuditFormModal(lead)}>Create Audit</Button>}
                            >
                                {relatedAudit ? (
                                    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-xl hover:shadow-xs hover:border-premium-accent dark:hover:border-premium-accent transition-all cursor-pointer group" onClick={() => onOpenAuditReportModal(lead, relatedAudit)}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-450 rounded-xl shrink-0 group-hover:scale-105 transition-transform"><FileScan className="w-5.5 h-5.5"/></div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-white">Growth Audit Report</p>
                                                <p className="text-xs text-slate-500 font-medium">Score: {relatedAudit.aiOverallScore}/100 • {safeFormatDate(relatedAudit.dateConducted)}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" className="font-bold">View PDF</Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 text-center py-4">No audit generated yet.</p>
                                )}
                            </Card>
                        </div>
                    )}

                    {/* TAB 3: PROPOSALS & FILES */}
                    {activeTab === 'proposals' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-slate-700 dark:text-white">Proposals</h3>
                                <Button size="sm" onClick={() => openModal('PROPOSAL_FORM', { prefillClientId: lead.id })} leftIcon={<Plus className="w-4 h-4"/>}>New Proposal</Button>
                            </div>
                            
                            {relatedProposals.length > 0 ? (
                                <div className="space-y-3">
                                    {relatedProposals.map(prop => (
                                        <div key={prop.id} onClick={() => onOpenProposalPanel(prop)} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-premium-accent cursor-pointer transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 group-hover:text-premium-accent transition-colors">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm text-text-heading dark:text-slate-100">{prop.title || `Proposal #${prop.proposalNumber}`}</h4>
                                                    <p className="text-xs text-text-muted">Version {prop.version} • Created {safeFormatDate(prop.generatedDate)}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300`}>
                                                {prop.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-slate-400 italic">No proposals created.</p>}

                            <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>

                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-slate-700 dark:text-white">Files</h3>
                                <Button size="sm" variant="outline" onClick={() => alert('Upload placeholder')}>Upload File</Button>
                            </div>
                             <p className="text-sm text-slate-400 italic">No files uploaded.</p>
                        </div>
                    )}
                    

                    


                </div>
            </div>
       </div>
    </SidePanel>

    {/* CONVERSION WIZARD MODAL */}
    {showConversionWizard && (
        <Modal 
            isOpen={showConversionWizard} 
            onClose={() => setShowConversionWizard(false)} 
            title={
                <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#001d21]/10 text-[#001d21] dark:text-[#fcb632] dark:bg-[#fcb632]/10 rounded-lg">
                        <UserCheck className="w-5 h-5"/>
                    </span>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Convert Lead to Client</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-550">Step {wizardStep} of 3: Required client details</p>
                    </div>
                </div>
            }
            size="lg"
            overrideZIndex="z-[1550]"
        >
            <div className="space-y-5 p-4">
                {/* STEP 1: Client Bio & Vertical */}
                {wizardStep === 1 && (
                    <div className="space-y-4">
                        <p className="text-xs text-slate-650 bg-blue-50/50 dark:bg-slate-900/40 p-3 rounded-lg border border-blue-200/30 leading-relaxed dark:text-slate-350">
                            Please confirm the primary client details for <strong>{lead.name}</strong>. These questions are required to establish an accurate client profile in our digital marketing CRM database.
                        </p>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-405">Primary Contact Person Name *</label>
                            <input 
                                type="text" 
                                value={wizardData.primaryContactName}
                                onChange={(e) => setWizardData({ ...wizardData, primaryContactName: e.target.value })}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-850 focus:outline-none focus:border-[#fcb632] dark:text-white"
                                placeholder="e.g. Robert Downey"
                                required
                            />
                        </div>
                        
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-655 dark:text-slate-400">Vertical / Industry Vertical *</label>
                            <select 
                                value={wizardData.industry}
                                onChange={(e) => setWizardData({ ...wizardData, industry: e.target.value })}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-855 focus:outline-none focus:border-[#fcb632] dark:text-white"
                            >
                                <option value="Tech / Digital SaaS">Tech / Digital SaaS</option>
                                <option value="E-commerce & D2C">E-commerce & D2C</option>
                                <option value="Healthcare & Clinical">Healthcare & Clinical</option>
                                <option value="Finance & Fintech">Finance & Fintech</option>
                                <option value="Real Estate">Real Estate</option>
                                <option value="Local Business / Service">Local Business / Service</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-650 dark:text-slate-400 block">Service Focus (Subscribed Zones) *</label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                {['Web Dev', 'SEO Management', 'Paid PPC Ads', 'Social Media', 'Content Strategy'].map(service => {
                                    const hasSelected = wizardData.serviceInterest.includes(service);
                                    return (
                                        <button
                                            key={service}
                                            type="button"
                                            onClick={() => {
                                                const freshArr = hasSelected 
                                                    ? wizardData.serviceInterest.filter(s => s !== service)
                                                    : [...wizardData.serviceInterest, service];
                                                setWizardData({ ...wizardData, serviceInterest: freshArr });
                                            }}
                                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all hover:scale-[1.01] cursor-pointer ${hasSelected ? 'bg-[#fcb632]/10 border-[#fcb632]/50 text-[#001d21] dark:text-[#fcb632]' : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                                        >
                                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${hasSelected ? 'bg-[#fcb632] border-[#fcb632] text-[#001d20]' : 'border-slate-300 dark:border-slate-700'}`}>
                                                {hasSelected && '✓'}
                                            </span>
                                            <span>{service}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {wizardData.serviceInterest.length === 0 && (
                                <p className="text-[10px] text-rose-500 font-semibold mt-1">Please select at least one service focus.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: ROI Goal & Financial Metric */}
                {wizardStep === 2 && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Target Success Metric / ROI Goal (%) *</label>
                            <p className="text-[11px] text-slate-450 dark:text-slate-500 block mb-1">State the target growth or Return-on-Investment goal agreed with the client.</p>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    value={wizardData.roiGoal}
                                    onChange={(e) => setWizardData({ ...wizardData, roiGoal: e.target.value })}
                                    className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-850 focus:outline-none focus:border-[#fcb632] dark:text-white"
                                    placeholder="300"
                                    required
                                    min="1"
                                />
                                <span className="absolute right-3.5 top-2.5 text-xs font-semibold text-slate-400">%</span>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[#021f24] dark:text-slate-400 font-semibold">Monthly Billing / Contract Revenue Band *</label>
                            <select 
                                value={wizardData.revenueBand}
                                onChange={(e) => setWizardData({ ...wizardData, revenueBand: e.target.value })}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-850 focus:outline-none focus:border-[#fcb632] dark:text-white"
                            >
                                <option value="₹50,000 - ₹1,00,000">₹50,005 - ₹1,00,000</option>
                                <option value="₹1,00,000 - ₹2,00,000">₹1,00,000 - ₹2,00,000</option>
                                <option value="₹2,00,000 - ₹5,00,000">₹2,00,000 - ₹5,00,000</option>
                                <option value="₹5,00,000+">₹5,00,000+</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* STEP 3: Setup & Handover */}
                {wizardStep === 3 && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 font-semibold">Assigned Account Manager *</label>
                            <select 
                                value={wizardData.assignedToUserId}
                                onChange={(e) => setWizardData({ ...wizardData, assignedToUserId: e.target.value })}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-850 focus:outline-none focus:border-[#fcb632] dark:text-white"
                                required
                            >
                                <option value="">-- Choose Account Lead --</option>
                                {teamMembers.map(member => (
                                    <option key={member.id} value={member.id}>{member.name} ({member.role})</option>
                                ))}
                            </select>
                            {wizardData.assignedToUserId === "" && (
                                <p className="text-[10px] text-rose-500 font-semibold mt-1">Please select an Account Manager.</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-655 dark:text-slate-400 font-semibold">Primary Onboarding Milestone Action *</label>
                            <input 
                                type="text" 
                                value={wizardData.nextActionTitle}
                                onChange={(e) => setWizardData({ ...wizardData, nextActionTitle: e.target.value })}
                                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-850 focus:outline-none focus:border-[#fcb632] dark:text-white"
                                placeholder="e.g. Schedule Onboarding Kickoff"
                                required
                            />
                            {wizardData.nextActionTitle.trim() === "" && (
                                <p className="text-[10px] text-rose-505 font-semibold mt-1">Milestone action is required.</p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-60c dark:text-slate-400">Additional Handover Notes</label>
                            <textarea 
                                value={wizardData.clientNotes}
                                onChange={(e) => setWizardData({ ...wizardData, clientNotes: e.target.value })}
                                className="w-full text-xs px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-250 dark:border-slate-850 focus:outline-none focus:border-[#fcb632] dark:text-white h-20 resize-none"
                                placeholder="Enter special requirements or budget constraints info..."
                            />
                        </div>
                    </div>
                )}

                {/* STEP NAVIGATION FOOTER */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-3">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                            if (wizardStep === 1) {
                                setShowConversionWizard(false);
                            } else {
                                setWizardStep(prev => prev - 1);
                            }
                        }}
                    >
                        {wizardStep === 1 ? 'Cancel' : 'Back'}
                    </Button>

                    <Button 
                        type="button" 
                        variant="primary" 
                        disabled={
                            (wizardStep === 1 && (wizardData.primaryContactName.trim() === "" || wizardData.serviceInterest.length === 0)) ||
                            (wizardStep === 2 && (wizardData.roiGoal === "" || Number(wizardData.roiGoal) <= 0)) ||
                            (wizardStep === 3 && (wizardData.assignedToUserId === "" || wizardData.nextActionTitle.trim() === ""))
                        }
                        onClick={() => {
                            if (wizardStep < 3) {
                                setWizardStep(prev => prev + 1);
                            } else {
                                // Complete action
                                const finalAttributes = {
                                    roiGoal: wizardData.roiGoal,
                                    nextActionTitle: wizardData.nextActionTitle,
                                    industry: wizardData.industry,
                                    primaryContactName: wizardData.primaryContactName,
                                    clientNotes: wizardData.clientNotes,
                                    assignedToUserId: wizardData.assignedToUserId,
                                    serviceInterest: wizardData.serviceInterest,
                                };
                                onConvertLeadToClient(lead, finalAttributes);
                                setShowConversionWizard(false);
                            }
                        }}
                    >
                        {wizardStep === 3 ? 'Confirm & Convert' : 'Next Step'}
                    </Button>
                </div>
            </div>
        </Modal>
    )}

    {/* UNDO REVERT CONFIRMATION MODAL */}
    {showRevertConfirmation && (
        <Modal 
            isOpen={showRevertConfirmation} 
            onClose={() => setShowRevertConfirmation(false)} 
            title={
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-455">
                    <AlertCircle className="w-5 h-5"/>
                    <h3 className="text-lg font-bold">Undo Conversion?</h3>
                </div>
            }
            size="md"
            overrideZIndex="z-[1550]"
        >
            <div className="space-y-4 p-4 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed text-left">
                    You are about to backtrack the client <strong>{lead.name}</strong> back to an active lead. 
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-left bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-100 dark:border-slate-800 animate-in fade-in">
                    <strong>Warning:</strong> This backtrack process is safe and fully reversible. This will cleanly remove the Client profile from the Clients directory and restore their status to <strong>Negotiation</strong>, letting you edit this lead further or re-convert them later.
                </p>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowRevertConfirmation(false)}
                    >
                        Cancel
                    </Button>
                    <Button 
                        type="button" 
                        variant="primary" 
                        className="bg-rose-600 hover:bg-rose-700 text-white border-transparent cursor-pointer"
                        onClick={() => {
                            if (onRevertClientToLead) {
                                onRevertClientToLead(lead.id);
                            }
                            setShowRevertConfirmation(false);
                            onClose();
                        }}
                    >
                        Yes, Backtrack to Lead
                    </Button>
                </div>
            </div>
        </Modal>
    )}
  </>
  );
};

// Missing Icon Component
const XCircle: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>;


export default LeadDetailView;
