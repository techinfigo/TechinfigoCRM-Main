import type { AgreedService, BillingModel, ClientPlanItem, Milestone, Task } from '../../types';

/**
 * Ready-made project plans for Techinfigo's services. Picking one in the
 * project popup fills the name, dates, billing and creates the task list
 * (due dates counted from the start date).
 */

export type TemplateKey = 'Website' | 'SEO' | 'Social' | 'GBP' | 'Ads' | 'Custom';

type StepDef = { day: number; title: string; priority?: Task['priority'] };

export interface ProjectTemplateDef {
  key: TemplateKey;
  label: string;
  emoji: string;
  /** Saved as the project "type". */
  type: string;
  days: number;
  billing: BillingModel;
  description: string;
  steps: StepDef[];
  milestones: { day: number; title: string }[];
  /** Words in a client's agreed service name that point to this template. */
  match: RegExp;
}

export const PROJECT_TEMPLATES: ProjectTemplateDef[] = [
  {
    key: 'Website',
    label: 'Website (7 days)',
    emoji: '🌐',
    type: 'Website',
    days: 7,
    billing: 'Fixed',
    description: 'Business website: 5 pages, WhatsApp/call buttons, enquiry form to CRM, Google profile basics. Live in 7 days.',
    match: /web|site|landing/i,
    steps: [
      { day: 0, title: 'Collect logo, photos, content and domain details from client', priority: 'High' },
      { day: 1, title: 'Design homepage' },
      { day: 2, title: 'Send homepage to client for approval', priority: 'High' },
      { day: 4, title: 'Build inner pages (About, Services, Gallery, Contact)' },
      { day: 5, title: 'Add WhatsApp + call buttons and enquiry form (to CRM)' },
      { day: 5, title: 'Set up / update Google Business Profile' },
      { day: 6, title: 'Mobile and speed check' },
      { day: 7, title: 'Go live and share the link with client', priority: 'High' },
      { day: 7, title: 'Collect balance payment', priority: 'High' },
    ],
    milestones: [
      { day: 2, title: 'Homepage approved' },
      { day: 7, title: 'Website live' },
    ],
  },
  {
    key: 'SEO',
    label: 'SEO (monthly)',
    emoji: '🔎',
    type: 'SEO',
    days: 30,
    billing: 'Retainer',
    description: 'Monthly local SEO: on-page fixes, Google profile, listings, content and a monthly report.',
    match: /seo|rank|search/i,
    steps: [
      { day: 0, title: 'SEO audit and local keyword list', priority: 'High' },
      { day: 3, title: 'On-page fixes: titles, meta, headings' },
      { day: 7, title: 'Google Business Profile: services, photos, posts' },
      { day: 10, title: 'Add 2 local listings (JustDial, IndiaMART etc.)' },
      { day: 14, title: 'Write 1 blog / service page' },
      { day: 21, title: 'Ask happy customers for Google reviews' },
      { day: 28, title: 'Check rankings' },
      { day: 30, title: 'Send monthly report to client', priority: 'High' },
    ],
    milestones: [{ day: 30, title: 'Monthly report sent' }],
  },
  {
    key: 'Social',
    label: 'Social media (monthly)',
    emoji: '📱',
    type: 'Social Media',
    days: 30,
    billing: 'Retainer',
    description: 'Monthly social media: content plan, shoot, posts and reels, posting and report.',
    match: /social|insta|facebook|content|reel/i,
    steps: [
      { day: 0, title: 'Make monthly content plan and send for approval', priority: 'High' },
      { day: 3, title: 'Photo / video shoot' },
      { day: 5, title: 'Design posts for week 1–2' },
      { day: 7, title: 'Edit reels for week 1–2' },
      { day: 14, title: 'Design posts and reels for week 3–4' },
      { day: 28, title: 'Insights and monthly report to client', priority: 'High' },
    ],
    milestones: [
      { day: 3, title: 'Plan approved + shoot done' },
      { day: 28, title: 'Monthly report sent' },
    ],
  },
  {
    key: 'GBP',
    label: 'Google profile setup',
    emoji: '📍',
    type: 'Google Business Profile',
    days: 7,
    billing: 'Fixed',
    description: 'Google Business Profile setup / clean-up so the business shows on Google Maps.',
    match: /google business|gbp|google profile|maps|gmb/i,
    steps: [
      { day: 0, title: 'Get access / create the profile', priority: 'High' },
      { day: 1, title: 'Categories, services, hours and description' },
      { day: 2, title: 'Upload 20+ photos' },
      { day: 3, title: 'Publish first 4 posts' },
      { day: 5, title: 'Make review link + QR code for client' },
      { day: 7, title: 'Follow up on verification', priority: 'High' },
    ],
    milestones: [{ day: 7, title: 'Profile verified and live' }],
  },
  {
    key: 'Ads',
    label: 'Meta / Google ads (monthly)',
    emoji: '📣',
    type: 'Ads',
    days: 30,
    billing: 'Retainer',
    description: 'Monthly ad management: setup, creatives, launch, weekly optimisation and report.',
    match: /ads|ad campaign|meta|ppc|lead gen/i,
    steps: [
      { day: 0, title: 'Ad account + tracking (pixel / conversions) setup', priority: 'High' },
      { day: 1, title: 'Finalise offer and audience with client' },
      { day: 3, title: 'Make ad creatives (3 images + 1 video)' },
      { day: 4, title: 'Client approval of creatives', priority: 'High' },
      { day: 5, title: 'Launch campaign', priority: 'High' },
      { day: 12, title: 'Week 1 check: cost per lead, pause weak ads' },
      { day: 19, title: 'Week 2 optimisation' },
      { day: 26, title: 'Week 3 optimisation' },
      { day: 30, title: 'Send monthly report to client', priority: 'High' },
    ],
    milestones: [
      { day: 5, title: 'Ads live' },
      { day: 30, title: 'Monthly report sent' },
    ],
  },
  {
    key: 'Custom',
    label: 'Custom (no tasks)',
    emoji: '✏️',
    type: 'Custom',
    days: 0,
    billing: 'Fixed',
    description: '',
    match: /$^/,
    steps: [],
    milestones: [],
  },
];

