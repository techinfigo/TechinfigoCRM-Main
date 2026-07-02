
import React from 'react';

// --- Core Types ---
export type View = 'DASHBOARD' | 'CLIENTS' | 'INVOICES' | 'LEADS' | 'LEAD_DETAIL' | 'TEAM' | 'TEAM_MEMBER_DETAIL' | 'EXPENSES' | 'MARKETING_AUDITS' | 'AUDIT_DETAIL' | 'ADMIN_PANEL' | 'CALENDAR' | 'TIME_LOGS' | 'ONBOARDING' | 'CAMPAIGN_ANALYTICS' | 'CAMPAIGNS' | 'USER_PROFILE' | 'INTEGRATIONS' | 'COMMUNICATION' | 'LEAVES' | 'HR_MODULE' | 'FINANCE' | 'CLIENT_DETAIL' | 'PROJECT_DETAIL' | 'PROJECTS' | 'TASKS' | 'MY_TASKS' | 'SOP_LIBRARY' | 'AUDITS' | 'TOOLS';

export type FeatureKey = 'dashboard' | 'leads' | 'clients' | 'projects' | 'tasks' | 'projectTasks' | 'invoices' | 'expenses' | 'finance' | 'hrModule' | 'leaves' | 'calendar' | 'communication' | 'userProfile' | 'adminPanel' | 'adminUsers' | 'adminRoles' | 'adminSettings' | 'adminData' | 'marketingAudits' | 'leadAudit' | 'timeTracking' | 'notifications' | 'sopLibrary' | 'onboarding' | 'campaigns' | 'integrations' | 'tools' | 'adminTimeLogs' | 'auditDetail';
export type PermissionAction = 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canUpdateStatus' | 'canConvert' | 'canAssignTeam' | 'canMarkComplete' | 'canAssignSelf' | 'canAssignOthers' | 'canSend' | 'canManageRecurring' | 'canViewHRModule' | 'canManageHRMembers' | 'canMarkAttendance' | 'canViewOwnLeave' | 'canRequestLeave' | 'canCancelOwnLeave' | 'canViewAllLeave' | 'canManageLeaveRequests' | 'canManageDrafts' | 'canDeleteEmails' | 'canUpdateProfile' | 'canManage' | 'canConductAudit' | 'canViewAuditReport' | 'canLogTime' | 'canViewOwnTime' | 'canEditOwnTime' | 'canDeleteOwnTime' | 'canViewAllTime' | 'canManageAllTimeLogs' | 'canViewNotifications' | 'canManageProposals' | 'canManageKickoffForms' | 'canGenerateReport';

export interface AppFeaturePermission {
    featureKey: FeatureKey;
    featureName: string;
    availablePermissions: { action: PermissionAction; label: string }[];
    currentPermissions: PermissionFlags;
}

export type PermissionFlags = Partial<Record<PermissionAction, boolean>>;

export interface RoleDefinition {
    id: string;
    name: string;
    description?: string;
    permissions: AppFeaturePermission[];
    isSystemRole?: boolean;
}

export type TeamMemberRole = 'Admin' | 'Manager' | 'Strategist' | 'Designer' | 'Developer' | 'Member';

export type HRStatus = 'Active' | 'Resigned' | 'On Leave' | 'Probation' | 'Contract' | 'Terminated';
export const hrStatuses: HRStatus[] = ['Active', 'Resigned', 'On Leave', 'Probation', 'Contract', 'Terminated'];

export interface OnboardingChecklist {
    documentsCollected: boolean;
    orientationScheduled: boolean;
    systemAccessProvided: boolean;
    hrPoliciesShared: boolean;
}

export interface ExitChecklist {
    clearanceFormSubmitted: boolean;
    assetHandoverComplete: boolean;
    exitInterviewConducted: boolean;
    systemAccessRevoked: boolean;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: TeamMemberRole;
    roleId?: string; // Links to RoleDefinition
    dateJoined: string; // ISO
    profilePictureUrl?: string;
    hrStatus?: HRStatus;
    jobTitle?: string;
    department?: string;
    monthlySalary?: number;
    password?: string; // Conceptual
    phoneNumber?: string;
    hrNotes?: string;
    onboardingChecklist?: OnboardingChecklist;
    exitChecklist?: ExitChecklist;
    exitDate?: string; // ISO
    reasonForExit?: string;
}

