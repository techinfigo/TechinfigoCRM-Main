

import React, { useState } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Button } from '../../common/Button';
import { Input, TextArea } from '../../common/Input';
import { EmailTemplate, FeatureKey, PermissionAction } from '../../../types';
import { EmailTemplatesManagement } from './email/EmailTemplatesManagement';
import { EmailLogsView } from './email/EmailLogsView';
import { Card } from '../../common/Card';

interface EmailSettingsViewProps {
  templates: EmailTemplate[];
  onSaveTemplates: (templates: EmailTemplate[]) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

type EmailSettingsTab = 'general' | 'templates' | 'smtp' | 'logs';

// --- SUB-COMPONENTS for TABS ---

const GeneralEmailSettings: React.FC = () => {
    // Dummy state for demonstration
    const [signature, setSignature] = useState('Best Regards,\n<strong>The TECHINFIGO Team</strong>');
    const [attachSignature, setAttachSignature] = useState(true);
    const [fromName, setFromName] = useState('TECHINFIGO CRM');
    const [replyTo, setReplyTo] = useState('support@techinfigo.com');

    return (
        <div className="space-y-6">
            <Card title="Email Signature" className="bg-bg-base dark:bg-bg-muted">
                <TextArea
                    label="Default Signature (HTML allowed)"
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    rows={5}
                />
                <div className="mt-3">
                    <label className="flex items-center">
                        <input type="checkbox" className="form-checkbox h-4 w-4 text-premium-accent" checked={attachSignature} onChange={e => setAttachSignature(e.target.checked)} />
                        <span className="ml-2 text-sm text-text-muted">Attach signature by default to all outgoing emails.</span>
                    </label>
                </div>
            </Card>
            <Card title="Default Sender Info" className="bg-bg-base dark:bg-bg-muted">
                <div className="space-y-4">
                    <Input label="Default From Name" value={fromName} onChange={e => setFromName(e.target.value)} />
                    <Input label="Default Reply-To Email" value={replyTo} onChange={e => setReplyTo(e.target.value)} />
                </div>
            </Card>
        </div>
    );
};

const SmtpConfiguration: React.FC = () => (
    <Card title="SMTP Server Configuration (Placeholder)" className="bg-bg-base dark:bg-bg-muted">
        <p className="text-sm text-text-muted mb-4">
            Configure a custom SMTP server to send emails directly from your own provider. This can improve deliverability and branding.
        </p>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="SMTP Host" placeholder="smtp.example.com" disabled />
                <Input label="SMTP Port" placeholder="587" disabled />
            </div>
            <Input label="SMTP Username" placeholder="your_username" disabled />
            <Input label="SMTP Password" type="password" placeholder="••••••••••" disabled />
             <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Encryption</label>
                <select className="w-full p-2 bg-slate-200 dark:bg-slate-700 border border-border-muted rounded-md" disabled>
                    <option>TLS</option>
                    <option>SSL</option>
                    <option>None</option>
                </select>
             </div>
             <Button disabled>Test Connection</Button>
        </div>
    </Card>
);

// --- MAIN VIEW COMPONENT ---

export const EmailSettingsView: React.FC<EmailSettingsViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<EmailSettingsTab>('templates');

  const tabItems: { id: EmailSettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'templates', label: 'Templates' },
    { id: 'smtp', label: 'SMTP' },
    { id: 'logs', label: 'Logs' },
  ];

  const renderTabContent = () => {
    switch(activeTab) {
        case 'general': return <GeneralEmailSettings />;
        case 'templates': return <EmailTemplatesManagement templates={props.templates} onSaveTemplates={props.onSaveTemplates} />;
        case 'smtp': return <SmtpConfiguration />;
        case 'logs': return <EmailLogsView />;
        default: return null;
    }
  };

  return (
    <SettingsSectionCard
      title="Email Module Settings"
      description="Manage sending preferences, templates, SMTP configuration, and view logs."
      contentClassName="p-0"
    >
        <div className="border-b border-border-base dark:border-slate-700 px-4">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabItems.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium
                  ${activeTab === tab.id
                    ? 'border-premium-accent-dark text-premium-accent-dark'
                    : 'border-transparent text-text-muted hover:text-text-base hover:border-slate-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/20">
            {renderTabContent()}
        </div>
    </SettingsSectionCard>
  );
};