export const templateByKey = (k: TemplateKey) => PROJECT_TEMPLATES.find((t) => t.key === k)!;

/** Best template for one of the client's agreed services. */
export const templateForService = (s?: AgreedService): TemplateKey => {
  if (!s) return 'Custom';
  // GBP before SEO/ads so "Google Business Profile" isn't read as ads.
  const order: TemplateKey[] = ['GBP', 'Website', 'SEO', 'Social', 'Ads'];
  return order.find((k) => templateByKey(k).match.test(s.name)) || 'Custom';
};

export const billingForService = (s?: AgreedService): BillingModel | null =>
  !s ? null : s.billingType === 'One-Time' ? 'Fixed' : 'Retainer';

export const addDays = (isoDay: string, n: number) => {
  const d = new Date(`${isoDay}T00:00`);
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Task due time: 6 PM India time on that day (a "by end of day" deadline). */
const dueIso = (isoDay: string) => new Date(`${isoDay}T18:00:00+05:30`).toISOString();

export function buildTemplateWork(
  t: ProjectTemplateDef,
  ctx: { projectId: string; projectName: string; startDay: string; assigneeId?: string; assigneeName?: string },
): { tasks: Task[]; milestones: Milestone[] } {
  const now = new Date().toISOString();
  const stamp = Date.now().toString(36);
  const tasks: Task[] = t.steps.map((s, i) => ({
    id: `task-${stamp}-${i}`,
    title: s.title,
    projectId: ctx.projectId,
    projectName: ctx.projectName,
    assignedMemberId: ctx.assigneeId,
    assigneeName: ctx.assigneeName,
    status: 'To Do',
    completed: false,
    priority: s.priority || 'Medium',
    dueDate: dueIso(addDays(ctx.startDay, s.day)),
    createdAt: now,
    updatedAt: now,
  }));
  const milestones: Milestone[] = t.milestones.map((m, i) => ({
    id: `ms-${stamp}-${i}`,
    title: m.title,
    dueDate: dueIso(addDays(ctx.startDay, m.day)),
    completed: false,
  }));
  return { tasks, milestones };
}

/** Social media month: posts Mon/Wed/Fri and a reel every Saturday for 4 weeks, as "Idea" in the client Calendar. */
export function buildSocialPlans(clientId: string, startDay: string): ClientPlanItem[] {
  const now = new Date().toISOString();
  const stamp = Date.now().toString(36);
  const out: ClientPlanItem[] = [];
  let post = 0;
  let reel = 0;
  for (let i = 0; i < 28; i++) {
    const day = addDays(startDay, i);
    const dow = new Date(`${day}T00:00`).getDay();
    const base = { clientId, date: day, platforms: ['Instagram', 'Facebook'], status: 'Idea' as const, createdAt: now, updatedAt: now };
    if (dow === 1 || dow === 3 || dow === 5) out.push({ ...base, id: `plan-${stamp}-p${++post}`, kind: 'Post', title: `Post ${post} – topic to decide` });
    if (dow === 6) out.push({ ...base, id: `plan-${stamp}-r${++reel}`, kind: 'Reel', title: `Reel ${reel} – idea to decide` });
  }
  return out;
}
