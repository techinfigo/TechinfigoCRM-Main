import type { AgreedService, Proposal } from '../types';
import { proposalNumbers, type ProposalDesign } from './proposalDesign';

/**
 * A proposal's services as the client's Agreed Services: same names, the
 * right billing type (One-Time / Monthly), and prices after the bundle
 * discount, so invoices match the quotation exactly. The discount is shared
 * across that side's services in proportion to their price.
 */
export function proposalToAgreedServices(d: ProposalDesign, idPrefix = `svc-${Date.now()}`): AgreedService[] {
  const n = proposalNumbers(d);
  const side = (b: 'one-time' | 'monthly') => d.services.filter((s) => s.billing === b);
  const shares = new Map<string, number>();
  if (n.discount > 0) {
    const list = side(n.discountOn);
    const total = list.reduce((a, s) => a + (Number(s.price) || 0), 0);
    let left = n.discount;
    list.forEach((s, i) => {
      const cut = i === list.length - 1 ? left : Math.round((n.discount * (Number(s.price) || 0)) / (total || 1));
      shares.set(s.key, cut);
      left -= cut;
    });
  }
  return d.services.map((s, i) => ({
    id: `${idPrefix}-${i}`,
    name: s.title,
    cost: Math.max(0, (Number(s.price) || 0) - (shares.get(s.key) || 0)),
    billingType: s.billing === 'monthly' ? 'Monthly' : 'One-Time',
    notes: `From proposal ${d.number}${shares.get(s.key) ? ` (list price ₹${(Number(s.price) || 0).toLocaleString('en-IN')}, bundle discount applied)` : ''}`,
  }));
}

/** Adds services that are not there yet (same name = already there). */
export function mergeAgreedServices(have: AgreedService[] = [], add: AgreedService[]): { list: AgreedService[]; added: number } {
  const names = new Set(have.map((s) => s.name.trim().toLowerCase()));
  const fresh = add.filter((s) => !names.has(s.name.trim().toLowerCase()));
  return { list: [...have, ...fresh], added: fresh.length };
}

/** The proposal to use for a lead/client: the signed one, else the newest designed one. */
export function bestProposalFor(id: string, proposals: Proposal[]): Proposal | undefined {
  const mine = proposals.filter((p) => p.clientId === id && p.design);
  const newest = (list: Proposal[]) => [...list].sort((a, b) => (b.lastUpdatedDate || '').localeCompare(a.lastUpdatedDate || ''))[0];
  return newest(mine.filter((p) => p.status === 'Signed')) || newest(mine);
}
