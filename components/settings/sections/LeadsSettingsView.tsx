
import React, { useState } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { ToggleSwitch } from '../../common/ToggleSwitch';
import { FormField } from '../../common/FormField';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { FeatureKey, PermissionAction } from '../../../types';
import { Zap, Globe, Facebook, Copy } from 'lucide-react';

interface LeadsSettingsProps {
    hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
    onSimulateIncomingLead: (source: string) => void;
}

export const LeadsSettingsView: React.FC<LeadsSettingsProps> = ({ hasPermission, onSimulateIncomingLead }) => {
    const [isModuleEnabled, setIsModuleEnabled] = useState(true);
    const [retentionDays, setRetentionDays] = useState('365');
    const [enableNotifications, setEnableNotifications] = useState(true);
    const [simulatedSource, setSimulatedSource] = useState('Website Contact Form');
    const [webhookUrl, setWebhookUrl] = useState(`https://api.techinfigo.crm/v1/hooks/leads/${Math.random().toString(36).substring(7)}`);

    const handleCopyWebhook = () => {
        navigator.clipboard.writeText(webhookUrl);
        alert("Webhook URL copied to clipboard!");
    };

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Lead Integrations (Webhooks)"
                description="Automatically capture leads from external sources like Facebook Ads, Google Ads, or your website."
            >
                 <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-border-base dark:border-border-muted mb-4">
                    <h4 className="text-sm font-semibold text-text-heading dark:text-text-heading mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        How to Connect
                    </h4>
                    <p className="text-xs text-text-muted dark:text-text-muted mb-4 leading-relaxed">
                        To bring leads into Techinfigo automatically, you need to point your external lead sources to your CRM's webhook URL. 
                        We recommend using middleware like <strong>Zapier</strong> or <strong>Make.com</strong> to bridge your ads platform to this URL.
                    </p>
                    
                    <div className="space-y-3">
                        <FormField label="Your Unique Webhook URL">
                            <div className="flex gap-2">
                                <Input value={webhookUrl} readOnly className="font-mono text-xs bg-white dark:bg-slate-900" containerClassName="flex-grow"/>
                                <Button variant="outline" size="sm" onClick={handleCopyWebhook} leftIcon={<Copy className="w-3 h-3"/>}>Copy</Button>
                            </div>
                        </FormField>
                    </div>
                </div>

                <div className="border-t border-border-base dark:border-slate-700 pt-4">
                    <h4 className="text-sm font-semibold text-text-heading dark:text-text-heading mb-3">Test & Simulate Incoming Leads</h4>
                    <p className="text-xs text-text-muted dark:text-text-muted mb-3">
                        Use this tool to simulate a lead arriving from an external source to verify your pipeline automation and notifications.
                    </p>
                    
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-text-muted mb-1">Source Simulation</label>
                            <select 
                                value={simulatedSource} 
                                onChange={(e) => setSimulatedSource(e.target.value)}
                                className="w-full sm:w-48 p-2 text-sm bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:ring-1 focus:ring-premium-accent"
                            >
                                <option value="Website Contact Form">Website Contact Form</option>
                                <option value="Facebook Lead Ads">Facebook Lead Ads</option>
                                <option value="Google Ads">Google Ads</option>
                                <option value="LinkedIn Gen Forms">LinkedIn Gen Forms</option>
                            </select>
                        </div>
                        <Button 
                            onClick={() => onSimulateIncomingLead(simulatedSource)} 
                            variant="primary" 
                            size="sm"
                            leftIcon={simulatedSource.includes('Facebook') ? <Facebook className="w-3 h-3"/> : <Globe className="w-3 h-3"/>}
                        >
                            Simulate Incoming Lead
                        </Button>
                    </div>
                </div>
            </SettingsSectionCard>

            <SettingsSectionCard
                title="Leads Module Settings"
                description="Control the overall behavior of the Leads module."
            >
                <div className="space-y-4">
                    <ToggleSwitch
                        id="enable-leads-module"
                        label="Enable Leads Module"
                        description="Turn the entire Leads module on or off for all users."
                        checked={isModuleEnabled}
                        onChange={setIsModuleEnabled}
                    />
                     <ToggleSwitch
                        id="enable-leads-notifications"
                        label="Enable New Lead Notifications"
                        description="Send a notification to relevant users when a new lead is created."
                        checked={enableNotifications}
                        onChange={setEnableNotifications}
                        disabled={!isModuleEnabled}
                    />
                </div>
            </SettingsSectionCard>

            <SettingsSectionCard
                title="Data Management"
                description="Manage data retention policies and export lead data."
            >
                <div className="space-y-4">
                    <FormField 
                        label="Data Retention"
                        description="Automatically delete leads older than the specified number of days. Set to 0 for indefinite retention."
                        htmlFor="lead-retention"
                    >
                        <Input
                            id="lead-retention"
                            type="number"
                            value={retentionDays}
                            onChange={(e) => setRetentionDays(e.target.value)}
                            min="0"
                            className="max-w-xs"
                        />
                    </FormField>
                    <div className="pt-2">
                        <Button variant="secondary" onClick={() => alert('Exporting leads...')}>
                            Export All Leads (CSV)
                        </Button>
                    </div>
                </div>
            </SettingsSectionCard>

             <div className="mt-6 flex justify-end">
                <Button onClick={() => alert('Leads settings saved!')} >
                    Save Leads Settings
                </Button>
            </div>
        </div>
    );
};