// --- Lead & Client ---
export type LeadStatus = 'New' | 'Qualified' | 'Contacted' | 'Engaged' | 'Audit in Progress' | 'Pitch Scheduled' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
export const leadStatuses: LeadStatus[] = ['New', 'Qualified', 'Contacted', 'Engaged', 'Audit in Progress', 'Pitch Scheduled', 'Negotiation', 'Closed Won', 'Closed Lost'];
export const allLeadStatusesForSystem: LeadStatus[] = ['New', 'Qualified', 'Contacted', 'Engaged', 'Audit in Progress', 'Pitch Scheduled', 'Negotiation', 'Closed Won', 'Closed Lost'];
export const KANBAN_STAGE_ORDER: LeadStatus[] = ['New', 'Qualified', 'Contacted', 'Engaged', 'Audit in Progress', 'Pitch Scheduled', 'Negotiation', 'Closed Won'];

export type LeadViewMode = 'List' | 'Kanban';
export type OnboardingInterestLevel = 'High' | 'Medium' | 'Low' | 'Not Discussed';
export const onboardingInterestLevels: OnboardingInterestLevel[] = ['High', 'Medium', 'Low', 'Not Discussed'];

// NEW: Qualification Types
export type LeadFit = 'Low Fit' | 'Medium Fit' | 'High Fit';
export type BudgetReadiness = 'Not Ready' | 'Partially Ready' | 'Ready';

export type FollowUpType = 'Call' | 'Email' | 'Meeting' | 'Other';
export const followUpTypes: FollowUpType[] = ['Call', 'Email', 'Meeting', 'Other'];

export interface FollowUpLogItem {
    id: string;
    note: string;
    timestamp: string;
    nextFollowUpDateTime?: string;
    followUpType?: FollowUpType;
    isHighPriority?: boolean;
    addedByUserId: string;
    addedByUserName: string;
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    companyName?: string;
    source?: string;
    status: LeadStatus;
    dateAdded: string; // ISO
    notes?: string;
    website?: string;
    
    // D2C Specific Fields
    instagramHandle?: string;
    revenueBand?: string; // <$10k, $10k-$50k, $50k+
    adStatus?: 'Active' | 'Inactive';
    techStack?: string[]; // Klaviyo, Shopify, etc.
    outreachAngle?: string;
    offerSent?: string;
    
    // Backend Qualification Fields (System Managed)
    leadFit?: LeadFit;
    budgetReadiness?: BudgetReadiness;
    qualificationCompleted?: boolean;

    estimatedBudget?: string; // Kept for backward compatibility but mapped to revenueBand conceptually in UI
    serviceInterest?: string[] | string; // Array or comma-sep string
    lastContactedDate?: string; // ISO
    nextFollowUpDateTime?: string; // ISO
    tags?: string[];
    hasDigitalPresence?: boolean;
    onboardingInterest?: OnboardingInterestLevel;
    preferredOnboardingDate?: string; // ISO
    internalOnboardingNotes?: string;
    assignedToUserId?: string;
    auditRecordId?: string;
    manualCompletionMarkers?: Record<string, boolean>;
    emailHistory?: any[]; // Placeholder
    followUpHistory?: FollowUpLogItem[];
    customFieldValues?: { [key: string]: any };
}

export interface Client {
    id: string;
    name: string;
    companyName?: string;
    email: string;
    phone?: string;
    address?: string;
    dateAdded: string; // ISO string
    website?: string;
    industry?: string;
    tags?: string[];
    primaryContactName?: string;
    primaryContactEmail?: string;
    clientNotes?: string;
    gstin?: string; 
    convertedFromLeadId?: string;
    customFieldValues?: { [key: string]: any };
    profilePictureUrl?: string;
    healthStatus: 'Active' | 'Healthy' | 'At Risk';
    roi: {
      current: number;
      goal: number;
    };
    nextAction: {
      title: string;
      dueDate: string; // ISO string
    };
    recentActivity: {
      id: string;
      action: string;
      timestamp: string; // ISO string
      icon: 'audit' | 'payment' | 'campaign' | 'note';
    }[];
}

export interface ClientDocument {
    id: string;
    clientId: string;
    name: string;
    url: string; // or base64
    type: string;
    size: number;
    uploadDate: string;
}

