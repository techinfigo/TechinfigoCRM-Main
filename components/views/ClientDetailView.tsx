
import React, { useState, ChangeEvent } from 'react';
import { Client, Project, Campaign, Invoice, AppSettings, FeatureKey, PermissionAction, View, TeamMember, MarketingAuditRequest, ClientDocument, InvoiceStatus, ModalType, Proposal, Audit } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ProjectsView } from './ProjectsView';
import { ClientCampaignsTab } from '@/components/views/ClientCampaignsTab';
import { InvoicesView } from './InvoicesView';
import { MarketingAuditsView } from './MarketingAuditsView';
import { TextArea } from '../common/Input';
import { ClientCampaignsReportTab } from '@/components/views/ClientCampaignsReportTab';
import { FileBarChart2, AlertTriangle, FileScan, CircleDollarSign, Rocket, StickyNote } from 'lucide-react';
import { computeClientHealth, computeClientRoi, computeClientNextAction, computeClientRecentActivity, ClientActivityEvent } from '../../selectors/clientHealthSelectors';

// Icons
const FileIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 text-slate-500 dark:text-slate-400"}><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 8.5a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" /></svg>;
const DownloadIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const TrashIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25-.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const UploadIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M9.25 13.75a.75.75 0 001.5 0V4.793l2.97 2.97a.75.75 0 001.06-1.06l-4.25-4.25a.75.75 0 00-1.06 0L5.22 6.703a.75.75 0 001.06 1.06L9.25 4.793V13.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;

const getActivityIcon = (icon: ClientActivityEvent['icon']) => {
  const commonClasses = "w-4 h-4 text-white p-0.5 rounded-full";
  switch (icon) {
    case 'audit':
      return <FileScan className={`${commonClasses} bg-purple-500`} />;
    case 'payment':
      return <CircleDollarSign className={`${commonClasses} bg-green-500`} />;
    case 'campaign':
      return <Rocket className={`${commonClasses} bg-blue-500`} />;
    case 'note':
      return <StickyNote className={`${commonClasses} bg-yellow-500`} />;
    default:
      return null;
  }
};

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

interface ClientDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  projects: Project[]; 
  campaigns: Campaign[]; 
  invoices: Invoice[];
  marketingAudits: MarketingAuditRequest[];
  proposals: Proposal[];
  audits: Audit[];
  clientDocuments: ClientDocument[];
  teamMembers: TeamMember[]; 
  currentUser: TeamMember;
  
  appSettings: AppSettings;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  
  activeModalType: ModalType | null;
  isModalFormDirty: boolean;
  openModal: (type: ModalType, props?: any) => void;
  closeModal: (forceClose?: boolean) => void; 
  setModalFormDirty: (isDirty: boolean) => void; 
  handleRequestActionWithDirtyCheck: (actionToPerform: () => void, message?: string, title?: string) => void;

  onOpenProjectModal: (project: Project | null) => void; 
  onOpenCampaignModal: (campaign: Campaign | null) => void; 
  onOpenInvoiceModal: (invoice: Invoice | null, prefillClient?: Client) => void; 
  onOpenInvoiceDetailPanel: (invoice: Invoice) => void;

  onOpenProjectDetail: (project: Project) => void; 
  onOpenCampaignReportModal: (campaign: Campaign) => void; 
  onOpenAuditDetailModal: (audit: MarketingAuditRequest) => void; 
  onOpenAuditRequestModal: (auditRequest?: MarketingAuditRequest | null, prefillClient?: Client) => void; 

  onAddClientDocument: (clientId: string, file: File) => void;
  onDeleteClientDocument: (documentId: string) => void;
  onUpdateProject: (project: Project) => void;
  onBatchUpdateProjects: (projects: Project[]) => void;
  onDeleteProject: (projectId: string) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onRevertClientToLead?: (leadId: string) => void;
}

const TABS = [
  'Overview',
  'Projects',
  'Campaigns',
  'Campaign Reports',
  'Invoices',
  'Marketing Audits',
  'Notes/Documents',
] as const;

type TabType = typeof TABS[number];

