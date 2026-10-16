import { auth } from '../firebase';
import type { ProposalDesign } from './proposalDesign';

/**
 * Saves a proposal online and returns the client's link
 * (www.techinfigo.com/p/<id>). The website stores only the proposal's details;
 * re-saving with the same id updates the same link.
 */
const ENDPOINT = `${(process.env.WEBSITE_URL || 'https://www.techinfigo.com').replace(/\/$/, '')}/api/proposals`;

export async function publishProposal(data: ProposalDesign, id?: string): Promise<{ id: string; url: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in again.');
  const idToken = await user.getIdToken();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, id, data }),
  });
  const json = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; url?: string; error?: string };
  if (!res.ok || !json.ok || !json.id || !json.url) throw new Error(json.error || `Could not create the link (${res.status}).`);
  return { id: json.id, url: json.url };
}
