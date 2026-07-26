
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../common/Button';
import {
  isGmailConfigured,
  getStoredGmailToken,
  clearGmailToken,
  connectGmail,
  fetchGmailMessages,
  fetchGmailBody,
  fetchGmailBodyRich,
  GmailBody,
  sendGmailMessage,
  toggleGmailStar,
  trashGmailMessage,
  GmailMessage,
} from '../../services/gmailService';
import {
  Mail, Inbox, Send, Star, RefreshCw, LogOut, ArrowLeft, AlertTriangle, Loader2,
  Pencil, Trash2, Reply, X,
} from 'lucide-react';

type GmailLabel = 'INBOX' | 'SENT' | 'STARRED';

const LABEL_TABS: { label: GmailLabel; title: string; icon: React.ElementType }[] = [
  { label: 'INBOX', title: 'Inbox', icon: Inbox },
  { label: 'SENT', title: 'Sent', icon: Send },
  { label: 'STARRED', title: 'Starred', icon: Star },
];

// Gmail-style helpers for the polished list.
const smartDate = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString([], sameYear ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: '2-digit' });
};

// Deterministic avatar colour from the sender name so the same person is always
// the same colour.
const AVATAR_COLORS = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-sky-500', 'bg-indigo-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-pink-500'];
const avatarColor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const initialOf = (name: string): string => (name.trim()[0] || '?').toUpperCase();

const isExpiredMessage = (message: string) => message.toLowerCase().includes('expired');

