/**
 * Techinfigo proposal: one fixed design, only the client's details change.
 *
 * SHARED FILE — an identical copy lives in the website repo at
 * lib/proposal-design.ts (it serves the client's link, www.techinfigo.com/p/<id>).
 * Change both together. Pure TypeScript, no imports, so it runs in the CRM
 * (live preview) and on the website server (the page the client opens).
 *
 * Every piece of text is HTML-escaped before it goes into the page.
 */

export type ProposalIcon = 'pin' | 'globe' | 'insta' | 'mega' | 'chat' | 'chart' | 'star' | 'zap' | 'list' | 'search' | 'repeat' | 'key' | 'check' | 'cal' | 'arrow' | 'goal';
export type ProposalServiceKey = 'website' | 'gbp' | 'growth' | 'seo' | 'social' | 'ads';

export interface ProposalProblem {
  icon: ProposalIcon;
  title: string;
  cost: string;
  level: 'red' | 'yellow';
}

export interface ProposalService {
  key: ProposalServiceKey;
  title: string;
  price: number;
  billing: 'one-time' | 'monthly';
  ticks: string[];
  recommended?: boolean;
}

export interface ProposalDesign {
  v: 1;
  number: string;
  date: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  business: string;
  person: string;
  /** What their buyers are called: students, patients, customers… */
  customerWord: string;
  /** Online score out of 100 from the audit; null hides the meter. */
  score: number | null;
  problems: ProposalProblem[];
  services: ProposalService[];
  roi: {
    enabled: boolean;
    avgValue: number; // ₹ a customer brings
    valueNote: string; // e.g. "/year", "per visit"
    profitPct: number; // 0-100
    joinPct: number; // % of enquiries that buy
    adBudget: number; // ₹ / month paid to Meta/Google
  };
  ctaLine: string;
  contact: { name: string; phone: string; address: string; upiId?: string };
  /** Short personal note from the founder at the top; a default is used when empty. */
  note?: string;
}

/** Real proof the website adds when it serves the link (never invented). */
export interface ProposalProof {
  rating?: number;
  count?: number;
  review?: { text: string; author: string };
  reviewsUrl?: string;
  videoUrl?: string;
}

/** What each problem turns into once fixed (the "After" side). */
const AFTER: Partial<Record<ProposalIcon, string>> = {
  pin: 'Verified on Google Maps, 20+ photos',
  globe: 'Website with WhatsApp + call buttons',
  star: 'Review link + QR: more 5★ reviews',
  insta: '12 posts + 4 reels every month',
  mega: 'Ads bringing enquiries every day',
  zap: 'Fast site, opens in 2 seconds',
  list: 'Every enquiry tracked in your free CRM',
};
/** Which services fix each problem — "After" shows only when one of them is in the proposal. */
const FIXED_BY: Partial<Record<ProposalIcon, ProposalServiceKey[]>> = {
  pin: ['gbp', 'growth'],
  globe: ['website'],
  star: ['gbp', 'growth'],
  insta: ['social', 'growth'],
  mega: ['ads', 'growth'],
  zap: ['website'],
  list: ['website', 'gbp', 'growth', 'seo', 'social', 'ads'],
};

/* ------------------------------------------------------------------ */
/* Catalogues the builder picks from                                    */
/* ------------------------------------------------------------------ */

export const PROPOSAL_SERVICES: (ProposalService & { icon: ProposalIcon; blurb: string })[] = [
  { key: 'website', title: 'Business website', price: 9999, billing: 'one-time', icon: 'globe', blurb: '5-page site, live in 7 days', ticks: ['5 pages, prices & photos', 'WhatsApp + call buttons', 'Live in 7 days'] },
  { key: 'gbp', title: 'Google profile setup', price: 4999, billing: 'one-time', icon: 'pin', blurb: 'Show on Google Maps', ticks: ['Verified on Google Maps', '20+ photos & services', 'Review link + QR code'] },
  { key: 'growth', title: 'Local Growth Plan', price: 14999, billing: 'monthly', icon: 'mega', blurb: 'Google + ads + posts, monthly', recommended: true, ticks: ['Google profile on Maps', 'Ads for new customers', '12 posts + 4 reels', 'Monthly report'] },
  { key: 'seo', title: 'SEO', price: 7999, billing: 'monthly', icon: 'search', blurb: 'Rank on Google search', ticks: ['Local keywords', 'Website fixes', 'Monthly ranking report'] },
  { key: 'social', title: 'Social media', price: 9999, billing: 'monthly', icon: 'insta', blurb: 'Posts & reels monthly', ticks: ['12 posts + 4 reels', 'Content plan you approve', 'Monthly insights'] },
  { key: 'ads', title: 'Meta / Google ads', price: 9999, billing: 'monthly', icon: 'mega', blurb: 'Ads that bring enquiries', ticks: ['Ad setup & tracking', '3 designs + 1 video', 'Weekly tuning'] },
];

export const PROPOSAL_PROBLEMS: ProposalProblem[] = [
  { icon: 'pin', title: 'Not on Google Maps', cost: '≈ 25 calls lost / month', level: 'red' },
  { icon: 'globe', title: 'No website or WhatsApp button', cost: 'Enquiries lost daily', level: 'red' },
  { icon: 'star', title: 'Very few Google reviews', cost: 'People pick rivals', level: 'red' },
  { icon: 'insta', title: 'Social media inactive', cost: 'Looks closed to new people', level: 'yellow' },
  { icon: 'mega', title: 'No ads running', cost: 'Rivals take the buyers', level: 'yellow' },
  { icon: 'zap', title: 'Website slow / old on phones', cost: 'Visitors leave in 3 seconds', level: 'yellow' },
  { icon: 'list', title: 'Enquiries not tracked', cost: 'Follow-ups get missed', level: 'yellow' },
];

export const CUSTOMER_WORDS = ['customers', 'students', 'patients', 'clients', 'guests', 'buyers', 'members'];

