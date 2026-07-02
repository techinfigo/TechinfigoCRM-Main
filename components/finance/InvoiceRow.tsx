
import React from 'react';
import { Invoice, Client, AppSettings, calculateInvoiceGrandTotal } from '../../types';
import { Button } from '../common/Button';
import { StatusBadge } from './StatusBadge';
import { RecurringBadge } from './RecurringBadge';

interface InvoiceRowProps {
  invoice: Invoice;
  client?: Client;
  appSettings: AppSettings;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onOpenInvoiceDetailPanel: (invoice: Invoice) => void;
  canEdit: boolean;
  canDelete: boolean;
  isLast: boolean;
}

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25-.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const EyeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;

const formatCurrency = (amount: number, currencyCode: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode }).format(amount);

const safeDateFormat = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString();
    } catch (e) {
        return 'Invalid Date';
    }
};

export const InvoiceRow: React.FC<InvoiceRowProps> = ({ invoice, client, appSettings, onEditInvoice, onDeleteInvoice, onOpenInvoiceDetailPanel, canEdit, canDelete, isLast }) => {
    const tdBaseClass = `px-4 py-3 whitespace-nowrap text-sm border-b border-slate-200 dark:border-slate-700`;
    
    return (
        <tr className="transition-colors duration-150">
            <td className={`${tdBaseClass} text-text-base dark:text-slate-300 font-medium ${isLast ? 'rounded-bl-lg' : ''}`}>{invoice.invoiceNumber}</td>
            <td className={`${tdBaseClass} text-text-muted dark:text-slate-400`}>{client?.name || invoice.clientName}</td>
            <td className={`${tdBaseClass} text-text-muted dark:text-slate-400`}>{safeDateFormat(invoice.issueDate)}</td>
            <td className={`${tdBaseClass} text-text-muted dark:text-slate-400`}>{safeDateFormat(invoice.dueDate)}</td>
            <td className={`${tdBaseClass} text-text-base dark:text-slate-300 font-medium`}>{formatCurrency(calculateInvoiceGrandTotal(invoice), invoice.currency || appSettings.defaultCurrency || 'INR')}</td>
            <td className={tdBaseClass}><StatusBadge status={invoice.status} /></td>
            <td className={tdBaseClass}>{invoice.isRecurring && invoice.recurrenceFrequency ? <RecurringBadge frequency={invoice.recurrenceFrequency} /> : <span className="text-gray-400 dark:text-gray-500">-</span>}</td>
            <td className={`${tdBaseClass} text-right ${isLast ? 'rounded-br-lg' : ''}`}>
                <div className="flex justify-end items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onOpenInvoiceDetailPanel(invoice)} className="p-2" title="View Invoice Details"><EyeIcon /></Button>
                    {canEdit && <Button variant="ghost" size="sm" onClick={() => onEditInvoice(invoice)} className="p-2" title="Edit Invoice"><EditIcon /></Button>}
                    {canDelete && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onDeleteInvoice(invoice.id);
                            }} 
                            className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400" 
                            title="Delete Invoice"
                        >
                            <TrashIcon />
                        </Button>
                    )}
                </div>
            </td>
        </tr>
    );
};
