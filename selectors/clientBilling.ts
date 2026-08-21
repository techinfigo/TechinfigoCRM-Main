import { Client, ClientDocumentType, PaymentMode } from '../types';

/**
 * Billing-preference accessors. These fields were added after the app had live
 * data, so existing clients have them undefined. Read through these helpers —
 * they apply the safe legacy default (a full GST invoice is required), which is
 * how the app behaved before billing preferences existed.
 */

export const getDocumentType = (client: Client): ClientDocumentType =>
  client.documentType ?? 'GST Invoice';

export const isInvoiceRequired = (client: Client): boolean =>
  client.invoiceRequired ?? true;

/** GSTIN is only meaningful on a full tax invoice. */
export const showsGstin = (client: Client): boolean =>
  getDocumentType(client) === 'GST Invoice';

/** Clients that should never be picked up by bulk/automated invoice generation. */
export const isExcludedFromBulkInvoicing = (client: Client): boolean =>
  !isInvoiceRequired(client) || getDocumentType(client) === 'No Document';

/** Only these document types represent formally invoiced revenue. */
export const countsAsInvoicedRevenue = (client: Client): boolean => {
  const dt = getDocumentType(client);
  return dt === 'GST Invoice' || dt === 'Bill of Supply';
};

export const documentTypeStyle = (dt: ClientDocumentType): { label: string; icon: string; className: string } => {
  switch (dt) {
    case 'GST Invoice':
      return { label: 'GST Invoice', icon: '🧾', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
    case 'Bill of Supply':
      return { label: 'GSTIN, no GST bill', icon: '📄', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' };
    case 'No Document':
    default:
      return { label: 'No GST', icon: '—', className: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
  }
};

export const paymentModeStyle = (pm?: PaymentMode): { label: string; icon: string; className: string } => {
  switch (pm) {
    case 'Cash':
      return { label: 'Cash', icon: '💵', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
    case 'UPI':
      return { label: 'UPI', icon: '📲', className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' };
    case 'Bank Transfer':
      return { label: 'Bank Transfer', icon: '🏦', className: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300' };
    case 'Cheque':
      return { label: 'Cheque', icon: '🖊️', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
    default:
      return { label: 'Not set', icon: '—', className: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
  }
};

import { AgreedService, Invoice } from '../types';

/** Total agreed contract value. Recurring services count one cycle. */
export const getTotalAgreedValue = (services?: AgreedService[]): number =>
  (services || []).reduce((sum, s) => sum + (Number(s.cost) || 0), 0);

/** Monthly recurring value: recurring services normalised to a month. */
export const getMonthlyRecurringValue = (services?: AgreedService[]): number =>
  (services || []).reduce((sum, s) => {
    const c = Number(s.cost) || 0;
    switch (s.billingType) {
      case 'Monthly': return sum + c;
      case 'Quarterly': return sum + c / 3;
      case 'Annual': return sum + c / 12;
      default: return sum;
    }
  }, 0);

/** A client's running financial position from agreed scope, advance and invoices. */
export interface ClientFinancialSummary {
  totalAgreed: number;
  monthlyRecurring: number;
  advancePaid: number;
  invoicedTotal: number;
  oneTimeAgreed: number;
}

export const getClientFinancialSummary = (
  client: { agreedServices?: AgreedService[]; advanceAmount?: number },
  invoices: Invoice[],
  clientId: string,
): ClientFinancialSummary => {
  const clientInvoices = invoices.filter(i => i.clientId === clientId);
  const invoicedTotal = clientInvoices.reduce((sum, inv) => {
    const sub = (inv.items || []).reduce((s, it) => s + it.quantity * it.unitPrice, 0);
    const tax = sub * ((inv.taxRate ?? 0) / 100);
    return sum + sub + tax;
  }, 0);
  const oneTimeAgreed = (client.agreedServices || [])
    .filter(s => s.billingType === 'One-Time')
    .reduce((sum, s) => sum + (Number(s.cost) || 0), 0);

  return {
    totalAgreed: getTotalAgreedValue(client.agreedServices),
    monthlyRecurring: getMonthlyRecurringValue(client.agreedServices),
    advancePaid: Number(client.advanceAmount) || 0,
    invoicedTotal,
    oneTimeAgreed,
  };
};
