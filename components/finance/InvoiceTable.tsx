
import React from 'react';
import { Invoice, Client, AppSettings, InvoiceStatus } from '../../types';
import { InvoiceRow } from './InvoiceRow';

interface InvoiceTableProps {
  invoices: Invoice[];
  clients: Client[];
  appSettings: AppSettings;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onOpenInvoiceBillModal: (invoice: Invoice) => void;
  onOpenInvoiceDetailPanel: (invoice: Invoice) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <th scope="col" className={`px-4 py-3.5 text-left text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider ${className || ''}`}>
        {children}
    </th>
);

export const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, clients, appSettings, ...handlers }) => {
  return (
    <div className="overflow-x-auto">
        <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
            <thead className="bg-[#f0f4f8] dark:bg-slate-800">
                <tr>
                    <TableHeader className="rounded-l-lg">Number</TableHeader>
                    <TableHeader>Client</TableHeader>
                    <TableHeader>Issue Date</TableHeader>
                    <TableHeader>Due Date</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Recurring</TableHeader>
                    <TableHeader className="text-right rounded-r-lg">Actions</TableHeader>
                </tr>
            </thead>
            <tbody>
                {invoices.map((invoice, index) => (
                    <InvoiceRow 
                        key={invoice.id} 
                        invoice={invoice}
                        client={clients.find(c => c.id === invoice.clientId)}
                        appSettings={appSettings}
                        isLast={index === invoices.length - 1}
                        {...handlers}
                    />
                ))}
            </tbody>
        </table>
    </div>
  );
};