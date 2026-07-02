
import React, { useState, useEffect } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { ApiKey, Webhook, WebhookEvent, availableWebhookEvents, FeatureKey, PermissionAction } from '../../../types';
import { Checkbox } from '../../common/Checkbox';
import { Modal } from '../../common/Modal';

interface ApiWebhooksSettingsViewProps {
  apiKeys: ApiKey[];
  webhooks: Webhook[];
  onRevokeApiKey: (keyId: string) => void;
  onAddApiKey: (label: string) => void;
  onAddWebhook: (webhook: Omit<Webhook, 'id'>) => void;
  onUpdateWebhook: (webhook: Webhook) => void;
  onDeleteWebhook: (webhookId: string) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

const KeyIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;
const TrashIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M2 3a1 1 0 00-1 1v1a1 1 0 001 1h1v8a1 1 0 001 1h8a1 1 0 001-1V6h1a1 1 0 001-1V4a1 1 0 00-1-1H2Zm2 2h8v8H4V5Zm2 1a1 1 0 011 1v4a1 1 0 01-2 0V7a1 1 0 011-1Zm4 0a1 1 0 011 1v4a1 1 0 01-2 0V7a1 1 0 011-1Z" /></svg>;

const WebhookModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (webhook: Omit<Webhook, 'id' | 'isActive'> & { isActive?: boolean }) => void;
    webhookToEdit?: Webhook | null;
}> = ({ isOpen, onClose, onSave, webhookToEdit }) => {
    const [url, setUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<Set<WebhookEvent>>(new Set());
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setUrl(webhookToEdit?.url || '');
            setSelectedEvents(new Set(webhookToEdit?.events || []));
            setIsActive(webhookToEdit?.isActive ?? true);
            setError('');
        }
    }, [isOpen, webhookToEdit]);

    const handleEventToggle = (event: WebhookEvent) => {
        setSelectedEvents(prev => {
            const next = new Set(prev);
            if (next.has(event)) next.delete(event);
            else next.add(event);
            return next;
        });
    };

    const handleSave = () => {
        if (!url.trim() || !url.startsWith('https://')) {
            setError('A valid HTTPS URL is required.');
            return;
        }
        if (selectedEvents.size === 0) {
            setError('At least one event must be selected.');
            return;
        }
        onSave({ url, events: Array.from(selectedEvents), isActive });
        onClose();
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={webhookToEdit ? 'Edit Webhook' : 'Add Webhook'} size="xl" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleSave}>Save Webhook</Button></>}>
            <div className="space-y-4">
                <Input label="Webhook URL *" id="webhook-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-service.com/webhook" error={error || undefined} />
                <div>
                    <label className="block text-sm font-medium text-text-muted dark:text-text-muted mb-2">Events to send</label>
                    <div className="space-y-2">
                        {availableWebhookEvents.map(event => (
                            <Checkbox key={event} id={`event-${event}`} label={event.replace('.', ' ')} checked={selectedEvents.has(event)} onChange={() => handleEventToggle(event)} />
                        ))}
                    </div>
                </div>
                 <div className="pt-2">
                     <Checkbox id="webhook-active" label="Enable Webhook" checked={isActive} onChange={() => setIsActive(!isActive)} />
                </div>
            </div>
        </Modal>
    );
}

export const ApiWebhooksSettingsView: React.FC<ApiWebhooksSettingsViewProps> = ({ apiKeys, webhooks, onRevokeApiKey, onAddApiKey, onAddWebhook, onUpdateWebhook, onDeleteWebhook, hasPermission }) => {
    const [newKeyLabel, setNewKeyLabel] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

    const handleAddKey = () => {
        if (!newKeyLabel.trim()) { alert('Please provide a label for the API key.'); return; }
        onAddApiKey(newKeyLabel);
        setNewKeyLabel('');
    };

    const handleOpenModal = (webhook?: Webhook) => {
        setEditingWebhook(webhook || null);
        setIsModalOpen(true);
    }
    
    return (
        <div className="space-y-6">
            <SettingsSectionCard title="API Keys" description="Manage API keys for programmatic access to your CRM data.">
                <div className="space-y-4">
                    {apiKeys.map(key => (
                        <div key={key.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                            <div className="flex items-center">
                                <KeyIcon />
                                <div className="ml-3">
                                    <p className="font-semibold text-text-base dark:text-slate-200">{key.label}</p>
                                    <p className="text-xs text-text-muted font-mono">{key.keyPrefix}************</p>
                                    <p className="text-xs text-text-muted">Created: {new Date(key.createdAt).toLocaleDateString()} | Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}</p>
                                </div>
                            </div>
                            <Button variant="danger" size="sm" onClick={() => { if(window.confirm(`Revoke key "${key.label}"? This action cannot be undone.`)) onRevokeApiKey(key.id); }}>
                                Revoke
                            </Button>
                        </div>
                    ))}
                    <div className="flex items-end gap-2 pt-4 border-t border-border-base dark:border-border-muted">
                        <Input label="New Key Label" id="new-key-label" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} placeholder="e.g., Marketing Site Integration" containerClassName="flex-grow" />
                        <Button onClick={handleAddKey} disabled={!newKeyLabel.trim()}>Generate New Key</Button>
                    </div>
                </div>
            </SettingsSectionCard>
            <SettingsSectionCard title="Webhooks" description="Send automated notifications to external services when events happen in your CRM.">
                <div className="space-y-3">
                    {webhooks.map(hook => (
                         <div key={hook.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                            <div>
                                <p className="font-semibold text-text-base dark:text-slate-200 font-mono truncate">{hook.url}</p>
                                <p className="text-xs text-text-muted">{hook.events.join(', ')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${hook.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{hook.isActive ? 'Active' : 'Inactive'}</span>
                                <Button variant="secondary" size="xs" onClick={() => handleOpenModal(hook)}>Edit</Button>
                                <Button variant="ghost" size="xs" className="p-1 text-red-500 hover:bg-red-100" onClick={() => onDeleteWebhook(hook.id)}><TrashIcon /></Button>
                            </div>
                         </div>
                    ))}
                    <Button onClick={() => handleOpenModal()} className="mt-2">Add Webhook</Button>
                </div>
            </SettingsSectionCard>
            <WebhookModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                webhookToEdit={editingWebhook}
                onSave={(data) => { editingWebhook ? onUpdateWebhook({id: editingWebhook.id, ...data, isActive: data.isActive ?? true}) : onAddWebhook({ ...data, isActive: data.isActive ?? true}); }}
            />
        </div>
    );
};
