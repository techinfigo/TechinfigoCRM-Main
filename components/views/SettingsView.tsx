
import React, { useState } from 'react';
import { 
    AppSettings, TeamMember, RoleDefinition, FeatureKey, PermissionAction, 
    IntegrationPlatform, ActivityLogItem, SettingsSection, ApiKey, Webhook, EmailTemplate, CustomField
} from '../../types';
import { SettingsSidebar } from '@/components/settings/SettingsSidebar';
import { PlaceholderSettingsView } from '@/components/settings/PlaceholderSettingsView';

// Import all the new section components
import { GeneralSettingsView } from '@/components/settings/sections/GeneralSettingsView';
import { UserManagementSettingsView } from '@/components/settings/sections/UserManagementSettingsView';
import { RolesPermissionsSettingsView } from '@/components/settings/sections/RolesPermissionsSettingsView';
import { LeadsSettingsView } from '@/components/settings/sections/LeadsSettingsView';
import { ClientsSettingsView } from '@/components/settings/sections/ClientsSettingsView';
import { ProjectsSettingsView } from '@/components/settings/sections/ProjectsSettingsView';
import { HRModuleSettingsView } from '@/components/settings/sections/HRModuleSettingsView';
import { FinanceSettingsView } from '@/components/settings/sections/FinanceSettingsView';
import { CalendarSettingsView } from '@/components/settings/sections/CalendarSettingsView';
import { NotificationsSettingsView } from '@/components/settings/sections/NotificationsSettingsView';
import { AutomationSettingsView } from '@/components/settings/sections/AutomationSettingsView';
import { SystemLogsSettingsView } from '@/components/settings/sections/SystemLogsSettingsView';
import { ApiWebhooksSettingsView } from '@/components/settings/sections/ApiWebhooksSettingsView';
import { DataExportSettingsView } from '@/components/settings/sections/DataExportSettingsView';
import { SecuritySettingsView } from '@/components/settings/sections/SecuritySettingsView';
import { BillingSettingsView } from '@/components/settings/sections/BillingSettingsView';
import { EmailSettingsView } from '@/components/settings/sections/EmailSettingsView';
import { CustomFieldsSettingsView } from '@/components/settings/sections/CustomFieldsSettingsView';
import { IntegrationsSettingsView } from '@/components/settings/sections/IntegrationsSettingsView';
import { FormResponsesSettingsView } from '@/components/settings/sections/FormResponsesSettingsView';
import { Button } from '../common/Button';
import { X } from 'lucide-react';


interface SettingsViewProps {
  // Pass all necessary state and handlers from App.tsx
  isOpen?: boolean; // Optional now, as we render inline
  teamMembers: TeamMember[];
  roleDefinitions: RoleDefinition[];
  appSettings: AppSettings;
  integrationPlatforms: IntegrationPlatform[];
  activityHistory: ActivityLogItem[];
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  currentUser: TeamMember | null;
  emailTemplates: EmailTemplate[];
  customFields: CustomField[];

  onSaveRoleDefinitions: (roleDefs: RoleDefinition[]) => void;
  onSaveSettings: (settings: AppSettings) => void;
  onConnectIntegration: (platformId: string) => void;
  onRevokeApiKey: (keyId: string) => void;
  onAddApiKey: (label: string) => void;
  onAddWebhook: (webhook: Omit<Webhook, 'id'>) => void;
  onUpdateWebhook: (webhook: Webhook) => void;
  onDeleteWebhook: (webhookId: string) => void;
  onSaveEmailTemplates: (templates: EmailTemplate[]) => void;
  onDeleteCustomField: (fieldId: string) => void;
  onOpenCustomFieldFormModal: (field: CustomField | null) => void;
  onRepairStorage: () => void;
  onExportData: () => void;
  onImportData: (fileContent: string) => void;
  onSimulateIncomingLead: (source: string) => void;
  
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const { hasPermission, onClose } = props;
  
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSettingsView appSettings={props.appSettings} onSaveSettings={props.onSaveSettings} hasPermission={hasPermission} />;
      
      case 'userManagement':
        return <UserManagementSettingsView teamMembers={props.teamMembers} roleDefinitions={props.roleDefinitions} hasPermission={hasPermission} />;
      
      case 'rolesAndPermissions':
        return <RolesPermissionsSettingsView roleDefinitions={props.roleDefinitions} onSaveRoleDefinitions={props.onSaveRoleDefinitions} hasPermission={hasPermission} />;

