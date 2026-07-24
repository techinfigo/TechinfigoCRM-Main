// Real Gmail integration via Google Identity Services (GIS) — deliberately NOT
// Firebase's Google sign-in, which would replace the user's existing CRM session.
// GIS returns a bare API access token without touching who is logged into the CRM,
// so the two logins stay fully independent. Browser-only OAuth gives no refresh
// token, so the token lasts ~1 hour and the user reconnects after that.

const TOKEN_KEY = 'crm_gmail_token';
const TOKEN_EXPIRY_KEY = 'crm_gmail_token_expiry';

const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ');

const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1/users/me';

export const isGmailConfigured = (): boolean => !!process.env.GOOGLE_OAUTH_CLIENT_ID;

export const getStoredGmailToken = (): string | null => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!token || !expiry) return null;
  if (Date.now() >= Number(expiry)) return null;
  return token;
};

export const clearGmailToken = (): void => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
};

let gisScriptPromise: Promise<void> | null = null;

const loadGisScript = (): Promise<void> => {
  // @ts-ignore - loaded dynamically at runtime, not a bundled dependency
  if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('gis-script') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services script.')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
    document.head.appendChild(script);
  });

  return gisScriptPromise;
};

export const connectGmail = async (): Promise<string> => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    throw new Error('Gmail is not configured: GOOGLE_OAUTH_CLIENT_ID is missing.');
  }

  await loadGisScript();

  return new Promise<string>((resolve, reject) => {
    // @ts-ignore - global injected by the GIS script
    const google = window.google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services failed to load. Please try again.'));
      return;
    }

    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: GMAIL_SCOPES,
        callback: (response: any) => {
          if (!response || response.error) {
            reject(new Error(
              response?.error_description ||
              (response?.error ? `Google sign-in was denied (${response.error}).` : 'Google sign-in failed.')
            ));
            return;
          }
          const expiresInMs = (response.expires_in || 3600) * 1000;
          const expiry = Date.now() + expiresInMs - 60000; // refresh a minute early
          sessionStorage.setItem(TOKEN_KEY, response.access_token);
          sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
          resolve(response.access_token);
        },
        error_callback: (err: any) => {
          reject(new Error(err?.message || 'Google sign-in was cancelled or denied.'));
        },
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Failed to start Google sign-in.'));
    }
  });
};

const gmailFetch = async (token: string, path: string): Promise<any> => {
  const res = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    clearGmailToken();
    throw new Error('Your Gmail session has expired. Please reconnect.');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gmail API request failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
};

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  date: string; // ISO string
  isUnread: boolean;
  isStarred: boolean;
}

const parseFromHeader = (value: string): { name: string; email: string } => {
  const match = value.match(/^(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].trim().replace(/^"|"$/g, '');
    return { name: name || match[2], email: match[2] };
  }
  return { name: value.trim(), email: value.trim() };
};

export const fetchGmailMessages = async (
  token: string,
  labelId: 'INBOX' | 'SENT' | 'STARRED' | 'TRASH' = 'INBOX',
  maxResults = 25,
): Promise<GmailMessage[]> => {
  // The list endpoint only returns ids — each message's metadata needs its own request.
  const listData = await gmailFetch(token, `/messages?labelIds=${labelId}&maxResults=${maxResults}`);
  const ids: string[] = (listData.messages || []).map((m: any) => m.id);

  const messages = await Promise.all(
    ids.map(async (id): Promise<GmailMessage | null> => {
      try {
        const msg = await gmailFetch(
          token,
          `/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
        );
        const headers: { name: string; value: string }[] = msg.payload?.headers || [];
        const getHeader = (name: string) =>
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const { name: fromName, email: fromEmail } = parseFromHeader(getHeader('From'));
        const labelIds: string[] = msg.labelIds || [];

        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: msg.snippet || '',
          subject: getHeader('Subject') || '(No Subject)',
          fromName,
          fromEmail,
          toEmail: getHeader('To'),
          date: new Date(Number(msg.internalDate)).toISOString(),
          isUnread: labelIds.includes('UNREAD'),
          isStarred: labelIds.includes('STARRED'),
        };
      } catch {
        // A single message failing to fetch shouldn't take down the whole list.
        return null;
      }
    }),
  );

  return messages
    .filter((m): m is GmailMessage => m !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Gmail's base64 is URL-safe (- and _ instead of + and /) and the decoded bytes
// are UTF-8, so a plain atob() would mangle anything outside ASCII.
const decodeBase64Url = (data: string): string => {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
};

const stripHtml = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

const findBody = (part: any): { plain?: string; html?: string } => {
  let plain: string | undefined;
  let html: string | undefined;

  const walk = (p: any) => {
    if (!p) return;
    if (p.mimeType === 'text/plain' && p.body?.data && !plain) {
      plain = decodeBase64Url(p.body.data);
    } else if (p.mimeType === 'text/html' && p.body?.data && !html) {
      html = decodeBase64Url(p.body.data);
    }
    if (p.parts) {
      p.parts.forEach(walk);
    }
  };
  walk(part);
  return { plain, html };
};

export const fetchGmailBody = async (token: string, messageId: string): Promise<string> => {
  const msg = await gmailFetch(token, `/messages/${messageId}?format=full`);
  const { plain, html } = findBody(msg.payload);
  if (plain) return plain;
  if (html) return stripHtml(html);
  return msg.snippet || '';
};
