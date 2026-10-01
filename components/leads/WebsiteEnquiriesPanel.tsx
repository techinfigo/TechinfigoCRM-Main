import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, limit, onSnapshot, query, serverTimestamp, updateDoc, where, type Timestamp } from 'firebase/firestore';
import { Globe, Inbox, MessageCircle, Phone, ShieldAlert, ChevronDown, Check, X, RotateCcw } from 'lucide-react';
import { db, isFirebaseConfigured } from '../../firebase';
import { Button } from '../common/Button';
import type { Lead } from '../../types';

/**
 * Inbox for enquiries sent by www.techinfigo.com.
 *
 * The website's server screens every enquiry for bots and writes it to the
 * `websiteEnquiries` collection with status "new" or "spam". Nothing lands in
 * the leads pipeline by itself: the owner adds each one with a click, so spam
 * that slips through never pollutes the pipeline.
 */

type EnquiryStatus = 'new' | 'spam' | 'imported' | 'dismissed';

type Enquiry = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  businessName: string | null;
  website: string | null;
  message: string | null;
  needs: string[];
  sourceForm: string | null;
  landingPage: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  referrer: string | null;
  status: EnquiryStatus;
  spamReasons: string[];
  createdAt: Date | null;
};

const SPAM_REASON_LABELS: Record<string, string> = {
  'invalid-phone': 'Not a valid mobile number',
  'link-in-name': 'Link in the name',
  'gibberish-name': 'Random letters in the name',
  'spam-words': 'Spam words',
  'bot-check-missing': 'Skipped the bot check',
};

function toEnquiry(id: string, d: Record<string, unknown>): Enquiry {
  const s = (v: unknown) => (typeof v === 'string' && v ? v : null);
  const ts = d.createdAt as Timestamp | undefined;
  return {
    id,
    name: s(d.name) ?? 'Unknown',
    phone: s(d.phone),
    email: s(d.email),
    businessName: s(d.businessName),
    website: s(d.website),
    message: s(d.message),
    needs: Array.isArray(d.needs) ? (d.needs as unknown[]).filter((n): n is string => typeof n === 'string') : [],
    sourceForm: s(d.sourceForm),
    landingPage: s(d.landingPage),
    utmSource: s(d.utmSource),
    utmCampaign: s(d.utmCampaign),
    referrer: s(d.referrer),
    status: (s(d.status) as EnquiryStatus) ?? 'new',
    spamReasons: Array.isArray(d.spamReasons) ? (d.spamReasons as string[]) : [],
    createdAt: ts?.toDate ? ts.toDate() : null,
  };
}

/** 10-digit Indian mobile -> wa.me number. */
function whatsappNumber(phone: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 10 ? `91${digits}` : null;
}

function cameFrom(e: Enquiry): string {
  if (e.utmSource) return e.utmCampaign ? `${e.utmSource} · ${e.utmCampaign}` : e.utmSource;
  if (e.referrer) {
    try {
      return new URL(e.referrer).hostname.replace(/^www\./, '');
    } catch {
      /* not a URL */
    }
  }
  return 'Direct / Google';
}

/** Where the enquiry was submitted: the website or an ad platform's lead form. */
function sourceLabel(e: Enquiry): 'Website' | 'Meta Ads' | 'Google Ads' {
  if (e.sourceForm === 'meta-lead-ads') return 'Meta Ads';
  if (e.sourceForm === 'google-ads-lead-form') return 'Google Ads';
  return 'Website';
}