/** Guess what a business calls its buyers, from its industry text. */
export function guessCustomerWord(industry?: string): string {
  const s = (industry || '').toLowerCase();
  if (/coach|school|academy|tuition|institute|class|education/.test(s)) return 'students';
  if (/clinic|hospital|dent|doctor|physio|health|skin|eye/.test(s)) return 'patients';
  if (/hotel|restaurant|cafe|resort|homestay|travel|tour/.test(s)) return 'guests';
  if (/real estate|property|builder|showroom|furniture|car|bike/.test(s)) return 'buyers';
  if (/gym|fitness|yoga|club/.test(s)) return 'members';
  if (/ca |lawyer|consult|agency|account/.test(s)) return 'clients';
  return 'customers';
}

/* ------------------------------------------------------------------ */
/* Numbers                                                             */
/* ------------------------------------------------------------------ */

type Case = { enquiries: number; customers: number; profit: number; x: number };
export interface ProposalNumbers {
  oneTime: number;
  monthly: number;
  startToday: number;
  hasAds: boolean;
  /** Cost the ROI is measured against: monthly fees + ads, or the one-time cost when nothing is monthly. */
  cost: number;
  costIsMonthly: boolean;
  profitPerCustomer: number;
  breakEven: number;
  sources: { label: string; color: string; enquiries: number }[];
  low: Case;
  expected: Case;
  high: Case;
}

const round = (n: number) => Math.round(n);

export function proposalNumbers(d: ProposalDesign): ProposalNumbers {
  const has = (k: ProposalServiceKey) => d.services.some((s) => s.key === k);
  const oneTime = d.services.filter((s) => s.billing === 'one-time').reduce((a, s) => a + (Number(s.price) || 0), 0);
  const monthly = d.services.filter((s) => s.billing === 'monthly').reduce((a, s) => a + (Number(s.price) || 0), 0);
  const startToday = round(oneTime * 0.5 + monthly);
  const hasAds = (has('growth') || has('ads')) && d.roi.adBudget > 0;
  const costIsMonthly = monthly > 0 || hasAds;
  const cost = costIsMonthly ? monthly + (hasAds ? d.roi.adBudget : 0) : oneTime;
  const profitPerCustomer = (Number(d.roi.avgValue) || 0) * ((Number(d.roi.profitPct) || 0) / 100);
  const breakEven = profitPerCustomer > 0 && cost > 0 ? Math.ceil(cost / profitPerCustomer) : 0;

  // Enquiries a month: [low, expected, high] per source.
  const src: { label: string; color: string; e: [number, number, number] }[] = [];
  if (hasAds) {
    const b = d.roi.adBudget;
    src.push({ label: 'Instagram / FB ads', color: '#0b2226', e: [round(b / 250), round(b / 150), round(b / 120)] });
  }
  if (has('gbp') || has('growth')) src.push({ label: 'Google Maps', color: '#f6b324', e: [7, 10, 18] });
  if (has('website')) src.push({ label: 'Website', color: '#16a172', e: [3, 5, 9] });
  if (has('seo')) src.push({ label: 'Google search', color: '#3a7078', e: [2, 5, 10] });
  if (has('social')) src.push({ label: 'Social posts', color: '#9b7ad8', e: [2, 4, 6] });

  const join = Math.max(0, Number(d.roi.joinPct) || 0) / 100;
  const mk = (i: 0 | 1 | 2, rate: number): Case => {
    const enquiries = src.reduce((a, s) => a + s.e[i], 0);
    const customers = round(enquiries * rate);
    const profit = round(customers * profitPerCustomer);
    return { enquiries, customers, profit, x: cost > 0 ? Math.round((profit / cost) * 10) / 10 : 0 };
  };
  return {
    oneTime,
    monthly,
    startToday,
    hasAds,
    cost,
    costIsMonthly,
    profitPerCustomer,
    breakEven,
    sources: src.map((s) => ({ label: s.label, color: s.color, enquiries: s.e[1] })),
    low: mk(0, join * 0.6),
    expected: mk(1, join),
    high: mk(2, Math.min(1, join * 1.2)),
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export function inrShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e7) return '₹' + +(n / 1e7).toFixed(1) + 'Cr';
  if (a >= 1e5) return '₹' + +(n / 1e5).toFixed(1) + 'L';
  if (a >= 1e3) return '₹' + Math.round(n / 1e3) + 'K';
  return inr(n);
}
const niceDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? esc(iso) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const shortDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? esc(iso) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ic = (name: ProposalIcon, cls = 'ic') => `<svg class="${cls}"><use href="#${name}"/></svg>`;
const person = (cls: string) => `<svg viewBox="0 0 24 24" class="${cls}"><circle cx="12" cy="6.5" r="4.5"/><path d="M3.5 22a8.5 8.5 0 0 1 17 0Z"/></svg>`;
const svcIcon = (k: ProposalServiceKey): ProposalIcon => PROPOSAL_SERVICES.find((s) => s.key === k)?.icon || 'check';

/* ------------------------------------------------------------------ */
/* The page                                                            */
/* ------------------------------------------------------------------ */

