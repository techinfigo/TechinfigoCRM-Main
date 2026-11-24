import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Claude (Anthropic) AI — uses the key the user stored in
 * Integrations → Apps & APIs (`appIntegrations/claude`). The call goes
 * straight from the browser to Anthropic with the direct-browser header,
 * so no extra server is needed. The key is the agency's own.
 */

const DEFAULT_MODEL = 'claude-3-5-haiku-latest';

export async function getAiConfig(): Promise<{ key: string; model: string } | null> {
  try {
    const snap = await getDoc(doc(db, 'appIntegrations', 'claude'));
    if (!snap.exists()) return null;
    const x = snap.data();
    const key = typeof x.apiKey === 'string' ? x.apiKey.trim() : '';
    if (!key) return null;
    const model = typeof x.model === 'string' && x.model.trim() ? x.model.trim() : DEFAULT_MODEL;
    return { key, model };
  } catch {
    return null;
  }
}

export class AiNotConnectedError extends Error {}

/** Send one prompt to Claude and get the text back. Throws a friendly error. */
export async function claudeMessage(system: string, user: string, maxTokens = 700): Promise<string> {
  const cfg = await getAiConfig();
  if (!cfg) throw new AiNotConnectedError('Claude is not connected. Add your Anthropic API key in Integrations → Apps & APIs.');
  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': cfg.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: cfg.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
    });
  } catch {
    throw new Error('Could not reach the AI. Check your internet and try again.');
  }
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    const msg = err?.error?.message || `AI error (${res.status}).`;
    throw new Error(res.status === 401 ? 'Your Anthropic API key was rejected. Check it in Integrations.' : res.status === 404 ? `Model "${cfg.model}" not found. Change it in Integrations → Claude.` : msg);
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content || []).filter((b) => b.type === 'text').map((b) => b.text || '').join('\n').trim();
  return text || '(no reply)';
}