// --- Projects & Tasks ---
export type ProjectStatus = 'Backlog' | 'In Progress' | 'Review' | 'Blocked' | 'Done' | 'Completed' | 'On Hold' | 'Cancelled' | 'Planning';
export const projectStatuses: ProjectStatus[] = ['Backlog', 'Planning', 'In Progress', 'Review', 'Blocked', 'Done', 'On Hold', 'Cancelled'];
export type ProjectPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export const projectPriorities: ProjectPriority[] = ['Low', 'Medium', 'High', 'Critical'];
export type ProjectHealth = 'On Track' | 'At Risk' | 'Off Track';
export const projectHealths: ProjectHealth[] = ['On Track', 'At Risk', 'Off Track'];
export type BillingModel = 'Fixed' | 'Retainer' | 'Hourly';
export const billingModels: BillingModel[] = ['Fixed', 'Retainer', 'Hourly'];

export interface Milestone {
    id: string;
    title: string;
    dueDate?: string;
    completed: boolean;
}

export interface ProjectConnectors {
    ga4?: { propertyId?: string; measurementId?: string };
    gsc?: { siteUrl?: string };
    metaAds?: { adAccountId?: string };
    googleAds?: { customerId?: string };
}

export interface Project {
    id: string;
    name: string;
    clientId: string;
    clientName?: string;
    projectCode: string;
    type: string;
    description?: string;
    status: ProjectStatus;
    priority: ProjectPriority;
    health: ProjectHealth;
    managerId: string;
    teamIds: string[];
    assignedMemberIds?: string[]; // Alias for teamIds for compatibility
    startDate: string;
    dueDate?: string;
    deadline?: string; // Alias for dueDate
    dateAdded?: string;
    createdAt?: string;
    updatedAt?: string;
    budget?: {
        planned: number;
        actual: number;
        currency: string;
    };
    billingModel: BillingModel;
    tags?: string[];
    milestones: Milestone[];
    tasks: Task[];
    connectors: ProjectConnectors;
    customFieldValues?: { [key: string]: any };
}

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export const taskPriorities: TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];
export type TaskWorkflowStatus = 'To Do' | 'In Progress' | 'Review' | 'Done' | 'Pending' | 'Blocked';
export const taskWorkflowStatuses: TaskWorkflowStatus[] = ['To Do', 'In Progress', 'Review', 'Done', 'Blocked'];

export interface Subtask {
    id: string;
    title: string;
    done: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface Comment {
    id: string;
    author: string;
    text: string;
    createdAt: string;
}

export type ActivityType = 'creation' | 'edit' | 'status_change' | 'comment' | 'subtask_toggle' | 'attachment';

export interface Activity {
    id: string;
    type: ActivityType;
    at: string;
    message: string;
    meta?: any;
}

export interface TaskReminderPrefs {
    enabled: boolean;
    leadTime: '30m' | '2h' | '1d' | 'None' | null;
}

export interface TaskAttachment {
    id: string;
    name: string;
    size: number;
    type: string;
    url?: string;
}

export interface TaskLink {
    id: string;
    url: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    projectId?: string; // Optional if global task
    projectName?: string; // Display helper
    leadId?: string; // Optional if linked to a lead
    leadName?: string; // Display helper
    assignedMemberId?: string;
    assigneeName?: string; // Display helper
    status: TaskWorkflowStatus;
    completed: boolean; // Derived/synced with status='Done'
    priority?: TaskPriority;
    dueDate?: string; // ISO
    labels?: string[];
    subtasks?: Subtask[];
    comments?: Comment[];
    commentCount?: number;
    activityLog?: Activity[];
    watchers?: string[];
    reminderPrefs?: TaskReminderPrefs;
    attachments?: TaskAttachment[];
    attachmentCount?: number;
    links?: TaskLink[];
    linkCount?: number;
    createdAt?: string;
    updatedAt?: string;
    checklist?: Subtask[]; // Alias for subtasks
    lastReminderAt?: string;
    parentId?: string; // For subtasks promoted to tasks, or hierarchy
}

export interface TimeLog {
    id: string;
    projectId: string;
    taskId?: string;
    memberId: string;
    date: string; // YYYY-MM-DD
    hours: number;
    notes?: string;
    dateLogged?: string; // ISO
}

// --- Finance ---
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
export type DiscountType = 'None' | 'Percentage' | 'Fixed';
export type RecurrenceFrequency = 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
export const recurrenceFrequencies: RecurrenceFrequency[] = ['Weekly', 'Monthly', 'Quarterly', 'Yearly'];

export interface ServiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    clientId: string;
    clientName?: string;
    issueDate: string; // ISO
    dueDate: string; // ISO
    sentDate?: string; // ISO
    status: InvoiceStatus;
    items: ServiceItem[];
    notes?: string;
    discountType?: DiscountType;
    discountValue?: number;
    taxRate?: number;
    paymentInstructions?: string;
    paymentTerms?: string;
    isRecurring?: boolean;
    recurrenceFrequency?: RecurrenceFrequency;
    recurrenceEndDate?: string; // ISO
    activityLog?: { timestamp: string; action: string; actorName: string }[];
    currency?: string; // 'INR' | 'USD' | etc.
}