const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  isOpen,
  onClose,
  client,
  projects,
  campaigns,
  invoices,
  marketingAudits,
  proposals,
  audits,
  clientDocuments,
  teamMembers,
  currentUser,
  appSettings,
  hasPermission,
  openModal,
  handleRequestActionWithDirtyCheck,
  onOpenProjectDetail,
  onOpenCampaignReportModal,
  onOpenAuditDetailModal,
  onOpenInvoiceDetailPanel,
  onAddClientDocument,
  onDeleteClientDocument,
  onUpdateProject,
  onBatchUpdateProjects,
  onOpenInvoiceModal,
  onOpenAuditRequestModal,
  onDeleteProject,
  onUpdateInvoiceStatus,
  onDeleteInvoice,
  onRevertClientToLead
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('Projects');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showBacktrackConfirm, setShowBacktrackConfirm] = useState(false);

  const healthStatus = computeClientHealth(client, invoices, projects);
  const roi = computeClientRoi(client, campaigns);
  const nextAction = computeClientNextAction(client, invoices, projects);
  const recentActivity = computeClientRecentActivity(client, invoices, proposals, audits);
  const roiPercentage = roi.goal > 0 ? (roi.current / roi.goal) * 100 : 0;
  const isNextActionOverdue = !!nextAction && new Date(nextAction.dueDate) < new Date();
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { notation: 'compact', compactDisplay: 'short' }).format(amount);

  const handleTabChange = (tab: TabType) => {
    handleRequestActionWithDirtyCheck(() => setActiveTab(tab));
  };
  
  const detailItem = (label: string, value: React.ReactNode | undefined | null, className?: string) => (
    <div className={`py-1.5 ${className || ''}`}>
      <dt className="text-xs font-medium text-text-muted dark:text-slate-400">{label}</dt>
      <dd className="text-sm text-text-base dark:text-slate-200">{value || 'N/A'}</dd>
    </div>
  );

  const handleFileSelected = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadDocument = () => {
    if (selectedFile && client?.id) {
      onAddClientDocument(client.id, selectedFile);
      setSelectedFile(null); // Reset file input
      if (document.getElementById('client-file-upload') as HTMLInputElement) {
        (document.getElementById('client-file-upload') as HTMLInputElement).value = "";
      }
    } else {
      alert("Please select a file to upload.");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleOpenInvoiceBillModal = (invoice: Invoice) => {
    openModal('INVOICE_BILL_VIEW', { invoice });
  };


  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-premium-accent text-lg shrink-0 overflow-hidden">
            {client.profilePictureUrl ? <img src={client.profilePictureUrl} alt={client.name} className="w-full h-full object-cover" /> : getInitials(client.name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-heading dark:text-text-heading">{client.name}</h2>
            <p className="text-sm text-text-muted dark:text-slate-400">{client.companyName}</p>
          </div>
        </div>
      }
      size="6xl"
      overrideZIndex="z-[1001]"
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex justify-between items-center px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-border-base dark:border-border-muted sticky top-0 z-10">
          <div className="flex border-b border-transparent -mb-[1px]">
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`px-3 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${activeTab === tab
                    ? 'border-premium-accent text-premium-accent dark:border-premium-accent-dark dark:text-premium-accent-dark'
                    : 'border-transparent text-text-muted hover:text-premium-accent dark:text-slate-400 dark:hover:text-premium-accent-dark'
                  }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
           <Button 
              variant="outline" 
              size="sm" 
              onClick={() => openModal('CLIENT_REPORT_GENERATOR', { client })} 
              leftIcon={<FileBarChart2 className="w-4 h-4"/>}
              className="hidden sm:flex"
          >
              Generate Report
          </Button>
          {client.convertedFromLeadId && onRevertClientToLead && (
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowBacktrackConfirm(true)} 
                className="text-rose-600 hover:text-rose-700 dark:text-rose-450 dark:hover:text-rose-400 border-rose-250 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-955/10 ml-2 cursor-pointer"
             >
                Backtrack to Lead
             </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'Overview' && (
            <div className="space-y-4">
              <Card title="Health Cockpit" className="bg-transparent shadow-none border-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-text-muted dark:text-slate-400 mb-1">Health Status</p>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${healthStatus === 'At Risk' ? 'bg-status-negative/10 text-status-negative' : 'bg-status-info/10 text-status-info'}`}>
                      <span className={`w-2 h-2 rounded-full ${healthStatus === 'At Risk' ? 'bg-status-negative' : 'bg-status-info'}`}></span>
                      {healthStatus}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-muted dark:text-slate-400 mb-1">ROI Progress</p>
                    <p className="text-xs text-text-base dark:text-slate-200">{`Current: ${formatCurrency(roi.current)} | Goal: ${formatCurrency(roi.goal)}`}</p>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                      <div className={`${roiPercentage >= 100 ? 'bg-status-positive' : roiPercentage < 50 ? 'bg-status-warning' : 'bg-status-info'} h-1.5 rounded-full`} style={{ width: `${Math.min(roiPercentage, 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-muted dark:text-slate-400 mb-1">Next Action</p>
                    {nextAction ? (
                      <div className={`flex items-center gap-1.5 text-xs ${isNextActionOverdue ? 'text-status-negative' : 'text-text-base dark:text-slate-200'}`}>
                        {isNextActionOverdue && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                        <span>{nextAction.title} – {new Date(nextAction.dueDate).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted">No upcoming action</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-medium text-text-muted dark:text-slate-400 mb-2">Recent Activity</p>
                  {recentActivity.length > 0 ? (
                    <ul className="space-y-2">
                      {recentActivity.map(activity => (
                        <li key={activity.id} className="flex items-center gap-2 text-xs">
                          {getActivityIcon(activity.icon)}
                          <span className="text-text-muted flex-grow truncate">{activity.action}</span>
                          <span className="text-text-muted/70 shrink-0">{new Date(activity.timestamp).toLocaleDateString()}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-muted">No recent activity</p>
                  )}
                </div>
              </Card>

              <Card title="Client Profile Information" className="bg-transparent shadow-none border-0">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {detailItem("Full Name", client.name)}
                  {detailItem("Company Name", client.companyName)}
                  {detailItem("Email", client.email)}
                  {detailItem("Phone", client.phone)}
                  {detailItem("Website", client.website ? <a href={client.website.startsWith('http') ? client.website : `http://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-premium-accent hover:underline">{client.website}</a> : 'N/A')}
                  {detailItem("Industry", client.industry)}
                  {detailItem("GSTIN", client.gstin)}
                  {detailItem("Date Added", new Date(client.dateAdded).toLocaleDateString())}
                  {detailItem("Address", client.address, "sm:col-span-2 whitespace-pre-wrap")}
                </dl>
                {hasPermission('clients', 'canEdit') && (
                    <Button
                    onClick={() => openModal('CLIENT_FORM', { client })}
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    >
                    Edit Client Details
                    </Button>
                )}
              </Card>
            </div>
          )}

          {activeTab === 'Projects' && (
            <ProjectsView 
              projects={projects}
              clients={[client]}
              teamMembers={teamMembers}
              onOpenProjectFormModal={(project) => openModal('PROJECT_FORM', { project: project, prefillClientId: client.id })}
              onViewProjectDetail={onOpenProjectDetail}
              isEmbedded={true}
              clientId={client.id}
              hasPermission={hasPermission}
              onUpdateProject={onUpdateProject}
              onBatchUpdateProjects={onBatchUpdateProjects}
              onDeleteProject={onDeleteProject}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'Campaigns' && (
            <ClientCampaignsTab
              campaigns={campaigns} 
              client={client}
              appSettings={appSettings}
              onAddCampaign={() => openModal('CAMPAIGN_FORM', { prefillClientId: client.id })}
              onEditCampaign={(camp) => openModal('CAMPAIGN_FORM', { campaign: camp })}
              onOpenReportModal={onOpenCampaignReportModal}
            />
          )}

          {activeTab === 'Campaign Reports' && (
              <ClientCampaignsReportTab campaigns={campaigns} appSettings={appSettings} />
          )}

          {activeTab === 'Invoices' && (
            <InvoicesView
              invoices={invoices} 
              clients={[client]}
              onAddInvoice={() => onOpenInvoiceModal(null, client)}
              onEditInvoice={(inv) => onOpenInvoiceModal(inv, client)}
              onDeleteInvoice={onDeleteInvoice} 
              onUpdateStatus={onUpdateInvoiceStatus}
              onProcessRecurring={() => { alert('Process recurring invoices action (Conceptual)'); }}
              appSettings={appSettings}
              hasPermission={hasPermission}
              onOpenInvoiceBillModal={handleOpenInvoiceBillModal}
              onOpenInvoiceDetailPanel={onOpenInvoiceDetailPanel}
            />
          )}

          {activeTab === 'Marketing Audits' && (
            <MarketingAuditsView
              audits={marketingAudits} 
              clients={[client]}
              onAddAudit={() => onOpenAuditRequestModal(null, client)}
              onEditAudit={(auditReq) => onOpenAuditRequestModal(auditReq, client)}
              onDeleteAudit={(auditId) => { alert(`Delete audit ${auditId} (Conceptual)`); }}
              onViewAuditDetail={onOpenAuditDetailModal}
              hasPermission={hasPermission}
            />
          )}

          {activeTab === 'Notes/Documents' && (
            <div className="space-y-6">
              <Card title="Client Notes" className="bg-transparent shadow-none border-0">
                <TextArea 
                    label="Internal Notes for this Client" 
                    value={client.clientNotes || ''} 
                    rows={6} 
                    readOnly 
                    placeholder="No specific internal notes recorded yet." 
                />
                {hasPermission('clients', 'canEdit') && (
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => openModal('CLIENT_FORM', { client: client })} 
                        className="mt-2">
                        Edit Client Details (incl. Notes)
                    </Button>
                )}
              </Card>
              <Card title="Client Documents" className="bg-transparent shadow-none border-0">
                  <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                      <label htmlFor="client-file-upload" className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">Upload New Document</label>
                      <div className="flex items-center gap-2">
                          <input
                              type="file"
                              id="client-file-upload"
                              onChange={handleFileSelected}
                              className="flex-grow text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-premium-accent-light file:text-premium-accent dark:file:bg-premium-accent-dark/70 dark:file:text-premium-accent-dark hover:file:bg-premium-accent-light/80 file:cursor-pointer"
                          />
                          <Button
                              onClick={handleUploadDocument}
                              disabled={!selectedFile || !hasPermission('clients', 'canEdit')} // Conceptual permission
                              variant="primary"
                              size="sm"
                              leftIcon={<UploadIcon />}
                          >
                              Upload
                          </Button>
                      </div>
                      {selectedFile && <p className="text-xs text-text-muted dark:text-text-muted mt-1">Selected: {selectedFile.name}</p>}
                  </div>

                  {clientDocuments.length > 0 ? (
                      <ul className="space-y-2">
                          {clientDocuments.map(doc => (
                              <li key={doc.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                                  <div className="flex items-center min-w-0">
                                      <FileIcon className="w-5 h-5 text-premium-accent dark:text-premium-accent-dark mr-2 shrink-0"/>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-text-base dark:text-text-base truncate" title={doc.name}>{doc.name}</p>
                                        <p className="text-xs text-text-muted dark:slate-400">
                                            {doc.type} - {formatFileSize(doc.size)} - Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                                        </p>
                                      </div>
                                  </div>
                                  <div className="flex items-center space-x-1 shrink-0 ml-2">
                                      <Button variant="ghost" size="xs" onClick={() => alert(`Conceptual: Download ${doc.name}`)} title="Download Document" className="p-1"><DownloadIcon/></Button>
                                      {hasPermission('clients', 'canEdit') && ( // Conceptual permission
                                        <Button variant="ghost" size="xs" onClick={() => { if (window.confirm(`Delete ${doc.name}?`)) onDeleteClientDocument(doc.id);}} title="Delete Document" className="p-1 text-status-negative"><TrashIcon/></Button>
                                      )}
                                  </div>
                              </li>
                          ))}
                      </ul>
                  ) : (
                      <p className="text-sm text-center text-text-muted dark:slate-400 py-4">No documents uploaded for this client yet.</p>
                  )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </Modal>

    {/* BACKTRACK CONFIRMATION MODAL FOR CLIENTS MODULE */}
    {showBacktrackConfirm && (
      <Modal
        isOpen={showBacktrackConfirm}
        onClose={() => setShowBacktrackConfirm(false)}
        title={
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-450">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" /></svg>
            <h3 className="text-lg font-bold">Backtrack Client to Lead?</h3>
          </div>
        }
        size="md"
        overrideZIndex="z-[2000]"
      >
        <div className="space-y-4 p-4 text-center">
          <p className="text-xs text-text-muted dark:text-slate-350 leading-relaxed text-left">
            You are about to backtrack the client profile <strong>{client.name}</strong> back into an active Lead.
          </p>
          <div className="text-xs text-text-muted dark:text-slate-400 leading-relaxed text-left bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="font-bold text-rose-700 dark:text-rose-450 block text-xs">Actions that will occur:</span>
            <ul className="list-disc pl-4 space-y-1">
              <li>This Client profile will be deleted from the Client list.</li>
              <li>The associated Lead status will revert to <strong className="text-[#001d21] dark:text-[#fcb632]">Negotiation</strong> stage.</li>
              <li>You can continue editing and optimizing the Lead as normal.</li>
            </ul>
          </div>
          <p className="text-xs text-slate-400 italic text-left">This action is safe, reliable, and keeps all historic audit details intact.</p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBacktrackConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white border-transparent cursor-pointer"
              onClick={() => {
                if (onRevertClientToLead) {
                  onRevertClientToLead(client.convertedFromLeadId || "");
                }
                setShowBacktrackConfirm(false);
              }}
            >
              Revert Back to Lead
            </Button>
          </div>
        </div>
      </Modal>
    )}
  </>
  );
};

export default ClientDetailView;