const SOURCE_BADGE: Record<ReturnType<typeof sourceLabel>, string> = {
  Website: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  'Meta Ads': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Google Ads': 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

function timeAgo(date: Date | null): string {
  if (!date) return '';
  const mins = Math.round((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function toLead(e: Enquiry): Lead {
  const notes = [
    e.needs.length ? `Needs: ${e.needs.join(', ')}` : '',
    e.message ?? '',
    `Came from: ${cameFrom(e)}${e.landingPage ? ` (page ${e.landingPage})` : ''}`,
  ]
    .filter(Boolean)
    .join('\n\n');
  return {
    id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: e.name,
    email: e.email ?? '',
    phone: e.phone ?? undefined,
    companyName: e.businessName ?? undefined,
    website: e.website ?? undefined,
    source: sourceLabel(e),
    status: 'New Lead',
    dateAdded: (e.createdAt ?? new Date()).toISOString(),
    notes,
    leadType: e.needs.some((n) => /d2c|store/i.test(n)) ? 'D2C' : 'General',
  } as Lead;
}

export type EnquiriesState = {
  enquiries: Enquiry[];
  counts: { new: number; spam: number };
  error: string | null;
  busy: string | null;
  setStatus: (e: Enquiry, status: EnquiryStatus, extra?: Record<string, unknown>) => Promise<void>;
};

/** Live list of website enquiries; used by the Leads page header badge and the inbox. */
export function useWebsiteEnquiries(): EnquiriesState {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(db, 'websiteEnquiries'), where('status', 'in', ['new', 'spam']), limit(300));
    return onSnapshot(
      q,
      (snap) => {
        setError(null);
        const list = snap.docs.map((d) => toEnquiry(d.id, d.data()));
        list.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
        setEnquiries(list);
      },
      (err) => {
        console.error('Website enquiries:', err);
        setError(
          err.code === 'permission-denied'
            ? 'This account is not allowed to see website enquiries. Check the Firestore rules.'
            : 'Could not load website enquiries.',
        );
      },
    );
  }, []);

  const counts = useMemo(
    () => ({
      new: enquiries.filter((e) => e.status === 'new').length,
      spam: enquiries.filter((e) => e.status === 'spam').length,
    }),
    [enquiries],
  );

  const setStatus = async (e: Enquiry, status: EnquiryStatus, extra: Record<string, unknown> = {}) => {
    setBusy(e.id);
    try {
      await updateDoc(doc(db, 'websiteEnquiries', e.id), { status, updatedAt: serverTimestamp(), ...extra });
    } catch (err) {
      console.error(err);
      setError('Could not update this enquiry. Try again.');
    } finally {
      setBusy(null);
    }
  };

  return { enquiries, counts, error, busy, setStatus };
}

/** Inbox body, shown inside the Leads card when "Enquiries" is selected. */
export const WebsiteEnquiriesInbox: React.FC<{ state: EnquiriesState; onAddToLeads: (lead: Lead) => void }> = ({
  state,
  onAddToLeads,
}) => {
  const { enquiries, counts, error, busy, setStatus } = state;
  const [tab, setTab] = useState<'new' | 'spam'>('new');
  const shown = enquiries.filter((e) => e.status === tab);

  const addToLeads = async (e: Enquiry) => {
    const lead = toLead(e);
    onAddToLeads(lead);
    await setStatus(e, 'imported', { importedLeadId: lead.id });
  };

  if (!isFirebaseConfigured) {
    return <p className="text-sm text-slate-500 p-4">Website enquiries need the cloud connection.</p>;
  }

  return (
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            {(['new', 'spam'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  tab === t
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                    : 'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400'
                }`}
              >
                {t === 'new' ? `New (${counts.new})` : `Spam (${counts.spam})`}
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          {shown.length === 0 && !error && (
            <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">
              {tab === 'new' ? 'No new enquiries. New ones from the website and ads appear here instantly.' : 'No spam. Suspicious enquiries are kept here for review.'}
            </p>
          )}

          <ul className="space-y-2">
            {shown.map((e) => {
              const wa = whatsappNumber(e.phone);
              const firstName = e.name.split(' ')[0];
              return (
                <li key={e.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {e.name}
                        {e.businessName && <span className="font-normal text-slate-500 dark:text-slate-400"> · {e.businessName}</span>}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        <span className={`inline-block px-1.5 py-0.5 mr-1.5 rounded font-medium ${SOURCE_BADGE[sourceLabel(e)]}`}>
                          {sourceLabel(e)}
                        </span>
                        {timeAgo(e.createdAt)} · Came from: {cameFrom(e)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {wa && (
                        <a
                          href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${firstName}, this is Sachin from Techinfigo. Thanks for your enquiry${sourceLabel(e) === 'Website' ? ' on our website' : ''}!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-semibold"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                      {e.phone && (
                        <a
                          href={`tel:${e.phone.replace(/[^\d+]/g, '')}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200"
                        >
                          <Phone className="w-3.5 h-3.5" /> {e.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  {e.needs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {e.needs.map((n) => (
                        <span key={n} className="px-2 py-0.5 rounded-full bg-secondary-accent/15 text-slate-800 dark:text-slate-100 text-xs font-medium">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}

                  {e.website && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> {e.website}
                    </p>
                  )}
                  {e.message && <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line line-clamp-4">{e.message}</p>}

                  {e.status === 'spam' && e.spamReasons.length > 0 && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Why it looks like spam: {e.spamReasons.map((r) => SPAM_REASON_LABELS[r] ?? r).join(', ')}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="primary" disabled={busy === e.id} onClick={() => addToLeads(e)} leftIcon={<Check className="w-3.5 h-3.5 mr-1" />}>
                      Add to Leads
                    </Button>
                    {e.status === 'new' ? (
                      <Button size="sm" variant="outline" disabled={busy === e.id} onClick={() => setStatus(e, 'spam', { spamReasons: ['marked-by-you'] })} leftIcon={<ShieldAlert className="w-3.5 h-3.5 mr-1" />}>
                        Spam
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={busy === e.id} onClick={() => setStatus(e, 'new')} leftIcon={<RotateCcw className="w-3.5 h-3.5 mr-1" />}>
                        Not spam
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" disabled={busy === e.id} onClick={() => setStatus(e, 'dismissed')} leftIcon={<X className="w-3.5 h-3.5 mr-1" />}>
                      Dismiss
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
  );
};
