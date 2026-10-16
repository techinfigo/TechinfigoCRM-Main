import React from 'react';
import { Rocket } from 'lucide-react';
import type { AgreedService, Client } from '../../types';
import { Modal } from '../common/Modal';
import { PROJECT_TEMPLATES, templateForService } from './projectTemplates';

/**
 * "Client is on board — start the project now?" Shown when a new client's
 * advance / first payment is recorded and the client has no project yet.
 * One tap opens the project popup with that service's template filled in.
 */
export const StartProjectPrompt: React.FC<{
  client: Client;
  reason: string;
  onStart: (service?: AgreedService) => void;
  onClose: () => void;
}> = ({ client, reason, onStart, onClose }) => {
  const who = client.companyName || client.name;
  const services = client.agreedServices || [];
  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      overrideZIndex="z-[1060]"
      title={
        <span className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-secondary-accent" /> Start the project for {who}?
        </span>
      }
      footer={
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm">
          Not now
        </button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-text-muted">{reason} Start now so the tasks, dates and reminders begin today.</p>
        <div className="space-y-2">
          {services.map((s) => {
            const t = PROJECT_TEMPLATES.find((x) => x.key === templateForService(s));
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onStart(s)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border-base dark:border-slate-600 hover:border-secondary-accent hover:bg-amber-50/60 dark:hover:bg-amber-400/10 text-left"
              >
                <span className="text-lg">{t?.emoji || '✏️'}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-text-heading dark:text-white">Start {s.name}</span>
                  <span className="block text-xs text-text-muted">
                    {t && t.key !== 'Custom' ? `${t.steps.length} tasks ready` : 'Blank project'} · ₹{Number(s.cost || 0).toLocaleString('en-IN')}
                    {s.billingType === 'One-Time' ? '' : `/${s.billingType === 'Monthly' ? 'month' : s.billingType.toLowerCase()}`}
                  </span>
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onStart()}
            className="w-full px-4 py-3 rounded-xl border border-dashed border-border-base dark:border-slate-600 text-sm font-semibold text-text-muted hover:text-text-heading text-left"
          >
            {services.length ? 'Another project…' : 'Create a project…'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
