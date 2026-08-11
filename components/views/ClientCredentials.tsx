import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Trash2, Plus, ShieldAlert, Check, KeyRound } from 'lucide-react';
import { Client, AccessCredential, CredentialLoginType, credentialLoginTypes } from '../../types';
import { encryptValue, decryptValue, isEncrypted } from '../../services/credentialCrypto';
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
  onBlur?: () => void;
  placeholder?: string;
}> = ({ label, id, value, onChange, onBlur, placeholder }) => {
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
          onBlur={onBlur}
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

const SENSITIVE_FIELDS: (keyof AccessCredential)[] = ['password', 'securityAnswer'];

export const ClientCredentials: React.FC<ClientCredentialsProps> = ({ client, onUpdateClient }) => {
  const storedCredentials = client.accessCredentials || [];

  const [passphrase, setPassphrase] = React.useState<string>('');
  const [unlocked, setUnlocked] = React.useState<boolean>(false);
  const [passInput, setPassInput] = React.useState<string>('');
  const [decrypted, setDecrypted] = React.useState<AccessCredential[]>(storedCredentials);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  const hasEncrypted = storedCredentials.some(c => SENSITIVE_FIELDS.some(f => isEncrypted(c[f] as string | undefined)));
  const needsUnlock = hasEncrypted && !unlocked;

  // A passphrase is in play once it's been set, or the user has started typing one.
  // From that point edits live in `decrypted` and only reach Firestore via saveEncrypted.
  const usingPassphrase = unlocked || !!passphrase || !!passInput;

  const handleUnlock = async () => {
    setUnlockError(null);
    try {
      const out: AccessCredential[] = [];
      for (const cred of storedCredentials) {
        const copy: AccessCredential = { ...cred };
        for (const f of SENSITIVE_FIELDS) {
          const v = cred[f] as string | undefined;
          if (isEncrypted(v)) {
            (copy as unknown as Record<string, unknown>)[f] = await decryptValue(v as string, passInput);
          }
        }
        out.push(copy);
      }
      setDecrypted(out); setPassphrase(passInput); setUnlocked(true);
    } catch { setUnlockError('Wrong passphrase, or data was saved with a different one.'); }
  };

  const credentials = needsUnlock ? [] : (usingPassphrase ? decrypted : storedCredentials);

  // onChange path: in-memory only. Never encrypts, so typing is never blocked
  // and no keystroke can be lost to a slow key derivation.
  const updateCredentials = (next: AccessCredential[]) => {
    if (usingPassphrase) {
      setDecrypted(next);
    } else {
      onUpdateClient({ ...client, accessCredentials: next });
    }
  };

  // Commit path: encrypts sensitive fields once, when editing finishes.
  // `override` is for callers that change the list and save in the same tick,
  // before the `decrypted` state update has landed.
  const saveEncrypted = async (override?: AccessCredential[]) => {
    const pass = passphrase || passInput;
    if (!pass) return; // nothing to encrypt without a passphrase
    const source = override ?? (unlocked || decrypted.length ? decrypted : storedCredentials);
    const encList: AccessCredential[] = [];
    for (const cred of source) {
      const copy: AccessCredential = { ...cred };
      for (const f of SENSITIVE_FIELDS) {
        const v = cred[f] as string | undefined;
        if (v && !isEncrypted(v)) {
          const encrypted = await encryptValue(v, pass);
          (copy as unknown as Record<string, unknown>)[f] = encrypted;
        }
      }
      encList.push(copy);
    }
    // We hold the plaintext in `decrypted`, so mark the session unlocked before the
    // encrypted list lands in props — otherwise hasEncrypted would flip the UI to the
    // lock screen against data this session can already read.
    setPassphrase(pass); setUnlocked(true);
    onUpdateClient({ ...client, accessCredentials: encList });
  };

  const handleAdd = () => {
    const next = [...credentials, newCredential()];
    updateCredentials(next);
    void saveEncrypted(next);
  };

  const handleFieldChange = (id: string, field: keyof AccessCredential, value: any) => {
    updateCredentials(credentials.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleFieldCommit = (next?: AccessCredential[]) => { void saveEncrypted(next); };

  // For discrete controls (dropdowns) where there's no blur to wait for.
  const handleFieldChangeCommit = (id: string, field: keyof AccessCredential, value: any) => {
    const next = credentials.map(c => c.id === id ? { ...c, [field]: value } : c);
    updateCredentials(next);
    void saveEncrypted(next);
  };

  const handleHandedOverChange = (id: string, checked: boolean) => {
    const next = credentials.map(c => c.id === id
      ? { ...c, handedOver: checked, handedOverDate: checked ? new Date().toISOString().slice(0, 10) : undefined }
      : c
    );
    updateCredentials(next);
    void saveEncrypted(next);
  };

  const handleDelete = (id: string) => {
    const next = credentials.filter(c => c.id !== id);
    updateCredentials(next);
    void saveEncrypted(next);
  };

  const loginTypeOptions = credentialLoginTypes.map(t => ({ value: t, label: t }));

  return (
    <div className="space-y-6">
      {needsUnlock ? (
        <div className="p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-premium-accent" />
            <p className="font-semibold text-text-heading dark:text-slate-100">Credentials are encrypted</p>
          </div>
          <p className="text-sm text-text-muted mb-3">Enter your passphrase to view or edit these credentials.</p>
          <div className="flex gap-2 max-w-sm">
            <input type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }} placeholder="Passphrase" className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-text-base dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-premium-accent" />
            <button type="button" onClick={handleUnlock} className="px-4 py-2 rounded-lg bg-premium-accent text-white text-sm font-medium hover:opacity-90">Unlock</button>
          </div>
          {unlockError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{unlockError}</p>}
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-800 dark:text-emerald-300 font-semibold">{passphrase || passInput ? 'Passwords are encrypted before saving.' : 'Set a passphrase to encrypt passwords before saving.'}</p>
          </div>
          <div className="flex gap-2 max-w-sm mt-3">
            <input type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)} placeholder={passphrase ? 'Passphrase set for this session' : 'Choose a passphrase to encrypt with'} disabled={!!passphrase} className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-text-base dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60" />
            {!passphrase && passInput && (<button type="button" onClick={() => { setPassphrase(passInput); setUnlocked(true); }} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:opacity-90 whitespace-nowrap">Use this</button>)}
          </div>
          <p className="text-xs text-text-muted mt-2">Remember this passphrase — it is never stored, so if you forget it the encrypted values cannot be recovered. Password and security-answer fields are encrypted; other fields are saved as-is.</p>
        </div>
      )}

      {!needsUnlock && (
      <>

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
                  onBlur={() => handleFieldCommit()}
                  placeholder="e.g., Hosting (Hostinger), Business Gmail, Shopify Admin"
                />
                <Select
                  label="Login Type"
                  options={loginTypeOptions}
                  value={cred.loginType}
                  onChange={(v) => handleFieldChangeCommit(cred.id, 'loginType', v as CredentialLoginType)}
                />
                <Input
                  label="Login URL"
                  id={`${cred.id}-url`}
                  value={cred.url || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'url', e.target.value)}
                  onBlur={() => handleFieldCommit()}
                  placeholder="https://..."
                />
                <Input
                  label="Username / Email"
                  id={`${cred.id}-username`}
                  value={cred.username || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'username', e.target.value)}
                  onBlur={() => handleFieldCommit()}
                  placeholder="login@example.com"
                />
                <SecretField
                  label="Password"
                  id={`${cred.id}-password`}
                  value={cred.password || ''}
                  onChange={(v) => handleFieldChange(cred.id, 'password', v)}
                  onBlur={() => handleFieldCommit()}
                  placeholder="Password"
                />
                <Input
                  label="Recovery Phone"
                  id={`${cred.id}-phone`}
                  value={cred.phone || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'phone', e.target.value)}
                  onBlur={() => handleFieldCommit()}
                  placeholder="+91 ..."
                />
                <Input
                  label="Recovery DOB / Info"
                  id={`${cred.id}-dob`}
                  value={cred.dob || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'dob', e.target.value)}
                  onBlur={() => handleFieldCommit()}
                  placeholder="DD/MM/YYYY or other recovery info"
                />
                <Input
                  label="Security Question"
                  id={`${cred.id}-secq`}
                  value={cred.securityQuestion || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'securityQuestion', e.target.value)}
                  onBlur={() => handleFieldCommit()}
                  placeholder="e.g., First pet's name?"
                />
                <SecretField
                  label="Security Answer"
                  id={`${cred.id}-seca`}
                  value={cred.securityAnswer || ''}
                  onChange={(v) => handleFieldChange(cred.id, 'securityAnswer', v)}
                  onBlur={() => handleFieldCommit()}
                  placeholder="Answer"
                />
                <TextArea
                  label="Notes"
                  id={`${cred.id}-notes`}
                  value={cred.notes || ''}
                  onChange={(e) => handleFieldChange(cred.id, 'notes', e.target.value)}
                  onBlur={() => handleFieldCommit()}
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
      </>
      )}
    </div>
  );
};