export const calculateInvoiceGrandTotal = (invoice: Invoice): number => {
    const subTotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    let discount = 0;
    if (invoice.discountType === 'Percentage' && invoice.discountValue) {
        discount = subTotal * (invoice.discountValue / 100);
    } else if (invoice.discountType === 'Fixed' && invoice.discountValue) {
        discount = invoice.discountValue;
    }
    const afterDiscount = Math.max(0, subTotal - discount);
    const tax = invoice.taxRate ? afterDiscount * (invoice.taxRate / 100) : 0;
    return afterDiscount + tax;
};

export type ExpenseCategory = 'Software/Tools' | 'Office Supplies' | 'Travel' | 'Marketing' | 'Salaries' | 'Contractors' | 'Rent' | 'Utilities' | 'Other';
export const expenseCategories: ExpenseCategory[] = ['Software/Tools', 'Office Supplies', 'Travel', 'Marketing', 'Salaries', 'Contractors', 'Rent', 'Utilities', 'Other'];

export interface Expense {
    id: string;
    date: string; // ISO
    category: ExpenseCategory;
    description: string;
    amount: number;
    currency?: string; // 'INR' | 'USD' | etc.
    vendor?: string;
    projectId?: string;
    receiptUrl?: string;
}

export type PaymentMethod = 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Other';

export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;
    paymentDate: string; // ISO
    paymentMethod: PaymentMethod;
    notes?: string;
}

// --- Marketing Audits (Old & New) ---
export type AuditEntity = 'Lead' | 'Client';
export type AuditStatusType = 'Draft' | 'In Progress' | 'Completed' | 'Sent';
export type MarketingAuditStatus = 'Requested' | 'InProgress' | 'AIGenerating' | 'ReviewPending' | 'Completed' | 'Error';
export type MarketingAuditFocusArea = 'SEO' | 'PPC' | 'Social Media' | 'Content' | 'UX/UI' | 'Email Marketing' | 'CRO';
export const marketingAuditFocusAreas: MarketingAuditFocusArea[] = ['SEO', 'PPC', 'Social Media', 'Content', 'UX/UI', 'Email Marketing', 'CRO'];

// Old structure for AuditRecord/MarketingAuditRequest (Legacy support)
export interface AuditConcernItem {
    concernName: string;
    status: AuditFindingStatus;
    notes?: string;
    key: string;
    label: string;
}

export interface AuditChecklistHeading {
    headingName: string;
    concerns: AuditConcernItem[];
}

export interface AuditParameterDetail {
    currentSituation: string;
    status: AuditFindingStatus;
    idealBenchmark?: string;
    suggestion?: string;
    estimatedLossPercent?: number;
}

export type AuditFindingStatus = 'Good' | 'Needs Improvement' | 'Critical' | 'Not Applicable' | 'Not Evaluated';
export const auditFindingStatuses: AuditFindingStatus[] = ['Good', 'Needs Improvement', 'Critical', 'Not Applicable', 'Not Evaluated'];

export interface MarketingAuditRequest {
    id: string;
    clientId: string;
    clientName?: string;
    websiteUrl: string;
    focusAreas: MarketingAuditFocusArea[];
    primaryGoals: string;
    competitors?: string[];
    additionalNotes?: string;
    status: MarketingAuditStatus;
    dateRequested: string; // ISO
    reportContent?: string; // Markdown
    lastGeneratedDate?: string; // ISO
    errorMessage?: string;
    aiExecutiveSummary?: string;
    aiOverallAuditScore?: number;
    aiTotalEstimatedConversionLoss?: string;
    aiChartsData?: any;
    detailedChecklist?: AuditChecklistHeading[];
    clientInfoForReport?: { name: string; companyName?: string; website?: string };
}

// --- D2C Audit Specific Structures (New) ---
export interface D2CAuditSection {
    scores: Record<string, number>; // e.g., { "pageSpeed": 8, "firstFold": 5 }
    issues: string; // Textarea content
    recommendations: string; // Textarea content
    checklist: string[]; // Array of selected checkbox labels
}

