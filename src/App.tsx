
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lead, Client, Project, Task, Invoice, Expense, TeamMember, AppSettings, 
  View, FeatureKey, PermissionAction, ActivityLogItem, 
  MarketingAuditRequest, Proposal, OnboardingKickoffData,
  Campaign, EmailMessage, ChatContact, ChatMessage, LeaveRequest,
  DailyAttendanceRecord, PerformanceReview, HRDocument, PayrollRecord, RoleDefinition,
  ApiKey, Webhook, EmailTemplate, CustomField, TimeLog, SavedTaskView, AppNotification, ClientDocument, InvoiceStatus,
  AuditRecord, SOP, BackupData, Audit, ModalType
} from './types';
import { load, save, KEYS, validateBackupFile, importData as processImportData, exportData, repairStorage } from './storage';
import { getDefaultRolePermissions } from './constants';
import LoginPage from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DashboardView } from './components/views/DashboardView';
import { LeadsView } from './components/views/LeadsView';
import { ClientsView } from './components/views/ClientsView';
import ClientDetailView from './components/views/ClientDetailView';
import LeadDetailView from './components/views/LeadDetailView';
import { ProjectDetailView } from './components/views/ProjectDetailView';
import { ProjectsView } from './components/views/ProjectsView';
import { TasksView } from './components/views/TasksView';
import { FinanceView } from './components/views/FinanceView';
import { HRModuleView } from './components/views/hr_module/HRModuleView';
import { CalendarView } from './components/views/CalendarView';
import { SettingsView } from './components/views/SettingsView';
import { UserProfileView } from './components/views/UserProfileView';
import { CommunicationView } from './components/views/CommunicationView';
import { OnboardingView } from './components/views/OnboardingView'; 
import { MyTasksView } from './components/views/MyTasksView';
import { SOPLibraryView } from './components/views/SOPLibraryView';
import { AuditsView } from './components/views/AuditsView';
import { ToolsView } from './components/views/ToolsView';
import { IntegrationsView } from './components/views/IntegrationsView';
import { ClientFormModal } from './components/modals/ClientFormModal';
import { ProjectFormModal } from './components/modals/ProjectFormModal';
import { LeadFormModal } from './components/modals/LeadFormModal';
import { InvoiceFormModal } from './components/modals/InvoiceFormModal';
import { ExpenseFormModal } from './components/modals/ExpenseFormModal';
import { TaskFormModal } from './components/modals/TaskFormModal';
import { AuditReportModal } from './components/modals/AuditReportModal';
import { AuditFormModal } from './components/modals/AuditFormModal';
import { AuditRequestFormModal } from './components/modals/AuditRequestFormModal';
import { CampaignFormModal } from './components/modals/CampaignFormModal';
import { EmailComposeModal } from './components/modals/EmailComposeModal';
import { ViewEmailModal } from './components/modals/ViewEmailModal';
import { SendInvoiceModal } from './components/modals/SendInvoiceModal';
import { PaymentFormModal } from './components/modals/PaymentFormModal';
import { InvoiceBillModal } from './components/modals/InvoiceBillModal';
import { FollowUpFormModal } from './components/modals/FollowUpFormModal';
import { TeamActionModal } from './components/modals/TeamActionModal';
import { MarkAttendanceModal } from './components/modals/hr_module/MarkAttendanceModal';
import { ApproveLeavesModal } from './components/modals/hr_module/ApproveLeavesModal';
import { UploadHRDocumentModal } from './components/modals/hr_module/UploadHRDocumentModal';
import { ScheduleExitInterviewModal } from './components/modals/hr_module/ScheduleExitInterviewModal';
import { OnboardingChecklistModal } from './components/modals/hr_module/OnboardingChecklistModal';
import { ExitChecklistModal } from './components/modals/hr_module/ExitChecklistModal';
import { PayslipModal } from './components/modals/hr_module/PayslipModal';
import { ProcessSalaryModal } from './components/modals/hr_module/ProcessSalaryModal';
import { PerformanceReviewModal } from './components/modals/hr_module/PerformanceReviewModal';
import { TeamMemberHRDetailModal } from './components/modals/hr_module/TeamMemberHRDetailModal';
import { TeamMemberHRFormModal } from './components/modals/tmr_module/TeamMemberHRFormModal';
import { ProposalFormModal } from './components/modals/ProposalFormModal';
import { CustomFieldFormModal } from './components/modals/CustomFieldFormModal';
import { KickoffFormModal } from './components/modals/KickoffFormModal';
import { SendProposalModal } from './components/modals/SendProposalModal';
import { CampaignReportModal } from './components/modals/CampaignReportModal';
import { CalendarEventDetailModal } from './components/modals/CalendarEventDetailModal';
import { TimeLogFormModal } from './components/modals/TimeLogFormModal';
import { ImportConfirmationModal } from './components/modals/ImportConfirmationModal';
import { SOPFormModal } from './components/modals/SOPFormModal';
import { ClientReportModal } from './components/modals/ClientReportModal';

import { ToastContainer } from './components/common/ToastContainer';
import { useToast } from './hooks/useToast';
import { ToastData } from './types';

// Detail Panels
import { InvoiceDetailPanel } from './components/panels/InvoiceDetailPanel';
import { ProposalDetailPanel } from './components/panels/ProposalDetailPanel';
import { CreateProposalPanel } from './components/panels/CreateProposalPanel';
import { ProjectsDrawer } from './components/drawers/ProjectsDrawer';

// Selectors & Utils
import { getAllTasks } from './selectors/tasksSelectors';
import { useCrossTabSync } from './hooks/useCrossTabSync';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useReminders } from './hooks/useReminders';
import { useDiagnostics } from './hooks/useDiagnostics';
import { UrlErrorBanner } from './components/common/UrlErrorBanner';

