import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Trash2, Plus, ShieldAlert, Check, KeyRound } from 'lucide-react';
import { Client, AccessCredential, CredentialLoginType, credentialLoginTypes } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Select } from '../common/Select';
import { Checkbox } from '../common/Checkbox';

interface ClientCredentialsProps {
  client: Client;
  onUpdateClient: (client: Client) => void;
}

const newCredential = (): AccessCredential => ({
  id: `cred-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: '',
  loginType: 'Email + Password',
});

const SecretField: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ label, id, value, onChange, placeholder }) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail silently (permissions/non-secure context) — nothing to recover.
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          className="block w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-text-muted dark:placeholder-slate-400 text-text-base dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-bg-muted focus:ring-secondary-accent dark:focus:ring-secondary-accent focus:border-secondary-accent dark:focus:border-secondary-accent transition-colors duration-150 pl-3 pr-20 py-2 text-sm"
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={visible ? 'Hide' : 'Reveal'}
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-status-positive" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ClientCredentials: React.FC<ClientCredentialsProps> = ({ client, onUpdateClient }) => {
  const credentials = client.accessCredentials || [];

  const updateCredentials = (next: AccessCredential[]) => {
    onUpdateClient({ ...client, accessCredentials: next });
  };

  const handleAdd = () => {
    updateCredentials([...credentials, newCredential()]);
  };

  const handleFieldChange = (id: string, field: keyof AccessCredential, value: any) => {
    updateCredentials(credentials.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleHandedOverChange = (id: string, checked: boolean) => {
    updateCredentials(credentials.map(c => c.id === id
      ? { ...c, handedOver: checked, handedOverDate: checked ? new Date().toISOString().slice(0, 10) : undefined }
      : c
    ));
  };

  const handleDelete = (id: string) => {
    updateCredentials(credentials.filter(c => c.id !== id));
  };

  const loginTypeOptions = credentialLoginTypes.map(t => ({ value: t, label: t }));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p className="font-semibold">Stored as plain text — not encrypted.</p>
          <p className="mt-0.5">
            This app has no backend, so everything entered below is saved as-is in the browser/Firestore storage. Treat it as a
            convenience handover vault, not a secure password manager: limit who has CRM access, and remove credentials once
            they're handed over and no longer needed here.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-zinc-400" /> Credentials & Handover
        </h3>
        <Button variant="primary" size="sm" leftIcon={<Plus />} onClick={handleAdd}>
          Add Credential
        </Button>
      </div>

      {credentials.length === 0 ? (
        <Card className="bg-transparent shadow-none border-dashed">
          <p className="text-sm text-text-muted text-center py-6">
            No credentials stored yet. Click "Add Credential" to start building the handover vault for this client.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {credentials.map((cred) => (
            <Card
              key={cred.id}
              title={cred.label || 'Untitled Credential'}
              actions={
                <button
                  type="button"
                  onClick={() => handleDelete(cred.id)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-status-negative hover:bg-status-negative/10 transition-colors"
                  title="Delete credential"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Label"
                  id={`${cred.id}-label`}
                  value={cred.label}
                  onChange={(e) => handleFieldChange(cred.id, 'label', e.target.value)}
                  placeholder="e.g., Hosting (Hostinger), Business Gmail, Shopify Admin"
                />
                <Select
                  label="Login Type"
                  options={loginTypeOptions}
                  value={cred.loginType}
                  onChange={(v) => handleFieldChange(cred.id, 'loginType', v as CredentialLoginType)}
                />
                <Input
                  label="Login URL"
                  id={`${cred.id}-url`}
                  value={cred.url || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'url', e.target.value)}
                  placeholder="https://..."
                />
                <Input
                  label="Username / Email"
                  id={`${cred.id}-username`}
                  value={cred.username || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'username', e.target.value)}
                  placeholder="login@example.com"
                />
                <SecretField
                  label="Password"
                  id={`${cred.id}-password`}
                  value={cred.password || ''}
                  onChange={(v) => handleFieldChange(cred.id, 'password', v)}
                  placeholder="Password"
                />
                <Input
                  label="Recovery Phone"
                  id={`${cred.id}-phone`}
                  value={cred.phone || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'phone', e.target.value)}
                  placeholder="+91 ..."
                />
                <Input
                  label="Recovery DOB / Info"
                  id={`${cred.id}-dob`}
                  value={cred.dob || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'dob', e.target.value)}
                  placeholder="DD/MM/YYYY or other recovery info"
                />
                <Input
                  label="Security Question"
                  id={`${cred.id}-secq`}
                  value={cred.securityQuestion || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'securityQuestion', e.target.value)}
                  placeholder="e.g., First pet's name?"
                />
                <SecretField
                  label="Security Answer"
                  id={`${cred.id}-seca`}
                  value={cred.securityAnswer || ''}
                  onChange={(v) => handleFieldChange(cred.id, 'securityAnswer', v)}
                  placeholder="Answer"
                />
                <TextArea
                  label="Notes"
                  id={`${cred.id}-notes`}
                  value={cred.notes || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'notes', e.target.value)}
                  rows={2}
                  containerClassName="md:col-span-2"
                  placeholder="Anything else relevant to this login..."
                />
              </div>

              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <Checkbox
                  label="Access handed over to client"
                  checked={!!cred.handedOver}
                  onChange={(e) => handleHandedOverChange(cred.id, e.target.checked)}
                />
                {cred.handedOver && cred.handedOverDate && (
                  <span className="text-xs text-status-positive font-medium">
                    Handed over on {cred.handedOverDate}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
