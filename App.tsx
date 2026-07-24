import React, { useState, useEffect, useMemo } from "react";
import { GoogleGenAI } from "@google/genai";
import {
  Lead,
  Client,
  Project,
  Task,
  Invoice,
  Payment,
  Expense,
  TeamMember,
  AppSettings,
  View,
  FeatureKey,
  PermissionAction,
  ActivityLogItem,
  MarketingAuditRequest,
  Proposal,
  OnboardingKickoffData,
  Campaign,
  EmailMessage,
  ChatContact,
  ChatMessage,
  LeaveRequest,
  LeaveRequestStatus,
  DailyAttendanceRecord,
  PerformanceReview,
  HRDocument,
  PayrollRecord,
  RoleDefinition,
  ApiKey,
  Webhook,
  EmailTemplate,
  CustomField,
  TimeLog,
  SavedTaskView,
  AppNotification,
  ClientDocument,
  InvoiceStatus,
  AuditRecord,
  SOP,
  BackupData,
  Audit,
  ModalType,
  ProposalStatus,
  calculateInvoiceGrandTotal,
} from "./types";
import {
  load,
  save,
  KEYS,
  validateBackupFile,
  importData as processImportData,
  exportData,
  repairStorage,
} from "./storage";
import LoginPage from "./components/LoginPage";
import { Sidebar } from "./components/Sidebar";
import { TopNavbar } from "./components/TopNavbar";
import { DashboardView } from "./components/views/DashboardView";
import { LeadsView } from "./components/views/LeadsView";
import { ClientsView } from "./components/views/ClientsView";
import ClientDetailView from "./components/views/ClientDetailView";
import LeadDetailView from "./components/views/LeadDetailView";
import { ProjectDetailView } from "./components/views/ProjectDetailView";
import { ProjectsView } from "./components/views/ProjectsView";
import { TasksView } from "./components/views/TasksView";
import { FinanceView } from "./components/views/FinanceView";
import { HRModuleView } from "./components/views/hr_module/HRModuleView";
import { CalendarView } from "./components/views/CalendarView";
import { SettingsView } from "./components/views/SettingsView";
import { UserProfileView } from "./components/views/UserProfileView";
import { CommunicationView } from "./components/views/CommunicationView";
import { OnboardingView } from "./components/views/OnboardingView";
import { MyTasksView } from "./components/views/MyTasksView";
import { SOPLibraryView } from "./components/views/SOPLibraryView";
import { AuditsView } from "./components/views/AuditsView";
import { ToolsView } from "./components/views/ToolsView";
import { ClientFormModal } from "./components/modals/ClientFormModal";
import { ProjectFormModal } from "./components/modals/ProjectFormModal";
import { LeadFormModal } from "./components/modals/LeadFormModal";
import { InvoiceFormModal } from "./components/modals/InvoiceFormModal";
import { ExpenseFormModal } from "./components/modals/ExpenseFormModal";
import { TaskFormModal } from "./components/modals/TaskFormModal";
import { AuditReportModal } from "./components/modals/AuditReportModal";
import { AuditFormModal } from "./components/modals/AuditFormModal";
import { AuditRequestFormModal } from "./components/modals/AuditRequestFormModal";
import { CampaignFormModal } from "./components/modals/CampaignFormModal";
import { EmailComposeModal } from "./components/modals/EmailComposeModal";
import { ViewEmailModal } from "./components/modals/ViewEmailModal";
import { SendInvoiceModal } from "./components/modals/SendInvoiceModal";
import {
  PaymentFormModal,
  PaymentFormData,
} from "./components/modals/PaymentFormModal";
import { InvoiceBillModal } from "./components/modals/InvoiceBillModal";
import { FollowUpFormModal } from "./components/modals/FollowUpFormModal";
import { TeamActionModal } from "./components/modals/TeamActionModal";
import { MarkAttendanceModal } from "./components/modals/hr_module/MarkAttendanceModal";
import { ApproveLeavesModal } from "./components/modals/hr_module/ApproveLeavesModal";
import { UploadHRDocumentModal } from "./components/modals/hr_module/UploadHRDocumentModal";
import { ScheduleExitInterviewModal } from "./components/modals/hr_module/ScheduleExitInterviewModal";
import { OnboardingChecklistModal } from "./components/modals/hr_module/OnboardingChecklistModal";
import { ExitChecklistModal } from "./components/modals/hr_module/ExitChecklistModal";
import { PayslipModal } from "./components/modals/hr_module/PayslipModal";
import { ProcessSalaryModal } from "./components/modals/hr_module/ProcessSalaryModal";
import { PerformanceReviewModal } from "./components/modals/hr_module/PerformanceReviewModal";
import { TeamMemberHRDetailModal } from "./components/modals/hr_module/TeamMemberHRDetailModal";
import { TeamMemberHRFormModal } from "./components/modals/tmr_module/TeamMemberHRFormModal";
import { ProposalFormModal } from "./components/modals/ProposalFormModal";
import { CustomFieldFormModal } from "./components/modals/CustomFieldFormModal";
import { KickoffFormModal } from "./components/modals/KickoffFormModal";
import { SendProposalModal } from "./components/modals/SendProposalModal";
import { CampaignReportModal } from "./components/modals/CampaignReportModal";
import { CalendarEventDetailModal } from "./components/modals/CalendarEventDetailModal";
import { TimeLogFormModal } from "./components/modals/TimeLogFormModal";
import { ImportConfirmationModal } from "./components/modals/ImportConfirmationModal";
import { ConfirmationModal } from "./components/modals/ConfirmationModal";
import { SOPFormModal } from "./components/modals/SOPFormModal";
import { ClientReportModal } from "./components/modals/ClientReportModal";

import { ToastContainer } from "./components/common/ToastContainer";
import { useToast } from "./hooks/useToast";
import { ToastData, LeadStatus } from "./types";

// Detail Panels
import { InvoiceDetailPanel } from "./components/panels/InvoiceDetailPanel";
import { ProposalDetailPanel } from "./components/panels/ProposalDetailPanel";
import { CreateProposalPanel } from "./components/panels/CreateProposalPanel";
import { ProjectsDrawer } from "./components/drawers/ProjectsDrawer";

// Selectors & Utils
import { getAllTasks } from "./selectors/tasksSelectors";
import { useCrossTabSync } from "./hooks/useCrossTabSync";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { useReminders } from "./hooks/useReminders";
import { useDiagnostics } from "./hooks/useDiagnostics";
import { UrlErrorBanner } from "./components/common/UrlErrorBanner";
import { auth, isFirebaseConfigured } from "./firebase";
import { subscribeToTasks, saveTaskToCloud, deleteTaskFromCloud } from "./taskSync";

interface AppProps {
    onSignOut?: () => void;
}