export const GmailView: React.FC = () => {
  const configured = isGmailConfigured();

  const [token, setToken] = useState<string | null>(() => getStoredGmailToken());
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [activeLabel, setActiveLabel] = useState<GmailLabel>('INBOX');
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selected, setSelected] = useState<GmailMessage | null>(null);
  const [body, setBody] = useState<GmailBody | null>(null);
  const [search, setSearch] = useState('');
  const [bodyLoading, setBodyLoading] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadMessages = useCallback(async (activeToken: string, label: GmailLabel) => {
    setListLoading(true);
    setListError(null);
    try {
      const page = await fetchGmailMessages(activeToken, label, 25);
      setMessages(page.messages);
      setNextPageToken(page.nextPageToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load messages.';
      setListError(message);
      if (isExpiredMessage(message)) {
        setToken(null);
        setMessages([]);
      }
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadMore = async () => {
    if (!token || !nextPageToken || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchGmailMessages(token, activeLabel, 25, nextPageToken);
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...page.messages.filter((m) => !seen.has(m.id))];
      });
      setNextPageToken(page.nextPageToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more.';
      setListError(message);
      if (isExpiredMessage(message)) setToken(null);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadMessages(token, activeLabel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeLabel]);

  const handleConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      const newToken = await connectGmail();
      setToken(newToken);
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : 'Failed to connect to Gmail.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearGmailToken();
    setToken(null);
    setMessages([]);
    setSelected(null);
    setBody(null);
  };

  const openCompose = (opts?: { to?: string; subject?: string; body?: string }) => {
    setComposeTo(opts?.to || '');
    setComposeSubject(opts?.subject || '');
    setComposeBody(opts?.body || '');
    setActionError(null);
    setComposeOpen(true);
  };

  const handleSend = async () => {
    if (!token) return;
    if (!composeTo.trim() || !composeSubject.trim()) {
      setActionError('Recipient and subject are required.');
      return;
    }
    setSending(true);
    setActionError(null);
    try {
      await sendGmailMessage(token, composeTo.trim(), composeSubject.trim(), composeBody);
      setComposeOpen(false);
      if (activeLabel === 'SENT') loadMessages(token, 'SENT');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  const handleToggleStar = async (message: GmailMessage) => {
    if (!token) return;
    try {
      await toggleGmailStar(token, message.id, message.isStarred);
      const nowStarred = !message.isStarred;
      setMessages(prev => prev.map(m => m.id === message.id ? { ...m, isStarred: nowStarred } : m));
      if (selected?.id === message.id) setSelected({ ...selected, isStarred: nowStarred });
      if (activeLabel === 'STARRED' && !nowStarred) {
        setMessages(prev => prev.filter(m => m.id !== message.id));
        if (selected?.id === message.id) setSelected(null);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update star.');
    }
  };

  const handleTrash = async (message: GmailMessage) => {
    if (!token) return;
    if (!window.confirm('Move this email to Trash?')) return;
    try {
      await trashGmailMessage(token, message.id);
      setMessages(prev => prev.filter(m => m.id !== message.id));
      if (selected?.id === message.id) setSelected(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to move to Trash.');
    }
  };

  const filteredMessages = search.trim()
    ? messages.filter((m) => {
        const q = search.toLowerCase();
        return (
          m.subject.toLowerCase().includes(q) ||
          m.fromName.toLowerCase().includes(q) ||
          m.fromEmail.toLowerCase().includes(q) ||
          m.snippet.toLowerCase().includes(q)
        );
      })
    : messages;

  const handleSelectMessage = async (message: GmailMessage) => {
    if (!token) return;
    setSelected(message);
    setBody(null);
    setBodyError(null);
    setBodyLoading(true);
    try {
      const fetchedBody = await fetchGmailBodyRich(token, message.id);
      setBody(fetchedBody);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : 'Failed to load message.';
      setBodyError(errMessage);
      if (isExpiredMessage(errMessage)) {
        setToken(null);
        setSelected(null);
      }
    } finally {
      setBodyLoading(false);
    }
  };

  // 1. Not configured
  if (!configured) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full p-5 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-amber-500 mb-3" />
          <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200 mb-1">Gmail is not configured</h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Add <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40">GOOGLE_OAUTH_CLIENT_ID</code> to
            the environment variables in Vercel and redeploy to enable this tab.
          </p>
        </div>
      </div>
    );
  }

  // 2. Not connected
  if (!token) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-text-muted dark:text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-text-heading dark:text-text-heading mb-2">Connect your Gmail</h3>
          <p className="text-sm text-text-muted dark:text-slate-400 mb-5">
            This signs into Gmail separately from your CRM login and does not affect your CRM session.
            Access lasts about an hour, after which you'll be asked to reconnect.
          </p>
          <Button variant="primary" onClick={handleConnect} isLoading={connecting} leftIcon={<Mail className="w-4 h-4" />}>
            Connect Gmail
          </Button>
          {connectError && (
            <p className="mt-3 text-sm text-status-negative dark:text-red-400">{connectError}</p>
          )}
        </div>
      </div>
    );
  }

  // 3. Connected
  return (
    <div className="flex h-full bg-bg-base dark:bg-slate-900 overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="p-3 border-b border-border-base dark:border-slate-700 flex items-center justify-between flex-shrink-0 gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {LABEL_TABS.map((tab) => (
              <button
                key={tab.label}
                onClick={() => { setActiveLabel(tab.label); setSelected(null); }}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeLabel === tab.label
                    ? 'bg-white dark:bg-slate-600 text-premium-accent dark:text-white shadow-sm'
                    : 'text-text-muted hover:text-text-base dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => openCompose()}
              leftIcon={<Pencil className="w-4 h-4" />}
            >
              Compose
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMessages(token, activeLabel)}
              isLoading={listLoading}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Disconnect
            </Button>
          </div>
        </div>

        <div className="flex-1 flex min-w-0 overflow-hidden">
          {/* Message list */}
          <div className={`w-full lg:w-96 flex-shrink-0 border-r border-border-base dark:border-slate-700 overflow-y-auto scrollbar-hide ${selected ? 'hidden lg:block' : 'block'}`}>
            <div className="sticky top-0 z-10 p-2 bg-bg-base dark:bg-slate-900 border-b border-border-base dark:border-slate-700">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mail..."
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-premium-accent rounded-full focus:outline-none text-text-base dark:text-slate-200 placeholder-text-muted"
              />
            </div>
            {listLoading && messages.length === 0 ? (
              <div className="p-8 flex items-center justify-center text-text-muted dark:text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : listError ? (
              <div className="p-4 text-sm text-status-negative dark:text-red-400">{listError}</div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted dark:text-slate-500">{search.trim() ? 'No matching emails.' : 'No messages here.'}</div>
            ) : (
              <ul className="divide-y divide-border-base dark:divide-slate-700">
                {filteredMessages.map((message) => {
                  const sender = message.fromName || message.fromEmail;
                  const isActive = selected?.id === message.id;
                  return (
                  <li
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`group relative flex gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isActive ? 'bg-secondary-accent/20 dark:bg-secondary-accent/30' : message.isUnread ? 'bg-white dark:bg-slate-800/40 hover:bg-highlight-accent dark:hover:bg-slate-800' : 'hover:bg-highlight-accent dark:hover:bg-slate-800'}`}
                  >
                    <span className={`absolute left-0 top-0 bottom-0 w-1 ${message.isUnread ? 'bg-premium-accent' : 'bg-transparent'}`} />

                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${avatarColor(sender)}`}>
                      {initialOf(sender)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center gap-2">
                        <p className={`truncate text-sm ${message.isUnread ? 'font-bold text-text-base dark:text-white' : 'font-medium text-text-base dark:text-slate-200'}`}>
                          {sender}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="hidden group-hover:flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleStar(message); }}
                              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                              title={message.isStarred ? 'Unstar' : 'Star'}
                            >
                              <Star className={`w-4 h-4 ${message.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-text-muted'}`} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTrash(message); }}
                              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-text-muted hover:text-red-500"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5 group-hover:hidden">
                            {message.isStarred && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />}
                            <p className={`text-xs ${message.isUnread ? 'font-semibold text-text-base dark:text-slate-200' : 'text-text-muted dark:text-slate-400'}`}>{smartDate(message.date)}</p>
                          </div>
                        </div>
                      </div>
                      <p className={`text-sm truncate ${message.isUnread ? 'font-semibold text-text-base dark:text-white' : 'text-text-muted dark:text-slate-300'}`}>
                        {message.subject}
                      </p>
                      <p className="text-xs text-text-muted dark:text-slate-500 truncate">{message.snippet}</p>
                    </div>
                  </li>
                  );
                })}
              </ul>
            )}
            {!search.trim() && nextPageToken && messages.length > 0 && (
              <div className="p-3 flex justify-center border-t border-border-base dark:border-slate-700">
                <Button variant="outline" size="sm" onClick={loadMore} isLoading={loadingMore}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </div>

          {/* Reading pane */}
          <div className={`flex-1 flex-col overflow-hidden ${selected ? 'flex' : 'hidden lg:flex lg:items-center lg:justify-center'}`}>
            {selected ? (
              <>
                <div className="p-3 border-b border-border-base dark:border-slate-700 flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" className="p-2 lg:hidden" onClick={() => setSelected(null)} title="Back to list">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h3 className="text-lg font-semibold truncate flex-1">{selected.subject}</h3>
                  <Button variant="ghost" size="sm" className="p-2" onClick={() => handleToggleStar(selected)} title={selected.isStarred ? 'Unstar' : 'Star'}>
                    <Star className={`w-5 h-5 ${selected.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2" onClick={() => openCompose({ to: selected.fromEmail, subject: `Re: ${selected.subject}` })} title="Reply">
                    <Reply className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="p-2 text-red-500 hover:text-red-600" onClick={() => handleTrash(selected)} title="Move to Trash">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
                <div className="overflow-y-auto scrollbar-hide p-4 space-y-4">
                  <div>
                    <p className="font-semibold">
                      {selected.fromName} <span className="text-sm text-text-muted font-normal">&lt;{selected.fromEmail}&gt;</span>
                    </p>
                    <p className="text-xs text-text-muted">To: {selected.toEmail}</p>
                    <p className="text-xs text-text-muted">{new Date(selected.date).toLocaleString()}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-border-base dark:border-slate-700">
                    {bodyLoading ? (
                      <div className="flex items-center gap-2 text-text-muted dark:text-slate-500 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading message…
                      </div>
                    ) : bodyError ? (
                      <p className="text-sm text-status-negative dark:text-red-400">{bodyError}</p>
                    ) : body?.html ? (
                      <div
                        className="gmail-html-body text-sm break-words max-w-none [&_a]:text-premium-accent [&_a]:underline [&_img]:max-w-full [&_img]:h-auto"
                        dangerouslySetInnerHTML={{ __html: body.html }}
                      />
                    ) : (
                      <div className="text-sm whitespace-pre-wrap break-words">{body?.plain}</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-text-muted dark:text-slate-500">
                <Mail className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600" />
                <p>Select an email to read</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {composeOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50" onClick={() => !sending && setComposeOpen(false)}>
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border-base dark:border-slate-700 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border-base dark:border-slate-700">
              <h3 className="font-semibold text-text-heading dark:text-slate-100">New Message</h3>
              <button onClick={() => !sending && setComposeOpen(false)} className="text-text-muted hover:text-text-base"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto">
              {actionError && <p className="text-sm text-red-600 dark:text-red-400">{actionError}</p>}
              <input type="email" value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="To"
                className="w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md text-sm text-text-base dark:text-text-base focus:outline-none focus:ring-2 focus:ring-premium-accent" />
              <input type="text" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject"
                className="w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md text-sm text-text-base dark:text-text-base focus:outline-none focus:ring-2 focus:ring-premium-accent" />
              <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your message..." rows={10}
                className="w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md text-sm text-text-base dark:text-text-base focus:outline-none focus:ring-2 focus:ring-premium-accent resize-none" />
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-border-base dark:border-slate-700">
              <Button variant="ghost" size="sm" onClick={() => setComposeOpen(false)} disabled={sending}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSend} isLoading={sending} leftIcon={<Send className="w-4 h-4" />}>Send</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
