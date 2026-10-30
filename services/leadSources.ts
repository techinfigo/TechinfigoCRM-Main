/** The 10 main places a lead can come from. Used everywhere in the CRM. */
export const LEAD_SOURCES: { name: string; hint: string }[] = [
  { name: 'Google / GMB', hint: 'Google Business, search, maps' },
  { name: 'Referral', hint: 'client, friend, partner' },
  { name: 'Website', hint: 'contact form, check-up form' },
  { name: 'Social Media', hint: 'Instagram, Facebook, LinkedIn, YouTube' },
  { name: 'Paid Ads', hint: 'Meta ads, Google ads' },
  { name: 'Direct', hint: 'walk-in, phone call, WhatsApp' },
  { name: 'Our Outreach', hint: 'cold call, cold DM, cold email, visit' },
  { name: 'Listings', hint: 'JustDial, IndiaMART, Sulekha' },
  { name: 'Offline', hint: 'event, networking, card, banner' },
  { name: 'Other', hint: '' },
];
export const LEAD_SOURCE_NAMES = LEAD_SOURCES.map((s) => s.name);

/** Turns any old / detailed source name into one of the 10 main sources. The saved lead is not changed. */
export function mainSource(raw?: string | null): string {
  const s = (raw || '').trim();
  if (!s) return '';
  if (LEAD_SOURCE_NAMES.includes(s)) return s;
  const t = s.toLowerCase();
  if (/\bads?\b|meta|google ad|facebook\/instagram ad|lead form/.test(t)) return 'Paid Ads';
  if (/gmb|google|maps|business profile/.test(t)) return 'Google / GMB';
  if (/refer/.test(t)) return 'Referral';
  if (/website|inbound|check-?up|9,999|form/.test(t)) return 'Website';
  if (/cold|outreach|door|visit/.test(t)) return 'Our Outreach';
  if (/insta|facebook|linkedin|youtube|social/.test(t)) return 'Social Media';
  if (/walk|phone|call|whatsapp|direct/.test(t)) return 'Direct';
  if (/justdial|indiamart|sulekha|listing|directory/.test(t)) return 'Listings';
  if (/event|network|bni|card|banner|flyer|newspaper|seminar/.test(t)) return 'Offline';
  return 'Other';
}
