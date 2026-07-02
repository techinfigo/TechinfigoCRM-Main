
import React, { useState, useEffect } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { FormField } from '../../common/FormField';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { ToggleSwitch } from '../../common/ToggleSwitch';

// --- ICONS (self-contained for modularity) ---
const EditIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M11.354 1.646a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708L5.061 13.939a.5.5 0 0 1-.353.146H2.5a.5.5 0 0 1-.5-.5V11.293a.5.5 0 0 1 .146-.353L11.354 1.646ZM12.5 2.5 4.207 10.793V13h2.207L13.5 4.707 12.5 3.707V2.5Z" /><path d="m10.854 3.146 2.292 2.292-8.5 8.5H2.5v-2.292l8.5-8.5Z" /></svg>;
const TrashIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5zM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498-.075l-.275-5.5A.75.75 0 0 1 6.05 6zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711z" clipRule="evenodd" /></svg>;

// --- TYPE DEFINITIONS for local state ---
interface ClientTag {
    id: string;
    name: string;
    color: string;
}

interface CustomField {
    id: string;
    name: string;
    type: 'Text' | 'Number' | 'Date' | 'Dropdown';
}

interface ClientSettings {
    defaultStatus: 'Active' | 'Inactive' | 'Prospective';
    isPortalEnabled: boolean;
    notifications: {
        onNewClient: boolean;
        onStatusChange: boolean;
        onPaymentReceived: boolean;
    };
}

