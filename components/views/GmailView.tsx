
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../common/Button';
import {
  isGmailConfigured,
  getStoredGmailToken,
  clearGmailToken,
  connectGmail,
  fetchGmailMessages,
  fetchGmailBody,
  GmailMessage,
} from '../../services/gmailService';
import {
  Mail, Inbox, Send, Star, RefreshCw, LogOut, ArrowLeft, AlertTriangle, Loader2,
} from 'lucide-react';

type GmailLabel = 'INBOX' | 'SENT' | 'STARRED';

const LABEL_TABS: { label: GmailLabel; title: string; icon: React.ElementType }[] = [
  { label: 'INBOX', title: 'Inbox', icon: Inbox },
  { label: 'SENT', title: 'Sent', icon: Send },
  { label: 'STARRED', title: 'Starred', icon: Star },
];

const isExpiredMessage = (message: string) => message.toLowerCase().includes('expired');

export const GmailView: React.FC = () => {
  const configured = isGmailConfigured();

  const [token, setToken] = useState<string | null>(() => getStoredGmailToken());
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [activeLabel, setActiveLabel] = useState<GmailLabel>('INBOX');
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selected, setSelected] = useState<GmailMessage | null>(null);
  const [body, setBody] = useState<string | null>(null);
  const [bodyLoading, setBodyLoading] = useState(false);
  const [bodyError, setBodyError] = useState<string | null>(null);

  const loadMessages = useCallback(async (activeToken: string, label: GmailLabel) => {
    setListLoading(true);
    setListError(null);
    try {
      const msgs = await fetchGmailMessages(activeToken, label, 25);
      setMessages(msgs);
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

  const handleSelectMessage = async (message: GmailMessage) => {
    if (!token) return;
    setSelected(message);
    setBody(null);
    setBodyError(null);
    setBodyLoading(true);
    try {
      const fetchedBody = await fetchGmailBody(token, message.id);
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
            {listLoading && messages.length === 0 ? (
              <div className="p-8 flex items-center justify-center text-text-muted dark:text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : listError ? (
              <div className="p-4 text-sm text-status-negative dark:text-red-400">{listError}</div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-sm text-text-muted dark:text-slate-500">No messages here.</div>
            ) : (
              <ul className="divide-y divide-border-base dark:divide-slate-700">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`p-3 cursor-pointer transition-colors ${selected?.id === message.id ? 'bg-secondary-accent/20 dark:bg-secondary-accent/30' : 'hover:bg-highlight-accent dark:hover:bg-slate-800'}`}
                  >
                    <div className="flex justify-between items-center gap-2 text-xs">
                      <p className={`truncate ${message.isUnread ? 'font-bold text-text-base dark:text-white' : 'font-semibold text-text-base dark:text-text-base'}`}>
                        {message.fromName || message.fromEmail}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {message.isStarred && <Star className="w-3.5 h-3.5 fill-secondary-accent text-secondary-accent" />}
                        <p className="text-text-muted dark:text-slate-400">{new Date(message.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <p className={`text-sm truncate mt-1 ${message.isUnread ? 'font-bold text-text-base dark:text-white' : 'font-medium text-text-muted dark:text-slate-300'}`}>
                      {message.subject}
                    </p>
                    <p className="text-xs text-text-muted dark:text-slate-500 truncate mt-1">{message.snippet}</p>
                  </li>
                ))}
              </ul>
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
                    ) : (
                      <div className="text-sm whitespace-pre-wrap break-words">{body}</div>
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
    </div>
  );
};
