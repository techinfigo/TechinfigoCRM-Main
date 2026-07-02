
import React from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { SettingsSection, FeatureKey, PermissionAction } from '../../types';
import { 
    Cog8ToothIcon, UsersIcon, ShieldCheckIcon, KeyIcon, CreditCardIcon, 
    Squares2x2Icon, BellIcon, EnvelopeIcon, PlusCircleIcon, LinkIcon, 
    DocumentMagnifyingGlassIcon, ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';
import { 
    Settings, Users, Shield, Lock, CreditCard, LayoutGrid, Bell, Mail, PlusCircle, Link, FileSearch, Download 
} from 'lucide-react';


interface SettingsSidebarProps {
  activeSection: SettingsSection;
  setActiveSection: (section: SettingsSection) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeSection, setActiveSection, hasPermission }) => {
  
  const navItems = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" />, group: 'General' },
    { id: 'userManagement', label: 'User Management', icon: <Users className="w-4 h-4" />, group: 'General' },
    { id: 'rolesAndPermissions', label: 'Roles & Permissions', icon: <Shield className="w-4 h-4" />, group: 'General' },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" />, group: 'General' },
    { id: 'billingAndSubscription', label: 'Billing & Subscription', icon: <CreditCard className="w-4 h-4" />, group: 'General' },
    
    { id: 'leadsSettings', label: 'Leads', icon: <LayoutGrid className="w-4 h-4" />, group: 'Modules' },
    { id: 'clientsSettings', label: 'Clients', icon: <LayoutGrid className="w-4 h-4" />, group: 'Modules' },
    { id: 'projectsSettings', label: 'Projects', icon: <LayoutGrid className="w-4 h-4" />, group: 'Modules' },
    { id: 'hrModuleSettings', label: 'HR Module', icon: <LayoutGrid className="w-4 h-4" />, group: 'Modules' },
    { id: 'financeSettings', label: 'Finance', icon: <LayoutGrid className="w-4 h-4" />, group: 'Modules' },
    { id: 'calendarSettings', label: 'Calendar', icon: <LayoutGrid className="w-4 h-4" />, group: 'Modules' },
    
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, group: 'Advanced' },
    { id: 'emailSettings', label: 'Email', icon: <Mail className="w-4 h-4" />, group: 'Advanced' },
    { id: 'customFields', label: 'Custom Fields', icon: <PlusCircle className="w-4 h-4" />, group: 'Advanced' },
    { id: 'automation', label: 'Automation', icon: <Settings className="w-4 h-4" />, group: 'Advanced' },
    
    { id: 'integrations', label: 'Integrations', icon: <Link className="w-4 h-4" />, group: 'System' },
    { id: 'apiAndWebhooks', label: 'API & Webhooks', icon: <Link className="w-4 h-4" />, group: 'System' },
    { id: 'formResponses', label: 'Form Responses', icon: <FileSearch className="w-4 h-4" />, group: 'System' },
    { id: 'systemLogs', label: 'System Logs', icon: <FileSearch className="w-4 h-4" />, group: 'System' },
    { id: 'dataExportAndBackup', label: 'Data Export & Backup', icon: <Download className="w-4 h-4" />, group: 'System' },
  ];
  
  const groupedItems = navItems.reduce((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <nav className="space-y-6">
      {Object.entries(groupedItems).map(([groupName, items]) => (
        <div key={groupName}>
          <h3 className="px-3 py-2 text-xs font-semibold text-text-muted dark:text-slate-500 uppercase tracking-wider">{groupName}</h3>
          <ul className="space-y-0.5 mt-1">
            {items.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 group
                    ${activeSection === item.id
                      ? 'bg-secondary-accent/10 text-secondary-accent'
                      : 'text-text-base dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                    }`}
                >
                  <span className={`mr-3 ${activeSection === item.id ? 'text-secondary-accent' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};
