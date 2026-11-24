import React, { useEffect, useState } from 'react';
import { X, Sparkles, Copy, Check, RefreshCw, MessageCircle } from 'lucide-react';
import type { Lead } from '../../types';
import { Button } from '../common/Button';
import { claudeMessage } from '../../services/ai';

const TONES = [
  { k: 'friendly', label: 'Friendly (Hinglish)' },
  { k: 'short', label: 'Short' },
  { k: 'formal', label: 'Formal English' },
  { k: 'nudge', label: 'Gentle follow-up' },
];

function leadContext(lead: Lead): string {
  const latest = lead.followUpHistory && lead.followUpHistory.length
    ? [...lead.followUpHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : null;
  const svc = Array.isArray(lead.serviceInterest) ? lead.serviceInterest.join(', ') : (lead.serviceInterest || '');
  return [
    `Lead name: ${lead.name}`,
    lead.companyName ? `Business: ${lead.companyName}` : '',
    `Stage: ${lead.status}`,
    lead.source ? `Source: ${lead.source}` : '',
    svc ? `Interested in: ${svc}` : '',
    lead.notes ? `Notes: ${lead.notes}` : '',
    latest ? `Last activity (${latest.followUpType || 'note'}): "${latest.note}"` : '',
  ].filter(Boolean).join('\n');
}

export const AiDraftModal: React.FC<{ lead: Lead; onClose: () => void }> = ({ lead, onClose }) => {
  const [tone, setTone] = useState('friendly');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async (t: string) => {
    setBusy(true);
    setError('');
    try {
      const sys = 'You are the sales / front-desk rep for an Indian business, replying to a lead on WhatsApp. Write ONLY the message to send — no preamble, no quotes, no explanation. Keep it 2-4 short lines, warm and human, never pushy. End with ONE clear next step (a question or simple call to action). Use at most one emoji. Never invent prices, offers or facts that are not given.';
      const toneLine = t === 'short'
        ? 'Tone: very short and crisp, 1-2 lines, Hinglish.'
        : t === 'formal'
          ? 'Tone: polite professional English.'
          : t === 'nudge'
            ? 'Tone: a gentle follow-up nudge because they have gone quiet. Hinglish.'
            : 'Tone: friendly Hinglish (simple Hindi written in English letters).';
      const out = await claudeMessage(sys, `Draft a WhatsApp reply to this lead.\n\n${leadContext(lead)}\n\n${toneLine}`, 400);
      setText(out);
    } catch (e) {
      setError((e as Error)?.message || 'Could not draft. Try again.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { generate('friendly'); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const digits = (lead.phone || '').replace(/\D/g, '');
  const wa = digits.length === 10 ? '91' + digits : digits;
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-slate-900 dark:text-white inline-flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> AI reply for {lead.name}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {TONES.map((tn) => (
              <button key={tn.k} onClick={() => { setTone(tn.k); generate(tn.k); }} disabled={busy} className={`px-3 py-1.5 rounded-full text-xs font-semibold border disabled:opacity-50 ${tone === tn.k ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900' : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'}`}>{tn.label}</button>
            ))}
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={busy ? 'Claude is writing…' : 'Your draft will appear here.'} className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white" />
          {busy && <p className="text-xs text-slate-500 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Drafting…</p>}
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => generate(tone)} leftIcon={<RefreshCw className="w-3.5 h-3.5 mr-1" />}>Regenerate</Button>
            <Button size="sm" variant="ghost" disabled={!text} onClick={copy} leftIcon={copied ? <Check className="w-3.5 h-3.5 mr-1 text-green-600" /> : <Copy className="w-3.5 h-3.5 mr-1" />}>{copied ? 'Copied' : 'Copy'}</Button>
            {wa && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] text-white text-sm font-semibold px-4 py-2"><MessageCircle className="w-4 h-4" /> Send on WhatsApp</a>}
          </div>
          <p className="text-[11px] text-slate-400">AI draft — read it before sending. Powered by your own Claude key.</p>
        </div>
      </div>
    </div>
  );
};
