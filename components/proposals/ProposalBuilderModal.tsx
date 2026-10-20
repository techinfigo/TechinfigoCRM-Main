import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Eye, Link2, Loader2, MessageCircle, PencilLine, Star } from 'lucide-react';
import type { Client, Lead, Proposal } from '../../types';
import { load, save, KEYS } from '../../storage';
import { Modal } from '../common/Modal';
import {
  CUSTOMER_WORDS,
  PROPOSAL_PROBLEMS,
  PROPOSAL_SERVICES,
  guessCustomerWord,
  inr,
  proposalNumbers,
  renderProposalHtml,
  type ProposalDesign,
  type ProposalProblem,
  type ProposalService,
  type ProposalServiceKey,
} from '../../services/proposalDesign';
import { publishProposal } from '../../services/proposalPublish';

/**
 * Proposal builder: fill a few fields, the proposal comes out in the one fixed
 * Techinfigo design (live preview on the right / "Preview" tab on phones).
 * "Save & get link" publishes it to www.techinfigo.com/p/<id>.
 */

type Contact = ProposalDesign['contact'];
const DEFAULT_CONTACT: Contact = { name: 'Sachin Bauddh', phone: '9557338487', address: 'Sanjay Place, Agra', upiId: '' };
const VALUE_NOTES = ['/year', '/month', 'per visit', 'per order', 'one-time'];

const localDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => localDay(new Date());
const plusDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return localDay(d);
};

/** Picks catalogue services matching a client's agreed services (by name). */
function servicesFromNames(names: { name: string; cost?: number; billingType?: string }[]): ProposalService[] {
  const out: ProposalService[] = [];
  const add = (k: ProposalServiceKey, price?: number) => {
    if (out.some((s) => s.key === k)) return;
    const c = PROPOSAL_SERVICES.find((s) => s.key === k)!;
    out.push({ key: c.key, title: c.title, price: price || c.price, billing: c.billing, ticks: [...c.ticks], recommended: c.recommended });
  };
  for (const n of names) {
    const s = n.name.toLowerCase();
    if (/google business|gbp|google profile|maps|gmb/.test(s)) add('gbp', n.cost);
    else if (/web|site|landing/.test(s)) add('website', n.cost);
    else if (/seo|rank/.test(s)) add('seo', n.cost);
    else if (/social|insta|content|reel/.test(s)) add('social', n.cost);
    else if (/ads|meta|ppc|campaign/.test(s)) add('ads', n.cost);
    else if (/growth|retainer|bundle/.test(s)) add('growth', n.cost);
  }
  return out;
}

