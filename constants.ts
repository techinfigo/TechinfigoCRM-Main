


import { AppFeaturePermission, FeatureKey, PermissionAction, PermissionFlags, AuditChecklistHeading } from './types';

export const ALL_APP_FEATURES_CONFIG: {
  featureKey: FeatureKey;
  featureName: string;
  availablePermissions: { action: PermissionAction; label: string }[];
}[] = [
  { featureKey: 'dashboard', featureName: 'Dashboard', availablePermissions: [{ action: 'canView', label: 'View Dashboard' }] },
  {
    featureKey: 'leads',
    featureName: 'Leads',
    availablePermissions: [
      { action: 'canView', label: 'View Leads' },
      { action: 'canCreate', label: 'Create Leads' },
      { action: 'canEdit', label: 'Edit Leads' },
      { action: 'canDelete', label: 'Delete Leads' },
      { action: 'canUpdateStatus', label: 'Update Status' },
      { action: 'canConvert', label: 'Convert Leads' },
    ]
  },
  {
    featureKey: 'clients',
    featureName: 'Clients',
    availablePermissions: [
      { action: 'canView', label: 'View Clients' },
      { action: 'canCreate', label: 'Create Clients' },
      { action: 'canEdit', label: 'Edit Clients' },
      { action: 'canDelete', label: 'Delete Clients' },
    ]
  },
  {
    featureKey: 'projects',
    featureName: 'Projects',
    availablePermissions: [
      { action: 'canView', label: 'View Projects' },
      { action: 'canCreate', label: 'Create Projects' },
      { action: 'canEdit', label: 'Edit Projects' },
      { action: 'canDelete', label: 'Delete Projects' },
      { action: 'canAssignTeam', label: 'Assign Team Members' },
    ]
  },
  {
    featureKey: 'tasks',
    featureName: 'Tasks (Global)',
    availablePermissions: [
      { action: 'canView', label: 'View All Tasks' },
      { action: 'canCreate', label: 'Create Tasks' },
      { action: 'canEdit', label: 'Edit All Tasks' },
      { action: 'canDelete', label: 'Delete All Tasks' },
    ]
  },
  {
    featureKey: 'projectTasks',
    featureName: 'Project Tasks',
    availablePermissions: [
      { action: 'canView', label: 'View Tasks' },
      { action: 'canCreate', label: 'Create Tasks' },
      { action: 'canEdit', label: 'Edit Tasks' },
      { action: 'canDelete', label: 'Delete Tasks' },
      { action: 'canMarkComplete', label: 'Mark Complete' },
      { action: 'canAssignSelf', label: 'Assign Self' },
      { action: 'canAssignOthers', label: 'Assign Others' },
    ]
  },
   {
    featureKey: 'invoices',
    featureName: 'Invoices',
    availablePermissions: [
      { action: 'canView', label: 'View Invoices' },
      { action: 'canCreate', label: 'Create Invoices' },
      { action: 'canEdit', label: 'Edit Invoices' },
      { action: 'canDelete', label: 'Delete Invoices' },
      { action: 'canSend', label: 'Send Invoices' },
      { action: 'canManageRecurring', label: 'Manage Recurring' },
    ]
  },
  {
    featureKey: 'expenses',
    featureName: 'Expenses',
    availablePermissions: [
      { action: 'canView', label: 'View Expenses' },
      { action: 'canCreate', label: 'Create Expenses' },
      { action: 'canEdit', label: 'Edit Expenses' },
      { action: 'canDelete', label: 'Delete Expenses' },
    ]
  },
  { featureKey: 'finance', featureName: 'Finance Module', availablePermissions: [{ action: 'canView', label: 'View Finance Module' }] },
  {
    featureKey: 'hrModule',
    featureName: 'HR Module',
    availablePermissions: [
      { action: 'canViewHRModule', label: 'View HR Module' },
      { action: 'canManageHRMembers', label: 'Manage HR Members' },
      { action: 'canMarkAttendance', label: 'Mark Attendance' },
    ]
  },
  {
    featureKey: 'leaves',
    featureName: 'Leave Management',
    availablePermissions: [
      { action: 'canViewOwnLeave', label: 'View Own Leaves' },
      { action: 'canRequestLeave', label: 'Request Leave' },
      { action: 'canCancelOwnLeave', label: 'Cancel Own Leave' },
      { action: 'canViewAllLeave', label: 'View All Leaves' },
      { action: 'canManageLeaveRequests', label: 'Manage Leave Requests' },
    ]
  },
  { featureKey: 'calendar', featureName: 'Calendar', availablePermissions: [{ action: 'canView', label: 'View Calendar' }] },
  {
    featureKey: 'communication',
    featureName: 'Communication',
    availablePermissions: [
      { action: 'canView', label: 'View Communication' },
      { action: 'canSend', label: 'Send Emails/Messages' },
      { action: 'canManageDrafts', label: 'Manage Drafts' },
      { action: 'canDeleteEmails', label: 'Delete Emails' },
    ]
  },
  {
    featureKey: 'userProfile',
    featureName: 'User Profile',
    availablePermissions: [
      { action: 'canView', label: 'View Own Profile' },
      { action: 'canUpdateProfile', label: 'Update Own Profile' },
    ]
  },
  {
    featureKey: 'adminPanel',
    featureName: 'Admin Panel (Settings)',
    availablePermissions: [{ action: 'canView', label: 'Access Settings' }]
  },
  {
    featureKey: 'adminUsers',
    featureName: 'Admin: User Management',
    availablePermissions: [{ action: 'canManage', label: 'Manage Users' }]
  },
  {
    featureKey: 'adminRoles',
    featureName: 'Admin: Roles & Permissions',
    availablePermissions: [{ action: 'canManage', label: 'Manage Roles' }]
  },
  {
    featureKey: 'adminSettings',
    featureName: 'Admin: App Settings',
    availablePermissions: [{ action: 'canManage', label: 'Manage App Settings' }]
  },
  {
    featureKey: 'adminData',
    featureName: 'Admin: Data Management',
    availablePermissions: [{ action: 'canManage', label: 'Manage App Data' }]
  },
  {
    featureKey: 'marketingAudits',
    featureName: 'Marketing Audits',
    availablePermissions: [
      { action: 'canView', label: 'View Audit Requests' },
      { action: 'canCreate', label: 'Create Audit Requests' },
    ]
  },
  {
    featureKey: 'leadAudit',
    featureName: 'Lead Audit Actions',
    availablePermissions: [
      { action: 'canConductAudit', label: 'Conduct Audit' },
      { action: 'canViewAuditReport', label: 'View Audit Report' },
    ]
  },
  {
    featureKey: 'timeTracking',
    featureName: 'Time Tracking',
    availablePermissions: [
      { action: 'canLogTime', label: 'Log Time' },
      { action: 'canViewOwnTime', label: 'View Own Time' },
      { action: 'canEditOwnTime', label: 'Edit Own Time' },
      { action: 'canDeleteOwnTime', label: 'Delete Own Time' },
      { action: 'canViewAllTime', label: 'View All Time Logs' },
      { action: 'canManageAllTimeLogs', label: 'Manage All Time Logs' },
    ]
  },
   {
    featureKey: 'notifications',
    featureName: 'Notifications',
    availablePermissions: [
        { action: 'canViewNotifications', label: 'View Notifications' }
    ]
  },
  {
    featureKey: 'sopLibrary',
    featureName: 'SOP Library',
    availablePermissions: [
        { action: 'canView', label: 'View Library' }
    ]
  }
];