export function renderProposalHtml(
  d: ProposalDesign,
  opts: { logoSrc?: string; sample?: boolean; pdfButton?: boolean; founderPhoto?: string; proof?: ProposalProof; today?: string } = {},
): string {
  const n = proposalNumbers(d);
  const word = (d.customerWord || 'customers').toLowerCase();
  const Word = cap(word);
  const one = word.replace(/s$/, '');
  const many = (count: number) => (count === 1 ? one : word);
  const has = (k: ProposalServiceKey) => d.services.some((s) => s.key === k);
  const roiOn = d.roi.enabled && n.profitPerCustomer > 0 && n.cost > 0 && n.sources.length > 0;
  const per = n.costIsMonthly ? '/ month' : 'one-time';

  /* 0. Personal note */
  const first = (d.person || '').replace(/^(mr|mrs|ms|dr)\.?\s+/i, '').split(' ')[0];
  const noteText = (d.note || '').trim() ||
    `${first ? `${first} ji, ` : ''}I looked at ${d.business} online. Below are the gaps costing you ${word} today, and the plan to fix them. My team does all the work; you only approve.`;
  const founderName = d.contact.name || 'Sachin Bauddh';
  const initials = founderName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const sectionNote = `
  <section class="note">
    ${opts.founderPhoto ? `<img class="face" src="${esc(opts.founderPhoto)}" alt="${esc(founderName)}" onerror="this.outerHTML='<div class=&quot;face init&quot;>${esc(initials)}</div>'">` : `<div class="face init">${esc(initials)}</div>`}
    <div>
      <p class="say">“${esc(noteText)}”</p>
      <p class="sig"><b>${esc(founderName)}</b> · Founder, Techinfigo</p>
    </div>
  </section>`;
  const todayIso = opts.today || new Date().toISOString().slice(0, 10);
  const daysLeft = Math.round((new Date(`${d.validUntil}T00:00:00Z`).getTime() - new Date(`${todayIso}T00:00:00Z`).getTime()) / 86400000);

  /* 1. Where you are now */
  const score = typeof d.score === 'number' && !Number.isNaN(d.score) ? Math.max(0, Math.min(100, Math.round(d.score))) : null;
  const scoreColor = score === null ? '' : score < 50 ? '#e04848' : score < 75 ? '#f0a020' : '#16a172';
  const scoreLabel = score === null ? '' : score < 50 ? 'Needs work' : score < 75 ? 'Can do better' : 'Good';
  const arc = 263.9;
  const problems = d.problems.slice(0, 4);
  const sectionNow = problems.length || score !== null ? `
  <section>
    <p class="kicker"><i>1</i> Where you are now</p>
    <h2>${esc(cap(word))} can't find you online</h2>
    <div class="score${score === null ? ' noscore' : ''}">
      ${score === null ? '' : `<div class="gauge">
        <svg viewBox="0 0 200 112"><path d="M16 100 A84 84 0 0 1 184 100" fill="none" stroke="#eef2f2" stroke-width="18" stroke-linecap="round"/><path d="M16 100 A84 84 0 0 1 184 100" fill="none" stroke="${scoreColor}" stroke-width="18" stroke-linecap="round" stroke-dasharray="${((score / 100) * arc).toFixed(1)} 400"/></svg>
        <div class="val num">${score}<small>out of 100</small></div>
        <div class="lbl" style="color:${scoreColor}">${scoreLabel}</div>
      </div>`}
      <div class="probs">
        ${problems.map((p) => `<div class="pair"><div class="prob ${p.level === 'yellow' ? 'yl' : ''}"><div class="ico">${ic(p.icon)}</div><div><small>Today</small><b>${esc(p.title)}</b><span>${esc(p.cost)}</span></div></div>${AFTER[p.icon] && (FIXED_BY[p.icon] || []).some((k) => has(k)) ? `<div class="after"><small>After</small>${ic('check')}<b>${esc(AFTER[p.icon] as string)}</b></div>` : ''}</div>`).join('')}
      </div>
    </div>
  </section>` : '';

  /* 2. The plan */
  const flowSources = n.sources.length ? n.sources.slice(0, 3) : d.services.slice(0, 3).map((s) => ({ label: s.title, color: '', enquiries: 0 }));
  const srcIcon = (label: string): ProposalIcon => (/ads/i.test(label) ? 'insta' : /maps/i.test(label) ? 'pin' : /website/i.test(label) ? 'globe' : /search/i.test(label) ? 'search' : 'insta');
  const sectionPlan = `
  <section>
    <p class="kicker"><i>2</i> The plan</p>
    <h2>How we bring you ${esc(word)}</h2>
    <div class="flow">
      <div class="col">${flowSources.map((s) => `<div class="src">${ic(srcIcon(s.label))}${esc(s.label.replace('Instagram / FB ads', 'Instagram ads'))}</div>`).join('')}</div>
      <div class="arrow">${ic('arrow')}</div>
      <div class="hub">${ic('chat')}<br>WhatsApp &amp; calls${roiOn ? `<br><span class="num" style="color:var(--amber)">${n.expected.enquiries} / month</span>` : ''}</div>
      <div class="arrow">${ic('arrow')}</div>
      <div class="goal">${ic('goal')}<br>${roiOn ? `<span class="num">${n.expected.customers}</span> new ${esc(many(n.expected.customers))}` : `More ${esc(word)}`}</div>
    </div>
    <div class="packs">
      ${d.services.map((s) => `<div class="pack${s.recommended ? ' best' : ''}">
        ${s.recommended ? '<span class="badge">RECOMMENDED</span>' : ''}
        <div class="top"><div class="ico">${ic(svcIcon(s.key))}</div><div><h3>${esc(s.title)}</h3><div class="pr num">${inr(s.price)} ${s.billing === 'monthly' ? '/ month' : 'one-time'}</div></div></div>
        <ul class="ticks">${s.ticks.filter(Boolean).slice(0, 4).map((t) => `<li>${ic('check')}${esc(t)}</li>`).join('')}</ul>
      </div>`).join('')}
    </div>
  </section>`;

  /* 3. ROI */
  let sectionRoi = '';
  if (roiOn) {
    const e = n.expected;
    const show = Math.max(10, Math.min(14, e.customers + 2));
    const amber = Math.min(n.breakEven, show);
    const green = Math.max(0, Math.min(e.customers, show) - n.breakEven);
    const people = Array.from({ length: show }, (_, i) => person(i < amber ? 'p-cost' : i < amber + green ? 'p-profit' : 'p-rest')).join('');
    const max = Math.max(n.high.profit, n.cost, 1);
    const h = (v: number) => Math.max(4, (v / max) * 140);
    const bar = (x: number, c: Case, label: string, strong: boolean) => {
      const hh = h(c.profit);
      return `<rect x="${x}" y="${(170 - hh).toFixed(1)}" width="56" height="${hh.toFixed(1)}" rx="8" fill="${strong ? '#16a172' : '#9fdcc4'}"/>
        <text x="${x + 28}" y="${(162 - hh).toFixed(1)}" text-anchor="middle" font-size="${strong ? 16 : 14}" font-weight="800" fill="#0b2226">${inrShort(c.profit)}</text>
        <text x="${x + 28}" y="190" text-anchor="middle" font-size="12" ${strong ? 'font-weight="800" fill="#16a172"' : 'fill="#62757a"'}>${label} ${c.x}×</text>`;
    };
    const costY = (170 - (n.cost / max) * 140).toFixed(1);
    const totalE = Math.max(1, n.sources.reduce((a, s) => a + s.enquiries, 0));
    const headline = n.costIsMonthly
      ? `Spend ${inrShort(n.cost)}, get back ${inrShort(e.profit)}`
      : `${n.breakEven} ${esc(many(n.breakEven))} ${n.breakEven === 1 ? 'pays' : 'pay'} for it all`;
    const joinTxt = d.roi.joinPct > 0 ? (Number.isInteger(100 / d.roi.joinPct) ? `1 in ${100 / d.roi.joinPct}` : `${d.roi.joinPct}%`) : '0%';
    sectionRoi = `
  <section>
    <p class="kicker"><i>3</i> Your ROI</p>
    <h2>${headline}</h2>
    <div class="be">
      <div class="big num">${n.breakEven}</div>
      <div>
        <b>${esc(many(n.breakEven))} ${n.costIsMonthly ? 'a month ' : ''}${n.breakEven === 1 ? 'pays' : 'pay'} for everything</b>
        <div class="people">${people}</div>
        <div class="legend"><span><i style="background:var(--amber)"></i>Covers cost</span><span><i style="background:#5ee0b0"></i>Your extra profit</span></div>
      </div>
    </div>
    <div class="wait">${ic('cal')}<div><b>Each month you wait ≈ ${inrShort(e.profit)} profit you could have made</b><span>3 months ≈ ${inrShort(e.profit * 3)} (expected case)</span></div></div>
    <div class="roi-grid">
      <div class="panel chart">
        <h4>Extra profit ${n.costIsMonthly ? 'per month' : 'in the first month'}</h4>
        <svg viewBox="0 0 340 200" class="num">
          <line x1="20" y1="170" x2="276" y2="170" stroke="#e4eaeb" stroke-width="2"/>
          ${bar(34, n.low, 'Low', false)}${bar(116, e, 'Expected', true)}${bar(198, n.high, 'High', false)}
          <line x1="20" y1="${costY}" x2="276" y2="${costY}" stroke="#e04848" stroke-width="2" stroke-dasharray="6 5"/>
          <text x="282" y="${(+costY - 3).toFixed(1)}" font-size="11" font-weight="700" fill="#e04848">Your cost</text>
          <text x="282" y="${(+costY + 11).toFixed(1)}" font-size="11" font-weight="700" fill="#e04848">${inrShort(n.cost)}</text>
        </svg>
      </div>
      <div class="panel">
        <h4>Where ${e.enquiries} enquiries come from</h4>
        <div class="srcbar num">${n.sources.map((s) => `<div style="width:${((s.enquiries / totalE) * 100).toFixed(1)}%;background:${s.color};${s.color === '#f6b324' ? 'color:#0b2226' : ''}">${s.enquiries}</div>`).join('')}</div>
        <div class="srcleg num">${n.sources.map((s) => `<div><i style="background:${s.color}"></i>${esc(s.label)}<b>${s.enquiries}</b></div>`).join('')}</div>
        <div class="funnel num">
          <div style="width:100%;background:#3a7078">${e.enquiries} enquiries</div>
          <div style="width:${Math.max(28, Math.min(100, (e.customers / Math.max(1, e.enquiries)) * 100 * 3)).toFixed(0)}%;background:#16a172">${e.customers} ${e.customers === 1 ? 'joins' : 'join'}</div>
        </div>
      </div>
    </div>
    <div class="inputs num">
      <span class="inp">${esc(cap(one))} value <b>${inr(d.roi.avgValue)}${esc(d.roi.valueNote ? ' ' + d.roi.valueNote : '')}</b></span>
      <span class="inp">Profit <b>${esc(d.roi.profitPct)}%</b></span>
      <span class="inp">Join rate <b>${joinTxt}</b></span>
      <span class="inp">Cost <b>${n.costIsMonthly ? `${inr(n.monthly)}${n.hasAds ? ` + ${inr(d.roi.adBudget)} ads` : ''} ${per}` : `${inr(n.cost)} one-time`}</b></span>
    </div>
    <details>
      <summary>How we calculated this</summary>
      <p>${n.sources.map((s) => `${esc(s.label)} ≈ ${s.enquiries}`).join(' + ')} = ${e.enquiries} enquiries${n.hasAds ? ` (ads: ${inr(d.roi.adBudget)} ÷ ₹150 per enquiry)` : ''}. ${joinTxt} join = ${e.customers} ${esc(many(e.customers))} × ${inr(n.profitPerCustomer)} profit = ${inr(e.profit)}. Low case: fewer enquiries${n.hasAds ? ' (₹250 each)' : ''} and 40% fewer joining. High case: more enquiries${n.hasAds ? ' (₹120 each)' : ''} and 20% more joining.</p>
    </details>
    <p class="fine">Estimate from your numbers, not a guarantee. Months 1–2 are setup; full results from month 3.</p>
  </section>`;
  }

  /* 4. Timeline */
  const steps: { icon: ProposalIcon; when: string; text: string }[] = [];
  const g = has('gbp') || has('growth');
  if (has('website') || g) steps.push({ icon: has('website') ? 'globe' : 'pin', when: 'Week 1', text: has('website') && g ? 'Website + Google profile' : has('website') ? 'Website live' : 'Google profile fixed' });
  if (n.hasAds || has('ads')) steps.push({ icon: 'mega', when: 'Week 2', text: 'Ads live' });
  if (has('social') || has('growth')) steps.push({ icon: 'repeat', when: 'Every week', text: n.hasAds ? 'Posts, reels, ad tuning' : 'Posts & reels' });
  else if (has('seo')) steps.push({ icon: 'search', when: 'Every week', text: 'SEO work' });
  if (n.monthly > 0) steps.push({ icon: 'chart', when: 'Month end', text: 'Your numbers report' });
  const tl = steps.slice(0, 4);
  const k = roiOn ? 4 : 3;
  const sectionTimeline = tl.length ? `
  <section>
    <p class="kicker"><i>${k}</i> Timeline</p>
    <h2>${has('website') ? 'Live in 7 days' : 'Up and running in 2 weeks'}</h2>
    <div class="steps n${tl.length}">${tl.map((s) => `<div class="st"><div class="ico">${ic(s.icon)}</div><div class="when">${s.when}</div><b>${s.text}</b></div>`).join('')}</div>
  </section>` : '';

  /* 5. Price */
  const oneNames = d.services.filter((s) => s.billing === 'one-time').map((s) => s.title);
  const monNames = d.services.filter((s) => s.billing === 'monthly').map((s) => s.title);
  const chips: string[] = [];
  if (n.hasAds) chips.push(`${ic('check')}Ad budget ${inr(d.roi.adBudget)} paid by you to Meta / Google`);
  if (n.monthly > 0) chips.push(`${ic('check')}3-month minimum`);
  if (has('website')) chips.push(`${ic('check')}30 days free fixes`);
  chips.push(`${ic('key')}You own everything`);
  const sectionPrice = `
  <section>
    <p class="kicker"><i>${tl.length ? k + 1 : k}</i> Investment</p>
    <h2>Clear pricing</h2>
    <div class="prices num">
      ${n.oneTime ? `<div class="pt"><div class="l">${esc(oneNames.length === 1 ? oneNames[0] : 'One-time')}</div><div class="a">${inr(n.oneTime)}</div><div class="s">one-time</div></div>` : ''}
      ${n.monthly ? `<div class="pt"><div class="l">${esc(monNames.length === 1 ? monNames[0] : 'Monthly')}</div><div class="a">${inr(n.monthly)}</div><div class="s">per month</div></div>` : ''}
      <div class="pt start"><div class="l">To start today</div><div class="a">${inr(n.startToday)}</div><div class="s">+ GST${n.oneTime && n.monthly ? ' · 50% one-time + month 1' : n.oneTime ? ' · 50% advance' : ' · month 1'}</div></div>
    </div>
    <div class="tchips">${chips.map((c) => `<span class="tchip">${c}</span>`).join('')}</div>
  </section>`;

  /* 6. Your protection (from the refund policy — keep in sync with /refund-policy) */
  const protect: string[] = [
    'Full refund within 48 hours if work hasn’t started',
    ...(has('website') ? ['30 days of free fixes after launch'] : []),
    'You own your website, pages and ad accounts',
    ...(n.monthly > 0 ? ['Monthly plan: 3 months, then cancel with 30 days’ notice'] : []),
    'Real numbers report every month',
  ];
  const sectionProtect = `
  <section>
    <p class="kicker">${ic('key', 'ic sm')} Your protection</p>
    <h2>No risk on your side</h2>
    <div class="protect">${protect.map((t) => `<div>${ic('check')}<b>${esc(t)}</b></div>`).join('')}</div>
  </section>`;

  /* 7. Proof — only real data the website passes in */
  const pr = opts.proof || {};
  const stars = (r: number) => '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r));
  const sectionProof = pr.rating || pr.videoUrl ? `
  <section class="proof">
    ${pr.rating ? `<div class="rate"><span class="big num">${pr.rating.toFixed(1)}</span><div><span class="st">${stars(pr.rating)}</span><b>Google rating${pr.count ? ` · ${pr.count} reviews` : ''}</b></div></div>` : ''}
    ${pr.review?.text ? `<blockquote>“${esc(pr.review.text.length > 220 ? pr.review.text.slice(0, 217) + '…' : pr.review.text)}”<cite>— ${esc(pr.review.author)}, on Google</cite></blockquote>` : ''}
    <div class="plinks">
      ${pr.reviewsUrl ? `<a href="${esc(pr.reviewsUrl)}" target="_blank" rel="noopener">${ic('star', 'ic sm')}Read all reviews</a>` : ''}
      ${pr.videoUrl ? `<a href="${esc(pr.videoUrl)}" target="_blank" rel="noopener">▶ Watch a client story</a>` : ''}
    </div>
  </section>` : '';

  /* 8. How to start */
  const sectionSteps = `
  <section>
    <p class="kicker">${ic('zap', 'ic sm')} How to start</p>
    <h2>3 simple steps</h2>
    <div class="go">
      <div><i>1</i><b>Reply YES on WhatsApp</b></div>
      <div><i>2</i><b>We call you the same day</b></div>
      <div><i>3</i><b>${has('website') ? 'Your website is live in 7 days' : 'Work starts in 24 hours'}</b></div>
    </div>
    <details><summary>Do I need to do anything?</summary><p>Only share your logo, photos and details once, and approve our designs. We do the rest.</p></details>
    <details><summary>Who owns the website and accounts?</summary><p>You do. The website, Google profile, pages and ad accounts are in your name.</p></details>
    <details><summary>What if it doesn’t work?</summary><p>You see real numbers every month. If something isn’t working we change it, and the monthly plan can be stopped after 3 months with 30 days’ notice.</p></details>
  </section>`;

  /* 9. Why + CTA */
  const phone = (d.contact.phone || '').replace(/\D/g, '');
  const wa = phone.length === 10 ? `91${phone}` : phone;
  const waLink = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`YES, we want to start. (Proposal ${d.number})`)}` : '';
  const upi = (d.contact.upiId || '').trim();
  const upiLink = upi ? `upi://pay?pa=${encodeURIComponent(upi)}&pn=Techinfigo&tn=${encodeURIComponent(`Advance ${d.number}`)}&cu=INR` : '';
  const sectionCta = `
  <section class="cta">
    <div class="whys">
      <div class="why"><div class="ico">${ic('pin')}</div><b>Team in Agra</b></div>
      <div class="why"><div class="ico">${ic('zap')}</div><b>${has('website') ? 'Live in 7 days' : 'Fast start'}</b></div>
      <div class="why"><div class="ico">${ic('chart')}</div><b>Real numbers monthly</b></div>
    </div>
    <h2>${esc(d.ctaLine || 'Ready to start?')}</h2>
    ${daysLeft >= 0 && daysLeft <= 60 ? `<p class="left">${daysLeft === 0 ? 'This offer ends today' : `This offer is valid for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}`}</p>` : ''}
    <div class="btns">
      ${waLink ? `<a class="btn y" href="${esc(waLink)}" target="_blank" rel="noopener">${ic('chat')}Reply YES on WhatsApp</a>` : ''}
      ${upiLink ? `<a class="btn o" href="${esc(upiLink)}">Pay advance by UPI</a>` : ''}
    </div>
    <p class="foot">${esc([d.contact.name, 'Techinfigo', d.contact.address, d.contact.phone].filter(Boolean).join(' · '))}</p>
  </section>`;

  const logo = opts.logoSrc ? `<img src="${esc(opts.logoSrc)}" alt="">` : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${esc(`Growth proposal – ${d.business}`)}</title>