      case 'leadsSettings':
        return <LeadsSettingsView hasPermission={hasPermission} onSimulateIncomingLead={props.onSimulateIncomingLead} />;

      case 'clientsSettings':
        return <ClientsSettingsView />;

      case 'projectsSettings':
        return <ProjectsSettingsView />;

      case 'hrModuleSettings':
        return <HRModuleSettingsView />;

      case 'financeSettings':
        return <FinanceSettingsView appSettings={props.appSettings} onSaveSettings={props.onSaveSettings} hasPermission={hasPermission}/>;
      
      case 'calendarSettings':
        return <CalendarSettingsView />;

      case 'notifications':
        return <NotificationsSettingsView />;
      
      case 'automation':
        return <AutomationSettingsView />;

      case 'systemLogs':
        return <SystemLogsSettingsView activityHistory={props.activityHistory} teamMembers={props.teamMembers} />;
      
      case 'formResponses':
        return <FormResponsesSettingsView />;
      
      case 'apiAndWebhooks':
        return <ApiWebhooksSettingsView 
                  apiKeys={props.apiKeys} 
                  webhooks={props.webhooks} 
                  onRevokeApiKey={props.onRevokeApiKey}
                  onAddApiKey={props.onAddApiKey}
                  onAddWebhook={props.onAddWebhook}
                  onUpdateWebhook={props.onUpdateWebhook}
                  onDeleteWebhook={props.onDeleteWebhook}
                  hasPermission={hasPermission} 
                />;
      
      case 'dataExportAndBackup':
        return <DataExportSettingsView hasPermission={hasPermission} onRepairStorage={props.onRepairStorage} onExportData={props.onExportData} onImportData={props.onImportData} />;

      case 'security':
        return <SecuritySettingsView appSettings={props.appSettings} onSaveSettings={props.onSaveSettings} currentUser={props.currentUser} hasPermission={hasPermission} />;

      case 'billingAndSubscription':
        return <BillingSettingsView />;
      
      case 'emailSettings':
        return <EmailSettingsView 
                  templates={props.emailTemplates}
                  onSaveTemplates={props.onSaveEmailTemplates}
                  hasPermission={props.hasPermission}
               />;

      case 'customFields':
        return <CustomFieldsSettingsView 
                    customFields={props.customFields} 
                    onDelete={props.onDeleteCustomField} 
                    onOpenModal={props.onOpenCustomFieldFormModal} 
                />;

      case 'integrations':
        return <IntegrationsSettingsView platforms={props.integrationPlatforms} onConnect={props.onConnectIntegration} hasPermission={hasPermission} />;

      default:
        return <GeneralSettingsView appSettings={props.appSettings} onSaveSettings={props.onSaveSettings} hasPermission={hasPermission} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-900">
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-accent/10 rounded-lg text-secondary-accent">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.542L9.03 5.513A1.5 1.5 0 007.5 6.75h-1.5a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5h1.5a1.5 1.5 0 001.53 1.237l.198.297a1.5 1.5 0 001.237 1.53h.03a1.5 1.5 0 001.5-1.5l.298-.198a1.5 1.5 0 001.237-1.53v-.03a1.5 1.5 0 00-1.5-1.5l-1.237-1.53.198-.297a1.5 1.5 0 00-1.53-1.237h-.03a1.5 1.5 0 00-1.237 1.53l-.297.198A1.5 1.5 0 009 13.5v1.5a1.5 1.5 0 001.5 1.5h1.5a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5H15a1.5 1.5 0 00-1.5-1.5l-2.19-2.19a3.002 3.002 0 00-2.122-.879zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Admin Settings</h1>
             </div>
             <Button variant="outline" size="sm" onClick={onClose} leftIcon={<X className="w-4 h-4"/>}>Close</Button>
        </header>

        {/* Main Layout */}
        <div className="flex flex-1 overflow-hidden">
             {/* Sidebar Container */}
             <div className="w-64 md:w-72 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto hidden md:block">
                 <div className="p-4">
                    <SettingsSidebar activeSection={activeSection} setActiveSection={setActiveSection} hasPermission={hasPermission} />
                 </div>
             </div>

             {/* Mobile Sidebar (optional, could use a dropdown or separate drawer, for now sticking to desktop-first split) */}

             {/* Content Container */}
             <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-zinc-900/50">
                 <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                     {renderActiveSection()}
                 </div>
             </main>
        </div>
    </div>
  );
};