export const ClientsSettingsView: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [tags, setTags] = useState<ClientTag[]>([
        { id: 't1', name: 'Key Account', color: '#007bff' },
        { id: 't2', name: 'Local Business', color: '#28a745' },
        { id: 't3', name: 'High Potential', color: '#ffc107' },
    ]);
    const [newTag, setNewTag] = useState({ name: '', color: '#6c757d' });

    const [customFields, setCustomFields] = useState<CustomField[]>([
        { id: 'cf1', name: 'Account Manager', type: 'Text' },
        { id: 'cf2', name: 'Contract End Date', type: 'Date' },
        { id: 'cf3', name: 'Service Level', type: 'Dropdown' },
    ]);
    const [newField, setNewField] = useState({ name: '', type: 'Text' as CustomField['type'] });

    const [settings, setSettings] = useState<ClientSettings>({
        defaultStatus: 'Active',
        isPortalEnabled: true,
        notifications: {
            onNewClient: true,
            onStatusChange: true,
            onPaymentReceived: false,
        },
    });

    const showSaveNotification = () => {
        // In a real app, this would trigger a toast notification
        console.log("Setting saved!");
    };

    // Auto-save simulation
    useEffect(() => {
        // This effect can be debounced in a real application
        showSaveNotification();
    }, [settings, tags, customFields]);

    // --- HANDLERS ---
    const handleAddTag = () => {
        if (newTag.name.trim()) {
            setTags(prev => [...prev, { ...newTag, id: `tag-${Date.now()}` }]);
            setNewTag({ name: '', color: '#6c757d' });
        }
    };
    const handleDeleteTag = (id: string) => setTags(prev => prev.filter(t => t.id !== id));

    const handleAddCustomField = () => {
        if (newField.name.trim()) {
            setCustomFields(prev => [...prev, { ...newField, id: `cf-${Date.now()}` }]);
            setNewField({ name: '', type: 'Text' });
        }
    };
    const handleDeleteCustomField = (id: string) => setCustomFields(prev => prev.filter(f => f.id !== id));
    
    const handleSettingChange = (field: keyof ClientSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };
    
    const handleNotificationChange = (field: keyof ClientSettings['notifications'], value: boolean) => {
        setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [field]: value } }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1 */}
            <div className="space-y-6">
                <SettingsSectionCard title="Client Tags" description="Organize clients with custom-colored tags.">
                    <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                        {tags.map(tag => (
                            <div key={tag.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                                <div className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: tag.color }}></span>
                                    <p className="font-medium text-sm">{tag.name}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="xs" className="p-1" title="Edit Tag"><EditIcon/></Button>
                                    <Button variant="ghost" size="xs" className="p-1 text-status-negative" onClick={() => handleDeleteTag(tag.id)} title="Delete Tag"><TrashIcon/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-end gap-2 pt-3 border-t border-border-muted dark:border-slate-700">
                        <Input label="New Tag Name" value={newTag.name} onChange={e => setNewTag(p => ({...p, name: e.target.value}))} containerClassName="flex-grow"/>
                        <Input type="color" label="Color" value={newTag.color} onChange={e => setNewTag(p => ({...p, color: e.target.value}))} className="p-1 h-10"/>
                        <Button onClick={handleAddTag}>Add Tag</Button>
                    </div>
                </SettingsSectionCard>

                <SettingsSectionCard title="Client Defaults" description="Set default values for new clients.">
                    <div className="space-y-4">
                        <FormField label="Default Client Status" htmlFor="defaultStatus">
                            <select id="defaultStatus" value={settings.defaultStatus} onChange={e => handleSettingChange('defaultStatus', e.target.value)} className="w-full p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm">
                                <option>Active</option>
                                <option>Inactive</option>
                                <option>Prospective</option>
                            </select>
                        </FormField>
                        <ToggleSwitch id="portal-access" label="Enable Client Portal Access" description="Allow clients to log in to a dedicated portal (conceptual)." checked={settings.isPortalEnabled} onChange={checked => handleSettingChange('isPortalEnabled', checked)} />
                    </div>
                </SettingsSectionCard>
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
                <SettingsSectionCard title="Custom Fields" description="Add custom fields to the client profile.">
                     <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                        {customFields.map(field => (
                            <div key={field.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                                <div>
                                    <p className="font-medium text-sm">{field.name}</p>
                                    <p className="text-xs text-text-muted">{field.type}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                     <Button variant="ghost" size="xs" className="p-1" title="Edit Field"><EditIcon/></Button>
                                    <Button variant="ghost" size="xs" className="p-1 text-status-negative" onClick={() => handleDeleteCustomField(field.id)} title="Delete Field"><TrashIcon/></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-end gap-2 pt-3 border-t border-border-muted dark:border-slate-700">
                        <Input label="New Field Name" value={newField.name} onChange={e => setNewField(p => ({...p, name: e.target.value}))} containerClassName="flex-grow" />
                        <FormField label="Type" htmlFor="fieldType">
                            <select id="fieldType" value={newField.type} onChange={e => setNewField(p => ({...p, type: e.target.value as CustomField['type']}))} className="w-full p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm">
                                <option>Text</option><option>Number</option><option>Date</option><option>Dropdown</option>
                            </select>
                        </FormField>
                        <Button onClick={handleAddCustomField}>Add Field</Button>
                    </div>
                </SettingsSectionCard>
                
                 <SettingsSectionCard title="Notification Preferences" description="Manage when you are notified about client events.">
                    <div className="space-y-4">
                        <ToggleSwitch id="notif-new" label="Notify on New Client Addition" checked={settings.notifications.onNewClient} onChange={checked => handleNotificationChange('onNewClient', checked)} />
                        <ToggleSwitch id="notif-status" label="Notify on Client Status Change" checked={settings.notifications.onStatusChange} onChange={checked => handleNotificationChange('onStatusChange', checked)} />
                        <ToggleSwitch id="notif-payment" label="Notify on Payment Received" checked={settings.notifications.onPaymentReceived} onChange={checked => handleNotificationChange('onPaymentReceived', checked)} />
                    </div>
                </SettingsSectionCard>

                <SettingsSectionCard title="Data Management" description="Import or export your client list.">
                    <div className="flex flex-wrap gap-3">
                        <Button variant="secondary">Import Clients (CSV)</Button>
                        <Button variant="secondary">Export All Clients (CSV)</Button>
                    </div>
                </SettingsSectionCard>
            </div>
        </div>
    );
};