<style>${CSS}</style></head>
<body>
${SYMBOLS}
${opts.sample ? '<div class="sample">SAMPLE</div>' : ''}
${opts.pdfButton ? '<button class="pdf" onclick="window.print()">⬇ Save as PDF</button>' : ''}
<div class="page">
  <header class="cover">
    <div class="brand">${logo}TECHINFIGO</div>
    <div class="cover-grid">
      <div>
        <h1>More ${esc(word)} for <span>${esc(d.business)}</span></h1>
        <div class="for">Growth proposal${d.person ? ` · for ${esc(d.person)}` : ''}</div>
        <div class="chips">
          <span class="chip">${ic('cal', 'ic sm')}<b>${niceDate(d.date)}</b></span>
          <span class="chip">No. <b>${esc(d.number)}</b></span>
          <span class="chip">Valid till <b>${shortDate(d.validUntil)}</b>${daysLeft >= 0 && daysLeft <= 60 ? ` · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : ''}</span>
        </div>
      </div>
      <div class="hero" aria-hidden="true">${HERO}</div>
    </div>
  </header>
  ${sectionNote}
  ${sectionNow}
  ${sectionPlan}
  ${sectionRoi}
  ${sectionTimeline}
  ${sectionPrice}
  ${sectionProtect}
  ${sectionProof}
  ${sectionSteps}
  ${sectionCta}
</div>
${waLink ? `<div class="sticky"><div><b class="num">${inr(n.startToday)}</b><span>to start + GST</span></div>${opts.pdfButton ? '<button class="spdf" onclick="window.print()" aria-label="Save as PDF">PDF</button>' : ''}<a href="${esc(waLink)}" target="_blank" rel="noopener">${ic('chat', 'ic sm')}Reply YES</a></div>` : ''}
</body></html>`;
}