const blankDesign = (number: string, contact: Contact): ProposalDesign => ({
  v: 1,
  number,
  date: today(),
  validUntil: plusDays(today(), 15),
  business: '',
  person: '',
  customerWord: 'customers',
  score: null,
  problems: [PROPOSAL_PROBLEMS[0], PROPOSAL_PROBLEMS[1]],
  services: servicesFromNames([{ name: 'Website' }, { name: 'Growth' }]),
  roi: { enabled: true, avgValue: 0, valueNote: '/year', profitPct: 50, joinPct: 10, adBudget: 10000 },
  ctaLine: 'Ready to start?',
  contact,
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Existing designed proposal to edit, or null for a new one. */
  proposal: Proposal | null;
  clients: Client[];
  leads: Lead[];
  prefillClientId?: string;
  nextNumber: string;
  onSave: (p: Proposal) => void;
}

export const ProposalBuilderModal: React.FC<Props> = ({ isOpen, onClose, proposal, clients, leads, prefillClientId, nextNumber, onSave }) => {
  const savedContact = useMemo<Contact>(() => ({ ...DEFAULT_CONTACT, ...(load<Partial<Contact>>(KEYS.proposalDefaults, {}) || {}) }), []);
  const [recipientId, setRecipientId] = useState(proposal?.clientId || prefillClientId || '');
  const [d, setD] = useState<ProposalDesign>(() => proposal?.design || blankDesign(nextNumber, savedContact));
  const [scoreText, setScoreText] = useState(proposal?.design?.score != null ? String(proposal.design.score) : '');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<{ id: string; url: string } | null>(proposal?.publicId && proposal.publicUrl ? { id: proposal.publicId, url: proposal.publicUrl } : null);
  const [copied, setCopied] = useState(false);
  const [editTicks, setEditTicks] = useState<ProposalServiceKey | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [proposalId] = useState(proposal?.id || `prop-${Date.now()}`);

  const recipients = useMemo(
    () => [
      ...clients.filter((c) => !c.isInternal).map((c) => ({ id: c.id, label: c.companyName ? `${c.companyName} (${c.name})` : c.name, group: 'Clients' })),
      ...leads.map((l) => ({ id: l.id, label: l.companyName ? `${l.companyName} (${l.name})` : l.name, group: 'Leads' })),
    ],
    [clients, leads],
  );

  /** Fill business, person, customer word and services from the chosen lead/client. */
  const applyRecipient = (id: string, keepServices = false) => {
    const c = clients.find((x) => x.id === id);
    const l = leads.find((x) => x.id === id);
    const who = c || l;
    if (!who) return;
    // A lead from the website check-up: their answers fill the whole proposal.
    const ck = l?.checkup;
    if (ck && !c) {
      const keys = ck.services.filter((k): k is ProposalServiceKey => PROPOSAL_SERVICES.some((s) => s.key === k));
      const services = keys
        .map((k) => PROPOSAL_SERVICES.find((s) => s.key === k)!)
        .map((s) => ({ key: s.key, title: s.title, price: s.price, billing: s.billing, ticks: [...s.ticks], recommended: s.recommended }));
      const problems = ck.problems.map((t) => PROPOSAL_PROBLEMS.find((p) => p.title === t)).filter((p): p is (typeof PROPOSAL_PROBLEMS)[number] => !!p);
      const hasAds = keys.includes('ads') || keys.includes('growth');
      setD((prev) => ({
        ...prev,
        business: who.companyName || who.name,
        person: who.name,
        customerWord: ck.customerWord || prev.customerWord,
        problems: problems.length ? problems.slice(0, 4) : prev.problems,
        services: services.length ? services : prev.services,
        roi: {
          ...prev.roi,
          enabled: true,
          avgValue: ck.value || prev.roi.avgValue,
          valueNote: ck.biz === 'coaching' ? '/year' : '',
          adBudget: hasAds ? ck.adBudget || prev.roi.adBudget || 10000 : 0,
        },
      }));
      if (ck.score) setScoreText(String(ck.score));
      return;
    }
    setD((prev) => {
      const fromClient = c?.agreedServices?.length ? servicesFromNames(c.agreedServices) : [];
      return {
        ...prev,
        business: who.companyName || who.name,
        person: who.name,
        customerWord: guessCustomerWord((who as { industry?: string }).industry),
        services: !keepServices && fromClient.length ? fromClient : prev.services,
      };
    });
  };

  useEffect(() => {
    if (!proposal?.design && prefillClientId) applyRecipient(prefillClientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (patch: Partial<ProposalDesign>) => setD((p) => ({ ...p, ...patch }));
  const setRoi = (patch: Partial<ProposalDesign['roi']>) => setD((p) => ({ ...p, roi: { ...p.roi, ...patch } }));
  const setContact = (patch: Partial<Contact>) => setD((p) => ({ ...p, contact: { ...p.contact, ...patch } }));

  const toggleProblem = (pb: ProposalProblem) =>
    setD((p) => {
      const on = p.problems.some((x) => x.icon === pb.icon && x.title === pb.title) || p.problems.some((x) => x.icon === pb.icon);
      if (on) return { ...p, problems: p.problems.filter((x) => x.icon !== pb.icon) };
      if (p.problems.length >= 4) return p;
      return { ...p, problems: [...p.problems, { ...pb }] };
    });
  const editProblem = (i: number, patch: Partial<ProposalProblem>) =>
    setD((p) => ({ ...p, problems: p.problems.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));

  const toggleService = (k: ProposalServiceKey) =>
    setD((p) => {
      if (p.services.some((s) => s.key === k)) return { ...p, services: p.services.filter((s) => s.key !== k) };
      const c = PROPOSAL_SERVICES.find((s) => s.key === k)!;
      return { ...p, services: [...p.services, { key: c.key, title: c.title, price: c.price, billing: c.billing, ticks: [...c.ticks], recommended: c.recommended }] };
    });
  const editService = (k: ProposalServiceKey, patch: Partial<ProposalService>) =>
    setD((p) => ({ ...p, services: p.services.map((s) => (s.key === k ? { ...s, ...patch } : s)) }));

  const n = proposalNumbers(d);
  const hasAdsService = d.services.some((s) => s.key === 'growth' || s.key === 'ads');
  const joinN = d.roi.joinPct > 0 ? Math.round(100 / d.roi.joinPct) : 10;

  const html = useMemo(
    () => renderProposalHtml(d, { logoSrc: `${window.location.origin}/icons/icon-192.png` }),
    [d],
  );

  const validate = (): string | null => {
    if (!recipientId) return 'Pick the lead or client this proposal is for.';
    if (!d.business.trim()) return 'Write the business name.';
    if (!d.services.length) return 'Pick at least one service.';
    if (d.roi.enabled && !(d.roi.avgValue > 0)) return 'ROI: write how much one customer is worth (or turn ROI off).';
    return null;
  };

  const record = (extra: Partial<Proposal> = {}): Proposal => {
    const who = clients.find((c) => c.id === recipientId) || leads.find((l) => l.id === recipientId);
    const now = new Date().toISOString();
    const price = [n.oneTime ? `${inr(n.oneTime)} one-time` : '', n.monthly ? `${inr(n.monthly)}/month` : ''].filter(Boolean).join(' + ');
    return {
      ...(proposal || {}),
      id: proposalId,
      clientId: recipientId,
      clientName: who?.name || proposal?.clientName,
      proposalNumber: d.number,
      version: (proposal?.version || 0) + 1,
      status: proposal?.status || 'Draft',
      generatedDate: proposal?.generatedDate || now,
      lastUpdatedDate: now,
      title: `Growth proposal – ${d.business}`,
      estimatedBudget: price,
      timeline: d.services.some((s) => s.key === 'website') ? 'Website live in 7 days' : '',
      validUntilDate: d.validUntil,
      message: `${d.services.map((s) => s.title).join(', ')} · ${price}`,
      design: { ...d, score: scoreText.trim() === '' ? null : Math.max(0, Math.min(100, Number(scoreText) || 0)) },
      publicId: link?.id,
      publicUrl: link?.url,
      ...extra,
    } as Proposal;
  };

  const rememberContact = () => save(KEYS.proposalDefaults, d.contact);

  const saveDraft = () => {
    const err = validate();
    if (err) return setError(err);
    setError(null);
    rememberContact();
    onSave(record());
    onClose();
  };

  const saveAndLink = async () => {
    const err = validate();
    if (err) return setError(err);
    setError(null);
    setBusy(true);
    rememberContact();
    try {
      const rec = record();
      const res = await publishProposal(rec.design!, link?.id);
      setLink(res);
      onSave({ ...rec, publicId: res.id, publicUrl: res.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const recipientPhone = (() => {
    const who = clients.find((c) => c.id === recipientId) || leads.find((l) => l.id === recipientId);
    const p = (who?.phone || '').replace(/\D/g, '');
    return p.length === 10 ? `91${p}` : p;
  })();
  const waText = link ? `Hi ${d.person || ''}, here is your growth plan from Techinfigo: ${link.url}` : '';

  const small =
    'h-10 px-3 rounded-lg border border-border-base dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-text-base dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-secondary-accent/50';
  const input =
    'w-full h-10 px-3 rounded-lg border border-border-base dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-text-base dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-secondary-accent/50';
  const label = 'block space-y-1 text-xs font-semibold text-text-muted';
  const chip = (on: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold border ${
      on ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-400 dark:text-slate-900 dark:border-amber-400' : 'border-border-base dark:border-slate-600 text-text-muted'
    }`;
  const H = ({ n: num, t }: { n: number; t: string }) => (
    <p className="flex items-center gap-2 text-sm font-bold text-text-heading dark:text-white">
      <span className="w-6 h-6 rounded-lg bg-secondary-accent text-secondary-accent-text grid place-items-center text-xs">{num}</span>
      {t}
    </p>
  );

  const form = (
    <div className="space-y-6">
      {/* 1. Who */}
      <div className="space-y-3">
        <H n={1} t="Who is it for?" />
        <label className={label}>
          Lead or client
          <select
            className={input}
            value={recipientId}
            onChange={(e) => {
              setRecipientId(e.target.value);
              applyRecipient(e.target.value);
            }}
          >
            <option value="">Choose…</option>
            {['Clients', 'Leads'].map((g) => (
              <optgroup key={g} label={g}>
                {recipients.filter((r) => r.group === g).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>
            Business name
            <input className={input} value={d.business} onChange={(e) => set({ business: e.target.value })} placeholder="e.g. Gyan Path Coaching" />
          </label>
          <label className={label}>
            Person
            <input className={input} value={d.person} onChange={(e) => set({ person: e.target.value })} placeholder="e.g. Mr. Anil Sharma" />
          </label>
        </div>
        <div>
          <p className="text-xs font-semibold text-text-muted mb-1.5">Their buyers are called</p>
          <div className="flex flex-wrap gap-2">
            {CUSTOMER_WORDS.map((w) => (
              <button key={w} type="button" className={chip(d.customerWord === w)} onClick={() => set({ customerWord: w })}>
                {w}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Problems */}
      <div className="space-y-3">
        <H n={2} t="Their problems (pick up to 4)" />
        <label className={`${label} max-w-[220px]`}>
          Online score from audit (0–100, optional)
          <input className={input} inputMode="numeric" value={scoreText} onChange={(e) => {
            const v = e.target.value.replace(/[^\d]/g, '').slice(0, 3);
            setScoreText(v);
            set({ score: v === '' ? null : Math.min(100, Number(v)) });
          }} placeholder="e.g. 42" />
        </label>
        <div className="flex flex-wrap gap-2">
          {PROPOSAL_PROBLEMS.map((pb) => (
            <button key={pb.icon} type="button" className={chip(d.problems.some((x) => x.icon === pb.icon))} onClick={() => toggleProblem(pb)}>
              {pb.title}
            </button>
          ))}
        </div>
        {d.problems.map((p, i) => (
          <div key={p.icon} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
            <input className={input} value={p.title} onChange={(e) => editProblem(i, { title: e.target.value })} aria-label="Problem" />
            <input className={input} value={p.cost} onChange={(e) => editProblem(i, { cost: e.target.value })} aria-label="What it costs them" />
            <button
              type="button"
              onClick={() => editProblem(i, { level: p.level === 'red' ? 'yellow' : 'red' })}
              className={`w-9 h-9 rounded-full border-2 ${p.level === 'red' ? 'bg-rose-500 border-rose-500' : 'bg-amber-400 border-amber-400'}`}
              title={p.level === 'red' ? 'Big problem (red). Tap for yellow.' : 'Smaller problem (yellow). Tap for red.'}
            />
          </div>
        ))}
      </div>

      {/* 3. Services */}
      <div className="space-y-3">
        <H n={3} t="What you will do" />
        <div className="flex flex-wrap gap-2">
          {PROPOSAL_SERVICES.map((s) => (
            <button key={s.key} type="button" className={chip(d.services.some((x) => x.key === s.key))} onClick={() => toggleService(s.key)}>
              {s.title}
            </button>
          ))}
        </div>
        {d.services.map((s) => (
          <div key={s.key} className="rounded-xl border border-border-base dark:border-slate-700 p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-text-heading dark:text-white mr-auto">{s.title}</span>
              <input
                className={`${small} w-28`}
                inputMode="numeric"
                value={s.price ? String(s.price) : ''}
                onChange={(e) => editService(s.key, { price: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })}
                aria-label="Price"
              />
              <select className={`${small} w-40`} value={s.billing} onChange={(e) => editService(s.key, { billing: e.target.value as ProposalService['billing'] })}>
                <option value="one-time">one-time</option>
                <option value="monthly">monthly retainer</option>
              </select>
              <button
                type="button"
                onClick={() => editService(s.key, { recommended: !s.recommended })}
                className={`p-2 rounded-lg border ${s.recommended ? 'border-amber-400 text-amber-500 bg-amber-50 dark:bg-amber-400/10' : 'border-border-base dark:border-slate-600 text-slate-400'}`}
                title="Mark as recommended"
              >
                <Star className="w-4 h-4" fill={s.recommended ? 'currentColor' : 'none'} />
              </button>
              <button type="button" onClick={() => setEditTicks(editTicks === s.key ? null : s.key)} className="p-2 rounded-lg border border-border-base dark:border-slate-600 text-slate-500" title="Edit the points">
                <PencilLine className="w-4 h-4" />
              </button>
            </div>
            {editTicks === s.key ? (
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    className={input}
                    value={s.ticks[i] || ''}
                    placeholder={`Point ${i + 1}`}
                    onChange={(e) => {
                      const t = [...s.ticks];
                      t[i] = e.target.value;
                      editService(s.key, { ticks: t.slice(0, 4) });
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">{s.ticks.filter(Boolean).join(' · ')}</p>
            )}
          </div>
        ))}
        {d.services.length > 1 && (
          <div className="rounded-xl border border-dashed border-emerald-400/70 p-3 flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-emerald-700 dark:text-emerald-300 mr-auto">Bundle discount (optional)</span>
            <span className="text-sm text-text-muted">₹</span>
            <input
              className={`${small} w-28`}
              inputMode="numeric"
              placeholder="0"
              value={d.discount?.amount ? String(d.discount.amount) : ''}
              onChange={(e) => set({ discount: { amount: Number(e.target.value.replace(/[^\d]/g, '')) || 0, on: d.discount?.on || 'one-time' } })}
              aria-label="Discount amount"
            />
            <select
              className={`${small} w-36`}
              value={d.discount?.on || 'one-time'}
              onChange={(e) => set({ discount: { amount: d.discount?.amount || 0, on: e.target.value as 'one-time' | 'monthly' } })}
              aria-label="Discount on"
            >
              <option value="one-time">off one-time</option>
              <option value="monthly">off every month</option>
            </select>
            <p className="w-full text-xs text-text-muted">The client sees each service price, then this discount as its own line, then the final total.</p>
          </div>
        )}
      </div>

      {/* 4. ROI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <H n={4} t="ROI plan" />
          <label className="flex items-center gap-2 text-xs font-semibold text-text-muted">
            <input type="checkbox" checked={d.roi.enabled} onChange={(e) => setRoi({ enabled: e.target.checked })} /> Show ROI
          </label>
        </div>
        {d.roi.enabled && (
          <>
            <p className="text-xs text-text-muted">Ask the client these on the call. Use their numbers, not guesses.</p>
            <div className="grid grid-cols-2 gap-3">
              <label className={label}>
                One {d.customerWord.replace(/s$/, '')} is worth (₹)
                <input className={input} inputMode="numeric" value={d.roi.avgValue ? String(d.roi.avgValue) : ''} onChange={(e) => setRoi({ avgValue: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} placeholder="e.g. 18000" />
              </label>
              <label className={label}>
                For
                <select className={input} value={d.roi.valueNote} onChange={(e) => setRoi({ valueNote: e.target.value })}>
                  {VALUE_NOTES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className={label}>
                Their profit on it (%)
                <input className={input} inputMode="numeric" value={d.roi.profitPct ? String(d.roi.profitPct) : ''} onChange={(e) => setRoi({ profitPct: Math.min(100, Number(e.target.value.replace(/[^\d]/g, '')) || 0) })} placeholder="e.g. 60" />
              </label>
              <label className={label}>
                1 in how many enquiries buys?
                <input className={input} inputMode="numeric" value={String(joinN)} onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value.replace(/[^\d]/g, '')) || 1);
                  setRoi({ joinPct: Math.round((100 / v) * 100) / 100 });
                }} />
              </label>
              {hasAdsService && (
                <label className={label}>
                  Ad budget / month (₹, paid by them)
                  <input className={input} inputMode="numeric" value={d.roi.adBudget ? String(d.roi.adBudget) : ''} onChange={(e) => setRoi({ adBudget: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })} placeholder="e.g. 10000" />
                </label>
              )}
            </div>
            {n.profitPerCustomer > 0 && n.cost > 0 && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-900 dark:text-emerald-200">
                Break-even: <b>{n.breakEven}</b> {d.customerWord}
                {n.costIsMonthly ? ' a month' : ''} · Expected: <b>{n.expected.customers}</b> {d.customerWord}, <b>{n.expected.x}×</b> return
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Details */}
      <div className="space-y-3">
        <H n={5} t="Details" />
        <div className="grid grid-cols-3 gap-3">
          <label className={label}>
            Proposal no.
            <input className={input} value={d.number} onChange={(e) => set({ number: e.target.value })} />
          </label>
          <label className={label}>
            Date
            <input className={input} type="date" value={d.date} onChange={(e) => set({ date: e.target.value })} />
          </label>
          <label className={label}>
            Valid till
            <input className={input} type="date" value={d.validUntil} onChange={(e) => set({ validUntil: e.target.value })} />
          </label>
        </div>
        <label className={label}>
          Closing line
          <input className={input} value={d.ctaLine} onChange={(e) => set({ ctaLine: e.target.value })} placeholder="e.g. Start before admission season?" />
        </label>
        <label className={label}>
          Your personal note at the top (optional)
          <textarea
            rows={2}
            maxLength={300}
            className={`${input} h-auto py-2`}
            value={d.note || ''}
            onChange={(e) => set({ note: e.target.value })}
            placeholder="Leave empty for: “Anil ji, I looked at Gyan Path Coaching online. Below are the gaps costing you students today…”"
          />
        </label>
        <button type="button" onClick={() => setShowContact((v) => !v)} className="text-xs font-semibold text-text-muted underline">
          {showContact ? 'Hide' : 'Edit'} your name, phone, address, UPI
        </button>
        {showContact && (
          <div className="grid grid-cols-2 gap-3">
            <label className={label}>
              Your name
              <input className={input} value={d.contact.name} onChange={(e) => setContact({ name: e.target.value })} />
            </label>
            <label className={label}>
              WhatsApp number
              <input className={input} value={d.contact.phone} onChange={(e) => setContact({ phone: e.target.value })} />
            </label>
            <label className={label}>
              Address
              <input className={input} value={d.contact.address} onChange={(e) => setContact({ address: e.target.value })} />
            </label>
            <label className={label}>
              UPI ID (shows "Pay advance by UPI")
              <input className={input} value={d.contact.upiId || ''} onChange={(e) => setContact({ upiId: e.target.value })} placeholder="e.g. techinfigo@okaxis" />
            </label>
          </div>
        )}
      </div>
    </div>
  );

  const preview = <iframe title="Proposal preview" srcDoc={html} className="w-full h-full min-h-[70vh] rounded-xl border border-border-base dark:border-slate-700 bg-[#f4f1ea]" />;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="7xl"
      overrideZIndex="z-[1050]"
      title={proposal ? `Edit proposal ${d.number}` : 'New proposal'}
      footer={
        <div className="w-full space-y-2">
          {error && <p className="text-sm text-rose-600">{error}</p>}
          {link && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-2.5">
              <Link2 className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 truncate max-w-[16rem] sm:max-w-none">
                {link.url.replace(/^https?:\/\//, '')}
              </a>
              <div className="flex flex-wrap gap-2 ml-auto">
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard?.writeText(link.url).catch(() => undefined);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-300 text-xs font-semibold text-emerald-800 dark:text-emerald-200"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
                </button>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-300 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                  <ExternalLink className="w-3.5 h-3.5" /> Open
                </a>
                <a
                  href={`https://wa.me/${recipientPhone}?text=${encodeURIComponent(waText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onSave({ ...record({ publicId: link.id, publicUrl: link.url }), status: 'SentToClient' })}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Send on WhatsApp
                </a>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted mr-auto">
              {[n.oneTime ? `${inr(n.oneTime)} one-time` : '', n.monthly ? `${inr(n.monthly)}/month` : ''].filter(Boolean).join(' + ')}
            </span>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm">
              Close
            </button>
            <button type="button" onClick={saveDraft} className="px-4 py-2 rounded-lg border border-border-base dark:border-slate-600 text-sm font-semibold">
              Save draft
            </button>
            <button
              type="button"
              onClick={saveAndLink}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-accent text-secondary-accent-text text-sm font-semibold disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {link ? 'Update link' : 'Save & get link'}
            </button>
          </div>
        </div>
      }
    >
      <div className="lg:hidden flex gap-2 mb-3">
        <button type="button" className={chip(tab === 'edit')} onClick={() => setTab('edit')}>
          <PencilLine className="w-3.5 h-3.5 inline mr-1" />
          Edit
        </button>
        <button type="button" className={chip(tab === 'preview')} onClick={() => setTab('preview')}>
          <Eye className="w-3.5 h-3.5 inline mr-1" />
          Preview
        </button>
      </div>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-5">
        <div className={tab === 'preview' ? 'hidden lg:block' : ''}>{form}</div>
        <div className={`${tab === 'edit' ? 'hidden lg:block' : ''} lg:sticky lg:top-0 lg:h-[75vh]`}>{preview}</div>
      </div>
    </Modal>
  );
};