export const ECOMMERCE_AUDIT_PARAMETERS: { headingName: string; concerns: { key: string; label: string }[] }[] = [
    {
        headingName: "Website Structure",
        concerns: [
            { key: "websiteStructure_pageAvailability", label: "Page Availability (404s)" },
            { key: "websiteStructure_siteSpeed", label: "Site Speed" },
            { key: "websiteStructure_mobileResponsiveness", label: "Mobile Responsiveness" },
        ]
    },
    {
        headingName: "Product Page",
        concerns: [
            { key: "productPage_highQualityProductImages", label: "High-Quality Product Images" },
            { key: "productPage_keyBenefitsAvailable", label: "Key Benefits Display" },
        ]
    },
    {
        headingName: "Google Organic SEO",
        concerns: [
            { key: "googleOrganicSEO_keywordInTitleURLMetaDescription", label: "Keyword in Title, URL, Meta Description" },
        ]
    }
];

export const ECOMMERCE_AUDIT_CHECKLIST_TEMPLATE: AuditChecklistHeading[] = ECOMMERCE_AUDIT_PARAMETERS.map(heading => ({
    headingName: heading.headingName,
    concerns: heading.concerns.map(concern => ({
        concernName: concern.label,
        status: 'Not Evaluated',
        key: concern.key,
        label: concern.label,
    }))
}));