export const App: React.FC = () => {
    // --- State Management ---
    const [currentUser, setCurrentUser] = useState<TeamMember | null>(() => load(KEYS.currentUser, null));
    const [currentView, setCurrentView] = useState<View>('DASHBOARD');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<'light'|'dark'>(() => load(KEYS.theme, 'light') as 'light'|'dark');
    
    const { toasts, addToast, removeToast } = useToast();
    
    // --- CORE DATA & UNDO/REDO HOOKS ---
    const { state: leads, set: setLeads } = useUndoRedo<Lead>(KEYS.leads, load(KEYS.leads, []), addToast);
    const { state: clients, set: setClients } = useUndoRedo<Client>(KEYS.clients, load(KEYS.clients, []), addToast);
    const { state: projects, set: setProjects } = useUndoRedo<Project>(KEYS.projects, load(KEYS.projects, []), addToast);
    const { state: tasks, set: setTasks } = useUndoRedo<Task>(KEYS.tasks, load(KEYS.tasks, []), addToast);
    
    // --- STANDARD STATE (No Undo/Redo yet) ---
    const [invoices, setInvoices] = useState<Invoice[]>(() => load(KEYS.invoices, []));
    const [expenses, setExpenses] = useState<Expense[]>(() => load(KEYS.expenses, []));
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => load(KEYS.teamMembers, []));
    const [marketingAudits, setMarketingAudits] = useState<MarketingAuditRequest[]>(() => load(KEYS.marketingAudits, []));
    const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(() => load(KEYS.auditRecords, []));
    const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>(() => load(KEYS.clientDocuments, []));
    const [campaigns, setCampaigns] = useState<Campaign[]>(() => load(KEYS.campaigns, []));
    const [proposals, setProposals] = useState<Proposal[]>(() => load(KEYS.proposals, []));
    const [onboardingKickoffData, setOnboardingKickoffData] = useState<OnboardingKickoffData[]>(() => load(KEYS.onboardingKickoffData, []));
    const [emails, setEmails] = useState<EmailMessage[]>(() => load(KEYS.emails, []));
    const [chatContacts, setChatContacts] = useState<ChatContact[]>(() => load(KEYS.chatContacts, []));
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => load(KEYS.chatMessages, []));
    const [activeCommunicationTab, setActiveCommunicationTab] = useState<'email' | 'chat'>('email');
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => load(KEYS.leaveRequests, []));
    const [dailyAttendanceRecords, setDailyAttendanceRecords] = useState<DailyAttendanceRecord[]>(() => load(KEYS.dailyAttendanceRecords, []));
    const [hrDocuments, setHrDocuments] = useState<HRDocument[]>(() => load(KEYS.hrDocuments, []));
    const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => load(KEYS.payrollRecords, []));
    const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>(() => load(KEYS.performanceReviews, []));
    const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>(() => load(KEYS.roleDefinitions, []));
    const [customFields, setCustomFields] = useState<CustomField[]>(() => load(KEYS.customFields, []));
    const [notifications, setNotifications] = useState<AppNotification[]>(() => load(KEYS.notifications, []));
    const [sops, setSops] = useState<SOP[]>(() => load(KEYS.sops, []));
    const [audits, setAudits] = useState<Audit[]>(() => load(KEYS.audits, []));
    const [activityHistory, setActivityHistory] = useState<ActivityLogItem[]>(() => load(KEYS.activityHistory, []));

    const [appSettings, setAppSettings] = useState<AppSettings>(() => load(KEYS.appSettings, { 
        agencyName: 'My Agency', 
        defaultCurrency: 'USD', 
        leadsModule: { isEnabled: true, enableAutoReminders: true, enableNewItemNotifications: true, dataRetentionDays: 365 },
        security: { twoFactorEnabled: false, sessionTimeoutMinutes: 60 }
    }));
    
    // Detail View States
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [activeModal, setActiveModal] = useState<{type: ModalType, props?: any} | null>(null);
    const [activePanel, setActivePanel] = useState<{ type: string, props?: any } | null>(null);
    const [projectsDrawerConfig, setProjectsDrawerConfig] = useState<{ clientId?: string, projectId?: string, mode?: 'view' | 'create' } | null>(null);
    
    // Navigation state for Audit module pre-filling
    const [auditPrefillData, setAuditPrefillData] = useState<any>(null);


    // --- URL Error Handling ---
    const [urlError, setUrlError] = useState<string | null>(null);
    useEffect(() => {
        window.addEventListener('error', (e: ErrorEvent) => {
            if (e.message && /Loading chunk [\d]+ failed/.test(e.message)) {
                setUrlError("A new version of the app is available. Please reload.");
            }
        });
    }, []);

    // --- Cross-Tab Sync ---
    useCrossTabSync({
        stateSetters: {
            leads: (val) => setLeads(val, { type: 'batch', description: 'Synced from other tab', payload: {} }), 
            clients: (val) => setClients(val, { type: 'batch', description: 'Synced from other tab', payload: {} }),
            projects: (val) => setProjects(val, { type: 'batch', description: 'Synced from other tab', payload: {} }),
            tasks: (val) => setTasks(val, { type: 'batch', description: 'Synced from other tab', payload: {} }),
            invoices: setInvoices,
            expenses: setExpenses,
            teamMembers: setTeamMembers,
            audits: setAudits,
        },
        showToast: addToast
    });
    
    // --- Diagnostics & Reminders ---
    const [catchUpTrigger, setCatchUpTrigger] = useState(0);
    const { isReminderOnCooldown } = useDiagnostics(() => setCatchUpTrigger(p => p + 1));

    // --- Seed Data Effect ---
    useEffect(() => {
        let newRoleDefinitions = [...roleDefinitions];
        let newTeamMembers = [...teamMembers];
        
        // 1. Seed Roles
        if (newRoleDefinitions.length === 0) {
            const defaultPermissions = getDefaultRolePermissions();
            newRoleDefinitions = [
                {
                    id: 'role-admin',
                    name: 'Admin',
                    description: 'Full system access',
                    isSystemRole: true,
                    permissions: defaultPermissions.map(p => ({
                        ...p,
                        currentPermissions: Object.keys(p.currentPermissions).reduce((acc, key) => ({ ...acc, [key]: true }), {})
                    }))
                },
                {
                    id: 'role-member',
                    name: 'Member',
                    description: 'Standard access',
                    isSystemRole: true,
                    permissions: defaultPermissions
                }
            ];
            setRoleDefinitions(newRoleDefinitions);
        }

        // 2. Seed Team Member
        if (newTeamMembers.length === 0) {
            const adminRoleId = newRoleDefinitions.find(r => r.name === 'Admin')?.id || 'role-admin';
            const defaultUser: TeamMember = {
                id: 'u-1',
                name: 'Founder',
                email: 'founder@agency.com',
                role: 'Admin',
                roleId: adminRoleId,
                dateJoined: new Date().toISOString(),
                hrStatus: 'Active',
                jobTitle: 'CEO',
                profilePictureUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                monthlySalary: 150000,
                department: 'Management'
            };
            const secondUser: TeamMember = {
                id: 'u-2',
                name: 'Sarah Creative',
                email: 'sarah@agency.com',
                role: 'Member',
                roleId: newRoleDefinitions.find(r => r.name === 'Member')?.id || 'role-member',
                dateJoined: new Date(Date.now() - 90 * 86400000).toISOString(),
                hrStatus: 'Active',
                jobTitle: 'Senior Designer',
                profilePictureUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                monthlySalary: 80000,
                department: 'Design'
            };
            newTeamMembers = [defaultUser, secondUser];
            setTeamMembers(newTeamMembers);
        }

        // 3. Seed Clients
        if (clients.length === 0) {
            const demoClients: Client[] = [
                {
                    id: 'c-1', name: 'Apex Innovations', companyName: 'Apex Innovations Ltd', email: 'contact@apexinnovations.com', phone: '555-0101', website: 'www.apexinnovations.com',
                    industry: 'Technology', dateAdded: new Date().toISOString(), healthStatus: 'Active',
                    roi: { current: 120000, goal: 80000 }, nextAction: { title: 'Quarterly Review', dueDate: new Date(Date.now() + 7 * 86400000).toISOString() },
                    recentActivity: [{ id: 'act-c1-1', action: 'Project Started', timestamp: new Date().toISOString(), icon: 'campaign' }],
                    tags: ['Enterprise', 'High Priority']
                },
                {
                    id: 'c-2', name: 'Bloom Lifestyle', companyName: 'Bloom Lifestyle Co', email: 'hello@bloomlife.com', phone: '555-0202', website: 'www.bloomlife.com',
                    industry: 'Retail', dateAdded: new Date().toISOString(), healthStatus: 'Healthy',
                    roi: { current: 45000, goal: 50000 }, nextAction: { title: 'Approve Creatives', dueDate: new Date(Date.now() + 2 * 86400000).toISOString() },
                    recentActivity: [{ id: 'act-c2-1', action: 'Invoice Paid', timestamp: new Date().toISOString(), icon: 'payment' }],
                    tags: ['E-commerce']
                }
            ];
            setClients(demoClients, { type: 'batch', description: 'Seeded Demo Clients', payload: {} });
        }

        // 4. Seed Leads
        if (leads.length === 0) {
             const demoLeads: Lead[] = [
                {
                    id: 'l-1', name: 'John Connor', companyName: 'Skynet Systems', email: 'john@skynet.com', phone: '555-1010',
                    status: 'New Lead', dateAdded: new Date().toISOString(), hasDigitalPresence: true, source: 'LinkedIn Outreach',
                    estimatedBudget: '₹1,00,000 - ₹2,00,000', serviceInterest: ['SEO', 'Web Dev'],
                    followUpHistory: [], emailHistory: [], manualCompletionMarkers: {},
                    nextFollowUpDateTime: new Date(Date.now() + 86400000).toISOString(),
                    primaryGoal: 'Reduce overall CPA and generate high-intent enterprise security leads.',
                    keyCompetitors: 'Cyberdyne Inc, Hanson Robotics, Boston Dynamics',
                    marketingChannels: ['Google Ads', 'LinkedIn PPC', 'SEO Content Strategy'],
                    targetAudience: 'Enterprise IT directors, security specialists, CTOs looking for high-grade network protections.',
                    brandTone: 'Sober, militaristic, technical, authority-driven and highly technical.',
                    trackingHealth: 'Issues Detected',
                    adLibraryLink: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL'
                },
                {
                    id: 'l-2', name: 'Elena Fisher', companyName: 'Uncharted Travels', email: 'elena@uncharted.com', phone: '555-2020',
                    status: 'Negotiation', dateAdded: new Date(Date.now() - 7 * 86400000).toISOString(), hasDigitalPresence: true, source: 'Referral',
                    estimatedBudget: '₹50,000 - ₹80,000', serviceInterest: ['Social Media'],
                    followUpHistory: [{id: 'f-1', note: 'Sent proposal', timestamp: new Date().toISOString(), addedByUserId: 'u-1', addedByUserName: 'Founder', nextFollowUpDateTime: new Date().toISOString()}], 
                    emailHistory: [], manualCompletionMarkers: {},
                    primaryGoal: 'Scale high-ticket luxury tour bookings via social video content & paid TikTok ads.',
                    keyCompetitors: 'NatGeo Expeditions, G Adventures, Abercrombie & Kent',
                    marketingChannels: ['Instagram Organic', 'TikTok PPC', 'Klaviyo Email Retargeting'],
                    targetAudience: 'Affluent solo travelers, archaeology enthusiasts, premium outdoor adventure-seekers.',
                    brandTone: 'Inspiring, educational, rugged but refined cinematic storytelling.',
                    trackingHealth: 'Verified',
                    adLibraryLink: 'https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL'
                }
            ];
            setLeads(demoLeads, { type: 'batch', description: 'Seeded Demo Leads', payload: {} });
        }

        // 5. Seed Projects & Tasks
        if (projects.length === 0) {
            const demoProjects: Project[] = [
                {
                    id: 'p-1', name: 'Website Redesign', projectCode: 'WEB-001', clientId: 'c-1', clientName: 'Apex Innovations',
                    type: 'Web Development', status: 'In Progress', priority: 'High', health: 'On Track',
                    managerId: 'u-1', teamIds: ['u-1', 'u-2'], billingModel: 'Fixed',
                    startDate: new Date().toISOString(), dateAdded: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                    milestones: [], connectors: {},
                    tasks: [
                        { id: 't-1', title: 'Design Homepage', status: 'Done', priority: 'High', assignedMemberId: 'u-2', completed: true, projectId: 'p-1' },
                        { id: 't-2', title: 'Develop Frontend', status: 'In Progress', priority: 'High', assignedMemberId: 'u-1', completed: false, projectId: 'p-1', dueDate: new Date(Date.now() + 3 * 86400000).toISOString() }
                    ]
                },
                {
                    id: 'p-2', name: 'Q3 Social Media', projectCode: 'SOC-002', clientId: 'c-2', clientName: 'Bloom Lifestyle',
                    type: 'Marketing', status: 'Backlog', priority: 'Medium', health: 'At Risk',
                    managerId: 'u-2', teamIds: ['u-2'], billingModel: 'Retainer',
                    startDate: new Date().toISOString(), dateAdded: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                    milestones: [], connectors: {},
                    tasks: [
                        { id: 't-3', title: 'Content Calendar', status: 'To Do', priority: 'Medium', assignedMemberId: 'u-2', completed: false, projectId: 'p-2', dueDate: new Date(Date.now() + 5 * 86400000).toISOString() }
                    ]
                }
            ];
            setProjects(demoProjects, { type: 'batch', description: 'Seeded Demo Projects', payload: {} });
            
            if (tasks.length === 0) {
                setTasks([
                    { id: 't-g1', title: 'Weekly Team Sync', status: 'To Do', priority: 'Medium', assignedMemberId: 'u-1', completed: false, dueDate: new Date().toISOString() }
                ], { type: 'create', description: 'Seeded Global Task', payload: {} });
            }
        }

        // 6. Seed Finance
        if (invoices.length === 0) {
             setInvoices([
                { id: 'inv-1', invoiceNumber: 'INV-001', clientId: 'c-1', clientName: 'Apex Innovations', issueDate: new Date(Date.now() - 15*86400000).toISOString(), dueDate: new Date(Date.now() - 5*86400000).toISOString(), status: 'Paid', items: [{id: 'i-1', description: 'Web Design Fee', quantity: 1, unitPrice: 50000}], taxRate: 18 },
                { id: 'inv-2', invoiceNumber: 'INV-002', clientId: 'c-2', clientName: 'Bloom Lifestyle', issueDate: new Date().toISOString(), dueDate: new Date(Date.now() + 10*86400000).toISOString(), status: 'Sent', items: [{id: 'i-2', description: 'Social Media Retainer', quantity: 1, unitPrice: 25000}], taxRate: 18 }
             ]);
        }
        if (expenses.length === 0) {
            setExpenses([
                { id: 'exp-1', date: new Date().toISOString(), category: 'Software/Tools', description: 'Adobe Creative Cloud', amount: 4200, vendor: 'Adobe' },
                { id: 'exp-2', date: new Date().toISOString(), category: 'Office Supplies', description: 'Stationery', amount: 1500, vendor: 'Local Store' }
            ]);
        }

        // 7. Seed Campaigns
        if (campaigns.length === 0) {
            setCampaigns([
                {
                    id: 'camp-1', name: 'Summer Sale Search', clientId: 'c-2', clientName: 'Bloom Lifestyle', platform: 'GoogleAds', status: 'Active',
                    startDate: new Date().toISOString(), totalBudget: 50000, actualSpend: 12000,
                    chartData: { spendVsBudget: { budget: 50000, spent: 12000 }, performanceTrend: { metricName: 'Revenue', data: [] } },
                    kpis: { roas: 4.5, conversions: 120, cpa: 100, ctr: 2.5 }
                }
            ]);
        }

        // 8. Seed Communication
        if (emails.length === 0) {
            setEmails([
                { id: 'em-1', senderName: 'John Connor', senderEmail: 'john@skynet.com', recipientEmail: 'founder@agency.com', subject: 'Project Inquiry', body: 'Hi, I would like to discuss a new project.', timestamp: new Date().toISOString(), folder: 'inbox', isRead: false }
            ]);
        }
        if (chatContacts.length === 0) {
            setChatContacts([
                { id: 'u-2', name: 'Sarah Creative', profilePictureUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', lastMessage: 'Hey, check the new designs!', lastMessageTimestamp: new Date().toISOString(), isOnline: true, unreadCount: 1 }
            ]);
            setChatMessages([
                { id: 'msg-1', contactId: 'u-2', senderId: 'u-2', text: 'Hey, check the new designs!', timestamp: new Date().toISOString(), status: 'delivered' }
            ]);
        }

        // 9. Seed HR Data
        if (leaveRequests.length === 0) {
            setLeaveRequests([
                { id: 'lr-1', memberId: 'u-2', memberName: 'Sarah Creative', leaveType: 'Sick', startDate: new Date().toISOString(), endDate: new Date().toISOString(), reason: 'Not feeling well', status: 'Pending', requestedDate: new Date().toISOString() }
            ]);
        }
        if (dailyAttendanceRecords.length === 0) {
            setDailyAttendanceRecords([
                { id: 'att-today', date: new Date().toISOString().split('T')[0], entries: [{ memberId: 'u-1', status: 'Present', checkInTime: '09:00' }, { memberId: 'u-2', status: 'Present', checkInTime: '09:15' }] }
            ]);
        }

        // 10. Seed Audits
        if (audits.length === 0) {
             const demoAudits: Audit[] = [
                {
                  id: "audit-1",
                  title: "Q4 Growth Audit",
                  entityType: "Client",
                  entityId: "c-1",
                  entityName: "Apex Innovations",
                  status: "Completed",
                  score: 85,
                  dateCreated: new Date(Date.now() - 5*86400000).toISOString(),
                  tags: ["Growth", "Q4"],
                  notes: "Strong technical foundation, needs more content velocity."
                }
              ];
              setAudits(demoAudits);
        }
        
        // 11. Seed SOPs (Ensure SOPs exist)
        if (sops.length === 0) {
             const demoSops: SOP[] = [
                {
                    id: "sop1",
                    title: "Audit Creation SOP",
                    category: "Audit",
                    description: "How to perform a full D2C audit using our 12-step framework.",
                    steps: ["Collect brand assets", "Review website", "Check funnels", "Document issues"],
                    updatedAt: new Date().toISOString()
                },
                {
                    id: "sop2",
                    title: "Creative Testing SOP",
                    category: "Creative",
                    description: "Our 3x3x3 creative testing method to find winning ads.",
                    steps: ["Brainstorm hooks", "Generate variants", "Launch tests", "Analyze results"],
                    updatedAt: new Date().toISOString()
                }
            ];
            setSops(demoSops);
        }
    }, []);

    // Save effects (Standard)
    useEffect(() => save(KEYS.invoices, invoices), [invoices]);
    useEffect(() => save(KEYS.expenses, expenses), [expenses]);
    useEffect(() => save(KEYS.emails, emails), [emails]);
    useEffect(() => save(KEYS.chatContacts, chatContacts), [chatContacts]);
    useEffect(() => save(KEYS.chatMessages, chatMessages), [chatMessages]);
    useEffect(() => save(KEYS.leaveRequests, leaveRequests), [leaveRequests]);
    useEffect(() => save(KEYS.dailyAttendanceRecords, dailyAttendanceRecords), [dailyAttendanceRecords]);
    useEffect(() => save(KEYS.hrDocuments, hrDocuments), [hrDocuments]);
    useEffect(() => save(KEYS.payrollRecords, payrollRecords), [payrollRecords]);
    useEffect(() => save(KEYS.performanceReviews, performanceReviews), [performanceReviews]);
    useEffect(() => save(KEYS.customFields, customFields), [customFields]);
    useEffect(() => save(KEYS.auditRecords, auditRecords), [auditRecords]);
    useEffect(() => save(KEYS.teamMembers, teamMembers), [teamMembers]);
    useEffect(() => save(KEYS.roleDefinitions, roleDefinitions), [roleDefinitions]);
    useEffect(() => save(KEYS.notifications, notifications), [notifications]);
    useEffect(() => save(KEYS.sops, sops), [sops]);
    useEffect(() => save(KEYS.audits, audits), [audits]);
    useEffect(() => save(KEYS.currentUser, currentUser), [currentUser]);
    useEffect(() => save(KEYS.appSettings, appSettings), [appSettings]);
    useEffect(() => save(KEYS.activityHistory, activityHistory), [activityHistory]);

    // Auth Handler
    const handleLogin = (email: string) => {
        const user = teamMembers.find(u => u.email === email);
        if (user) {
            setCurrentUser(user);
            save(KEYS.lastUser, {
                email: user.email,
                name: user.name,
                profilePictureUrl: user.profilePictureUrl,
            });
            return true;
        }
        return false;
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };

    const handleUpdateProfile = async (updatedData: Partial<TeamMember>, oldPassword?: string) => {
        if (currentUser) {
            const updatedUser = { ...currentUser, ...updatedData };
            setCurrentUser(updatedUser);
            setTeamMembers(prev => prev.map(m => m.id === currentUser.id ? updatedUser : m));
            save(KEYS.lastUser, {
                email: updatedUser.email,
                name: updatedUser.name,
                profilePictureUrl: updatedUser.profilePictureUrl
            });
            return true;
        }
        return false;
    };

    const handleUpdateProfilePicture = async (file: File) => {
        return new Promise<boolean>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                if (currentUser) {
                    const updatedUser = { ...currentUser, profilePictureUrl: dataUrl };
                    setCurrentUser(updatedUser);
                    setTeamMembers(prev => prev.map(m => m.id === currentUser.id ? updatedUser : m));
                    save(KEYS.lastUser, {
                        email: updatedUser.email,
                        name: updatedUser.name,
                        profilePictureUrl: updatedUser.profilePictureUrl
                    });
                    resolve(true);
                } else {
                    resolve(false);
                }
            };
            reader.onerror = () => {
                resolve(false);
            };
            reader.readAsDataURL(file);
        });
    };

    // Theme Handler
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        save(KEYS.theme, newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };
    
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);


    const hasPermission = (feature: FeatureKey, action: PermissionAction) => true;

    // Modal Manager Handlers
    const openModal = (type: ModalType, props?: any) => {
        setActiveModal({ type, props });
    };

    const closeModal = () => {
        setActiveModal(null);
    };
    
    const handleClientDetailClose = () => {
        setSelectedClient(null);
    };

    const handleProjectDetailClose = () => {
        setSelectedProject(null);
    };
    
    const handleLeadDetailClose = () => {
        setSelectedLead(null);
    };
    
    const closePanel = () => {
        setActivePanel(null);
    };
    
    // Handler for direct Audit navigation from Leads
    const handleNavigateToAuditCreate = (data: { type: 'Lead' | 'Client', id: string, name: string }) => {
        setAuditPrefillData(data);
        setCurrentView('AUDITS');
    };


    // Data Handlers (Modified to use Undo/Redo setters where applicable)
    const handleSaveClient = (client: Client) => {
        const exists = clients.find(c => c.id === client.id);
        if (exists) {
            setClients(clients.map(c => c.id === client.id ? client : c), { type: 'update', payload: { old: exists, new: client }, description: `Updated client "${client.name}"` });
        } else {
            setClients([client, ...clients], { type: 'create', payload: client, description: `Created client "${client.name}"` });
        }
        if(selectedClient && selectedClient.id === client.id) setSelectedClient(client);
        closeModal();
    };
    
    const handleSaveProject = (project: Project) => {
         const exists = projects.find(p => p.id === project.id);
         const projectWithId = { ...project, id: project.id || `proj-${Date.now()}` };

         if (exists) {
             setProjects(projects.map(p => p.id === projectWithId.id ? projectWithId : p), { type: 'update', payload: { old: exists, new: projectWithId }, description: `Updated project "${project.name}"` });
         } else {
             setProjects([projectWithId, ...projects], { type: 'create', payload: projectWithId, description: `Created project "${project.name}"` });
         }
        if(selectedProject && selectedProject.id === projectWithId.id) setSelectedProject(projectWithId);
        closeModal();
    }
    
     const handleSaveCampaign = (campaign: Campaign) => {
        setCampaigns(prev => {
             const exists = prev.find(c => c.id === campaign.id);
             if (exists) return prev.map(c => c.id === campaign.id ? campaign : c);
             return [campaign, ...prev];
        });
        closeModal();
    }
    
    const handleSaveInvoice = (invoice: Invoice) => {
        setInvoices(prev => {
             const exists = prev.find(i => i.id === invoice.id);
             const invoiceWithId = { ...invoice, id: invoice.id || `inv-${Date.now()}` };
             
             if (exists) return prev.map(i => i.id === invoiceWithId.id ? invoiceWithId : i);
             return [invoiceWithId, ...prev];
        });
        closeModal();
    }

    const handleDeleteInvoice = (invoiceId: string) => {
        setInvoices(prev => prev.filter(i => i.id !== invoiceId));
    };

    const handleSaveExpense = (expense: Expense) => {
        setExpenses(prev => {
            const exists = prev.find(e => e.id === expense.id);
            const expenseWithId = { ...expense, id: expense.id || `exp-${Date.now()}` };
            
            if (exists) return prev.map(e => e.id === expenseWithId.id ? expenseWithId : e);
            return [...prev, expenseWithId];
        });
        closeModal();
    };
    
    const handleDeleteExpense = (expenseId: string) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
    };
    
    const handleSaveAudit = (audit: MarketingAuditRequest) => {
        setMarketingAudits(prev => {
             const exists = prev.find(a => a.id === audit.id);
             if (exists) return prev.map(a => a.id === audit.id ? audit : a);
             return [audit, ...prev];
        });
        closeModal();
    }
    
    const handleSaveAuditRecord = (auditData: AuditRecord, leadId: string) => {
         setAuditRecords(prev => {
             const exists = prev.find(a => a.id === auditData.id);
             if (exists) return prev.map(a => a.id === auditData.id ? auditData : a);
             return [auditData, ...prev];
        });
        // Update lead with auditRecordId
         const lead = leads.find(l => l.id === leadId);
         if (lead) {
             const updatedLead = { ...lead, auditRecordId: auditData.id, status: 'Audit Complete' as const };
             setLeads(leads.map(l => l.id === leadId ? updatedLead : l), { type: 'update', payload: { old: lead, new: updatedLead }, description: `Updated lead status to Audit Complete` });
         }
         closeModal();
    };

    const handleSaveTask = (task: Task) => {
         const exists = tasks.find(t => t.id === task.id);
         if(exists) {
             setTasks(tasks.map(t => t.id === task.id ? task : t), { type: 'update', payload: { old: exists, new: task }, description: `Updated task "${task.title}"` });
         } else {
             setTasks([task, ...tasks], { type: 'create', payload: task, description: `Created task "${task.title}"` });
         }
         
         // Also update tasks embedded in projects for data consistency (Simplified: assuming task form handles global/project link)
         if(task.projectId) {
             const project = projects.find(p => p.id === task.projectId);
             if (project) {
                 const taskExists = project.tasks.some(t => t.id === task.id);
                 const updatedTasks = taskExists ? project.tasks.map(t => t.id === task.id ? task : t) : [...project.tasks, task];
                 const updatedProject = { ...project, tasks: updatedTasks };
                 setProjects(projects.map(p => p.id === project.id ? updatedProject : p), { type: 'update', payload: { old: project, new: updatedProject }, description: `Updated project tasks` });
                 if(selectedProject && selectedProject.id === project.id) setSelectedProject(updatedProject);
             }
         }
         closeModal();
    }
    
    const handleBatchUpdateProjects = (updatedProjects: Project[]) => {
        setProjects(updatedProjects, { type: 'batch', payload: {}, description: 'Batch updated projects' });
    };

    const handleSendMessage = (contactId: string, text: string) => {
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            contactId,
            senderId: 'me',
            text,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };
        setChatMessages(prev => [...prev, newMessage]);
        setChatContacts(prev => prev.map(c => c.id === contactId ? { ...c, lastMessage: text, lastMessageTimestamp: newMessage.timestamp } : c));
    };

    const handleSaveEmail = async (emailData: Partial<EmailMessage>, action: 'send' | 'draft') => {
        const newEmail: EmailMessage = {
            ...emailData,
            id: emailData.id || `email-${Date.now()}`,
            senderName: currentUser?.name || 'Unknown',
            timestamp: new Date().toISOString(),
            folder: action === 'send' ? 'sent' : 'drafts',
            isRead: true
        } as EmailMessage;
        setEmails(prev => [newEmail, ...prev]);
        return true;
    };
    
    const handleSaveLeaveRequest = (request: LeaveRequest) => {
        setLeaveRequests(prev => {
            const exists = prev.find(r => r.id === request.id);
            if (exists) return prev.map(r => r.id === request.id ? request : r);
            return [request, ...prev];
        });
        closeModal();
    }
    
    const handleSaveHRDocument = (docData: Omit<HRDocument, 'id' | 'uploadedByUserId' | 'uploadedByUserName'>) => {
        const newDoc: HRDocument = {
            ...docData,
            id: `hrdoc-${Date.now()}`,
            uploadedByUserId: currentUser?.id || '',
            uploadedByUserName: currentUser?.name || '',
        };
        setHrDocuments(prev => [...prev, newDoc]);
        closeModal();
    };

    const handleSavePerformanceReview = (review: PerformanceReview) => {
        setPerformanceReviews(prev => {
            const exists = prev.find(r => r.id === review.id);
            if (exists) return prev.map(r => r.id === review.id ? review : r);
            return [review, ...prev];
        });
        closeModal();
    };
    
    const handleSaveProposal = (proposalData: Partial<Proposal>) => {
         setProposals(prev => {
            if (proposalData.id) {
                 return prev.map(p => p.id === proposalData.id ? { ...p, ...proposalData } as Proposal : p);
            }
            return [...prev, { ...proposalData, id: `prop-${Date.now()}`, proposalNumber: `PROP-${Date.now()}`, version: 1, generatedDate: new Date().toISOString(), lastUpdatedDate: new Date().toISOString() } as Proposal];
         });
         closeModal();
         if(activePanel?.type === 'CREATE_PROPOSAL') closePanel();
    };
    
    const handleSaveSOP = (sop: SOP) => {
        setSops(prev => {
            const exists = prev.find(s => s.id === sop.id);
            if (exists) return prev.map(s => s.id === sop.id ? sop : s);
            return [sop, ...prev];
        });
        closeModal();
    };

    const handleSaveNewAudit = (audit: Audit) => {
        setAudits(prev => {
            const exists = prev.find(a => a.id === audit.id);
            if (exists) return prev.map(a => a.id === audit.id ? audit : a);
            return [audit, ...prev];
        });
    };

    const handleSaveCustomField = (field: CustomField) => {
        setCustomFields(prev => {
            const exists = prev.find(f => f.id === field.id);
            if (exists) return prev.map(f => f.id === field.id ? field : f);
            return [...prev, { ...field, id: `cf-${Date.now()}` }];
        });
        closeModal();
    };

    const handleDeleteCustomField = (fieldId: string) => {
        setCustomFields(prev => prev.filter(f => f.id !== fieldId));
    };
    
    const handleToast = (options: ToastData) => {
      addToast(options);
    };

    const handleExportData = () => {
        const dataToExport: Omit<BackupData, 'version'> = {
            appSettings, clients, invoices, leads, projects, tasks, teamMembers, expenses, payments: [], activityHistory,
            auditRecords, marketingAudits, proposals, clientDocuments, onboardingKickoffData, campaigns,
            integrationPlatforms: [], emails, chatContacts, chatMessages, leaveRequests, dailyAttendanceRecords,
            performanceReviews, hrDocuments, payrollRecords, roleDefinitions, apiKeys: [], webhooks: [],
            emailTemplates: [], customFields, timeLogs: [], savedViews: [], notifications, sops, audits
        };
        const jsonString = exportData(dataToExport);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `crm_backup_${new Date().toISOString()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportData = (jsonString: string) => {
        const result = validateBackupFile(jsonString);
        if ('error' in result) {
            alert(result.error);
            return;
        }
        openModal('IMPORT_CONFIRMATION', {
            summary: result.summary,
            onConfirmImport: (mode: 'replace' | 'merge') => {
                const currentData: Omit<BackupData, 'version'> = {
                    appSettings, clients, invoices, leads, projects, tasks, teamMembers, expenses, payments: [], activityHistory,
                    auditRecords, marketingAudits, proposals, clientDocuments, onboardingKickoffData, campaigns,
                    integrationPlatforms: [], emails, chatContacts, chatMessages, leaveRequests, dailyAttendanceRecords,
                    performanceReviews, hrDocuments, payrollRecords, roleDefinitions, apiKeys: [], webhooks: [],
                    emailTemplates: [], customFields, timeLogs: [], savedViews: [], notifications, sops, audits
                };
                const newData = processImportData(result.summary.data, currentData, mode);
                
                if (newData.appSettings) setAppSettings(newData.appSettings);
                if (newData.clients) setClients(newData.clients, { type: 'batch', payload: {}, description: 'Imported Clients' });
                if (newData.invoices) setInvoices(newData.invoices);
                if (newData.leads) setLeads(newData.leads, { type: 'batch', payload: {}, description: 'Imported Leads' });
                if (newData.projects) setProjects(newData.projects, { type: 'batch', payload: {}, description: 'Imported Projects' });
                if (newData.tasks) setTasks(newData.tasks, { type: 'batch', payload: {}, description: 'Imported Tasks' });
                if (newData.teamMembers) setTeamMembers(newData.teamMembers);
                if (newData.expenses) setExpenses(newData.expenses);
                if (newData.marketingAudits) setMarketingAudits(newData.marketingAudits);
                if (newData.auditRecords) setAuditRecords(newData.auditRecords);
                if (newData.proposals) setProposals(newData.proposals);
                if (newData.clientDocuments) setClientDocuments(newData.clientDocuments);
                if (newData.onboardingKickoffData) setOnboardingKickoffData(newData.onboardingKickoffData);
                if (newData.campaigns) setCampaigns(newData.campaigns);
                if (newData.emails) setEmails(newData.emails);
                if (newData.chatContacts) setChatContacts(newData.chatContacts);
                if (newData.chatMessages) setChatMessages(newData.chatMessages);
                if (newData.leaveRequests) setLeaveRequests(newData.leaveRequests);
                if (newData.dailyAttendanceRecords) setDailyAttendanceRecords(newData.dailyAttendanceRecords);
                if (newData.hrDocuments) setHrDocuments(newData.hrDocuments);
                if (newData.payrollRecords) setPayrollRecords(newData.payrollRecords);
                if (newData.performanceReviews) setPerformanceReviews(newData.performanceReviews);
                if (newData.roleDefinitions) setRoleDefinitions(newData.roleDefinitions);
                if (newData.customFields) setCustomFields(newData.customFields);
                if (newData.notifications) setNotifications(newData.notifications);
                if (newData.sops) setSops(newData.sops);
                if (newData.audits) setAudits(newData.audits);
                
                closeModal();
                addToast({ title: "Import Successful", description: `Data imported successfully in ${mode} mode.` });
            }
        });
    };


    // --- Computed Data for Views ---
    const allTasks = useMemo(() => getAllTasks(projects, tasks, teamMembers), [projects, tasks, teamMembers]);

    // --- Reminder System Hook ---
    useReminders({
        tasks: allTasks,
        updateTask: (taskId, updates) => {
             // Helper to find if task is project or global and update accordingly
             const projectTask = projects.flatMap(p => p.tasks).find(t => t.id === taskId);
             if (projectTask) {
                 const project = projects.find(p => p.tasks.some(t => t.id === taskId));
                 if (project) {
                     const updatedTasks = project.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
                     handleSaveProject({ ...project, tasks: updatedTasks });
                 }
             } else {
                 const task = tasks.find(t => t.id === taskId);
                 if (task) handleSaveTask({ ...task, ...updates });
             }
        },
        hydrated: true,
        onReminderFired: (task) => {
            addToast({ 
                title: 'Task Reminder', 
                description: `Reminder: ${task.title}`, 
                actions: [{ label: 'Open', onClick: () => openModal('TASK_FORM', { task }) }] 
            });
            // Add to notifications list
            setNotifications(prev => [{
                id: `notif-rem-${Date.now()}`,
                type: 'info',
                title: 'Task Reminder',
                message: task.title,
                timestamp: new Date().toISOString(),
                isRead: false,
                severity: 'Medium',
                icon: null, // Can pass icon here if needed
                taskId: task.id
            }, ...prev]);
        },
        globalSnoozeUntil: load(KEYS.globalSnoozeUntil, null),
        onOpenTask: (task) => openModal('TASK_FORM', { task }),
        currentUserId: currentUser?.id,
        isReminderOnCooldown: isReminderOnCooldown,
        catchUpSweepTrigger: catchUpTrigger
    });

    // Helper to determine main content wrapper classes based on view
    // Removed 'PROJECTS' from here as requested in previous turn to fix margin issues
    const isFullHeightView = ['CALENDAR'].includes(currentView);

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} />;
    }

    const renderView = () => {
        switch (currentView) {
            case 'DASHBOARD': return <DashboardView 
                                        clients={clients} 
                                        invoices={invoices} 
                                        leads={leads} 
                                        projects={projects} 
                                        teamMembers={teamMembers} 
                                        expenses={expenses} 
                                        timeLogs={[]} 
                                        leaveRequests={leaveRequests} 
                                        dailyAttendanceRecords={dailyAttendanceRecords} 
                                        activityHistory={activityHistory} 
                                        appSettings={appSettings} 
                                        hasPermission={hasPermission} 
                                        setCurrentView={setCurrentView} 
                                        campaigns={campaigns} 
                                        dashboardSuggestions={[]} 
                                        onOpenCampaignReportModal={(c) => openModal('CAMPAIGN_REPORT', { campaign: c })} 
                                        currentUser={currentUser} 
                                        onOpenLeadFormModal={() => openModal('LEAD_FORM')} 
                                        onOpenClientFormModal={() => openModal('CLIENT_FORM')} 
                                        onOpenProjectFormModal={() => openModal('PROJECT_FORM')} 
                                        onOpenInvoiceModal={() => openModal('INVOICE_FORM')} 
                                        onOpenExpenseModal={() => openModal('EXPENSE_FORM')} 
                                        onOpenPaymentModal={() => openModal('PAYMENT_FORM')} 
                                        onOpenTimeLogModal={(log, defaults) => openModal('TIME_LOG_FORM', { timeLog: log, ...defaults })} 
                                        onOpenTaskModal={() => openModal('TASK_FORM')} 
                                        onMarkTaskAsDone={() => {}} 
                                        onOpenEmailComposeModal={(email) => openModal('EMAIL_COMPOSE', { initialEmail: email })} 
                                        onSelectClientForDetail={setSelectedClient} 
                                        allTasks={allTasks} 
                                        onSelectTask={(t) => openModal('TASK_FORM', { task: t })} 
                                     />;
            case 'COMMUNICATION': return <CommunicationView 
                                            emails={emails} 
                                            chatContacts={chatContacts} 
                                            chatMessages={chatMessages} 
                                            currentUser={currentUser} 
                                            activeTab={activeCommunicationTab} 
                                            setActiveTab={setActiveCommunicationTab}
                                            hasPermission={hasPermission} 
                                            onOpenComposeModal={(email) => openModal('EMAIL_COMPOSE', { initialEmail: email })} 
                                            onOpenViewEmailModal={(email) => openModal('VIEW_EMAIL', { emailMessage: email })} 
                                            onMoveToTrash={() => {}} 
                                            onDeletePermanently={() => {}} 
                                            onToggleStar={() => {}} 
                                            onSendMessage={handleSendMessage} 
                                            onMarkContactAsRead={(id) => setChatContacts(prev => prev.map(c => c.id === id ? {...c, unreadCount: 0} : c))} 
                                        />;
            case 'LEADS': return <LeadsView 
                                    leads={leads} 
                                    auditRecords={auditRecords} 
                                    teamMembers={teamMembers} 
                                    onAddLead={() => openModal('LEAD_FORM')} 
                                    onEditLead={(l) => openModal('LEAD_FORM', { lead: l })} 
                                    onDeleteLead={(id) => { setLeads(leads.filter(l => l.id !== id), { type: 'delete', payload: leads.find(l => l.id === id)!, description: 'Deleted lead' }); }} 
                                    onUpdateStatus={(id, status) => { 
                                        const lead = leads.find(l => l.id === id);
                                        if (lead) setLeads(leads.map(l => l.id === id ? { ...l, status } : l), { type: 'update', payload: { old: lead, new: { ...lead, status } }, description: `Updated lead status to ${status}` }); 
                                    }} 
                                    onCreateProposal={(leadId) => { const lead = leads.find(l => l.id === leadId); if(lead) openModal('PROPOSAL_FORM', { proposal: { clientId: leadId } }); }} 
                                    hasPermission={hasPermission} 
                                    onNavigateToIntegrations={() => setCurrentView('INTEGRATIONS')}
                                    onImportLeads={(leadsToImport) => {
                                        if (leadsToImport && leadsToImport.length > 0) {
                                            setLeads([...leadsToImport, ...leads], {
                                                type: 'batch',
                                                payload: {},
                                                description: `Imported ${leadsToImport.length} Leads from CSV`
                                            });
                                            addToast({
                                                title: "Import Successful",
                                                description: `Successfully imported ${leadsToImport.length} leads.`,
                                                type: "success"
                                            });
                                            return leadsToImport.length;
                                        }
                                        return 0;
                                    }} 
                                    onSelectLeadForDetail={setSelectedLead} 
                                    onOpenAuditFormModal={(l) => openModal('AUDIT_FORM', { lead: l })} 
                                    onOpenAuditReportModal={(l, ar) => openModal('AUDIT_REPORT', { lead: l, auditRecord: ar })} 
                                    onOpenFollowUpModal={(l) => openModal('FOLLOW_UP', { lead: l })} 
                                    onOpenEmailComposeModal={(l) => openModal('EMAIL_COMPOSE', { initialEmail: { recipientEmail: l.email } })} 
                                    onNavigateToAuditCreate={handleNavigateToAuditCreate}
                                />;
            case 'CLIENTS': return <ClientsView 
                                    clients={clients} 
                                    marketingAudits={marketingAudits} 
                                    onViewAuditDetail={(a) => openModal('AUDIT_REPORT', { auditRecord: a })} 
                                    onAddClient={() => openModal('CLIENT_FORM')} 
                                    onEditClient={(c) => openModal('CLIENT_FORM', { client: c })} 
                                    onDeleteClient={(id) => { setClients(clients.filter(c => c.id !== id), { type: 'delete', payload: clients.find(c => c.id === id)!, description: 'Deleted client' }); }} 
                                    hasPermission={hasPermission} 
                                    onSelectClientForDetail={setSelectedClient} 
                                    onOpenProjectsDrawer={(config) => setProjectsDrawerConfig(config || { mode: 'view' })} 
                                />;
            case 'PROJECTS': return <ProjectsView 
                                        projects={projects} 
                                        clients={clients} 
                                        teamMembers={teamMembers} 
                                        currentUser={currentUser} 
                                        onOpenProjectFormModal={(p) => openModal('PROJECT_FORM', { project: p })} 
                                        onDeleteProject={(id) => { setProjects(projects.filter(p => p.id !== id), { type: 'delete', payload: projects.find(p => p.id === id)!, description: 'Deleted project' }); }} 
                                        onViewProjectDetail={setSelectedProject} 
                                        hasPermission={hasPermission} 
                                        onUpdateProject={handleSaveProject} 
                                        onBatchUpdateProjects={handleBatchUpdateProjects} 
                                    />;
            case 'TASKS': 
            case 'MY_TASKS':
                return <MyTasksView
                            projects={projects}
                            teamMembers={teamMembers}
                            currentUser={currentUser}
                            onMarkTaskAsDone={(taskId, projectId) => {
                                const task = allTasks.find(t => t.id === taskId);
                                if(task) handleSaveTask({...task, status: task.status === 'Done' ? 'To Do' : 'Done', completed: task.status !== 'Done'});
                            }}
                            onOpenTimeLogModal={(log, defaults) => openModal('TIME_LOG_FORM', { timeLog: log, ...defaults })}
                            onOpenTaskModal={() => openModal('TASK_FORM')}
                            onOpenProjectDetailModal={setSelectedProject}
                            setCurrentView={setCurrentView}
                        />;
             case 'HR_MODULE': return <HRModuleView 
                                        teamMembers={teamMembers}
                                        onOpenTeamMemberHRFormModal={(m) => openModal('TEAM_MEMBER_HR_FORM', { member: m })}
                                        onDeleteTeamMemberHR={() => {}}
                                        onOpenTeamMemberHRDetailModal={(m) => openModal('TEAM_MEMBER_HR_DETAIL', { member: m })}
                                        leaveRequests={leaveRequests}
                                        currentUser={currentUser}
                                        onOpenLeaveRequestModal={(lr) => openModal('LEAVE_REQUEST_FORM', { leaveRequest: lr })}
                                        onUpdateLeaveStatus={() => {}}
                                        onCancelLeaveRequest={() => {}}
                                        dailyAttendanceRecords={dailyAttendanceRecords}
                                        onSaveAttendance={() => {}}
                                        onOpenMarkAttendanceModal={() => openModal('MARK_ATTENDANCE')}
                                        performanceReviews={performanceReviews}
                                        onOpenPerformanceReviewModal={(emp, rev) => openModal('PERFORMANCE_REVIEW', { employee: emp, existingReview: rev })}
                                        onOpenApproveLeavesModal={() => openModal('APPROVE_LEAVES', { pendingRequests: leaveRequests.filter(l => l.status === 'Pending') })}
                                        onOpenUploadHRDocumentModal={(defaults) => openModal('UPLOAD_HR_DOC', { defaults })}
                                        onOpenScheduleExitInterviewModal={() => openModal('SCHEDULE_EXIT_INTERVIEW')}
                                        hrDocuments={hrDocuments}
                                        onSaveHRDocument={handleSaveHRDocument}
                                        hasPermission={hasPermission}
                                        roleDefinitions={roleDefinitions}
                                        appSettings={appSettings}
                                        ai={null}
                                        payrollRecords={payrollRecords}
                                        onOpenOnboardingChecklistModal={(m) => openModal('ONBOARDING_CHECKLIST', { member: m })}
                                        onOpenExitChecklistModal={(m) => openModal('EXIT_CHECKLIST', { member: m })}
                                        onOpenPayslipModal={(pr, m) => openModal('PAYSLIP', { payrollRecord: pr, member: m })}
                                        onOpenProcessSalaryModal={(pr, m) => openModal('PROCESS_SALARY', { payrollRecord: pr, member: m })}
                                      />;
            case 'FINANCE': return <FinanceView 
                                        invoices={invoices} 
                                        clients={clients} 
                                        onAddInvoice={() => openModal('INVOICE_FORM')} 
                                        onEditInvoice={(i) => openModal('INVOICE_FORM', { invoice: i })} 
                                        onDeleteInvoice={handleDeleteInvoice} 
                                        onUpdateStatus={() => {}} 
                                        onProcessRecurringInvoices={() => {}} 
                                        onOpenInvoiceBillModal={(i) => openModal('INVOICE_BILL_VIEW', { invoice: i })} 
                                        onOpenInvoiceDetailPanel={(i) => setActivePanel({ type: 'INVOICE_DETAIL_PANEL', props: { invoice: i } })} 
                                        expenses={expenses} 
                                        projects={projects} 
                                        onAddExpense={() => openModal('EXPENSE_FORM')} 
                                        onEditExpense={(e) => openModal('EXPENSE_FORM', { expense: e })} 
                                        onDeleteExpense={handleDeleteExpense} 
                                        onUpdateInvoiceStatus={(id, status) => setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i))}
                                        appSettings={appSettings} 
                                        hasPermission={hasPermission} 
                                    />;
            case 'AUDITS': 
                return (
                    <AuditsView 
                        audits={audits} 
                        onSaveAudit={handleSaveNewAudit} 
                        prefillData={auditPrefillData}
                        leads={leads}
                        clients={clients}
                    />
                );
            case 'CALENDAR': return <CalendarView 
                                        projects={projects} 
                                        invoices={invoices} 
                                        leads={leads} 
                                        marketingAudits={marketingAudits} 
                                        leaveRequests={leaveRequests} 
                                    />;
            case 'SOP_LIBRARY': return <SOPLibraryView sops={sops} onEditSOP={(sop) => openModal('SOP_FORM', { sop })} onAddSOP={() => openModal('SOP_FORM')} />;
            case 'TOOLS': return <ToolsView />;
            case 'INTEGRATIONS': return <IntegrationsView 
                                            leads={leads} 
                                            onImportLeads={(leadsToImport) => {
                                                if (leadsToImport && leadsToImport.length > 0) {
                                                    setLeads([...leadsToImport, ...leads], {
                                                        type: 'batch',
                                                        payload: {},
                                                        description: `Inbound custom API / webhook auto-ingestion triggered`
                                                    });
                                                    addToast({
                                                        title: "API Action Inbound!",
                                                        description: `Inbound lead pipeline successfully processed: ${leadsToImport[0].name} auto-ingested.`,
                                                        type: "success"
                                                    });
                                                    return leadsToImport.length;
                                                }
                                                return 0;
                                            }}
                                         />;
            case 'USER_PROFILE': return <UserProfileView 
                                            currentUser={currentUser}
                                            onUpdateProfile={handleUpdateProfile}
                                            onUpdateProfilePicture={handleUpdateProfilePicture}
                                            roleDefinitions={roleDefinitions}
                                         />;
            case 'ADMIN_PANEL': return <SettingsView 
                                            isOpen={true} 
                                            teamMembers={teamMembers} 
                                            roleDefinitions={roleDefinitions} 
                                            appSettings={appSettings} 
                                            integrationPlatforms={[]} 
                                            activityHistory={[]} 
                                            apiKeys={[]} 
                                            webhooks={[]} 
                                            currentUser={currentUser} 
                                            emailTemplates={[]} 
                                            customFields={customFields} 
                                            onSaveRoleDefinitions={() => {}} 
                                            onSaveSettings={() => {}} 
                                            onConnectIntegration={() => {}} 
                                            onRevokeApiKey={() => {}} 
                                            onAddApiKey={() => {}} 
                                            onAddWebhook={() => {}} 
                                            onUpdateWebhook={() => {}} 
                                            onDeleteWebhook={() => {}} 
                                            onSaveEmailTemplates={() => {}} 
                                            onDeleteCustomField={handleDeleteCustomField} 
                                            onOpenCustomFieldFormModal={(field) => openModal('CUSTOM_FIELD_FORM', { field })} 
                                            onRepairStorage={repairStorage} 
                                            onExportData={handleExportData} 
                                            onImportData={handleImportData} 
                                            hasPermission={hasPermission} 
                                            activeSection={'general'} 
                                            setActiveSection={() => {}} 
                                            onClose={() => setCurrentView('DASHBOARD')} 
                                        />;
            default: return null; 
        }
    };

    return (
        <div className={`flex h-screen bg-bg-canvas dark:bg-zinc-900 text-text-base dark:text-slate-200 font-sans transition-colors duration-300 ${theme}`}>
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                appSettings={appSettings} 
                onLogout={handleLogout} 
                currentUser={currentUser} 
                hasPermission={hasPermission} 
                onOpenAdminPanel={() => setCurrentView('ADMIN_PANEL')}
                isSidebarOpen={isMobileSidebarOpen}
                setIsSidebarOpen={setIsMobileSidebarOpen}
                isCollapsed={isSidebarCollapsed}
            />
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <TopNavbar 
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    isCollapsed={isSidebarCollapsed}
                    currentTheme={theme}
                    onToggleTheme={toggleTheme}
                    notifications={notifications}
                    unreadEmails={emails.filter(e => !e.isRead && e.folder === 'inbox')}
                    unreadChats={chatContacts.filter(c => (c.unreadCount || 0) > 0)}
                    chatMessages={chatMessages}
                    unreadChatCount={chatContacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
                    onMarkContactAsRead={(id) => setChatContacts(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c))}
                    setCurrentView={setCurrentView}
                    setActiveCommunicationTab={setActiveCommunicationTab}
                    onOpenViewEmailModal={(email) => openModal('VIEW_EMAIL', { emailMessage: email })}
                    onMarkEmailRead={(id) => setEmails(prev => prev.map(e => e.id === id ? { ...e, isRead: true } : e))}
                    onMarkNotificationRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))}
                    onOpenTaskModal={() => openModal('TASK_FORM')}
                    globalSnoozeUntil={load(KEYS.globalSnoozeUntil, null)}
                    onSetGlobalSnooze={(val) => { save(KEYS.globalSnoozeUntil, val); }}
                    onSnoozeNotification={() => {}}
                    onOpenTaskFromNotification={(taskId) => { const task = allTasks.find(t => t.id === taskId); if(task) openModal('TASK_FORM', { task }); }}
                />
                <main className={`flex-1 overflow-x-hidden ${isFullHeightView ? 'h-full overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6'} bg-bg-canvas dark:bg-zinc-900 transition-all relative`}>
                    {urlError && <UrlErrorBanner message={urlError} onDismiss={() => setUrlError(null)} />}
                    {renderView()}
                </main>
            </div>
            
            <ToastContainer toasts={toasts} removeToast={removeToast} />

            {/* Client Detail View Modal */}
            {selectedClient && (
                <ClientDetailView
                    isOpen={true}
                    onClose={handleClientDetailClose}
                    client={selectedClient}
                    projects={projects.filter(p => p.clientId === selectedClient.id)}
                    campaigns={campaigns.filter(c => c.clientId === selectedClient.id)}
                    invoices={invoices.filter(i => i.clientId === selectedClient.id)}
                    marketingAudits={marketingAudits.filter(a => a.clientId === selectedClient.id)}
                    clientDocuments={clientDocuments.filter(d => d.clientId === selectedClient.id)}
                    teamMembers={teamMembers}
                    currentUser={currentUser}
                    appSettings={appSettings}
                    hasPermission={hasPermission}
                    
                    activeModalType={activeModal?.type || null}
                    isModalFormDirty={false} 
                    openModal={openModal}
                    closeModal={closeModal}
                    setModalFormDirty={() => {}}
                    handleRequestActionWithDirtyCheck={(action) => action()}

                    onOpenProjectModal={(p) => openModal('PROJECT_FORM', { project: p, prefillClientId: selectedClient.id })}
                    onOpenCampaignModal={(c) => openModal('CAMPAIGN_FORM', { campaign: c, prefillClientId: selectedClient.id })}
                    onOpenInvoiceModal={(i, prefillClient) => openModal('INVOICE_FORM', { invoice: i, client: prefillClient })}
                    onOpenInvoiceDetailPanel={(i) => setActivePanel({ type: 'INVOICE_DETAIL_PANEL', props: { invoice: i } })}
                    
                    onOpenProjectDetail={setSelectedProject}
                    onOpenCampaignReportModal={(c) => openModal('CAMPAIGN_REPORT', { campaign: c })}
                    onOpenAuditDetailModal={(a) => openModal('AUDIT_REPORT', { auditRecord: a })}
                    onOpenAuditRequestModal={(req, prefillClient) => openModal('AUDIT_FORM', { auditRequest: req, client: prefillClient })}

                    onAddClientDocument={() => {}}
                    onDeleteClientDocument={() => {}}
                    onUpdateProject={handleSaveProject}
                    onBatchUpdateProjects={handleBatchUpdateProjects}
                    onDeleteProject={(id) => { setProjects(projects.filter(p => p.id !== id), { type: 'delete', payload: projects.find(p => p.id === id)!, description: 'Deleted project' }); }}
                    onUpdateInvoiceStatus={(id, status) => setInvoices(invoices.map(i => i.id === id ? { ...i, status } : i))}
                    onDeleteInvoice={handleDeleteInvoice}
                />
            )}
            
            {/* Project Detail View Modal */}
            {selectedProject && (
                <ProjectDetailView
                    isOpen={true}
                    onClose={handleProjectDetailClose}
                    project={selectedProject}
                    clients={clients}
                    teamMembers={teamMembers}
                    currentUser={currentUser}
                    onUpdateProject={(p) => handleSaveProject(p)}
                    onAddTask={(pid, taskData) => {
                        const newTask = { ...taskData, id: `task-${Date.now()}`, projectId: pid, status: 'To Do', completed: false } as Task;
                        handleSaveTask(newTask);
                    }} 
                    onUpdateTask={(pid, task) => handleSaveTask(task)}
                    onDeleteTask={(pid, tid) => { setTasks(tasks.filter(t => t.id !== tid), { type: 'delete', payload: tasks.find(t => t.id === tid)!, description: 'Deleted task' }); }}
                    onEditProjectDetails={() => openModal('PROJECT_FORM', { project: selectedProject })}
                    hasPermission={hasPermission}
                    onOpenTimeLogModal={(log, defaults) => openModal('TIME_LOG_FORM', { timeLog: log, ...defaults })}
                    timeLogs={[]}
                    overrideZIndex="z-[1005]"
                />
            )}

            {/* Lead Detail View Modal */}
            {selectedLead && (
                <LeadDetailView
                    isOpen={true}
                    onClose={handleLeadDetailClose}
                    lead={selectedLead}
                    auditRecords={auditRecords}
                    proposals={proposals}
                    onboardingKickoffData={onboardingKickoffData}
                    teamMembers={teamMembers}
                    onEditLead={(l) => openModal('LEAD_FORM', { lead: l })}
                    hasPermission={hasPermission}
                    openModal={openModal}
                    onOpenFollowUpModal={(l) => openModal('FOLLOW_UP', { lead: l })}
                    onOpenAuditFormModal={(l) => openModal('AUDIT_FORM', { lead: l })}
                    onOpenAuditReportModal={(l, ar) => openModal('AUDIT_REPORT', { lead: l, auditRecord: ar })}
                    onOpenPaymentModal={() => openModal('PAYMENT_FORM')}
                    onConvertLeadToClient={(l, transitionData) => {
                         const handoffNotes = transitionData?.notes || '';
                         const starterBudget = transitionData?.budget || l.estimatedBudget || '';
                         const starterServices = transitionData?.services || (Array.isArray(l.serviceInterest) ? l.serviceInterest : []);

                         const newClient: Client = {
                             id: `client-${Date.now()}`,
                             name: l.name,
                             companyName: l.companyName,
                             email: l.email,
                             phone: l.phone,
                             website: l.website,
                             dateAdded: new Date().toISOString(),
                             healthStatus: 'Healthy',
                             roi: { current: 0, goal: 0 },
                             nextAction: { title: 'Onboarding', dueDate: new Date().toISOString() },
                             recentActivity: [
                                 { id: `act-conv-${Date.now()}`, action: 'Converted from Lead', timestamp: new Date().toISOString(), icon: 'note' },
                                 ...(handoffNotes ? [{ id: `act-notes-${Date.now()}`, action: `Sales Handoff: ${handoffNotes}`, timestamp: new Date().toISOString(), icon: 'note' as const }] : [])
                             ],
                             convertedFromLeadId: l.id,
                             industry: l.tags?.[0] || 'Unknown',
                             tags: starterServices.length > 0 ? starterServices : l.tags,
                             clientNotes: handoffNotes
                          };
                          handleSaveClient(newClient);
                          
                          const updatedLead: Lead = {
                              ...l,
                              status: 'Closed Won',
                              estimatedBudget: starterBudget || l.estimatedBudget,
                              serviceInterest: starterServices.length > 0 ? starterServices : l.serviceInterest
                          };
                          setLeads(leads.map(lead => lead.id === l.id ? updatedLead : lead), { 
                              type: 'update', 
                              payload: { old: l, new: updatedLead }, 
                              description: `Converted lead "${l.name}" to client with standard onboarding specifications.` 
                          });
                          if(selectedLead?.id === l.id) setSelectedLead(updatedLead);
                     }}
                    onUpdateStatus={(leadId, status) => {
                        const lead = leads.find(l => l.id === leadId);
                        if(lead) setLeads(leads.map(l => l.id === leadId ? { ...l, status } : l), { type: 'update', payload: { old: lead, new: { ...lead, status } }, description: `Updated lead status to ${status}` });
                        if(selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, status } : null);
                    }}
                    onMarkStageManually={() => {}}
                    onRevertManualMark={() => {}}
                    openPanel={(type, props) => setActivePanel({ type, props })}
                    onOpenProposalPanel={(p) => setActivePanel({ type: 'PROPOSAL_DETAIL_PANEL', props: { proposal: p } })}
                    onSendProposal={() => {}}
                    onSendAuditReport={() => {}}
                    ai={null}
                    onUpdateLeadField={(leadId, field, value) => {
                         const lead = leads.find(l => l.id === leadId);
                         if(lead) {
                             const updatedLead = { ...lead, [field]: value };
                             setLeads(leads.map(l => l.id === leadId ? updatedLead : l), { type: 'update', payload: { old: lead, new: updatedLead }, description: `Updated lead ${field}` });
                         }
                         if(selectedLead?.id === leadId) setSelectedLead(prev => prev ? { ...prev, [field]: value } : null);
                    }}
                    clients={clients}
                    onOpenProjectsDrawer={(config) => setProjectsDrawerConfig(config || { mode: 'view' })}
                />
            )}
            
            {/* Side Panels */}
            {activePanel?.type === 'INVOICE_DETAIL_PANEL' && activePanel.props?.invoice && (
                <InvoiceDetailPanel 
                    isOpen={true}
                    onClose={closePanel}
                    invoice={activePanel.props.invoice}
                    client={clients.find(c => c.id === activePanel.props?.invoice.clientId)}
                    appSettings={appSettings}
                    onOpenSendModal={(inv) => openModal('SEND_INVOICE', { invoice: inv })}
                    onUpdateStatus={(id, status) => setInvoices(invoices.map(i => i.id === id ? {...i, status} : i))}
                    onEditInvoice={(inv) => openModal('INVOICE_FORM', { invoice: inv })}
                    onOpenBillModal={(inv) => openModal('INVOICE_BILL_VIEW', { invoice: inv })}
                />
            )}
            
             {activePanel?.type === 'PROPOSAL_DETAIL_PANEL' && activePanel.props?.proposal && (
                <ProposalDetailPanel 
                    isOpen={true}
                    onClose={closePanel}
                    proposal={activePanel.props.proposal}
                    onOpenSendModal={(p) => openModal('SEND_PROPOSAL', { proposal: p })}
                    onUpdateStatus={(id, status) => setProposals(proposals.map(p => p.id === id ? {...p, status} : p))}
                />
            )}
            
            {activePanel?.type === 'CREATE_PROPOSAL' && (
                <CreateProposalPanel 
                    isOpen={true}
                    onClose={closePanel}
                    onSave={handleSaveProposal}
                    clientId={activePanel.props.clientId}
                    clientName={clients.find(c => c.id === activePanel.props.clientId)?.name || ''}
                    proposal={activePanel.props.proposal}
                    clients={clients}
                />
            )}
            
            {/* Projects Drawer */}
            <ProjectsDrawer 
                isOpen={!!projectsDrawerConfig}
                onClose={() => setProjectsDrawerConfig(null)}
                config={projectsDrawerConfig || {}}
                onUpdateConfig={setProjectsDrawerConfig}
                projects={projects}
                clients={clients}
                teamMembers={teamMembers}
                onSaveProject={handleSaveProject}
                onDeleteProject={(id) => { setProjects(projects.filter(p => p.id !== id), { type: 'delete', payload: projects.find(p => p.id === id)!, description: 'Deleted project' }); }}
                hasPermission={hasPermission}
            />

            
            {/* Global Modal Rendering */}
            {activeModal?.type === 'CLIENT_FORM' && (
                <ClientFormModal 
                    isOpen={true}
                    onClose={closeModal}
                    onSave={handleSaveClient}
                    client={activeModal.props?.client || null}
                    onSetDirty={() => {}}
                    customFields={customFields}
                />
            )}
            {activeModal?.type === 'PROJECT_FORM' && (
                <ProjectFormModal 
                    isOpen={true}
                    onClose={closeModal}
                    onSave={handleSaveProject}
                    project={activeModal.props?.project || null}
                    clients={clients}
                    teamMembers={teamMembers}
                    onSetDirty={() => {}}
                    customFields={customFields}
                />
            )}
             {activeModal?.type === 'CAMPAIGN_FORM' && (
                <CampaignFormModal 
                    isOpen={true}
                    onClose={closeModal}
                    onSave={handleSaveCampaign}
                    campaign={activeModal.props?.campaign || null}
                    clients={clients}
                    appSettings={appSettings}
                    onGenerateInsights={async () => {}}
                    onSetDirty={() => {}}
                    prefillClientId={activeModal.props?.prefillClientId}
                />
            )}
             {activeModal?.type === 'INVOICE_FORM' && (
                <InvoiceFormModal 
                    isOpen={true}
                    onClose={closeModal}
                    onSave={handleSaveInvoice}
                    invoice={activeModal.props?.invoice || null}
                    clients={activeModal.props?.client ? [activeModal.props.client] : clients}
                    getNextInvoiceNumber={() => 'INV-001'}
                    appSettings={appSettings}
                    onSetDirty={() => {}}
                />
            )}
             {activeModal?.type === 'AUDIT_FORM' && (
                activeModal.props?.lead ? (
                    <AuditFormModal 
                        isOpen={true}
                        onClose={closeModal}
                        onSave={handleSaveAuditRecord}
                        lead={activeModal.props.lead}
                        existingAuditRecord={activeModal.props?.auditRecord}
                        currentUser={currentUser}
                        onGenerateAiReport={async () => {}}
                        onSetDirty={() => {}}
                        ai={null}
                    />
                ) : (
                    <AuditRequestFormModal
                        isOpen={true}
                        onClose={closeModal}
                        onSave={handleSaveAudit}
                        auditRequest={activeModal.props?.auditRequest || null}
                        clients={clients}
                        onSetDirty={() => {}}
                    />
                )
            )}
             {activeModal?.type === 'AUDIT_REPORT' && activeModal.props?.auditRecord && (
                <AuditReportModal 
                    isOpen={true}
                    onClose={closeModal}
                    auditRecord={activeModal.props.auditRecord}
                    lead={activeModal.props?.lead || {name: 'Unknown', companyName: '', email: ''}}
                    onEditAudit={() => {}}
                    currentUser={currentUser}
                />
            )}
             {activeModal?.type === 'TASK_FORM' && (
                <TaskFormModal 
                    isOpen={true}
                    onClose={closeModal}
                    onSave={handleSaveTask}
                    onDelete={(id) => { setTasks(tasks.filter(t => t.id !== id), { type: 'delete', payload: tasks.find(t => t.id === id)!, description: 'Deleted task' }); closeModal(); }}
                    task={activeModal.props?.task || null}
                    projects={projects}
                    teamMembers={teamMembers}
                    currentUser={currentUser}
                    onSetDirty={() => {}}
                    showToast={handleToast}
                    overrideZIndex="z-[1060]"
                />
            )}
            {activeModal?.type === 'EMAIL_COMPOSE' && (
                <EmailComposeModal 
                    isOpen={true}
                    onClose={closeModal}
                    onSaveEmail={handleSaveEmail}
                    initialEmail={activeModal.props?.initialEmail}
                    currentUserName={currentUser?.name || ''}
                    currentUserEmail={currentUser?.email || ''}
                    ai={null}
                    onSetDirty={() => {}}
                    emailTemplates={[]}
                />
            )}
            {activeModal?.type === 'VIEW_EMAIL' && activeModal.props?.emailMessage && (
                <ViewEmailModal
                    isOpen={true}
                    onClose={closeModal}
                    emailMessage={activeModal.props.emailMessage}
                />
            )}
            {activeModal?.type === 'SEND_INVOICE' && activeModal.props?.invoice && (
                <SendInvoiceModal
                    isOpen={true}
                    onClose={closeModal}
                    onSend={() => {}}
                    invoice={activeModal.props.invoice}
                    client={clients.find(c => c.id === activeModal.props.invoice.clientId) || null}
                    appSettings={appSettings}
                />
            )}
             {activeModal?.type === 'INVOICE_BILL_VIEW' && activeModal.props?.invoice && (
                <InvoiceBillModal
                    isOpen={true}
                    onClose={closeModal}
                    invoice={activeModal.props.invoice}
                    client={clients.find(c => c.id === activeModal.props.invoice.clientId)}
                    appSettings={appSettings}
                />
            )}
             {activeModal?.type === 'LEAD_FORM' && (
                 <LeadFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSave={(lead) => { 
                        if (activeModal.props?.lead && activeModal.props.lead.id) {
                            setLeads(leads.map(l => l.id === lead.id ? lead : l), { type: 'update', payload: { old: activeModal.props.lead, new: lead }, description: `Updated lead "${lead.name}"` });
                        } else {
                             setLeads([lead, ...leads], { type: 'create', payload: lead, description: `Created lead "${lead.name}"` });
                        }
                        closeModal(); 
                    }}
                    lead={activeModal.props?.lead || null}
                    teamMembers={teamMembers}
                    onSetDirty={() => {}}
                    customFields={customFields}
                 />
             )}
             {activeModal?.type === 'EXPENSE_FORM' && (
                 <ExpenseFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSave={(expense) => { setExpenses(prev => [...prev, { ...expense, id: `exp-${Date.now()}` }]); closeModal(); }}
                    expense={activeModal.props?.expense || null}
                    projects={projects}
                    appSettings={appSettings}
                    onSetDirty={() => {}}
                 />
             )}
             {activeModal?.type === 'PAYMENT_FORM' && (
                 <PaymentFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSave={() => { closeModal(); }}
                    invoices={invoices}
                    appSettings={appSettings}
                    onSetDirty={() => {}}
                 />
             )}
             {activeModal?.type === 'FOLLOW_UP' && activeModal.props?.lead && (
                 <FollowUpFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSave={() => { closeModal(); }}
                    leadName={activeModal.props.lead.name}
                    leadId={activeModal.props.lead.id}
                    onSetDirty={() => {}}
                 />
             )}
              {activeModal?.type === 'TEAM_MEMBER_HR_FORM' && (
                 <TeamMemberHRFormModal
                    isOpen={true}
                    onClose={closeModal}
                    member={activeModal.props?.member || null}
                    onSave={(m) => { setTeamMembers(prev => {
                        const exists = prev.find(tm => tm.id === m.id);
                        if (exists) return prev.map(tm => tm.id === m.id ? m : tm);
                        return [...prev, { ...m, id: `tm-${Date.now()}` }];
                    }); closeModal(); }}
                    roleDefinitions={roleDefinitions}
                    onSetDirty={() => {}}
                 />
             )}
             {activeModal?.type === 'LEAVE_REQUEST_FORM' && (
                 <TeamActionModal
                    isOpen={true}
                    onClose={closeModal}
                    mode="LEAVE_FORM"
                    leaveRequestToEdit={activeModal.props?.leaveRequest || null}
                    onSaveLeaveRequest={handleSaveLeaveRequest}
                    currentUserId={currentUser?.id}
                    currentUserName={currentUser?.name}
                    onSetDirty={() => {}}
                 />
             )}
             {activeModal?.type === 'MARK_ATTENDANCE' && (
                 <MarkAttendanceModal
                    isOpen={true}
                    onClose={closeModal}
                    teamMembers={teamMembers}
                    onSaveAttendance={(record) => { setDailyAttendanceRecords(prev => [...prev, record]); closeModal(); }}
                 />
             )}
             {activeModal?.type === 'APPROVE_LEAVES' && (
                 <ApproveLeavesModal
                    isOpen={true}
                    onClose={closeModal}
                    pendingRequests={activeModal.props?.pendingRequests || []}
                    onUpdateLeaveStatus={(id, status, notes) => {
                        setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status, adminNotes: notes } : req));
                    }}
                 />
             )}
             {activeModal?.type === 'UPLOAD_HR_DOC' && (
                 <UploadHRDocumentModal
                    isOpen={true}
                    onClose={closeModal}
                    teamMembers={teamMembers}
                    onSave={handleSaveHRDocument}
                    defaults={activeModal.props?.defaults}
                    onSetDirty={() => {}}
                 />
             )}
             {activeModal?.type === 'SCHEDULE_EXIT_INTERVIEW' && (
                 <ScheduleExitInterviewModal
                    isOpen={true}
                    onClose={closeModal}
                    teamMembers={teamMembers}
                    onSchedule={(employeeId, dateTime, notes) => { alert('Scheduled (Conceptual)'); }}
                 />
             )}
             {activeModal?.type === 'ONBOARDING_CHECKLIST' && activeModal.props?.member && (
                 <OnboardingChecklistModal
                    isOpen={true}
                    onClose={closeModal}
                    member={activeModal.props.member}
                    onSave={(updatedMember) => {
                         setTeamMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
                         closeModal();
                    }}
                 />
             )}
             {activeModal?.type === 'EXIT_CHECKLIST' && activeModal.props?.member && (
                 <ExitChecklistModal
                    isOpen={true}
                    onClose={closeModal}
                    member={activeModal.props.member}
                    onSave={(updatedMember) => {
                         setTeamMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
                         closeModal();
                    }}
                 />
             )}
             {activeModal?.type === 'PAYSLIP' && activeModal.props?.payrollRecord && activeModal.props?.member && (
                 <PayslipModal
                    isOpen={true}
                    onClose={closeModal}
                    payrollRecord={activeModal.props.payrollRecord}
                    member={activeModal.props.member}
                    appSettings={appSettings}
                 />
             )}
             {activeModal?.type === 'PROCESS_SALARY' && activeModal.props?.payrollRecord && activeModal.props?.member && (
                 <ProcessSalaryModal
                    isOpen={true}
                    onClose={closeModal}
                    payrollRecord={activeModal.props.payrollRecord}
                    member={activeModal.props.member}
                    onConfirm={() => {
                        setPayrollRecords(prev => {
                             const exists = prev.find(r => r.id === activeModal.props.payrollRecord.id);
                             const updated = { ...activeModal.props.payrollRecord, status: 'Processed' as const };
                             if (exists) return prev.map(r => r.id === updated.id ? updated : r);
                             return [...prev, updated];
                        });
                        closeModal();
                    }}
                 />
             )}
             {activeModal?.type === 'PERFORMANCE_REVIEW' && activeModal.props?.employee && (
                 <PerformanceReviewModal
                    isOpen={true}
                    onClose={closeModal}
                    employee={activeModal.props.employee}
                    currentUser={currentUser}
                    existingReview={activeModal.props.existingReview}
                    onSave={handleSavePerformanceReview}
                    onSetDirty={() => {}}
                 />
             )}
             {activeModal?.type === 'TEAM_MEMBER_HR_DETAIL' && activeModal.props?.member && (
                 <TeamMemberHRDetailModal
                    isOpen={true}
                    onClose={closeModal}
                    member={activeModal.props.member}
                    onEdit={(m) => openModal('TEAM_MEMBER_HR_FORM', { member: m })}
                    roleDefinitions={roleDefinitions}
                    leaveRequests={leaveRequests.filter(r => r.memberId === activeModal.props.member.id)}
                    projects={projects.filter(p => p.teamIds.includes(activeModal.props.member.id))}
                    dailyAttendanceRecords={dailyAttendanceRecords}
                 />
             )}
              {activeModal?.type === 'PROPOSAL_FORM' && (
                 <ProposalFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSave={handleSaveProposal}
                    proposal={activeModal.props?.proposal || null}
                    clients={clients}
                    getNextProposalNumber={() => `PROP-${Date.now()}`}
                    ai={null}
                 />
             )}
              {activeModal?.type === 'CUSTOM_FIELD_FORM' && (
                 <CustomFieldFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSave={handleSaveCustomField}
                    fieldToEdit={activeModal.props?.field || null}
                 />
             )}
             {activeModal?.type === 'KICKOFF_FORM' && activeModal.props?.clientId && (
                <KickoffFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSave={(data) => { 
                        setOnboardingKickoffData(prev => {
                            const exists = prev.find(d => d.clientId === data.clientId);
                            if(exists) return prev.map(d => d.clientId === data.clientId ? data : d);
                            return [...prev, data];
                        });
                        closeModal();
                    }}
                    existingData={activeModal.props.existingData}
                    clientId={activeModal.props.clientId}
                    clients={clients}
                    onSetDirty={() => {}}
                 />
            )}
            {activeModal?.type === 'SEND_PROPOSAL' && activeModal.props?.proposal && (
                <SendProposalModal
                    isOpen={true}
                    onClose={closeModal}
                    onSend={() => { alert('Sent proposal (Conceptual)'); closeModal(); }}
                    proposal={activeModal.props.proposal}
                    client={clients.find(c => c.id === activeModal.props.proposal.clientId) || null}
                />
            )}
            {activeModal?.type === 'CAMPAIGN_REPORT' && activeModal.props?.campaign && (
                <CampaignReportModal
                    isOpen={true}
                    onClose={closeModal}
                    campaign={activeModal.props.campaign}
                    appSettings={appSettings}
                />
            )}
            {activeModal?.type === 'CALENDAR_EVENT_DETAIL' && activeModal.props?.date && (
                <CalendarEventDetailModal
                    isOpen={true}
                    onClose={closeModal}
                    date={activeModal.props.date}
                    events={activeModal.props.events}
                    projects={projects}
                    setCurrentView={setCurrentView}
                    setSelectedProjectForDetail={setSelectedProject}
                    handleViewAuditDetail={(a) => openModal('AUDIT_REPORT', { auditRecord: a })}
                    onOpenInvoiceModal={(i) => openModal('INVOICE_FORM', { invoice: i })}
                    onOpenLeadModal={(l) => openModal('LEAD_FORM', { lead: l })}
                />
            )}
            {activeModal?.type === 'TIME_LOG_FORM' && (
                <TimeLogFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSave={(log) => { /* ... */ closeModal(); }}
                    timeLog={activeModal.props?.timeLog || null}
                    projects={projects}
                    tasks={allTasks}
                    teamMembers={teamMembers}
                    currentUserId={currentUser.id}
                    defaultProjectId={activeModal.props?.projectId}
                    defaultTaskId={activeModal.props?.taskId}
                    onSetDirty={() => {}}
                />
            )}
            {activeModal?.type === 'IMPORT_CONFIRMATION' && activeModal.props?.summary && (
                <ImportConfirmationModal
                    isOpen={true}
                    onClose={closeModal}
                    onConfirmImport={activeModal.props.onConfirmImport}
                    summary={activeModal.props.summary}
                />
            )}
            {activeModal?.type === 'SOP_FORM' && (
                <SOPFormModal
                    isOpen={true}
                    onClose={closeModal}
                    onSave={handleSaveSOP}
                    sop={activeModal.props?.sop || null}
                />
            )}
            {activeModal?.type === 'CLIENT_REPORT_GENERATOR' && activeModal.props?.client && (
                <ClientReportModal
                    isOpen={true}
                    onClose={closeModal}
                    client={activeModal.props.client}
                    projects={projects.filter(p => p.clientId === activeModal.props.client.id)}
                    tasks={allTasks.filter(t => {
                        const project = projects.find(p => p.id === t.projectId);
                        return project && project.clientId === activeModal.props.client.id;
                    })}
                    campaigns={campaigns}
                    appSettings={appSettings}
                    onOpenEmailCompose={(emailData) => {
                        closeModal();
                        setTimeout(() => openModal('EMAIL_COMPOSE', { initialEmail: { recipientEmail: emailData.to, subject: emailData.subject, body: emailData.body } }), 100);
                    }}
                />
            )}
        </div>
    );
};