export interface D2CAuditData {
    website: D2CAuditSection;
    funnel: D2CAuditSection;
    ads: D2CAuditSection;
    brand: D2CAuditSection;
    retention: D2CAuditSection;
    tech: D2CAuditSection;
    summary: D2CAuditSection; // Reuses structure, uses scores.overall for score
}

export interface AuditRecord {
    id: string;
    leadId: string;
    leadName: string;
    auditTypeSubmitted: 'Manual' | 'AI-Assisted';
    dateConducted: string; // ISO
    conductedByUserId: string;
    conductedByUserName: string;
    overallSummary?: string;
    eCommerceAuditFindings?: { [key: string]: AuditParameterDetail }; // Legacy
    aiOverallScore?: number;
    aiTotalEstimatedConversionLoss?: number;
    
    // New Structured Data
    d2cData?: D2CAuditData; 
}


// New General Audit Interface (Unified)
export interface AuditData {
    executiveSummary: string;
    funnelAnalysis: string;
    creativeAnalysis: string;
    websiteAnalysis: string;
    actionPlan: string;
}

export interface Audit {
    id: string;
    title: string;
    entityType: AuditEntity;
    entityId: string;
    entityName: string;
    status: AuditStatusType;
    score?: number;
    dateCreated: string; // ISO
    tags?: string[];
    pdfUrl?: string;
    loomUrl?: string;
    notes?: string;
    auditData?: AuditData; // Simple Text based
    d2cAuditData?: D2CAuditData; // Complex Structured D2C data
}


// --- Proposals & Onboarding ---
export type ProposalStatus = 'Draft' | 'SentToClient' | 'Signed' | 'Declined' | 'Archived';
export const proposalStatuses: ProposalStatus[] = ['Draft', 'SentToClient', 'Signed', 'Declined', 'Archived'];

export interface Proposal {
    id: string;
    clientId: string;
    clientName?: string; // Helper
    proposalNumber: string;
    version: number;
    status: ProposalStatus;
    generatedDate: string; // ISO
    lastUpdatedDate: string; // ISO
    subject?: string;
    message?: string; // Body content
    title?: string;
    content?: string; // For CreateProposalPanel
    estimatedBudget?: string;
    timeline?: string;
    validUntilDate?: string;
}

export interface PlatformCredential {
    id: string;
    platformName: string;
    loginUrl?: string;
    username?: string;
    email?: string;
    password?: string; // Ideally encrypted or not stored
    notes?: string;
}

export interface OnboardingKickoffData {
    id: string;
    clientId: string;
    submissionDate?: string;
    isSubmitted: boolean;
    businessName: string;
    industry?: string;
    targetAudience?: string;
    keyProductsServices?: string;
    uniqueSellingPoints?: string;
    currentMarketingChannels: string[];
    accessCredentials: PlatformCredential[];
    projectGoals?: string;
    preferredCommunication?: string;
    brandGuidelinesUrl?: string;
    existingAssetsUrl?: string;
}

// --- Campaigns ---
export type CampaignPlatform = 'GoogleAds' | 'MetaAds' | 'LinkedInAds' | 'TwitterAds' | 'EmailMarketing' | 'Other';
export const campaignPlatforms: CampaignPlatform[] = ['GoogleAds', 'MetaAds', 'LinkedInAds', 'TwitterAds', 'EmailMarketing', 'Other'];
export type CampaignStatus = 'Planning' | 'Active' | 'Paused' | 'Completed' | 'Archived';
export const campaignStatuses: CampaignStatus[] = ['Planning', 'Active', 'Paused', 'Completed', 'Archived'];
export type CampaignInsightsStatus = 'Generating' | 'Completed' | 'Error';

export interface CampaignAnomaly {
    id: string;
    campaignId: string;
    campaignName: string;
    metric: string;
    date: string;
    observedValue: number;
    expectedValue: number;
    deviationDescription: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    potentialExplanation?: string;
}

export interface Campaign {
    id: string;
    clientId: string;
    clientNameDisplay?: string; // Helper for UI
    name: string;
    platform: CampaignPlatform;
    status: CampaignStatus;
    startDate?: string; // ISO
    endDate?: string; // ISO
    totalBudget?: number;
    allocatedSpend?: number;
    actualSpend?: number;
    campaignGoals?: string;
    targetROAS?: number;
    notes?: string;
    
