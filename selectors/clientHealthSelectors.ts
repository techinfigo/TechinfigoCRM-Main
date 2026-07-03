
import { Client, Invoice, Project, Campaign, Proposal, Audit } from '../types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const STALE_ACTIVITY_DAYS = 14;

export type ClientHealthStatus = 'Healthy' | 'At Risk';

export interface ClientRoi {
    current: number;
    goal: number;
}

export interface ClientNextAction {
    title: string;
    dueDate: string; // ISO string
}

export interface ClientActivityEvent {
    id: string;
    action: string;
    timestamp: string; // ISO string
    icon: 'audit' | 'payment' | 'campaign' | 'note';
}

const isInvoiceUnpaid = (invoice: Invoice): boolean =>
    invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && invoice.status !== 'Draft';

const isInvoiceOverdue = (invoice: Invoice, now: Date): boolean =>
    isInvoiceUnpaid(invoice) && new Date(invoice.dueDate) < now;

const getLastActivityTimestamp = (client: Client, invoices: Invoice[], projects: Project[]): number => {
    const timestamps: number[] = [new Date(client.dateAdded).getTime()];

    invoices.filter(i => i.clientId === client.id).forEach(invoice => {
        timestamps.push(new Date(invoice.issueDate).getTime());
        if (invoice.sentDate) timestamps.push(new Date(invoice.sentDate).getTime());
        (invoice.activityLog || []).forEach(entry => timestamps.push(new Date(entry.timestamp).getTime()));
    });

    projects.filter(p => p.clientId === client.id).forEach(project => {
        if (project.updatedAt) timestamps.push(new Date(project.updatedAt).getTime());
        if (project.createdAt) timestamps.push(new Date(project.createdAt).getTime());
        (project.tasks || []).forEach(task => {
            if (task.updatedAt) timestamps.push(new Date(task.updatedAt).getTime());
        });
    });

    return Math.max(...timestamps.filter(t => !Number.isNaN(t)));
};

export function computeClientHealth(client: Client, invoices: Invoice[], projects: Project[]): ClientHealthStatus {
    const now = new Date();

    const hasOverdueInvoice = invoices.some(i => i.clientId === client.id && isInvoiceOverdue(i, now));
    const hasOffTrackProject = projects.some(p => p.clientId === client.id && p.health === 'Off Track');

    const lastActivity = getLastActivityTimestamp(client, invoices, projects);
    const daysSinceActivity = (now.getTime() - lastActivity) / MS_PER_DAY;
    const isStale = daysSinceActivity >= STALE_ACTIVITY_DAYS;

    return (hasOverdueInvoice || hasOffTrackProject || isStale) ? 'At Risk' : 'Healthy';
}

export function computeClientRoi(client: Client, campaigns: Campaign[]): ClientRoi {
    const current = campaigns
        .filter(c => c.clientId === client.id)
        .reduce((sum, c) => sum + (c.kpis?.revenueGenerated || 0), 0);

    return { current, goal: client.roi?.goal ?? 0 };
}

export function computeClientNextAction(client: Client, invoices: Invoice[], projects: Project[]): ClientNextAction | null {
    const candidates: ClientNextAction[] = [];

    invoices
        .filter(i => i.clientId === client.id && isInvoiceUnpaid(i))
        .forEach(i => candidates.push({ title: `Invoice ${i.invoiceNumber} payment due`, dueDate: i.dueDate }));

    projects
        .filter(p => p.clientId === client.id)
        .forEach(p => {
            (p.tasks || [])
                .filter(t => !t.completed && t.dueDate)
                .forEach(t => candidates.push({ title: `${t.title} (${p.name})`, dueDate: t.dueDate as string }));
        });

    if (candidates.length === 0) return null;

    return candidates.reduce((soonest, next) =>
        new Date(next.dueDate).getTime() < new Date(soonest.dueDate).getTime() ? next : soonest
    );
}

export function computeClientRecentActivity(client: Client, invoices: Invoice[], proposals: Proposal[], audits: Audit[]): ClientActivityEvent[] {
    const events: ClientActivityEvent[] = [];

    invoices
        .filter(i => i.clientId === client.id && i.status === 'Paid')
        .forEach(i => events.push({
            id: `inv-${i.id}`,
            action: `Invoice ${i.invoiceNumber} paid`,
            timestamp: i.sentDate || i.issueDate,
            icon: 'payment',
        }));

    proposals
        .filter(p => p.clientId === client.id && (p.status === 'SentToClient' || p.status === 'Signed'))
        .forEach(p => events.push({
            id: `prop-${p.id}`,
            action: `Proposal ${p.proposalNumber} ${p.status === 'Signed' ? 'signed' : 'sent to client'}`,
            timestamp: p.lastUpdatedDate || p.generatedDate,
            icon: 'note',
        }));

    audits
        .filter(a => a.entityType === 'Client' && a.entityId === client.id && a.status === 'Completed')
        .forEach(a => events.push({
            id: `audit-${a.id}`,
            action: `Audit "${a.title}" completed`,
            timestamp: a.dateCreated,
            icon: 'audit',
        }));

    return events
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
}
