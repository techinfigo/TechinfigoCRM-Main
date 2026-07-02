













import { 
    BackupData, ImportSummary,
    Task, Project, Client, Invoice, Lead, TeamMember, Expense, Payment, ActivityLogItem,
    AuditRecord, MarketingAuditRequest, Proposal, ClientDocument, OnboardingKickoffData,
    Campaign, IntegrationPlatform, EmailMessage, ChatContact, ChatMessage, LeaveRequest,
    DailyAttendanceRecord, PerformanceReview, HRDocument, PayrollRecord, RoleDefinition,
    ApiKey, Webhook, EmailTemplate, CustomField, TimeLog, SavedTaskView, AppSettings, AppNotification, SOP, Audit
} from './types';
// FIX: Corrected import path for local utils file.
import { safeLocalStorageGet } from './utils';
import { queueCloudWrite } from './cloudSync';


export const CURRENT_STORAGE_VERSION = 1;

// Define all storage keys in one place
export const KEYS = {
    appSettings: 'crm_appSettings',
    clients: 'crm_clients',
    invoices: 'crm_invoices',
    leads: 'crm_leads',
    projects: 'crm_projects',
    tasks: 'crm_tasks', // global tasks
    teamMembers: 'crm_teamMembers',
    expenses: 'crm_expenses',
    payments: 'crm_payments',
    activityHistory: 'crm_activityHistory',
    auditRecords: 'crm_auditRecords',
    marketingAudits: 'crm_marketingAudits',
    proposals: 'crm_proposals',
    clientDocuments: 'crm_clientDocuments',
    onboardingKickoffData: 'crm_onboardingKickoffData',
    campaigns: 'crm_campaigns',
    integrationPlatforms: 'crm_integrationPlatforms',
    emails: 'crm_emails',
    chatContacts: 'crm_chatContacts',
    chatMessages: 'crm_chatMessages',
    leaveRequests: 'crm_leaveRequests',
    dailyAttendanceRecords: 'crm_dailyAttendanceRecords',
    performanceReviews: 'crm_performanceReviews',
    hrDocuments: 'crm_hrDocuments',
    payrollRecords: 'crm_payrollRecords',
    roleDefinitions: 'crm_roleDefinitions',
    apiKeys: 'crm_apiKeys',
    webhooks: 'crm_webhooks',
    emailTemplates: 'crm_emailTemplates',
    customFields: 'crm_customFields',
    timeLogs: 'crm_timeLogs',
    savedViews: 'crm_savedViews',
    currentUser: 'crm_currentUser',
    lastUser: 'crm_lastUser',
    theme: 'crm_theme',
    globalSnoozeUntil: 'crm_globalSnoozeUntil',
    notifications: 'crm_notifications',
    sops: 'crm_sops',
    audits: 'crm_audits', // New key for Audits module
};

// Generic load/save functions
export const load = <T,>(key: string, fallback: T): T => safeLocalStorageGet(key, fallback);

export const save = <T,>(key: string, data: T) => {
  try {
    const stringifiedValue = JSON.stringify(data);
    // Prevent redundant writes that could trigger storage events
    if (localStorage.getItem(key) !== stringifiedValue) {
      localStorage.setItem(key, stringifiedValue);
    }
  } catch (error) {
    console.error(`Error writing to localStorage for key "${key}".`, error);
  }
  // Also persist to Firestore (debounced, no-op if not signed in / not configured).
  queueCloudWrite(key, data);
};

// --- EXPORT / IMPORT ---
export function exportData(allData: Omit<BackupData, 'version'>): string {
    const backupData: BackupData = {
        version: CURRENT_STORAGE_VERSION,
        ...allData
    };
    return JSON.stringify(backupData, null, 2);
}

export function validateBackupFile(jsonString: string): { summary: ImportSummary; } | { error: string } {
    let parsedData;
    try {
        parsedData = JSON.parse(jsonString);
    } catch (e) {
        return { error: 'Invalid JSON file. The file could not be parsed.' };
    }

    if (typeof parsedData !== 'object' || parsedData === null || !('version' in parsedData)) {
        return { error: 'Invalid backup format. Missing "version" key.' };
    }
    
    if (parsedData.version !== CURRENT_STORAGE_VERSION) {
         return { error: `Version mismatch. Expected v${CURRENT_STORAGE_VERSION}, but file is v${parsedData.version}.` };
    }

    const counts: ImportSummary['counts'] = {};
    for (const key in KEYS) {
        if (Object.prototype.hasOwnProperty.call(KEYS, key)) {
            const dataKey = key as keyof Omit<BackupData, 'version'>;
            if (dataKey in parsedData) {
                if (Array.isArray(parsedData[dataKey])) {
                    counts[dataKey] = parsedData[dataKey].length;
                } else {
                    counts[dataKey] = 1;
                }
            } else {
                counts[dataKey] = 0;
            }
        }
    }
    
    return { summary: { counts, data: parsedData as BackupData } };
}

function mergeArraysById<T extends { id: string }>(current: T[], backup: T[]): T[] {
    if (!Array.isArray(current) || !Array.isArray(backup)) return current;
    
    const backupMap = new Map(backup.map(item => [item.id, item]));
    const seenIds = new Set<string>();

    const merged = current.map(item => {
        seenIds.add(item.id);
        return backupMap.has(item.id) ? backupMap.get(item.id)! : item;
    });

    const newItems = backup.filter(item => !seenIds.has(item.id));
    
    return [...merged, ...newItems];
}

export function importData(backupData: BackupData, currentData: Omit<BackupData, 'version'>, mode: 'replace' | 'merge'): Omit<BackupData, 'version'> {
    if (mode === 'replace') {
        const replacedData: any = {};
        for (const key in KEYS) {
            const dataKey = key as keyof Omit<BackupData, 'version'>;
            replacedData[dataKey] = backupData[dataKey] || currentData[dataKey];
        }
        return replacedData;
    } else { // Merge logic
        const mergedData: any = {};
        for (const key in KEYS) {
             const dataKey = key as keyof Omit<BackupData, 'version'>;
             const currentSlice = currentData[dataKey];
             const backupSlice = backupData[dataKey];

             if (Array.isArray(currentSlice) && Array.isArray(backupSlice)) {
                 mergedData[dataKey] = mergeArraysById(currentSlice as any[], backupSlice as any[]);
             } else {
                 mergedData[dataKey] = backupSlice !== undefined ? backupSlice : currentSlice;
             }
        }
        return mergedData;
    }
}


export const repairStorage = () => {
    if (!window.confirm("This will attempt to repair your local storage data by clearing potentially corrupted entries. Use this if the app fails to load. Proceed?")) {
        return;
    }
    let repaired = false;
    Object.values(KEYS).forEach(key => {
        try {
            const item = localStorage.getItem(key);
            if (item) JSON.parse(item);
        } catch (e) {
            console.warn(`Removing corrupted item for key: ${key}`);
            localStorage.removeItem(key);
            repaired = true;
        }
    });

    if (repaired) {
        alert('Storage repair complete. Corrupted items removed. The application will now reload.');
        window.location.reload();
    } else {
        alert('No corrupted items found in storage.');
    }
};