export const App: React.FC<AppProps> = ({ onSignOut }) => {
  // --- State Management ---
  const [currentUser, setCurrentUser] = useState<TeamMember | null>(() =>
    load(KEYS.currentUser, null),
  );
  const [currentView, setCurrentView] = useState<View>("DASHBOARD");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(
    () => load(KEYS.theme, "light") as "light" | "dark",
  );

  const { toasts, addToast, removeToast } = useToast();

  // Shared Gemini client for AI-assisted features (e.g. proposal auto-drafting).
  // Stays null when no API key is configured, which hides the AI buttons rather
  // than erroring — so the app works fine without Gemini set up.
  const aiClient = useMemo(() => {
    try {
      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) return null;
      return new GoogleGenAI({ apiKey });
    } catch (err) {
      console.error("Failed to initialise Gemini client", err);
      return null;
    }
  }, []);

  // --- CORE DATA & UNDO/REDO HOOKS ---
  const { state: leads, set: setLeads } = useUndoRedo<Lead>(
    KEYS.leads,
    load(KEYS.leads, []),
    addToast,
  );
  const { state: clients, set: setClients } = useUndoRedo<Client>(
    KEYS.clients,
    load(KEYS.clients, []),
    addToast,
  );
  const { state: projects, set: setProjects } = useUndoRedo<Project>(
    KEYS.projects,
    load(KEYS.projects, []),
    addToast,
  );
  const { state: tasks, set: setTasks, hydrate: hydrateTasks } = useUndoRedo<Task>(
    KEYS.tasks,
    load(KEYS.tasks, []),
    addToast,
  );

  // Real-time Firestore sync for tasks: a dedicated per-document collection
  // (see taskSync.ts) rather than the generic whole-array blob the rest of
  // the app's data uses, so "My Tasks" stays in sync live and survives a
  // refresh. currentUid is stable for the lifetime of this component — the
  // AuthGate wrapper only mounts App after sign-in completes.
  const currentUid = isFirebaseConfigured ? auth.currentUser?.uid ?? null : null;
  useEffect(() => {
    if (!currentUid) return;
    const unsubscribe = subscribeToTasks(currentUid, (cloudTasks) => {
      hydrateTasks(cloudTasks);
    });
    return unsubscribe;
  }, [currentUid, hydrateTasks]);

  // --- STANDARD STATE (No Undo/Redo yet) ---
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    load(KEYS.invoices, []),
  );
  const [payments, setPayments] = useState<Payment[]>(() =>
    load(KEYS.payments, []),
  );
  const [expenses, setExpenses] = useState<Expense[]>(() =>
    load(KEYS.expenses, []),
  );
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() =>
    load(KEYS.teamMembers, []),
  );
  const [marketingAudits, setMarketingAudits] = useState<
    MarketingAuditRequest[]
  >(() => load(KEYS.marketingAudits, []));
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(() =>
    load(KEYS.auditRecords, []),
  );
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>(() =>
    load(KEYS.clientDocuments, []),
  );
  const [campaigns, setCampaigns] = useState<Campaign[]>(() =>
    load(KEYS.campaigns, []),
  );
  const [proposals, setProposals] = useState<Proposal[]>(() =>
    load(KEYS.proposals, []),
  );
  const [onboardingKickoffData, setOnboardingKickoffData] = useState<
    OnboardingKickoffData[]
  >(() => load(KEYS.onboardingKickoffData, []));
  const [emails, setEmails] = useState<EmailMessage[]>(() =>
    load(KEYS.emails, []),
  );
  const [chatContacts, setChatContacts] = useState<ChatContact[]>(() =>
    load(KEYS.chatContacts, []),
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    load(KEYS.chatMessages, []),
  );
  const [activeCommunicationTab, setActiveCommunicationTab] = useState<
    "email" | "chat"
  >("email");
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() =>
    load(KEYS.leaveRequests, []),
  );
  const [dailyAttendanceRecords, setDailyAttendanceRecords] = useState<
    DailyAttendanceRecord[]
  >(() => load(KEYS.dailyAttendanceRecords, []));
  const [hrDocuments, setHrDocuments] = useState<HRDocument[]>(() =>
    load(KEYS.hrDocuments, []),
  );
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() =>
    load(KEYS.payrollRecords, []),
  );
  const [performanceReviews, setPerformanceReviews] = useState<
    PerformanceReview[]
  >(() => load(KEYS.performanceReviews, []));
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>(() =>
    load(KEYS.roleDefinitions, []),
  );
  const [customFields, setCustomFields] = useState<CustomField[]>(() =>
    load(KEYS.customFields, []),
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    load(KEYS.notifications, []),
  );
  const [sops, setSops] = useState<SOP[]>(() => load(KEYS.sops, []));
  const [audits, setAudits] = useState<Audit[]>(() => load(KEYS.audits, []));
  const [activityHistory, setActivityHistory] = useState<ActivityLogItem[]>(
    () => load(KEYS.activityHistory, []),
  );

  const [appSettings, setAppSettings] = useState<AppSettings>(() =>
    load(KEYS.appSettings, {
      agencyName: "TECHINFIGO",
      defaultCurrency: "INR",
      leadsModule: {
        isEnabled: true,
        enableAutoReminders: true,
        enableNewItemNotifications: true,
        dataRetentionDays: 365,
      },
      security: { twoFactorEnabled: false, sessionTimeoutMinutes: 60 },
    }),
  );

  // Detail View States
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeModal, setActiveModal] = useState<{
    type: ModalType;
    props?: any;
  } | null>(null);
  const [activePanel, setActivePanel] = useState<{
    type: string;
    props?: any;
  } | null>(null);
  const [projectsDrawerConfig, setProjectsDrawerConfig] = useState<{
    clientId?: string;
    projectId?: string;
    mode?: "view" | "create";
  } | null>(null);

  // Navigation state for Audit module pre-filling
  const [auditPrefillData, setAuditPrefillData] = useState<any>(null);

  // --- URL Error Handling ---
  const [urlError, setUrlError] = useState<string | null>(null);
  useEffect(() => {
    window.addEventListener("error", (e: ErrorEvent) => {
      if (e.message && /Loading chunk [\d]+ failed/.test(e.message)) {
        setUrlError("A new version of the app is available. Please reload.");
      }
    });
  }, []);

  // --- Cross-Tab Sync ---
  useCrossTabSync({
    stateSetters: {
      leads: (val) =>
        setLeads(val, {
          type: "batch",
          description: "Synced from other tab",
          payload: {},
        }),
      clients: (val) =>
        setClients(val, {
          type: "batch",
          description: "Synced from other tab",
          payload: {},
        }),
      projects: (val) =>
        setProjects(val, {
          type: "batch",
          description: "Synced from other tab",
          payload: {},
        }),
      tasks: (val) =>
        setTasks(val, {
          type: "batch",
          description: "Synced from other tab",
          payload: {},
        }),
      invoices: setInvoices,
      expenses: setExpenses,
      teamMembers: setTeamMembers,
      audits: setAudits,
    },
    showToast: addToast,
  });

  // --- Diagnostics & Reminders ---
  const [catchUpTrigger, setCatchUpTrigger] = useState(0);
  const { isReminderOnCooldown } = useDiagnostics(() =>
    setCatchUpTrigger((p) => p + 1),
  );

  // Save effects (Standard)
  useEffect(() => save(KEYS.invoices, invoices), [invoices]);
  useEffect(() => save(KEYS.payments, payments), [payments]);
  useEffect(() => save(KEYS.expenses, expenses), [expenses]);
  useEffect(() => save(KEYS.emails, emails), [emails]);
  useEffect(() => save(KEYS.chatContacts, chatContacts), [chatContacts]);
  useEffect(() => save(KEYS.chatMessages, chatMessages), [chatMessages]);
  useEffect(() => save(KEYS.leaveRequests, leaveRequests), [leaveRequests]);
  useEffect(
    () => save(KEYS.dailyAttendanceRecords, dailyAttendanceRecords),
    [dailyAttendanceRecords],
  );
  useEffect(() => save(KEYS.hrDocuments, hrDocuments), [hrDocuments]);
  useEffect(() => save(KEYS.payrollRecords, payrollRecords), [payrollRecords]);
  useEffect(
    () => save(KEYS.performanceReviews, performanceReviews),
    [performanceReviews],
  );
  useEffect(() => save(KEYS.customFields, customFields), [customFields]);
  useEffect(() => save(KEYS.auditRecords, auditRecords), [auditRecords]);
  useEffect(() => save(KEYS.teamMembers, teamMembers), [teamMembers]);
  useEffect(
    () => save(KEYS.roleDefinitions, roleDefinitions),
    [roleDefinitions],
  );
  useEffect(() => save(KEYS.notifications, notifications), [notifications]);
  useEffect(() => save(KEYS.sops, sops), [sops]);
  useEffect(() => save(KEYS.audits, audits), [audits]);
  useEffect(() => save(KEYS.currentUser, currentUser), [currentUser]);
  useEffect(() => save(KEYS.appSettings, appSettings), [appSettings]);
  useEffect(
    () => save(KEYS.activityHistory, activityHistory),
    [activityHistory],
  );

  // Auth Handler
  const handleLogin = (email: string) => {
    const user = teamMembers.find((u) => u.email === email);
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
    onSignOut?.();
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
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    save(KEYS.theme, newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const hasPermission = (feature: FeatureKey, action: PermissionAction): boolean => {
    // Solo-owner / Admin always has full access.
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;

    const role = roleDefinitions.find(r => r.id === currentUser.roleId || r.name === currentUser.role);
    if (!role) return false; // fail closed: unknown role = no access, not full access

    const featurePerm = role.permissions.find(p => p.featureKey === feature);
    return Boolean(featurePerm?.currentPermissions?.[action]);
  };

  // Modal Manager Handlers
  const openModal = (type: ModalType, props?: any) => {
    setActiveModal({ type, props });
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleSelectClientForDetail = (client: Client) => {
    setSelectedClient(client);
    setCurrentView("CLIENT_DETAIL");
  };

  const handleClientDetailClose = () => {
    setSelectedClient(null);
    setCurrentView("CLIENTS");
  };

  const handleProjectDetailClose = () => {
    setSelectedProject(null);
  };

  const handleLeadDetailClose = () => {
    setSelectedLead(null);
  };

  const handleSaveFollowUp = (formData: any, leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const newLogItem = {
      ...formData,
      id: `f-${Date.now()}`,
      timestamp: new Date().toISOString(),
      addedByUserId: currentUser?.id || "system-user",
      addedByUserName: currentUser?.name || "System",
    };

    const updatedHistory = lead.followUpHistory
      ? [...lead.followUpHistory, newLogItem]
      : [newLogItem];
    const updatedLead = {
      ...lead,
      followUpHistory: updatedHistory,
    };

    setLeads(
      leads.map((l) => (l.id === leadId ? updatedLead : l)),
      {
        type: "update",
        payload: { old: lead, new: updatedLead },
        description: `Logged Activity for "${lead.name}"`,
      },
    );

    // Update active sidebar detail view state to reflect the timeline entry instantly
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(updatedLead);
    }
  };

  const closePanel = () => {
    setActivePanel(null);
  };

  // Handler for direct Audit navigation from Leads
  const handleNavigateToAuditCreate = (data: {
    type: "Lead" | "Client";
    id: string;
    name: string;
  }) => {
    setAuditPrefillData(data);
    setCurrentView("AUDITS");
  };

  // Data Handlers (Modified to use Undo/Redo setters where applicable)
  const handleSaveClient = (client: Client) => {
    // New clients arrive from the form with an empty id — assign one here,
    // otherwise every new client shares id "" and overwrites the previous one.
    if (!client.id) {
      client = {
        ...client,
        id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        dateAdded: client.dateAdded || new Date().toISOString(),
      };
    }
    const exists = clients.find((c) => c.id === client.id);
    if (exists) {
      setClients(
        clients.map((c) => (c.id === client.id ? client : c)),
        {
          type: "update",
          payload: { old: exists, new: client },
          description: `Updated client "${client.name}"`,
        },
      );
    } else {
      setClients([client, ...clients], {
        type: "create",
        payload: client,
        description: `Created client "${client.name}"`,
      });
    }
    if (selectedClient && selectedClient.id === client.id)
      setSelectedClient(client);
    closeModal();
  };

  const handleRevertClientToLead = (leadId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const clientToRemove = clients.find((c) => c.convertedFromLeadId === leadId);
    if (clientToRemove) {
      setClients(
        clients.filter((c) => c.id !== clientToRemove.id),
        {
          type: "delete",
          payload: clientToRemove,
          description: `Backtracked client "${clientToRemove.name}" to Lead`,
        }
      );
    }

    setLeads(
      leads.map((l) => (l.id === leadId ? { ...l, status: "Negotiation" as LeadStatus } : l)),
      {
        type: "update",
        payload: { old: lead, new: { ...lead, status: "Negotiation" as LeadStatus } },
        description: `Backtracked client "${lead.name}" to Negotiation status`,
      }
    );

    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status: "Negotiation" as LeadStatus } : null));
    }
    if (selectedClient?.convertedFromLeadId === leadId) {
      setSelectedClient(null);
      if (currentView === "CLIENT_DETAIL") setCurrentView("CLIENTS");
    }
  };

  const handleSaveProject = (project: Project) => {
    const exists = projects.find((p) => p.id === project.id);
    const projectWithId = {
      ...project,
      id: project.id || `proj-${Date.now()}`,
    };

    if (exists) {
      setProjects(
        projects.map((p) => (p.id === projectWithId.id ? projectWithId : p)),
        {
          type: "update",
          payload: { old: exists, new: projectWithId },
          description: `Updated project "${project.name}"`,
        },
      );
    } else {
      setProjects([projectWithId, ...projects], {
        type: "create",
        payload: projectWithId,
        description: `Created project "${project.name}"`,
      });
    }
    if (selectedProject && selectedProject.id === projectWithId.id)
      setSelectedProject(projectWithId);
    closeModal();
  };

  const handleSaveCampaign = (campaign: Campaign) => {
    setCampaigns((prev) => {
      const exists = prev.find((c) => c.id === campaign.id);
      if (exists) return prev.map((c) => (c.id === campaign.id ? campaign : c));
      return [campaign, ...prev];
    });
    closeModal();
  };

  const handleSaveInvoice = (invoice: Omit<Invoice, 'clientName' | 'invoiceNumber'> & { id?: string; invoiceNumber?: string; clientName?: string }) => {
    setInvoices((prev) => {
      const exists = prev.find((i) => i.id === invoice.id || (invoice.invoiceNumber && i.invoiceNumber === invoice.invoiceNumber));
      
      const invoiceClientName = invoice.clientName || clients.find(c => c.id === invoice.clientId)?.name || 'Unknown Client';
      
      let finalInvoiceNumber = invoice.invoiceNumber;
      if (!finalInvoiceNumber) {
        if (exists) {
          finalInvoiceNumber = exists.invoiceNumber;
        } else {
          const invoiceNums = prev
            .map((i) => i.invoiceNumber)
            .filter((num) => typeof num === 'string' && /^\d+$/.test(num));

          let maxNum = 1035;
          invoiceNums.forEach((num) => {
            const val = parseInt(num, 10);
            if (!isNaN(val) && val > maxNum) {
              maxNum = val;
            }
          });
          finalInvoiceNumber = String(maxNum + 1);
        }
      }

      const invoiceWithId: Invoice = {
        ...invoice,
        id: invoice.id || `inv-${Date.now()}`,
        invoiceNumber: finalInvoiceNumber,
        clientName: invoiceClientName,
      } as Invoice;

      if (exists) {
        return prev.map((i) => (i.id === exists.id ? invoiceWithId : i));
      }
      return [invoiceWithId, ...prev];
    });
    closeModal();
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
  };

  const handleRecordPayment = (paymentData: PaymentFormData) => {
    const invoice = invoices.find((i) => i.id === paymentData.invoiceId);
    const newPayment: Payment = {
      id: `payment-${Date.now()}`,
      invoiceId: paymentData.invoiceId,
      amount: parseFloat(paymentData.amount),
      paymentDate: new Date(paymentData.paymentDate).toISOString(),
      paymentMethod: paymentData.paymentMethod,
      notes: paymentData.notes,
    };

    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);

    if (invoice) {
      const totalPaid = updatedPayments
        .filter((p) => p.invoiceId === invoice.id)
        .reduce((sum, p) => sum + p.amount, 0);
      const grandTotal = calculateInvoiceGrandTotal(invoice);
      if (totalPaid >= grandTotal && invoice.status !== "Paid") {
        setInvoices((prev) =>
          prev.map((i) =>
            i.id === invoice.id ? { ...i, status: "Paid" as InvoiceStatus } : i,
          ),
        );
      }
    }

    closeModal();
    addToast({
      title: "Payment Recorded",
      description: `Payment of ${newPayment.amount.toLocaleString()} recorded for invoice ${invoice?.invoiceNumber || ""}.`,
    });
  };

  const handleSendInvoice = (
    invoiceId: string,
    emailData: { subject: string; body: string },
  ) => {
    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;
    const client = clients.find((c) => c.id === invoice.clientId);
    const recipientEmail = client?.email;
    if (!recipientEmail) {
      addToast({
        title: "Missing Email Address",
        description: "This client has no email address on file.",
      });
      return;
    }

    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.location.href = mailtoUrl;

    if (invoice.status !== "Paid") {
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === invoiceId ? { ...i, status: "Sent" as InvoiceStatus } : i,
        ),
      );
    }

    const newEmail: EmailMessage = {
      id: `email-${Date.now()}`,
      senderName: currentUser?.name || "Unknown",
      senderEmail: currentUser?.email || "",
      recipientEmail,
      subject: emailData.subject,
      body: emailData.body,
      timestamp: new Date().toISOString(),
      folder: "sent",
      isRead: true,
    };
    setEmails((prev) => [newEmail, ...prev]);

    closeModal();
    addToast({
      title: "Opening your email app",
      description: "Review and hit send there to deliver the invoice.",
    });
  };

  const handleSendProposal = (
    proposal: Proposal,
    emailData: { subject: string; body: string; to: string },
  ) => {
    if (!emailData.to) {
      addToast({
        title: "Missing Email Address",
        description: "This client has no email address on file.",
      });
      return;
    }

    const mailtoUrl = `mailto:${encodeURIComponent(emailData.to)}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.location.href = mailtoUrl;

    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposal.id
          ? {
              ...p,
              status: "SentToClient" as ProposalStatus,
              lastUpdatedDate: new Date().toISOString(),
            }
          : p,
      ),
    );

    const newEmail: EmailMessage = {
      id: `email-${Date.now()}`,
      senderName: currentUser?.name || "Unknown",
      senderEmail: currentUser?.email || "",
      recipientEmail: emailData.to,
      subject: emailData.subject,
      body: emailData.body,
      timestamp: new Date().toISOString(),
      folder: "sent",
      isRead: true,
    };
    setEmails((prev) => [newEmail, ...prev]);

    closeModal();
    addToast({
      title: "Opening your email app",
      description: "Review and hit send there to deliver the proposal.",
    });
  };

  const handleSendAuditReport = (lead: Lead, auditRecord: AuditRecord) => {
    const recipientEmail = lead?.email;
    if (!recipientEmail) {
      addToast({
        title: "Missing Email Address",
        description: "No email address is on file for this contact.",
      });
      return;
    }

    const scoreText =
      auditRecord.aiOverallScore !== undefined
        ? `${auditRecord.aiOverallScore}/100`
        : "N/A";
    const summaryText =
      auditRecord.overallSummary || "No executive summary provided.";
    const subject = `Marketing Audit Report for ${lead.name}`;
    const body = `Hi ${lead.name},\n\nPlease find a summary of your marketing audit below.\n\nOverall Score: ${scoreText}\n\nExecutive Summary:\n${summaryText}\n\nBest regards,\n${currentUser?.name || "The Team"}`;

    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;

    const newEmail: EmailMessage = {
      id: `email-${Date.now()}`,
      senderName: currentUser?.name || "Unknown",
      senderEmail: currentUser?.email || "",
      recipientEmail,
      subject,
      body,
      timestamp: new Date().toISOString(),
      folder: "sent",
      isRead: true,
    };
    setEmails((prev) => [newEmail, ...prev]);

    closeModal();
    addToast({
      title: "Opening your email app",
      description: "Review and hit send there to deliver the audit report.",
    });
  };

  const handleProcessRecurringInvoices = () => {
    const today = new Date();
    
    // Helper to calculate same day
    const sameDay = (d1: string | Date, d2: string | Date) => {
      return new Date(d1).toDateString() === new Date(d2).toDateString();
    };

    // Helper to get matching occurrence dates for a recurring invoice
    const getNextOccurrences = (invoice: Invoice, referenceDate: Date): Date[] => {
      if (!invoice.isRecurring || !invoice.issueDate || !invoice.recurrenceFrequency) {
        return [];
      }
      
      const occurrences: Date[] = [];
      const origDate = new Date(invoice.issueDate);
      const endDate = invoice.recurrenceEndDate ? new Date(invoice.recurrenceEndDate) : null;
      
      let current = new Date(origDate);
      let cycle = 1;
      const maxIterations = 200; // safety ceiling
      
      while (cycle < maxIterations) {
        if (invoice.recurrenceFrequency === 'Weekly') {
          current.setDate(current.getDate() + 7);
        } else if (invoice.recurrenceFrequency === 'Monthly') {
          current.setMonth(current.getMonth() + 1);
        } else if (invoice.recurrenceFrequency === 'Quarterly') {
          current.setMonth(current.getMonth() + 3);
        } else if (invoice.recurrenceFrequency === 'Yearly') {
          current.setFullYear(current.getFullYear() + 1);
        } else {
          break;
        }
        
        if (current > referenceDate) {
          break;
        }
        if (endDate && current > endDate) {
          break;
        }
        
        occurrences.push(new Date(current));
        cycle++;
      }
      
      return occurrences;
    };

    // 1. Identify all pending generations
    const pendingGenerations: {
      parentInvoice: Invoice;
      occurrenceDate: Date;
    }[] = [];

    invoices.forEach((parent) => {
      if (parent.isRecurring) {
        const occurrences = getNextOccurrences(parent, today);
        occurrences.forEach((occDate) => {
          const alreadyCreated = invoices.some((child) => 
            child.parentInvoiceId === parent.id && 
            child.parentOccurrenceDate && 
            sameDay(child.parentOccurrenceDate, occDate)
          );
          if (!alreadyCreated) {
            pendingGenerations.push({
              parentInvoice: parent,
              occurrenceDate: occDate,
            });
          }
        });
      }
    });

    if (pendingGenerations.length === 0) {
      openModal("CONFIRMATION", {
        title: "All Recurring Invoices Up-to-Date",
        message: (
          <p className="text-slate-600 dark:text-slate-300">
            No new invoices need processing for the current cycle. All recurrences are already generated and up to date.
          </p>
        ),
        confirmLabel: "OK",
        cancelLabel: "Close",
        variant: "info",
        onConfirm: () => {},
      });
      return;
    }

    // Helper to generate sequential next invoice numbers
    const invoiceNums = invoices
      .map((i) => i.invoiceNumber)
      .filter((num) => /^\d+$/.test(num));

    let maxNum = 1035;
    invoiceNums.forEach((num) => {
      const val = parseInt(num, 10);
      if (!isNaN(val) && val > maxNum) {
        maxNum = val;
      }
    });

    const nextInvoiceNumbers = pendingGenerations.map((_, idx) => {
      return String(maxNum + 1 + idx);
    });

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: appSettings?.defaultCurrency || 'INR',
      }).format(amount);
    };

    // Construct detailed modal display message
    const message = (
      <div className="space-y-4">
        <p className="font-medium text-slate-700 dark:text-slate-200">
          We found <strong className="text-blue-600 dark:text-blue-400">{pendingGenerations.length}</strong> new invoice(s) due to be generated:
        </p>
        <div className="max-h-60 overflow-y-auto space-y-3 border border-slate-200 dark:border-slate-700 rounded-md p-3 divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          {pendingGenerations.map((gen, idx) => {
            const nextNum = nextInvoiceNumbers[idx];
            // Calculate parent total
            const subTotal = gen.parentInvoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
            let discount = 0;
            if (gen.parentInvoice.discountType === 'Percentage' && gen.parentInvoice.discountValue) {
              discount = subTotal * (gen.parentInvoice.discountValue / 100);
            } else if (gen.parentInvoice.discountType === 'Fixed' && gen.parentInvoice.discountValue) {
              discount = gen.parentInvoice.discountValue;
            }
            const afterDiscount = Math.max(0, subTotal - discount);
            const tax = gen.parentInvoice.taxRate ? afterDiscount * (gen.parentInvoice.taxRate / 100) : 0;
            const grandTotal = afterDiscount + tax;

            return (
              <div key={idx} className="pt-3 first:pt-0 flex justify-between items-start text-xs text-slate-600 dark:text-slate-400">
                <div className="space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {nextNum} <span className="font-normal text-slate-500 text-xs">(From template {gen.parentInvoice.invoiceNumber})</span>
                  </div>
                  <div>Client: <strong className="text-slate-700 dark:text-slate-300">{gen.parentInvoice.clientName || 'Unknown Client'}</strong></div>
                  <div>Frequency: <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-full font-medium">{gen.parentInvoice.recurrenceFrequency}</span></div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                   Due Issue: {gen.occurrenceDate.toLocaleDateString()}
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Amount: {formatCurrency(grandTotal)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          The system will copy all line items, client specs, taxation, and payment terms of the templates. Each new invoice will be spawned in <strong className="text-slate-700 dark:text-slate-300">"Draft"</strong> status ready for review.
        </p>
      </div>
    );

    openModal("CONFIRMATION", {
      title: "Process Recurring Invoices",
      message: message,
      confirmLabel: "Generate Invoices",
      cancelLabel: "Cancel",
      variant: "info",
      onConfirm: () => {
        // Execute generation
        const newInvoices: Invoice[] = pendingGenerations.map((gen, idx) => {
          const nextNum = nextInvoiceNumbers[idx];
          
          const origIssue = new Date(gen.parentInvoice.issueDate);
          const origDue = new Date(gen.parentInvoice.dueDate);
          const diffMs = origDue.getTime() - origIssue.getTime();
          const nextDue = new Date(gen.occurrenceDate.getTime() + (diffMs > 0 ? diffMs : 14 * 86400000));

          return {
            ...gen.parentInvoice,
            id: `inv-rec-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            invoiceNumber: nextNum,
            issueDate: gen.occurrenceDate.toISOString(),
            dueDate: nextDue.toISOString(),
            status: "Draft", // Create in Draft status
            isRecurring: false, // Child shouldn't itself act as a recurring parent
            parentInvoiceId: gen.parentInvoice.id,
            parentOccurrenceDate: gen.occurrenceDate.toISOString(),
            activityLog: [
              {
                timestamp: new Date().toISOString(),
                action: `Automatically generated from recurring parent ${gen.parentInvoice.invoiceNumber}`,
                actorName: "System",
              },
            ],
          };
        });

        setInvoices((prev) => [...newInvoices, ...prev]);

        addToast({
          title: "Processing Successful",
          description: `Successfully processed and created ${newInvoices.length} recurring invoice(s).`,
        });
      },
    });
  };

  const handleSaveExpense = (expense: Expense) => {
    setExpenses((prev) => {
      const exists = prev.find((e) => e.id === expense.id);
      const expenseWithId = {
        ...expense,
        id: expense.id || `exp-${Date.now()}`,
      };

      if (exists)
        return prev.map((e) => (e.id === expenseWithId.id ? expenseWithId : e));
      return [...prev, expenseWithId];
    });
    closeModal();
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  const handleSaveAudit = (audit: MarketingAuditRequest) => {
    setMarketingAudits((prev) => {
      const exists = prev.find((a) => a.id === audit.id);
      if (exists) return prev.map((a) => (a.id === audit.id ? audit : a));
      return [audit, ...prev];
    });
    closeModal();
  };

  const handleSaveAuditRecord = (auditData: AuditRecord, leadId: string) => {
    setAuditRecords((prev) => {
      const exists = prev.find((a) => a.id === auditData.id);
      if (exists)
        return prev.map((a) => (a.id === auditData.id ? auditData : a));
      return [auditData, ...prev];
    });
    // Update lead with auditRecordId
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      const updatedLead = {
        ...lead,
        auditRecordId: auditData.id,
        status: "Audit Complete" as const,
      };
      setLeads(
        leads.map((l) => (l.id === leadId ? updatedLead : l)),
        {
          type: "update",
          payload: { old: lead, new: updatedLead },
          description: `Updated lead status to Audit Complete`,
        },
      );
    }
    closeModal();
  };

  const handleSaveTask = (task: Task) => {
    if (currentUid) saveTaskToCloud(currentUid, task);
    const exists = tasks.find((t) => t.id === task.id);
    if (exists) {
      setTasks(
        tasks.map((t) => (t.id === task.id ? task : t)),
        {
          type: "update",
          payload: { old: exists, new: task },
          description: `Updated task "${task.title}"`,
        },
      );
    } else {
      setTasks([task, ...tasks], {
        type: "create",
        payload: task,
        description: `Created task "${task.title}"`,
      });
    }

    // Also update tasks embedded in projects for data consistency (Simplified: assuming task form handles global/project link)
    if (task.projectId) {
      const project = projects.find((p) => p.id === task.projectId);
      if (project) {
        const taskExists = project.tasks.some((t) => t.id === task.id);
        const updatedTasks = taskExists
          ? project.tasks.map((t) => (t.id === task.id ? task : t))
          : [...project.tasks, task];
        const updatedProject = { ...project, tasks: updatedTasks };
        setProjects(
          projects.map((p) => (p.id === project.id ? updatedProject : p)),
          {
            type: "update",
            payload: { old: project, new: updatedProject },
            description: `Updated project tasks`,
          },
        );
        if (selectedProject && selectedProject.id === project.id)
          setSelectedProject(updatedProject);
      }
    }
    closeModal();
  };

  const handleBatchUpdateProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects, {
      type: "batch",
      payload: {},
      description: "Batch updated projects",
    });
  };

  const handleSendMessage = (contactId: string, text: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      contactId,
      senderId: "me",
      text,
      timestamp: new Date().toISOString(),
      status: "sent",
    };
    setChatMessages((prev) => [...prev, newMessage]);
    setChatContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? {
              ...c,
              lastMessage: text,
              lastMessageTimestamp: newMessage.timestamp,
            }
          : c,
      ),
    );
  };

  const handleSaveEmail = async (
    emailData: Partial<EmailMessage>,
    action: "send" | "draft",
  ) => {
    const newEmail: EmailMessage = {
      ...emailData,
      id: emailData.id || `email-${Date.now()}`,
      senderName: currentUser?.name || "Unknown",
      timestamp: new Date().toISOString(),
      folder: action === "send" ? "sent" : "drafts",
      isRead: true,
    } as EmailMessage;
    setEmails((prev) => [newEmail, ...prev]);
    return true;
  };

  const handleSaveLeaveRequest = (request: LeaveRequest) => {
    setLeaveRequests((prev) => {
      const exists = prev.find((r) => r.id === request.id);
      if (exists) return prev.map((r) => (r.id === request.id ? request : r));
      return [request, ...prev];
    });
    closeModal();
  };

  const handleDeleteTeamMemberHR = (memberId: string) => {
    const member = teamMembers.find((m) => m.id === memberId);
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
    addToast({
      title: "HR Record Deleted",
      description: `${member?.name || "The team member"}'s HR record has been removed.`,
    });
  };

  const handleUpdateLeaveStatus = (
    requestId: string,
    status: LeaveRequestStatus,
    adminNotes?: string,
  ) => {
    setLeaveRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? {
              ...req,
              status,
              adminNotes,
              reviewedByUserId: currentUser?.id,
              reviewedDate: new Date().toISOString(),
            }
          : req,
      ),
    );
    addToast({
      title: `Leave ${status}`,
      description: `The leave request has been ${status.toLowerCase()}.`,
    });
  };

  const handleCancelLeaveRequest = (requestId: string) => {
    setLeaveRequests((prev) =>
      prev.map((req) =>
        req.id === requestId
          ? { ...req, status: "CancelledByEmployee" as LeaveRequestStatus }
          : req,
      ),
    );
    addToast({
      title: "Leave Cancelled",
      description: "Your leave request has been cancelled.",
    });
  };

  const handleScheduleExitInterview = (
    employeeId: string,
    dateTime: string,
    notes: string,
  ) => {
    const member = teamMembers.find((m) => m.id === employeeId);
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === employeeId
          ? { ...m, exitInterviewScheduledAt: dateTime, exitInterviewNotes: notes }
          : m,
      ),
    );
    addToast({
      title: "Exit Interview Scheduled",
      description: `Scheduled for ${member?.name || "the employee"} on ${new Date(dateTime).toLocaleString()}.`,
    });
  };

  const handleRunBulkPayroll = (monthYear: string) => {
    const activeMembers = teamMembers.filter((m) => m.hrStatus === "Active");
    const membersNeedingPayroll = activeMembers.filter(
      (member) =>
        !payrollRecords.some(
          (r) => r.employeeId === member.id && r.monthYear === monthYear,
        ),
    );
    if (membersNeedingPayroll.length === 0) {
      addToast({
        title: "Bulk Payroll",
        description:
          "All active employees already have payroll records for this period.",
      });
      return;
    }
    const newRecords: PayrollRecord[] = membersNeedingPayroll.map((member) => {
      const baseSalary = member.monthlySalary || 0;
      return {
        id: `payroll-${member.id}-${monthYear}`,
        employeeId: member.id,
        monthYear,
        baseSalary,
        bonuses: 0,
        deductions: 0,
        netSalary: baseSalary,
        status: "Pending",
      };
    });
    setPayrollRecords((prev) => [...prev, ...newRecords]);
    addToast({
      title: "Bulk Payroll Generated",
      description: `Generated payroll for ${newRecords.length} employee(s).`,
    });
  };

  const handleSaveHRDocument = (
    docData: Omit<HRDocument, "id" | "uploadedByUserId" | "uploadedByUserName">,
  ) => {
    const newDoc: HRDocument = {
      ...docData,
      id: `hrdoc-${Date.now()}`,
      uploadedByUserId: currentUser?.id || "",
      uploadedByUserName: currentUser?.name || "",
    };
    setHrDocuments((prev) => [...prev, newDoc]);
    closeModal();
  };

  const handleSavePerformanceReview = (review: PerformanceReview) => {
    setPerformanceReviews((prev) => {
      const exists = prev.find((r) => r.id === review.id);
      if (exists) return prev.map((r) => (r.id === review.id ? review : r));
      return [review, ...prev];
    });
    closeModal();
  };

  const handleSaveProposal = (proposalData: Partial<Proposal>) => {
    // A proposal's `clientId` may point at either a Client or a Lead.
    const recipientName =
      clients.find((c) => c.id === proposalData.clientId)?.name ||
      leads.find((l) => l.id === proposalData.clientId)?.name ||
      undefined;

    setProposals((prev) => {
      if (proposalData.id) {
        return prev.map((p) =>
          p.id === proposalData.id
            ? ({
                ...p,
                ...proposalData,
                clientName: recipientName ?? p.clientName,
                status: proposalData.status || p.status || "Draft",
                lastUpdatedDate: new Date().toISOString(),
              } as Proposal)
            : p,
        );
      }
      return [
        ...prev,
        {
          ...proposalData,
          clientName: recipientName,
          status: proposalData.status || "Draft",
          id: `prop-${Date.now()}`,
          proposalNumber: `PROP-${Date.now()}`,
          version: 1,
          generatedDate: new Date().toISOString(),
          lastUpdatedDate: new Date().toISOString(),
        } as Proposal,
      ];
    });
    closeModal();
    if (activePanel?.type === "CREATE_PROPOSAL") closePanel();
  };

  const handleSaveSOP = (sop: SOP) => {
    setSops((prev) => {
      const exists = prev.find((s) => s.id === sop.id);
      if (exists) return prev.map((s) => (s.id === sop.id ? sop : s));
      return [sop, ...prev];
    });
    closeModal();
  };

  const handleSaveNewAudit = (audit: Audit) => {
    setAudits((prev) => {
      const exists = prev.find((a) => a.id === audit.id);
      if (exists) return prev.map((a) => (a.id === audit.id ? audit : a));
      return [audit, ...prev];
    });
  };

  const handleSaveCustomField = (field: CustomField) => {
    setCustomFields((prev) => {
      const exists = prev.find((f) => f.id === field.id);
      if (exists) return prev.map((f) => (f.id === field.id ? field : f));
      return [...prev, { ...field, id: `cf-${Date.now()}` }];
    });
    closeModal();
  };

  const handleDeleteCustomField = (fieldId: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  const handleToast = (options: ToastData) => {
    addToast(options);
  };

  const handleExportData = () => {
    const dataToExport: Omit<BackupData, "version"> = {
      appSettings,
      clients,
      invoices,
      leads,
      projects,
      tasks,
      teamMembers,
      expenses,
      payments,
      activityHistory,
      auditRecords,
      marketingAudits,
      proposals,
      clientDocuments,
      onboardingKickoffData,
      campaigns,
      integrationPlatforms: [],
      emails,
      chatContacts,
      chatMessages,
      leaveRequests,
      dailyAttendanceRecords,
      performanceReviews,
      hrDocuments,
      payrollRecords,
      roleDefinitions,
      apiKeys: [],
      webhooks: [],
      emailTemplates: [],
      customFields,
      timeLogs: [],
      savedViews: [],
      notifications,
      sops,
      audits,
    };
    const jsonString = exportData(dataToExport);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `crm_backup_${new Date().toISOString()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (jsonString: string) => {
    const result = validateBackupFile(jsonString);
    if ("error" in result) {
      alert(result.error);
      return;
    }
    openModal("IMPORT_CONFIRMATION", {
      summary: result.summary,
      onConfirmImport: (mode: "replace" | "merge") => {
        const currentData: Omit<BackupData, "version"> = {
          appSettings,
          clients,
          invoices,
          leads,
          projects,
          tasks,
          teamMembers,
          expenses,
          payments,
          activityHistory,
          auditRecords,
          marketingAudits,
          proposals,
          clientDocuments,
          onboardingKickoffData,
          campaigns,
          integrationPlatforms: [],
          emails,
          chatContacts,
          chatMessages,
          leaveRequests,
          dailyAttendanceRecords,
          performanceReviews,
          hrDocuments,
          payrollRecords,
          roleDefinitions,
          apiKeys: [],
          webhooks: [],
          emailTemplates: [],
          customFields,
          timeLogs: [],
          savedViews: [],
          notifications,
          sops,
          audits,
        };
        const newData = processImportData(
          result.summary.data,
          currentData,
          mode,
        );

        if (newData.appSettings) setAppSettings(newData.appSettings);
        if (newData.clients)
          setClients(newData.clients, {
            type: "batch",
            payload: {},
            description: "Imported Clients",
          });
        if (newData.invoices) setInvoices(newData.invoices);
        if (newData.payments) setPayments(newData.payments);
        if (newData.leads)
          setLeads(newData.leads, {
            type: "batch",
            payload: {},
            description: "Imported Leads",
          });
        if (newData.projects)
          setProjects(newData.projects, {
            type: "batch",
            payload: {},
            description: "Imported Projects",
          });
        if (newData.tasks)
          setTasks(newData.tasks, {
            type: "batch",
            payload: {},
            description: "Imported Tasks",
          });
        if (newData.teamMembers) setTeamMembers(newData.teamMembers);
        if (newData.expenses) setExpenses(newData.expenses);
        if (newData.marketingAudits)
          setMarketingAudits(newData.marketingAudits);
        if (newData.auditRecords) setAuditRecords(newData.auditRecords);
        if (newData.proposals) setProposals(newData.proposals);
        if (newData.clientDocuments)
          setClientDocuments(newData.clientDocuments);
        if (newData.onboardingKickoffData)
          setOnboardingKickoffData(newData.onboardingKickoffData);
        if (newData.campaigns) setCampaigns(newData.campaigns);
        if (newData.emails) setEmails(newData.emails);
        if (newData.chatContacts) setChatContacts(newData.chatContacts);
        if (newData.chatMessages) setChatMessages(newData.chatMessages);
        if (newData.leaveRequests) setLeaveRequests(newData.leaveRequests);
        if (newData.dailyAttendanceRecords)
          setDailyAttendanceRecords(newData.dailyAttendanceRecords);
        if (newData.hrDocuments) setHrDocuments(newData.hrDocuments);
        if (newData.payrollRecords) setPayrollRecords(newData.payrollRecords);
        if (newData.performanceReviews)
          setPerformanceReviews(newData.performanceReviews);
        if (newData.roleDefinitions)
          setRoleDefinitions(newData.roleDefinitions);
        if (newData.customFields) setCustomFields(newData.customFields);
        if (newData.notifications) setNotifications(newData.notifications);
        if (newData.sops) setSops(newData.sops);
        if (newData.audits) setAudits(newData.audits);

        closeModal();
        addToast({
          title: "Import Successful",
          description: `Data imported successfully in ${mode} mode.`,
        });
      },
    });
  };

  // --- Computed Data for Views ---
  const allTasks = useMemo(
    () => getAllTasks(projects, tasks, teamMembers, leads, clients),
    [projects, tasks, teamMembers, leads, clients],
  );

  // --- Reminder System Hook ---
  useReminders({
    tasks: allTasks,
    updateTask: (taskId, updates) => {
      // Helper to find if task is project or global and update accordingly
      const projectTask = projects
        .flatMap((p) => p.tasks)
        .find((t) => t.id === taskId);
      if (projectTask) {
        const project = projects.find((p) =>
          p.tasks.some((t) => t.id === taskId),
        );
        if (project) {
          const updatedTasks = project.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t,
          );
          handleSaveProject({ ...project, tasks: updatedTasks });
        }
      } else {
        const task = tasks.find((t) => t.id === taskId);
        if (task) handleSaveTask({ ...task, ...updates });
      }
    },
    hydrated: true,
    onReminderFired: (task) => {
      addToast({
        title: "Task Reminder",
        description: `Reminder: ${task.title}`,
        actions: [
          { label: "Open", onClick: () => openModal("TASK_FORM", { task }) },
        ],
      });
      // Add to notifications list
      setNotifications((prev) => [
        {
          id: `notif-rem-${Date.now()}`,
          type: "info",
          title: "Task Reminder",
          message: task.title,
          timestamp: new Date().toISOString(),
          isRead: false,
          severity: "Medium",
          icon: null, // Can pass icon here if needed
          taskId: task.id,
        },
        ...prev,
      ]);
    },
    globalSnoozeUntil: load(KEYS.globalSnoozeUntil, null),
    onOpenTask: (task) => openModal("TASK_FORM", { task }),
    currentUserId: currentUser?.id,
    isReminderOnCooldown: isReminderOnCooldown,
    catchUpSweepTrigger: catchUpTrigger,
  });

  // Helper to determine main content wrapper classes based on view
  // Removed 'PROJECTS' from here as requested in previous turn to fix margin issues
  const isFullHeightView = ["CALENDAR"].includes(currentView);

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case "DASHBOARD":
        return (
          <DashboardView
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
            proposals={proposals}
            audits={audits}
            dashboardSuggestions={[]}
            onOpenCampaignReportModal={(c) =>
              openModal("CAMPAIGN_REPORT", { campaign: c })
            }
            currentUser={currentUser}
            onOpenLeadFormModal={() => openModal("LEAD_FORM")}
            onOpenClientFormModal={() => openModal("CLIENT_FORM")}
            onOpenProjectFormModal={() => openModal("PROJECT_FORM")}
            onOpenInvoiceModal={() => openModal("INVOICE_FORM")}
            onOpenExpenseModal={() => openModal("EXPENSE_FORM")}
            onOpenPaymentModal={() => openModal("PAYMENT_FORM")}
            onOpenTimeLogModal={(log, defaults) =>
              openModal("TIME_LOG_FORM", { timeLog: log, ...defaults })
            }
            onOpenTaskModal={() => openModal("TASK_FORM")}
            onMarkTaskAsDone={() => {}}
            onOpenEmailComposeModal={(email) =>
              openModal("EMAIL_COMPOSE", { initialEmail: email })
            }
            onSelectClientForDetail={handleSelectClientForDetail}
            allTasks={allTasks}
            onSelectTask={(t) => openModal("TASK_FORM", { task: t })}
          />
        );
      case "COMMUNICATION":
        return (
          <CommunicationView
            emails={emails}
            chatContacts={chatContacts}
            chatMessages={chatMessages}
            currentUser={currentUser}
            activeTab={activeCommunicationTab}
            setActiveTab={setActiveCommunicationTab}
            hasPermission={hasPermission}
            onOpenComposeModal={(email) =>
              openModal("EMAIL_COMPOSE", { initialEmail: email })
            }
            onOpenViewEmailModal={(email) =>
              openModal("VIEW_EMAIL", { emailMessage: email })
            }
            onMoveToTrash={() => {}}
            onDeletePermanently={() => {}}
            onToggleStar={() => {}}
            onSendMessage={handleSendMessage}
            onMarkContactAsRead={(id) =>
              setChatContacts((prev) =>
                prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
              )
            }
          />
        );
      case "LEADS":
        return (
          <LeadsView
            leads={leads}
            auditRecords={auditRecords}
            teamMembers={teamMembers}
            onAddLead={() => openModal("LEAD_FORM")}
            onEditLead={(l) => openModal("LEAD_FORM", { lead: l })}
            onDeleteLead={(id) => {
              setLeads(
                leads.filter((l) => l.id !== id),
                {
                  type: "delete",
                  payload: leads.find((l) => l.id === id)!,
                  description: "Deleted lead",
                },
              );
            }}
            onUpdateStatus={(id, status) => {
              const lead = leads.find((l) => l.id === id);
              if (lead)
                setLeads(
                  leads.map((l) => (l.id === id ? { ...l, status } : l)),
                  {
                    type: "update",
                    payload: { old: lead, new: { ...lead, status } },
                    description: `Updated lead status to ${status}`,
                  },
                );
            }}
            onCreateProposal={(leadId) => {
              const lead = leads.find((l) => l.id === leadId);
              if (lead)
                openModal("PROPOSAL_FORM", { prefillClientId: leadId });
            }}
            hasPermission={hasPermission}
            onImportLeads={(leadsToImport) => {
              setLeads([...leadsToImport, ...leads], {
                type: "batch",
                payload: {},
                description: `Imported ${leadsToImport.length} leads`,
              });
              return leadsToImport.length;
            }}
            onSelectLeadForDetail={setSelectedLead}
            onOpenAuditFormModal={(l) => openModal("AUDIT_FORM", { lead: l })}
            onOpenAuditReportModal={(l, ar) =>
              openModal("AUDIT_REPORT", { lead: l, auditRecord: ar })
            }
            onOpenFollowUpModal={(l, initialNote) =>
              openModal("FOLLOW_UP", { lead: l, initialNote })
            }
            onOpenEmailComposeModal={(l) =>
              openModal("EMAIL_COMPOSE", {
                initialEmail: { recipientEmail: l.email },
              })
            }
            onNavigateToAuditCreate={handleNavigateToAuditCreate}
          />
        );
      case "CLIENTS":
        return (
          <ClientsView
            clients={clients}
            invoices={invoices}
            projects={projects}
            marketingAudits={marketingAudits}
            onViewAuditDetail={(a) =>
              openModal("AUDIT_REPORT", { auditRecord: a })
            }
            onAddClient={() => openModal("CLIENT_FORM")}
            onEditClient={(c) => openModal("CLIENT_FORM", { client: c })}
            onDeleteClient={(id) => {
              setClients(
                clients.filter((c) => c.id !== id),
                {
                  type: "delete",
                  payload: clients.find((c) => c.id === id)!,
                  description: "Deleted client",
                },
              );
            }}
            hasPermission={hasPermission}
            onSelectClientForDetail={handleSelectClientForDetail}
            onOpenProjectsDrawer={(config) =>
              setProjectsDrawerConfig(config || { mode: "view" })
            }
          />
        );
      case "CLIENT_DETAIL":
        if (!selectedClient) return null;
        return (
          <ClientDetailView
            onClose={handleClientDetailClose}
            client={selectedClient}
            projects={projects.filter((p) => p.clientId === selectedClient.id)}
            campaigns={campaigns.filter(
              (c) => c.clientId === selectedClient.id,
            )}
            invoices={invoices.filter((i) => i.clientId === selectedClient.id)}
            marketingAudits={marketingAudits.filter(
              (a) => a.clientId === selectedClient.id,
            )}
            proposals={proposals.filter(
              (p) => p.clientId === selectedClient.id,
            )}
            audits={audits.filter(
              (a) =>
                a.entityType === "Client" && a.entityId === selectedClient.id,
            )}
            clientDocuments={clientDocuments.filter(
              (d) => d.clientId === selectedClient.id,
            )}
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
            onOpenProjectModal={(p) =>
              openModal("PROJECT_FORM", {
                project: p,
                prefillClientId: selectedClient.id,
              })
            }
            onOpenCampaignModal={(c) =>
              openModal("CAMPAIGN_FORM", {
                campaign: c,
                prefillClientId: selectedClient.id,
              })
            }
            onOpenInvoiceModal={(i, prefillClient) =>
              openModal("INVOICE_FORM", { invoice: i, client: prefillClient })
            }
            onOpenInvoiceDetailPanel={(i) =>
              setActivePanel({
                type: "INVOICE_DETAIL_PANEL",
                props: { invoice: i },
              })
            }
            onOpenProjectDetail={setSelectedProject}
            onOpenCampaignReportModal={(c) =>
              openModal("CAMPAIGN_REPORT", { campaign: c })
            }
            onOpenAuditDetailModal={(a) =>
              openModal("AUDIT_REPORT", { auditRecord: a })
            }
            onOpenAuditRequestModal={(req, prefillClient) =>
              openModal("AUDIT_FORM", {
                auditRequest: req,
                client: prefillClient,
              })
            }
            onAddClientDocument={() => {}}
            onDeleteClientDocument={() => {}}
            onUpdateProject={handleSaveProject}
            onBatchUpdateProjects={handleBatchUpdateProjects}
            onDeleteProject={(id) => {
              setProjects(
                projects.filter((p) => p.id !== id),
                {
                  type: "delete",
                  payload: projects.find((p) => p.id === id)!,
                  description: "Deleted project",
                },
              );
            }}
            onUpdateInvoiceStatus={(id, status) =>
              setInvoices(
                invoices.map((i) => (i.id === id ? { ...i, status } : i)),
              )
            }
            onDeleteInvoice={handleDeleteInvoice}
            onProcessRecurringInvoices={handleProcessRecurringInvoices}
            onRevertClientToLead={handleRevertClientToLead}
            tasks={allTasks}
          />
        );
      case "PROJECTS":
        return (
          <ProjectsView
            projects={projects}
            clients={clients}
            teamMembers={teamMembers}
            currentUser={currentUser}
            onOpenProjectFormModal={(p) =>
              openModal("PROJECT_FORM", { project: p })
            }
            onDeleteProject={(id) => {
              setProjects(
                projects.filter((p) => p.id !== id),
                {
                  type: "delete",
                  payload: projects.find((p) => p.id === id)!,
                  description: "Deleted project",
                },
              );
            }}
            onViewProjectDetail={setSelectedProject}
            hasPermission={hasPermission}
            onUpdateProject={handleSaveProject}
            onBatchUpdateProjects={handleBatchUpdateProjects}
          />
        );
      case "TASKS":
      case "MY_TASKS":
        return (
          <MyTasksView
            tasks={allTasks}
            projects={projects}
            teamMembers={teamMembers}
            currentUser={currentUser}
            onMarkTaskAsDone={(taskId) => {
              const task = allTasks.find((t) => t.id === taskId);
              if (task)
                handleSaveTask({
                  ...task,
                  status: task.status === "Done" ? "To Do" : "Done",
                  completed: task.status !== "Done",
                });
            }}
            onEditTask={(task) => openModal("TASK_FORM", { task })}
            onOpenTimeLogModal={(log, defaults) =>
              openModal("TIME_LOG_FORM", { timeLog: log, ...defaults })
            }
            onOpenTaskModal={() => openModal("TASK_FORM")}
            onOpenProjectDetailModal={setSelectedProject}
            onOpenLeadDetail={(leadId) => {
              const lead = leads.find((l) => l.id === leadId);
              if (lead) setSelectedLead(lead);
            }}
            onOpenClientDetail={(clientId) => {
              const client = clients.find((c) => c.id === clientId);
              if (client) handleSelectClientForDetail(client);
            }}
            setCurrentView={setCurrentView}
          />
        );
      case "HR_MODULE":
        return (
          <HRModuleView
            teamMembers={teamMembers}
            onOpenTeamMemberHRFormModal={(m) =>
              openModal("TEAM_MEMBER_HR_FORM", { member: m })
            }
            onDeleteTeamMemberHR={handleDeleteTeamMemberHR}
            onOpenTeamMemberHRDetailModal={(m) =>
              openModal("TEAM_MEMBER_HR_DETAIL", { member: m })
            }
            leaveRequests={leaveRequests}
            currentUser={currentUser}
            onOpenLeaveRequestModal={(lr) =>
              openModal("LEAVE_REQUEST_FORM", { leaveRequest: lr })
            }
            onUpdateLeaveStatus={handleUpdateLeaveStatus}
            onCancelLeaveRequest={handleCancelLeaveRequest}
            dailyAttendanceRecords={dailyAttendanceRecords}
            onSaveAttendance={() => {}}
            onOpenMarkAttendanceModal={() => openModal("MARK_ATTENDANCE")}
            performanceReviews={performanceReviews}
            onOpenPerformanceReviewModal={(emp, rev) =>
              openModal("PERFORMANCE_REVIEW", {
                employee: emp,
                existingReview: rev,
              })
            }
            onOpenApproveLeavesModal={() =>
              openModal("APPROVE_LEAVES", {
                pendingRequests: leaveRequests.filter(
                  (l) => l.status === "Pending",
                ),
              })
            }
            onOpenUploadHRDocumentModal={(defaults) =>
              openModal("UPLOAD_HR_DOC", { defaults })
            }
            onOpenScheduleExitInterviewModal={() =>
              openModal("SCHEDULE_EXIT_INTERVIEW")
            }
            hrDocuments={hrDocuments}
            onSaveHRDocument={handleSaveHRDocument}
            hasPermission={hasPermission}
            roleDefinitions={roleDefinitions}
            appSettings={appSettings}
            ai={null}
            payrollRecords={payrollRecords}
            onOpenOnboardingChecklistModal={(m) =>
              openModal("ONBOARDING_CHECKLIST", { member: m })
            }
            onOpenExitChecklistModal={(m) =>
              openModal("EXIT_CHECKLIST", { member: m })
            }
            onOpenPayslipModal={(pr, m) =>
              openModal("PAYSLIP", { payrollRecord: pr, member: m })
            }
            onOpenProcessSalaryModal={(pr, m) =>
              openModal("PROCESS_SALARY", { payrollRecord: pr, member: m })
            }
            onRunBulkPayroll={handleRunBulkPayroll}
          />
        );
      case "FINANCE":
        return (
          <FinanceView
            invoices={invoices}
            clients={clients}
            onAddInvoice={() => openModal("INVOICE_FORM")}
            onEditInvoice={(i) => openModal("INVOICE_FORM", { invoice: i })}
            onDeleteInvoice={handleDeleteInvoice}
            onUpdateStatus={(id, status) =>
              setInvoices(
                invoices.map((i) => (i.id === id ? { ...i, status } : i)),
              )
            }
            onProcessRecurringInvoices={handleProcessRecurringInvoices}
            onOpenInvoiceBillModal={(i) =>
              openModal("INVOICE_BILL_VIEW", { invoice: i })
            }
            onOpenInvoiceDetailPanel={(i) =>
              setActivePanel({
                type: "INVOICE_DETAIL_PANEL",
                props: { invoice: i },
              })
            }
            expenses={expenses}
            projects={projects}
            onAddExpense={() => openModal("EXPENSE_FORM")}
            onEditExpense={(e) => openModal("EXPENSE_FORM", { expense: e })}
            onDeleteExpense={handleDeleteExpense}
            onUpdateInvoiceStatus={(id, status) =>
              setInvoices((prev) =>
                prev.map((i) => (i.id === id ? { ...i, status } : i)),
              )
            }
            appSettings={appSettings}
            hasPermission={hasPermission}
          />
        );
      case "AUDITS":
        return (
          <AuditsView
            audits={audits}
            onSaveAudit={handleSaveNewAudit}
            prefillData={auditPrefillData}
          />
        );
      case "CALENDAR":
        return (
          <CalendarView
            projects={projects}
            invoices={invoices}
            leads={leads}
            marketingAudits={marketingAudits}
            leaveRequests={leaveRequests}
          />
        );
      case "SOP_LIBRARY":
        return (
          <SOPLibraryView
            sops={sops}
            onEditSOP={(sop) => openModal("SOP_FORM", { sop })}
            onAddSOP={() => openModal("SOP_FORM")}
          />
        );
      case "TOOLS":
        return <ToolsView />;
      case "USER_PROFILE":
        return (
          <UserProfileView
            currentUser={currentUser}
            onUpdateProfile={handleUpdateProfile}
            onUpdateProfilePicture={handleUpdateProfilePicture}
            roleDefinitions={roleDefinitions}
          />
        );
      case "ADMIN_PANEL":
        return (
          <SettingsView
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
            onSaveSettings={(newSettings) => setAppSettings(newSettings)}
            onConnectIntegration={() => {}}
            onRevokeApiKey={() => {}}
            onAddApiKey={() => {}}
            onAddWebhook={() => {}}
            onUpdateWebhook={() => {}}
            onDeleteWebhook={() => {}}
            onSaveEmailTemplates={() => {}}
            onDeleteCustomField={handleDeleteCustomField}
            onOpenCustomFieldFormModal={(field) =>
              openModal("CUSTOM_FIELD_FORM", { field })
            }
            onRepairStorage={repairStorage}
            onExportData={handleExportData}
            onImportData={handleImportData}
            hasPermission={hasPermission}
            activeSection={"general"}
            setActiveSection={() => {}}
            onClose={() => setCurrentView("DASHBOARD")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`flex h-screen bg-bg-canvas dark:bg-zinc-900 text-text-base dark:text-slate-200 font-sans transition-colors duration-300 ${theme}`}
    >
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        appSettings={appSettings}
        onLogout={handleLogout}
        currentUser={currentUser}
        hasPermission={hasPermission}
        onOpenAdminPanel={() => setCurrentView("ADMIN_PANEL")}
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
          unreadEmails={emails.filter((e) => !e.isRead && e.folder === "inbox")}
          unreadChats={chatContacts.filter((c) => (c.unreadCount || 0) > 0)}
          chatMessages={chatMessages}
          unreadChatCount={chatContacts.reduce(
            (sum, c) => sum + (c.unreadCount || 0),
            0,
          )}
          onMarkContactAsRead={(id) =>
            setChatContacts((prev) =>
              prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
            )
          }
          setCurrentView={setCurrentView}
          setActiveCommunicationTab={setActiveCommunicationTab}
          onOpenViewEmailModal={(email) =>
            openModal("VIEW_EMAIL", { emailMessage: email })
          }
          onMarkEmailRead={(id) =>
            setEmails((prev) =>
              prev.map((e) => (e.id === id ? { ...e, isRead: true } : e)),
            )
          }
          onMarkNotificationRead={(id) =>
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
            )
          }
          onOpenTaskModal={() => {
            const defaultLink = selectedLead
              ? { type: "lead" as const, id: selectedLead.id, name: selectedLead.name }
              : selectedClient
                ? {
                    type: "client" as const,
                    id: selectedClient.id,
                    name: selectedClient.companyName || selectedClient.name,
                  }
                : undefined;
            openModal("TASK_FORM", defaultLink ? { defaultLink } : undefined);
          }}
          globalSnoozeUntil={load(KEYS.globalSnoozeUntil, null)}
          onSetGlobalSnooze={(val) => {
            save(KEYS.globalSnoozeUntil, val);
          }}
          onSnoozeNotification={() => {}}
          onOpenTaskFromNotification={(taskId) => {
            const task = allTasks.find((t) => t.id === taskId);
            if (task) openModal("TASK_FORM", { task });
          }}
        />
        <main
          className={`flex-1 overflow-x-hidden ${isFullHeightView ? "h-full overflow-hidden p-0" : "overflow-y-auto p-4 md:p-6"} bg-bg-canvas dark:bg-zinc-900 transition-all relative`}
        >
          {urlError && (
            <UrlErrorBanner
              message={urlError}
              onDismiss={() => setUrlError(null)}
            />
          )}
          {renderView()}
        </main>
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

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
            const newTask = {
              ...taskData,
              id: `task-${Date.now()}`,
              projectId: pid,
              status: "To Do",
              completed: false,
            } as Task;
            handleSaveTask(newTask);
          }}
          onUpdateTask={(pid, task) => handleSaveTask(task)}
          onDeleteTask={(pid, tid) => {
            if (currentUid) deleteTaskFromCloud(currentUid, tid);
            setTasks(
              tasks.filter((t) => t.id !== tid),
              {
                type: "delete",
                payload: tasks.find((t) => t.id === tid)!,
                description: "Deleted task",
              },
            );
          }}
          onEditProjectDetails={() =>
            openModal("PROJECT_FORM", { project: selectedProject })
          }
          hasPermission={hasPermission}
          onOpenTimeLogModal={(log, defaults) =>
            openModal("TIME_LOG_FORM", { timeLog: log, ...defaults })
          }
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
          onEditLead={(l) => openModal("LEAD_FORM", { lead: l })}
          hasPermission={hasPermission}
          openModal={openModal}
          onOpenFollowUpModal={(l, initialNote) =>
            openModal("FOLLOW_UP", { lead: l, initialNote })
          }
          onOpenAuditFormModal={(l) => openModal("AUDIT_FORM", { lead: l })}
          onOpenAuditReportModal={(l, ar) =>
            openModal("AUDIT_REPORT", { lead: l, auditRecord: ar })
          }
          onOpenPaymentModal={() => openModal("PAYMENT_FORM")}
          onConvertLeadToClient={(l, customAttributes) => {
            const newClient: Client = {
              id: `client-${Date.now()}`,
              name: l.name,
              companyName: l.companyName,
              email: l.email,
              phone: l.phone,
              website: l.website,
              dateAdded: new Date().toISOString(),
              healthStatus: "Healthy",
              roi: { current: 0, goal: Number(customAttributes?.roiGoal || 300) },
              nextAction: {
                title: customAttributes?.nextActionTitle || "Onboarding Kickoff Meeting",
                dueDate: new Date().toISOString(),
              },
              recentActivity: [
                {
                  id: `act-conv-${Date.now()}`,
                  action: "Converted from Lead",
                  timestamp: new Date().toISOString(),
                  icon: "note",
                },
              ],
              convertedFromLeadId: l.id,
              industry: customAttributes?.industry || l.industry || "Unknown",
              tags: l.tags,
              primaryContactName: customAttributes?.primaryContactName || l.name,
              clientNotes: customAttributes?.clientNotes || "",
              customFieldValues: {
                assignedToUserId: customAttributes?.assignedToUserId || "",
                serviceInterest: customAttributes?.serviceInterest || []
              }
            };
            handleSaveClient(newClient);
            setLeads(
              leads.map((lead) =>
                lead.id === l.id ? { ...lead, status: "Converted" } : lead,
              ),
              {
                type: "update",
                payload: { old: l, new: { ...l, status: "Converted" } },
                description: `Converted lead "${l.name}"`,
              },
            );
            if (selectedLead?.id === l.id)
              setSelectedLead((prev) =>
                prev ? { ...prev, status: "Converted" } : null,
              );
          }}
          onUpdateStatus={(leadId, status) => {
            const lead = leads.find((l) => l.id === leadId);
            if (lead)
              setLeads(
                leads.map((l) => (l.id === leadId ? { ...l, status } : l)),
                {
                  type: "update",
                  payload: { old: lead, new: { ...lead, status } },
                  description: `Updated lead status to ${status}`,
                },
              );
            if (selectedLead?.id === leadId)
              setSelectedLead((prev) => (prev ? { ...prev, status } : null));
          }}
          onMarkStageManually={() => {}}
          onRevertManualMark={() => {}}
          openPanel={(type, props) => setActivePanel({ type, props })}
          onOpenProposalPanel={(p) =>
            setActivePanel({
              type: "PROPOSAL_DETAIL_PANEL",
              props: { proposal: p },
            })
          }
          onSendProposal={() => {}}
          onSendAuditReport={() => {}}
          ai={null}
          onUpdateLeadField={(leadId, field, value) => {
            const lead = leads.find((l) => l.id === leadId);
            if (lead) {
              const updatedLead = { ...lead, [field]: value };
              setLeads(
                leads.map((l) => (l.id === leadId ? updatedLead : l)),
                {
                  type: "update",
                  payload: { old: lead, new: updatedLead },
                  description: `Updated lead ${field}`,
                },
              );
            }
            if (selectedLead?.id === leadId)
              setSelectedLead((prev) =>
                prev ? { ...prev, [field]: value } : null,
              );
          }}
          clients={clients}
          onOpenProjectsDrawer={(config) =>
            setProjectsDrawerConfig(config || { mode: "view" })
          }
          onRevertClientToLead={handleRevertClientToLead}
          tasks={allTasks}
        />
      )}

      {/* Side Panels */}
      {activePanel?.type === "INVOICE_DETAIL_PANEL" &&
        activePanel.props?.invoice &&
        (() => {
          const liveInvoice =
            invoices.find((i) => i.id === activePanel.props.invoice.id) ||
            activePanel.props.invoice;
          return (
            <InvoiceDetailPanel
              isOpen={true}
              onClose={closePanel}
              invoice={liveInvoice}
              client={clients.find((c) => c.id === liveInvoice.clientId)}
              appSettings={appSettings}
              payments={payments}
              onOpenSendModal={(inv) =>
                openModal("SEND_INVOICE", { invoice: inv })
              }
              onUpdateStatus={(id, status) =>
                setInvoices(
                  invoices.map((i) => (i.id === id ? { ...i, status } : i)),
                )
              }
              onEditInvoice={(inv) =>
                openModal("INVOICE_FORM", { invoice: inv })
              }
              onOpenBillModal={(inv) =>
                openModal("INVOICE_BILL_VIEW", { invoice: inv })
              }
            />
          );
        })()}

      {activePanel?.type === "PROPOSAL_DETAIL_PANEL" &&
        activePanel.props?.proposal && (
          <ProposalDetailPanel
            isOpen={true}
            onClose={closePanel}
            proposal={
              proposals.find((p) => p.id === activePanel.props.proposal.id) ||
              activePanel.props.proposal
            }
            onOpenSendModal={(p) => openModal("SEND_PROPOSAL", { proposal: p })}
            onUpdateStatus={(id, status) =>
              setProposals(
                proposals.map((p) => (p.id === id ? { ...p, status } : p)),
              )
            }
          />
        )}

      {activePanel?.type === "CREATE_PROPOSAL" && (
        <CreateProposalPanel
          isOpen={true}
          onClose={closePanel}
          onSave={handleSaveProposal}
          clientId={activePanel.props.clientId}
          clientName={
            clients.find((c) => c.id === activePanel.props.clientId)?.name || ""
          }
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
        onDeleteProject={(id) => {
          setProjects(
            projects.filter((p) => p.id !== id),
            {
              type: "delete",
              payload: projects.find((p) => p.id === id)!,
              description: "Deleted project",
            },
          );
        }}
        hasPermission={hasPermission}
      />

      {/* Global Modal Rendering */}
      {activeModal?.type === "CLIENT_FORM" && (
        <ClientFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={handleSaveClient}
          client={activeModal.props?.client || null}
          onSetDirty={() => {}}
          customFields={customFields}
        />
      )}
      {activeModal?.type === "PROJECT_FORM" && (
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
      {activeModal?.type === "CAMPAIGN_FORM" && (
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
      {activeModal?.type === "INVOICE_FORM" && (
        <InvoiceFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={handleSaveInvoice}
          invoice={activeModal.props?.invoice || null}
          clients={
            activeModal.props?.client ? [activeModal.props.client] : clients
          }
          getNextInvoiceNumber={() => {
            const invoiceNums = invoices
              .map((i) => i.invoiceNumber)
              .filter((num) => typeof num === 'string' && /^\d+$/.test(num));
            let maxNum = 1035;
            invoiceNums.forEach((num) => {
              const val = parseInt(num, 10);
              if (!isNaN(val) && val > maxNum) {
                maxNum = val;
              }
            });
            return String(maxNum + 1);
          }}
          appSettings={appSettings}
          onSetDirty={() => {}}
        />
      )}
      {activeModal?.type === "AUDIT_FORM" &&
        (activeModal.props?.lead ? (
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
        ))}
      {activeModal?.type === "AUDIT_REPORT" &&
        activeModal.props?.auditRecord && (
          <AuditReportModal
            isOpen={true}
            onClose={closeModal}
            auditRecord={activeModal.props.auditRecord}
            lead={
              activeModal.props?.lead || {
                name: "Unknown",
                companyName: "",
                email: "",
              }
            }
            onEditAudit={() => {}}
            onSend={() =>
              handleSendAuditReport(
                activeModal.props?.lead || {
                  name: "Unknown",
                  companyName: "",
                  email: "",
                },
                activeModal.props.auditRecord,
              )
            }
            currentUser={currentUser}
          />
        )}
      {activeModal?.type === "TASK_FORM" && (
        <TaskFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={handleSaveTask}
          onDelete={(id) => {
            if (currentUid) deleteTaskFromCloud(currentUid, id);
            setTasks(
              tasks.filter((t) => t.id !== id),
              {
                type: "delete",
                payload: tasks.find((t) => t.id === id)!,
                description: "Deleted task",
              },
            );
            closeModal();
          }}
          task={activeModal.props?.task || null}
          projects={projects}
          leads={leads}
          clients={clients}
          teamMembers={teamMembers}
          currentUser={currentUser}
          onSetDirty={() => {}}
          showToast={handleToast}
          overrideZIndex="z-[1060]"
          defaultLink={activeModal.props?.defaultLink || null}
        />
      )}
      {activeModal?.type === "EMAIL_COMPOSE" && (
        <EmailComposeModal
          isOpen={true}
          onClose={closeModal}
          onSaveEmail={handleSaveEmail}
          initialEmail={activeModal.props?.initialEmail}
          currentUserName={currentUser?.name || ""}
          currentUserEmail={currentUser?.email || ""}
          ai={null}
          onSetDirty={() => {}}
          emailTemplates={[]}
        />
      )}
      {activeModal?.type === "VIEW_EMAIL" &&
        activeModal.props?.emailMessage && (
          <ViewEmailModal
            isOpen={true}
            onClose={closeModal}
            emailMessage={activeModal.props.emailMessage}
          />
        )}
      {activeModal?.type === "SEND_INVOICE" && activeModal.props?.invoice && (
        <SendInvoiceModal
          isOpen={true}
          onClose={closeModal}
          onSend={handleSendInvoice}
          onOpenPdf={(inv) => openModal("INVOICE_BILL_VIEW", { invoice: inv })}
          invoice={activeModal.props.invoice}
          client={
            clients.find((c) => c.id === activeModal.props.invoice.clientId) ||
            null
          }
          appSettings={appSettings}
        />
      )}
      {activeModal?.type === "INVOICE_BILL_VIEW" &&
        activeModal.props?.invoice && (
          <InvoiceBillModal
            isOpen={true}
            onClose={closeModal}
            invoice={activeModal.props.invoice}
            client={clients.find(
              (c) => c.id === activeModal.props.invoice.clientId,
            )}
            appSettings={appSettings}
          />
        )}
      {activeModal?.type === "LEAD_FORM" && (
        <LeadFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={(lead) => {
            if (activeModal.props?.lead && activeModal.props.lead.id) {
              setLeads(
                leads.map((l) => (l.id === lead.id ? lead : l)),
                {
                  type: "update",
                  payload: { old: activeModal.props.lead, new: lead },
                  description: `Updated lead "${lead.name}"`,
                },
              );
            } else {
              setLeads([lead, ...leads], {
                type: "create",
                payload: lead,
                description: `Created lead "${lead.name}"`,
              });
            }
            closeModal();
          }}
          lead={activeModal.props?.lead || null}
          teamMembers={teamMembers}
          onSetDirty={() => {}}
          customFields={customFields}
        />
      )}
      {activeModal?.type === "EXPENSE_FORM" && (
        <ExpenseFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={handleSaveExpense}
          expense={activeModal.props?.expense || null}
          projects={projects}
          appSettings={appSettings}
          onSetDirty={() => {}}
        />
      )}
      {activeModal?.type === "PAYMENT_FORM" && (
        <PaymentFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={handleRecordPayment}
          invoices={invoices}
          appSettings={appSettings}
          onSetDirty={() => {}}
        />
      )}
      {activeModal?.type === "FOLLOW_UP" && activeModal.props?.lead && (
        <FollowUpFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={(formData, leadId) => {
            handleSaveFollowUp(formData, leadId);
            closeModal();
          }}
          leadName={activeModal.props.lead.name}
          leadId={activeModal.props.lead.id}
          onSetDirty={() => {}}
          initialNote={activeModal.props.initialNote}
        />
      )}
      {activeModal?.type === "TEAM_MEMBER_HR_FORM" && (
        <TeamMemberHRFormModal
          isOpen={true}
          onClose={closeModal}
          member={activeModal.props?.member || null}
          onSave={(m) => {
            setTeamMembers((prev) => {
              const exists = prev.find((tm) => tm.id === m.id);
              if (exists) return prev.map((tm) => (tm.id === m.id ? m : tm));
              return [...prev, { ...m, id: `tm-${Date.now()}` }];
            });
            closeModal();
          }}
          roleDefinitions={roleDefinitions}
          onSetDirty={() => {}}
        />
      )}
      {activeModal?.type === "LEAVE_REQUEST_FORM" && (
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
      {activeModal?.type === "MARK_ATTENDANCE" && (
        <MarkAttendanceModal
          isOpen={true}
          onClose={closeModal}
          teamMembers={teamMembers}
          onSaveAttendance={(record) => {
            setDailyAttendanceRecords((prev) => [...prev, record]);
            closeModal();
          }}
        />
      )}
      {activeModal?.type === "APPROVE_LEAVES" && (
        <ApproveLeavesModal
          isOpen={true}
          onClose={closeModal}
          pendingRequests={leaveRequests.filter((l) => l.status === "Pending")}
          onUpdateLeaveStatus={handleUpdateLeaveStatus}
        />
      )}
      {activeModal?.type === "UPLOAD_HR_DOC" && (
        <UploadHRDocumentModal
          isOpen={true}
          onClose={closeModal}
          teamMembers={teamMembers}
          onSave={handleSaveHRDocument}
          defaults={activeModal.props?.defaults}
          onSetDirty={() => {}}
        />
      )}
      {activeModal?.type === "SCHEDULE_EXIT_INTERVIEW" && (
        <ScheduleExitInterviewModal
          isOpen={true}
          onClose={closeModal}
          teamMembers={teamMembers}
          onSchedule={handleScheduleExitInterview}
        />
      )}
      {activeModal?.type === "ONBOARDING_CHECKLIST" &&
        activeModal.props?.member && (
          <OnboardingChecklistModal
            isOpen={true}
            onClose={closeModal}
            member={activeModal.props.member}
            onSave={(updatedMember) => {
              setTeamMembers((prev) =>
                prev.map((m) =>
                  m.id === updatedMember.id ? updatedMember : m,
                ),
              );
              closeModal();
            }}
          />
        )}
      {activeModal?.type === "EXIT_CHECKLIST" && activeModal.props?.member && (
        <ExitChecklistModal
          isOpen={true}
          onClose={closeModal}
          member={activeModal.props.member}
          onSave={(updatedMember) => {
            setTeamMembers((prev) =>
              prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)),
            );
            closeModal();
          }}
        />
      )}
      {activeModal?.type === "PAYSLIP" &&
        activeModal.props?.payrollRecord &&
        activeModal.props?.member && (
          <PayslipModal
            isOpen={true}
            onClose={closeModal}
            payrollRecord={activeModal.props.payrollRecord}
            member={activeModal.props.member}
            appSettings={appSettings}
          />
        )}
      {activeModal?.type === "PROCESS_SALARY" &&
        activeModal.props?.payrollRecord &&
        activeModal.props?.member && (
          <ProcessSalaryModal
            isOpen={true}
            onClose={closeModal}
            payrollRecord={activeModal.props.payrollRecord}
            member={activeModal.props.member}
            onConfirm={() => {
              setPayrollRecords((prev) => {
                const exists = prev.find(
                  (r) => r.id === activeModal.props.payrollRecord.id,
                );
                const updated = {
                  ...activeModal.props.payrollRecord,
                  status: "Processed" as const,
                };
                if (exists)
                  return prev.map((r) => (r.id === updated.id ? updated : r));
                return [...prev, updated];
              });
              closeModal();
            }}
          />
        )}
      {activeModal?.type === "PERFORMANCE_REVIEW" &&
        activeModal.props?.employee && (
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
      {activeModal?.type === "TEAM_MEMBER_HR_DETAIL" &&
        activeModal.props?.member && (
          <TeamMemberHRDetailModal
            isOpen={true}
            onClose={closeModal}
            member={activeModal.props.member}
            onEdit={(m) => openModal("TEAM_MEMBER_HR_FORM", { member: m })}
            roleDefinitions={roleDefinitions}
            leaveRequests={leaveRequests.filter(
              (r) => r.memberId === activeModal.props.member.id,
            )}
            projects={projects.filter((p) =>
              p.teamIds.includes(activeModal.props.member.id),
            )}
            dailyAttendanceRecords={dailyAttendanceRecords}
          />
        )}
      {activeModal?.type === "PROPOSAL_FORM" && (
        <ProposalFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={handleSaveProposal}
          proposal={activeModal.props?.proposal || null}
          clients={clients}
          leads={leads}
          prefillClientId={activeModal.props?.prefillClientId}
          getNextProposalNumber={() => `PROP-${Date.now()}`}
          ai={aiClient}
        />
      )}
      {activeModal?.type === "CUSTOM_FIELD_FORM" && (
        <CustomFieldFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={handleSaveCustomField}
          fieldToEdit={activeModal.props?.field || null}
        />
      )}
      {activeModal?.type === "KICKOFF_FORM" && activeModal.props?.clientId && (
        <KickoffFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={(data) => {
            setOnboardingKickoffData((prev) => {
              const exists = prev.find((d) => d.clientId === data.clientId);
              if (exists)
                return prev.map((d) =>
                  d.clientId === data.clientId ? data : d,
                );
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
      {activeModal?.type === "SEND_PROPOSAL" && activeModal.props?.proposal && (
        <SendProposalModal
          isOpen={true}
          onClose={closeModal}
          onSend={(_clientId, emailData) =>
            handleSendProposal(activeModal.props.proposal, emailData)
          }
          proposal={activeModal.props.proposal}
          client={
            clients.find((c) => c.id === activeModal.props.proposal.clientId) ||
            leads.find((l) => l.id === activeModal.props.proposal.clientId) ||
            null
          }
        />
      )}
      {activeModal?.type === "CAMPAIGN_REPORT" &&
        activeModal.props?.campaign && (
          <CampaignReportModal
            isOpen={true}
            onClose={closeModal}
            campaign={activeModal.props.campaign}
            appSettings={appSettings}
          />
        )}
      {activeModal?.type === "CALENDAR_EVENT_DETAIL" &&
        activeModal.props?.date && (
          <CalendarEventDetailModal
            isOpen={true}
            onClose={closeModal}
            date={activeModal.props.date}
            events={activeModal.props.events}
            projects={projects}
            setCurrentView={setCurrentView}
            setSelectedProjectForDetail={setSelectedProject}
            handleViewAuditDetail={(a) =>
              openModal("AUDIT_REPORT", { auditRecord: a })
            }
            onOpenInvoiceModal={(i) =>
              openModal("INVOICE_FORM", { invoice: i })
            }
            onOpenLeadModal={(l) => openModal("LEAD_FORM", { lead: l })}
          />
        )}
      {activeModal?.type === "TIME_LOG_FORM" && (
        <TimeLogFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={(log) => {
            /* ... */ closeModal();
          }}
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
      {activeModal?.type === "IMPORT_CONFIRMATION" &&
        activeModal.props?.summary && (
          <ImportConfirmationModal
            isOpen={true}
            onClose={closeModal}
            onConfirmImport={activeModal.props.onConfirmImport}
            summary={activeModal.props.summary}
          />
        )}
      {activeModal?.type === "CONFIRMATION" && (
        <ConfirmationModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={() => {
            if (activeModal.props?.onConfirm) {
              activeModal.props.onConfirm();
            }
            closeModal();
          }}
          title={activeModal.props?.title}
          message={activeModal.props?.message}
          confirmLabel={activeModal.props?.confirmLabel}
          cancelLabel={activeModal.props?.cancelLabel}
          variant={activeModal.props?.variant}
          overrideZIndex={activeModal.props?.overrideZIndex}
        />
      )}
      {activeModal?.type === "SOP_FORM" && (
        <SOPFormModal
          isOpen={true}
          onClose={closeModal}
          onSave={handleSaveSOP}
          sop={activeModal.props?.sop || null}
        />
      )}
      {activeModal?.type === "CLIENT_REPORT_GENERATOR" &&
        activeModal.props?.client && (
          <ClientReportModal
            isOpen={true}
            onClose={closeModal}
            client={activeModal.props.client}
            projects={projects.filter(
              (p) => p.clientId === activeModal.props.client.id,
            )}
            tasks={allTasks.filter((t) => {
              const project = projects.find((p) => p.id === t.projectId);
              return (
                project && project.clientId === activeModal.props.client.id
              );
            })}
            campaigns={campaigns}
            appSettings={appSettings}
            onOpenEmailCompose={(emailData) => {
              closeModal();
              setTimeout(
                () =>
                  openModal("EMAIL_COMPOSE", {
                    initialEmail: {
                      recipientEmail: emailData.to,
                      subject: emailData.subject,
                      body: emailData.body,
                    },
                  }),
                100,
              );
            }}
          />
        )}
    </div>
  );
};