const HERO = `<svg viewBox="0 0 240 180"><rect x="24" y="118" width="30" height="42" rx="6" fill="#2a4a50"/><rect x="66" y="96" width="30" height="64" rx="6" fill="#2f5960"/><rect x="108" y="70" width="30" height="90" rx="6" fill="#3a7078"/><rect x="150" y="40" width="30" height="120" rx="6" fill="#f6b324"/><path d="M28 104 L80 82 L122 58 L176 22" stroke="#5ee0b0" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M162 20 L178 20 L178 36" stroke="#5ee0b0" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="206" cy="58" r="20" fill="#16a172"/><path d="M197 58 l6 6 12-12" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="14" y1="160" x2="226" y2="160" stroke="#3a5a60" stroke-width="3" stroke-linecap="round"/></svg>`;

const SYMBOLS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<symbol id="pin" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></symbol>
<symbol id="globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></symbol>
<symbol id="insta" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/></symbol>
<symbol id="mega" viewBox="0 0 24 24"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></symbol>
<symbol id="chat" viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></symbol>
<symbol id="chart" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></symbol>
<symbol id="star" viewBox="0 0 24 24"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/></symbol>
<symbol id="zap" viewBox="0 0 24 24"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></symbol>
<symbol id="list" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></symbol>
<symbol id="search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></symbol>
<symbol id="check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
<symbol id="repeat" viewBox="0 0 24 24"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></symbol>
<symbol id="key" viewBox="0 0 24 24"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></symbol>
<symbol id="cal" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></symbol>
<symbol id="arrow" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></symbol>
<symbol id="goal" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></symbol>
</svg>`;

const CSS = `
:root{--ink:#0b2226;--ink2:#15363c;--amber:#f6b324;--amber-soft:#fff4d9;--text:#1d2b2e;--muted:#62757a;--line:#e4eaeb;--bg:#f4f1ea;--card:#fff;--green:#16a172;--green-soft:#e2f6ee;--red:#e04848;--red-soft:#fdeaea;--yel-soft:#fff3d6}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:Poppins,system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{max-width:820px;margin:0 auto;padding:0 16px 40px}
section{background:var(--card);border-radius:22px;padding:26px 24px;margin-top:16px;break-inside:avoid}
.kicker{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#b07a00;margin:0 0 6px}
.kicker i{font-style:normal;width:22px;height:22px;border-radius:7px;background:var(--amber);color:var(--ink);display:grid;place-items:center;letter-spacing:0}
h2{font-size:24px;line-height:1.2;margin:0 0 18px;color:var(--ink)}
.num{font-variant-numeric:tabular-nums}
svg.ic{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
svg.ic.sm{width:14px;height:14px}
.cover{background:var(--ink);color:#fff;border-radius:0 0 30px 30px;margin:0 -16px;padding:24px 24px 30px}
.brand{display:flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.05em;font-size:14px}
.brand img{width:34px;height:34px;border-radius:9px}
.cover-grid{display:grid;grid-template-columns:1.3fr 1fr;gap:16px;align-items:center;margin-top:18px}
.cover h1{font-size:34px;line-height:1.12;margin:0}
.cover h1 span{color:var(--amber);display:block}
.cover .for{margin-top:10px;color:#a9bfc2;font-size:14px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}
.chip{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.08);border-radius:999px;padding:6px 12px;font-size:12px;color:#d6e2e3}
.chip b{color:#fff}
.hero svg{width:100%;height:auto;display:block}
.score{display:grid;grid-template-columns:200px 1fr;gap:18px;align-items:center}
.score.noscore{grid-template-columns:1fr}
.gauge{position:relative;text-align:center}
.gauge svg{width:200px;height:auto}
.gauge .val{position:absolute;left:0;right:0;top:46px;font-size:40px;font-weight:800;color:var(--ink);line-height:1}
.gauge .val small{display:block;font-size:12px;font-weight:600;color:var(--muted)}
.gauge .lbl{font-size:13px;font-weight:700;margin-top:2px}
.probs{display:grid;gap:10px}
.prob{display:flex;align-items:center;gap:12px;background:var(--red-soft);border-radius:16px;padding:12px 14px}
.prob .ico{width:42px;height:42px;border-radius:12px;background:#fff;color:var(--red);display:grid;place-items:center;flex:none}
.prob b{display:block;color:var(--ink);font-size:15px}
.prob span{font-size:13px;color:var(--red);font-weight:600}
.prob.yl{background:var(--yel-soft)} .prob.yl .ico,.prob.yl span{color:#b07a00}
.flow{display:grid;grid-template-columns:1fr 34px 1fr 34px 1fr;align-items:center;gap:6px;text-align:center}
.flow .col{display:grid;gap:8px}
.src{display:flex;align-items:center;gap:8px;justify-content:center;background:#f2f6f6;border-radius:14px;padding:10px;font-weight:600;font-size:13px;color:var(--ink)}
.arrow{color:var(--amber)} .arrow svg{width:30px;height:30px}
.hub{background:var(--ink);color:#fff;border-radius:18px;padding:16px 10px;font-weight:700;font-size:14px}
.hub svg{color:var(--amber);width:30px;height:30px;margin-bottom:4px}
.goal{background:var(--green-soft);color:var(--green);border-radius:18px;padding:16px 10px;font-weight:800;font-size:15px}
.goal svg{width:30px;height:30px;margin-bottom:4px}
.packs{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px;margin-top:20px}
.pack{border:1px solid var(--line);border-radius:18px;padding:16px}
.pack.best{border:2px solid var(--amber);background:var(--amber-soft)}
.pack .top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.pack .top .ico{width:40px;height:40px;border-radius:12px;background:var(--ink);color:var(--amber);display:grid;place-items:center;flex:none}
.pack h3{margin:0;font-size:16px;color:var(--ink);line-height:1.2}
.pack .pr{font-size:13px;font-weight:700;color:var(--muted)}
.ticks{display:grid;gap:6px;margin:0;padding:0;list-style:none;font-size:14px}
.ticks li{display:flex;gap:8px;align-items:center}
.ticks svg{width:18px;height:18px;color:var(--green)}
.badge{display:inline-block;font-size:10px;font-weight:800;letter-spacing:.06em;background:var(--ink);color:var(--amber);border-radius:999px;padding:3px 9px;margin-bottom:8px}
.be{display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;background:var(--ink);color:#fff;border-radius:20px;padding:18px 20px}
.be .big{font-size:64px;font-weight:800;color:var(--amber);line-height:1}
.be b{font-size:18px;display:block}
.people{display:flex;flex-wrap:wrap;gap:4px;margin-top:8px}
.people svg{width:22px;height:22px;fill:currentColor}
.p-cost{color:var(--amber)} .p-profit{color:#5ee0b0} .p-rest{color:#3a5a60}
.legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#a9bfc2;margin-top:6px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.roi-grid{display:grid;grid-template-columns:1.25fr 1fr;gap:16px;margin-top:16px}
.panel{border:1px solid var(--line);border-radius:18px;padding:16px}
.panel h4{margin:0 0 10px;font-size:13px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.chart svg{width:100%;height:auto;display:block}
.srcbar{display:flex;height:34px;border-radius:10px;overflow:hidden;font-size:12px;font-weight:700;color:#fff}
.srcbar div{display:flex;align-items:center;justify-content:center;min-width:18px}
.srcleg{display:grid;gap:8px;margin-top:12px;font-size:13px}
.srcleg div{display:flex;align-items:center;gap:8px}
.srcleg i{width:12px;height:12px;border-radius:4px;flex:none}
.srcleg b{margin-left:auto;color:var(--ink)}
.funnel{margin-top:14px;display:grid;gap:6px;text-align:center;font-size:13px;font-weight:700}
.funnel div{margin:0 auto;border-radius:10px;padding:8px 0;color:#fff}
.inputs{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.inp{display:flex;align-items:center;gap:8px;background:#f2f6f6;border-radius:12px;padding:8px 12px;font-size:12px;color:var(--muted)}
.inp b{color:var(--ink);font-size:14px}
details{margin-top:12px;font-size:13px;color:var(--muted)}
summary{cursor:pointer;font-weight:700;color:var(--ink)}
.fine{font-size:11.5px;color:var(--muted);margin:10px 0 0}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;position:relative}
.steps.n3{grid-template-columns:repeat(3,1fr)} .steps.n2{grid-template-columns:repeat(2,1fr)} .steps.n1{grid-template-columns:1fr}
.steps:before{content:"";position:absolute;top:27px;left:12%;right:12%;height:3px;background:repeating-linear-gradient(90deg,var(--amber) 0 10px,transparent 10px 18px)}
.steps.n1:before{display:none}
.st{text-align:center;position:relative}
.st .ico{width:56px;height:56px;border-radius:50%;background:var(--ink);color:var(--amber);display:grid;place-items:center;margin:0 auto 8px;border:4px solid #fff;box-shadow:0 0 0 2px var(--amber)}
.st .when{font-size:11px;font-weight:800;color:#b07a00;text-transform:uppercase;letter-spacing:.06em}
.st b{display:block;font-size:14px;color:var(--ink);line-height:1.25;margin-top:2px}
.prices{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.pt{border-radius:18px;padding:16px;background:#f2f6f6;text-align:center}
.pt .l{font-size:12px;color:var(--muted);font-weight:600}
.pt .a{font-size:24px;font-weight:800;color:var(--ink);margin:4px 0 0}
.pt .s{font-size:12px;color:var(--muted)}
.pt.start{background:var(--ink)} .pt.start .l,.pt.start .s{color:#a9bfc2} .pt.start .a{color:var(--amber)}
.tchips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.tchip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:12px;font-weight:600;color:var(--ink)}
.tchip svg{width:16px;height:16px;color:var(--green)}
.cta{background:var(--ink);color:#fff;text-align:center;padding:28px 22px}
.whys{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:22px}
.why{background:rgba(255,255,255,.06);border-radius:16px;padding:14px 8px}
.why .ico{width:44px;height:44px;border-radius:12px;background:var(--amber);color:var(--ink);display:grid;place-items:center;margin:0 auto 8px}
.why b{font-size:14px}
.cta h2{color:#fff;margin-bottom:6px}
.btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:14px 20px;border-radius:14px;font-weight:700;text-decoration:none;font-size:15px}
.btn.y{background:var(--amber);color:var(--ink)} .btn.o{border:1px solid rgba(255,255,255,.35);color:#fff}
.foot{font-size:12px;color:#8fa6a9;margin-top:18px}
.sample{position:fixed;top:10px;right:10px;background:#e04848;color:#fff;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;z-index:9}
.pdf{position:fixed;right:14px;bottom:14px;z-index:9;border:0;border-radius:999px;background:var(--amber);color:var(--ink);font:700 13px Poppins,system-ui,sans-serif;padding:10px 16px;box-shadow:0 6px 18px rgba(0,0,0,.18);cursor:pointer}
/* v3 */
.note{display:flex;gap:16px;align-items:center;border-left:5px solid var(--amber)}
.note .face{width:72px;height:72px;border-radius:50%;object-fit:cover;flex:none;border:3px solid var(--amber)}
.note .face.init{display:grid;place-items:center;background:var(--ink);color:var(--amber);font-weight:800;font-size:24px}
.note .say{margin:0;font-size:16px;font-weight:600;color:var(--ink);line-height:1.5}
.note .sig{margin:8px 0 0;font-size:13px;color:var(--muted)}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:stretch}
.prob small,.after small{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.7}
.after{display:flex;flex-direction:column;justify-content:center;gap:2px;background:var(--green-soft);border-radius:16px;padding:12px 14px;color:var(--green);position:relative}
.after small{color:var(--green)}
.after svg{position:absolute;right:12px;top:12px;width:18px;height:18px}
.after b{color:var(--ink);font-size:14px;padding-right:22px}
.wait{display:flex;gap:12px;align-items:center;margin-top:12px;background:var(--red-soft);border-radius:16px;padding:12px 16px;color:var(--red)}
.wait b{display:block;color:var(--ink)}
.wait span{font-size:13px;font-weight:600}
.protect{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.protect div{display:flex;gap:10px;align-items:center;background:var(--green-soft);border-radius:14px;padding:12px 14px}
.protect svg{color:var(--green);width:20px;height:20px}
.protect b{font-size:14px;color:var(--ink)}
.proof .rate{display:flex;gap:14px;align-items:center}
.proof .big{font-size:48px;font-weight:800;color:var(--ink);line-height:1}
.proof .st{color:var(--amber);font-size:22px;letter-spacing:2px;display:block}
.proof blockquote{margin:16px 0 0;padding:14px 16px;background:#f2f6f6;border-radius:14px;font-size:15px;color:var(--ink)}
.proof cite{display:block;margin-top:8px;font-style:normal;font-size:12px;color:var(--muted)}
.plinks{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.plinks a{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:8px 14px;font-size:13px;font-weight:700;color:var(--ink);text-decoration:none}
.go{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px}
.go div{background:#f2f6f6;border-radius:16px;padding:14px;text-align:center}
.go i{font-style:normal;display:grid;place-items:center;width:34px;height:34px;margin:0 auto 8px;border-radius:50%;background:var(--amber);color:var(--ink);font-weight:800}
.go b{font-size:14px;color:var(--ink)}
.cta .left{color:var(--amber);font-weight:700;margin:0}
.sticky{display:none}
@media (max-width:600px){
  .pair{grid-template-columns:1fr}
  .go{grid-template-columns:1fr}
  .note{flex-direction:column;text-align:center}
  .sticky{display:flex;position:fixed;left:10px;right:10px;bottom:10px;z-index:20;align-items:center;justify-content:space-between;gap:10px;background:var(--ink);color:#fff;border-radius:16px;padding:10px 10px 10px 16px;box-shadow:0 10px 30px rgba(0,0,0,.3)}
  .sticky b{display:block;color:var(--amber);font-size:17px}
  .sticky span{font-size:11px;color:#a9bfc2}
  .sticky a{display:inline-flex;align-items:center;gap:6px;background:var(--amber);color:var(--ink);font-weight:800;text-decoration:none;border-radius:12px;padding:12px 16px}
  .pdf{display:none}
  .sticky>div{margin-right:auto}
  .spdf{border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;font:700 12px Poppins,system-ui,sans-serif;border-radius:10px;padding:11px 10px}
  .page{padding-bottom:90px}
}
@media print{.sticky{display:none}}
@media (max-width:600px){
  section{padding:22px 16px}
  .cover-grid{grid-template-columns:1fr}
  .hero{max-width:240px;margin:0 auto}
  .cover h1{font-size:28px}
  .score{grid-template-columns:1fr;justify-items:center}
  .probs{width:100%}
  .flow{grid-template-columns:1fr;gap:4px}
  .flow .col{grid-template-columns:repeat(auto-fit,minmax(0,1fr))}
  .src{flex-direction:column;gap:4px;font-size:12px}
  .arrow svg{transform:rotate(90deg)}
  .roi-grid{grid-template-columns:1fr}
  .be .big{font-size:52px}
  .steps,.steps.n3,.steps.n4{grid-template-columns:1fr 1fr;row-gap:18px}
  .steps:before{display:none}
  .why b{font-size:12px}
}
@media print{
  body{background:#fff}
  .pdf,.sample{display:none}
  .page{max-width:none;padding:0}
  .cover{margin:0;border-radius:0 0 24px 24px}
  section{box-shadow:none;border:1px solid var(--line)}
  details>p{display:block}
}
`;