    // Performance Data
    kpis?: {
        roas?: number;
        conversions?: number;
        cpa?: number;
        ctr?: number;
        cpm?: number;
        revenueGenerated?: number;
    };
    dailyPerformance?: { date: string; spend: number; revenue: number; conversions: number }[];
    chartData?: {
        spendVsBudget: { budget: number; spent: number };
        performanceTrend: { metricName: string; data: { date: string; revenue: number }[] };
    };
    
    // AI Analysis
    aiPerformanceInsights?: string;
    insightsStatus?: CampaignInsightsStatus;
    insightsErrorMessage?: string;
    anomalies?: CampaignAnomaly[];
}

// --- Communication ---
export interface EmailMessage {
    id: string;
    senderName?: string;
    senderEmail: string;
    recipientName?: string;
    recipientEmail: string;
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    timestamp: string; // ISO
    folder: EmailFolder;
    isRead?: boolean;
    attachments?: EmailAttachment[]; // from file system
    attachmentsFromFiles?: File[]; // transient
}
export type EmailFolder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'important';

export interface EmailAttachment {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    dataUrl?: string;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
}

export interface ChatContact {
    id: string;
    name: string;
    profilePictureUrl?: string;
    lastMessage?: string;
    lastMessageTimestamp: string; // ISO
    isOnline: boolean;
    unreadCount?: number;
    email?: string;
    phone?: string;
    socialHandle?: string;
    tags?: string[];
    lastSeenTime?: string; // ISO
}

export interface ChatMessage {
    id: string;
    contactId: string;
    senderId: string; // 'me' or contactId
    text?: string;
    timestamp: string; // ISO
    status: 'sent' | 'delivered' | 'read';
    attachments?: { name: string; url: string; type: string }[];
}

// --- HR & Admin ---
export interface ActivityLogItem {
    id: string;
    userId: string;
    userName: string;
    actionType: string; // e.g., 'CREATE_CLIENT'
    entityType: string; // e.g., 'Client'
    entityId?: string;
    entityName?: string;
    timestamp: string; // ISO
    details: string;
}

export interface LeaveRequest {
    id: string;
    memberId: string;
    memberName: string;
    leaveType: LeaveType;
    startDate: string; // ISO
    endDate: string; // ISO
    reason: string;
    status: LeaveRequestStatus;
    requestedDate: string; // ISO
    adminNotes?: string;
    reviewedByUserId?: string;
    reviewedDate?: string;
}
export type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Unpaid' | 'Maternity' | 'Paternity';
export const leaveTypes: LeaveType[] = ['Annual', 'Sick', 'Casual', 'Unpaid', 'Maternity', 'Paternity'];
export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'CancelledByEmployee' | 'CancelledByAdmin';
export const leaveRequestStatuses: LeaveRequestStatus[] = ['Pending', 'Approved', 'Rejected', 'CancelledByEmployee', 'CancelledByAdmin'];

export interface AttendanceEntry {
    memberId: string;
    status: AttendanceStatus;
    checkInTime?: string; // HH:MM
    checkOutTime?: string; // HH:MM
}
export interface DailyAttendanceRecord {
    id: string;
    date: string; // YYYY-MM-DD
    entries: AttendanceEntry[];
}
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'Leave' | 'N/A';
export const attendanceStatuses: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Half-Day', 'Leave'];

export interface PerformanceReview {
    id: string;
    employeeId: string;
    employeeName: string;
    reviewDate: string; // ISO
    reviewerId: string;
    reviewerName: string;
    performanceRatings: PerformanceRating;
    goalsAchieved: PerformanceGoalStatus;
    managerFeedback: string;
    growthDevelopmentPlan: string;
    nextReviewDate?: string; // ISO
    attachments?: EmailAttachment[];
}
export interface PerformanceRating {
    communication: number; // 1-5
    taskCompletion: number;
    innovation: number;
    punctuality: number;
}
export type PerformanceGoalStatus = 'Exceeded' | 'Achieved' | 'Partially Achieved' | 'Missed';
export const performanceGoalStatuses: PerformanceGoalStatus[] = ['Exceeded', 'Achieved', 'Partially Achieved', 'Missed'];