export const calendarEventColors = {
  project: 'bg-blue-200 text-blue-800 dark:bg-blue-700/50 dark:text-blue-200',
  task: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700/50 dark:text-yellow-200',
  invoice: 'bg-red-200 text-red-800 dark:bg-red-700/50 dark:text-red-200',
  lead: 'bg-purple-200 text-purple-800 dark:bg-purple-700/50 dark:text-purple-200',
  audit: 'bg-indigo-200 text-indigo-800 dark:bg-indigo-700/50 dark:text-indigo-200',
  anomaly: 'bg-pink-200 text-pink-800 dark:bg-pink-700/50 dark:text-pink-200',
  leave: 'bg-teal-200 text-teal-800 dark:bg-teal-700/50 dark:text-teal-200',
};

export const getDefaultRolePermissions = (): AppFeaturePermission[] => {
    return ALL_APP_FEATURES_CONFIG.map(feature => {
        const currentPermissions = feature.availablePermissions.reduce((acc, perm) => {
            acc[perm.action] = false;
            return acc;
        }, {} as PermissionFlags);

        if (['dashboard', 'projects', 'projectTasks', 'clients', 'leads', 'calendar', 'onboarding', 'campaigns', 'communication', 'finance', 'sopLibrary'].includes(feature.featureKey)) {
            currentPermissions.canView = true;
        }
        if (feature.featureKey === 'tasks') {
            currentPermissions.canView = true;
        }
        if (feature.featureKey === 'invoices' || feature.featureKey === 'expenses' || feature.featureKey === 'marketingAudits' || feature.featureKey === 'auditDetail') {
            currentPermissions.canView = true; 
        }
        if (feature.featureKey === 'hrModule') { 
            currentPermissions.canViewHRModule = true; 
            currentPermissions.canMarkAttendance = true; 
        }
        if (feature.featureKey === 'userProfile') {
            currentPermissions.canView = true;
            currentPermissions.canUpdateProfile = true;
        }
        if (feature.featureKey === 'notifications') { // All users can view their notifications
            currentPermissions.canViewNotifications = true;
        }
        if (feature.featureKey === 'integrations') { 
            currentPermissions.canView = true;
        }
        if (feature.featureKey === 'communication') { 
            currentPermissions.canView = true;
            currentPermissions.canSend = true;
            currentPermissions.canManageDrafts = true; 
            currentPermissions.canDeleteEmails = true; 
        }
        if (feature.featureKey === 'leadAudit') { 
            currentPermissions.canConductAudit = true;
            currentPermissions.canViewAuditReport = true;
        }
        if (feature.featureKey === 'leaves') {
            currentPermissions.canViewOwnLeave = true;
            currentPermissions.canRequestLeave = true;
            currentPermissions.canCancelOwnLeave = true;
        }
        if (feature.featureKey === 'projectTasks') { 
            currentPermissions.canEdit = true; 
            currentPermissions.canMarkComplete = true;
            currentPermissions.canAssignSelf = true;
        }
         if (feature.featureKey === 'timeTracking') {
            currentPermissions.canLogTime = true;
            currentPermissions.canViewOwnTime = true;
            currentPermissions.canEditOwnTime = true;
            currentPermissions.canDeleteOwnTime = true;
        }
        if (feature.featureKey === 'adminPanel') {
            currentPermissions.canView = false; 
        }
        return { ...feature, currentPermissions };
    });
};