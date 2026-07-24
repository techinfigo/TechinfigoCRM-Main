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
      return { label: 'Bill of Supply', icon: '📄', className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' };
    case 'Receipt Only':
      return { label: 'Receipt Only', icon: '🧾', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' };
    case 'No Document':
    default:
      return { label: 'No Document', icon: '—', className: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' };
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