export interface HRDocument {
    id: string;
    name: string;
    category: HRDocumentCategory;
    employeeId?: string;
    uploadDate: string; // ISO
    uploadedByUserId: string;
    uploadedByUserName: string;
    file?: File; // Transient
    size?: number;
    type?: string;
    expiryDate?: string;
    notes?: string;
    status: HRDocumentStatus;
    displayType?: string; // Helper
}
export type HRDocumentCategory = 'Contract' | 'ID Proof' | 'Resume' | 'Offer Letter' | 'Appraisal' | 'Other';
export const hrDocumentCategories: HRDocumentCategory[] = ['Contract', 'ID Proof', 'Resume', 'Offer Letter', 'Appraisal', 'Other'];
export type HRDocumentStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Expired';
export const hrDocumentStatuses: HRDocumentStatus[] = ['Pending Approval', 'Approved', 'Rejected', 'Expired'];

export interface PayrollRecord {
    id: string;
    employeeId: string;
    monthYear: string; // YYYY-MM
    baseSalary: number;
    bonuses: number;
    deductions: number;
    netSalary: number;
    status: PayrollStatus;
    paymentDate?: string; // ISO
    attendanceDays?: number;
}
export type PayrollStatus = 'Pending' | 'Processed' | 'Approved' | 'Paid' | 'Hold';

// --- Settings & Utils ---
export interface AppSettings {
    agencyName: string;
    agencyLogoUrl?: string;
    agencyGstin?: string;
    defaultCurrency: 'USD' | 'INR' | 'EUR' | 'GBP';
    defaultPaymentTerms?: number;
    leadsModule: {
        isEnabled: boolean;
        enableAutoReminders: boolean;
        enableNewItemNotifications: boolean;
        dataRetentionDays: number;
    };
    security: {
        twoFactorEnabled: boolean;
        sessionTimeoutMinutes: number;
    };
}

export interface ApiKey {
    id: string;
    label: string;
    keyPrefix: string;
    createdAt: string;
    lastUsedAt?: string;
}

export type WebhookEvent = 'lead.created' | 'client.created' | 'invoice.paid' | 'task.completed';
export const availableWebhookEvents: WebhookEvent[] = ['lead.created', 'client.created', 'invoice.paid', 'task.completed'];

export interface Webhook {
    id: string;
    url: string;
    events: WebhookEvent[];
    isActive: boolean;
}

export type CustomFieldModule = 'Leads' | 'Clients' | 'Projects' | 'HR' | 'Finance';
export const customFieldModules: CustomFieldModule[] = ['Leads', 'Clients', 'Projects', 'HR', 'Finance'];
export type CustomFieldType = 'Text' | 'Number' | 'Date' | 'Dropdown' | 'Checkbox' | 'URL' | 'Email' | 'Multi-select';

export interface CustomField {
    id: string;
    label: string;
    type: CustomFieldType;
    modules: CustomFieldModule[];
    isRequired: boolean;
    status: 'Active' | 'Inactive';
    options?: string[]; // For Dropdown
    defaultValue?: any;
    validation?: {
        min?: number;
        max?: number;
        regex?: string;
    };
}

export interface SavedTaskView {
    id: string;
    name: string;
    params: {
        searchTerm: string;
        filters: {
            status: string[];
            priority: string[];
            projectId: string[];
            assigneeId: string[];
            due: string;
        };
        sort: { key: string; direction: string };
        viewMode: string;
    }
}

export interface AppNotification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    timestamp: string; // ISO
    isRead: boolean;
    severity: 'Low' | 'Medium' | 'High';
    icon: any; // ReactNode
    taskId?: string; // Link to entity
}

export type SOPCategory = 'Audit' | 'Ads' | 'Creative' | 'Retention' | 'Reporting' | 'Communication' | 'CRO' | 'Onboarding' | 'Pricing' | 'Other';

export interface SOP {
    id: string;
    title: string;
    category: SOPCategory;
    description: string;
    steps: string[];
    checklists?: string[];
    additionalNotes?: string;
    updatedAt: string; // ISO
}

export type SettingsSection = 'general' | 'userManagement' | 'rolesAndPermissions' | 'leadsSettings' | 'clientsSettings' | 'projectsSettings' | 'hrModuleSettings' | 'financeSettings' | 'calendarSettings' | 'notifications' | 'automation' | 'systemLogs' | 'apiAndWebhooks' | 'dataExportAndBackup' | 'security' | 'billingAndSubscription' | 'emailSettings' | 'customFields' | 'integrations' | 'formResponses';

export type PanelType = 'INVOICE_DETAIL_PANEL' | 'PROPOSAL_DETAIL_PANEL' | 'CREATE_PROPOSAL';

export interface ProjectsDrawerConfig {
    clientId?: string;
    projectId?: string;
    mode?: 'view' | 'create';
}
export type ProjectsDrawerMode = 'view' | 'create';

export interface CalendarEvent {
    id: string;
    date: Date;
    title: string;
    type: 'project' | 'task' | 'invoice' | 'lead' | 'audit' | 'anomaly' | 'leave';
    originalItem?: any;
    colorClass?: string;
}

export interface ToastData {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' }[];
  duration?: number;
  autoFocus?: boolean;
}

export interface Toast extends ToastData {
  id: number;
}

export interface BackupData {
    version: number;
    appSettings: AppSettings;
    clients: Client[];
    invoices: Invoice[];
    leads: Lead[];
    projects: Project[];
    tasks: Task[];
    teamMembers: TeamMember[];
    expenses: Expense[];
    payments: Payment[];
    activityHistory: ActivityLogItem[];
    auditRecords: AuditRecord[];
    marketingAudits: MarketingAuditRequest[];
    proposals: Proposal[];
    clientDocuments: ClientDocument[];
    onboardingKickoffData: OnboardingKickoffData[];
    campaigns: Campaign[];
    integrationPlatforms: IntegrationPlatform[];
    emails: EmailMessage[];
    chatContacts: ChatContact[];
    chatMessages: ChatMessage[];
    leaveRequests: LeaveRequest[];
    dailyAttendanceRecords: DailyAttendanceRecord[];
    performanceReviews: PerformanceReview[];
    hrDocuments: HRDocument[];
    payrollRecords: PayrollRecord[];
    roleDefinitions: RoleDefinition[];
    apiKeys: ApiKey[];
    webhooks: Webhook[];
    emailTemplates: EmailTemplate[];
    customFields: CustomField[];
    timeLogs: TimeLog[];
    savedViews: SavedTaskView[];
    notifications: AppNotification[];
    sops: SOP[];
    audits: Audit[];
}

export interface ImportSummary {
    counts: Record<string, number>;
    data: BackupData;
}

export interface DashboardSuggestion {
    id: string;
    title: string;
    description: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    actionPath?: () => void;
    severity?: 'Low' | 'Medium' | 'High';
}

export interface IntegrationPlatform {
    id: string;
    name: string;
    description: string;
    category: string;
    status: 'Connected' | 'Not Connected' | 'Coming Soon' | 'Error' | 'Disabled';
    logoUrl?: string;
    docsUrl?: string;
    manageUrl?: string;
}

export interface DiagnosticLog {
    timestamp: string;
    type: 'info' | 'warning' | 'error';
    message: string;
}

export type ModalType = 
  | 'LEAD_FORM' | 'CLIENT_FORM' | 'PROJECT_FORM' | 'TASK_FORM' 
  | 'INVOICE_FORM' | 'EXPENSE_FORM' | 'PAYMENT_FORM' | 'TIME_LOG_FORM'
  | 'EMAIL_COMPOSE' | 'VIEW_EMAIL' | 'FOLLOW_UP' | 'AUDIT_FORM'
  | 'AUDIT_REPORT' | 'TEAM_MEMBER_FORM' | 'LEAVE_REQUEST_FORM'
  | 'TEAM_ACTION' | 'CONFIRMATION' | 'CAMPAIGN_FORM' | 'CAMPAIGN_REPORT'
  | 'SEND_INVOICE' | 'INVOICE_BILL_VIEW' | 'TEAM_MEMBER_HR_FORM'
  | 'MARK_ATTENDANCE' | 'APPROVE_LEAVES' | 'UPLOAD_HR_DOC'
  | 'SCHEDULE_EXIT_INTERVIEW' | 'ONBOARDING_CHECKLIST' | 'EXIT_CHECKLIST'
  | 'PAYSLIP' | 'PROCESS_SALARY' | 'PROPOSAL_FORM' | 'KICKOFF_FORM'
  | 'SEND_PROPOSAL' | 'PERFORMANCE_REVIEW' | 'CUSTOM_FIELD_FORM'
  | 'CALENDAR_EVENT_DETAIL' | 'TEAM_MEMBER_HR_DETAIL' | 'SETTINGS'
  | 'SEND_AUDIT_REPORT' | 'IMPORT_CONFIRMATION' | 'SOP_FORM'
  | 'CLIENT_REPORT_GENERATOR'; // Added CLIENT_REPORT_GENERATOR
