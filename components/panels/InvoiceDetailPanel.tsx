
import React from 'react';
import { Invoice, Client, AppSettings, InvoiceStatus, Payment, calculateInvoiceGrandTotal } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { StatusBadge } from '../finance/StatusBadge';
import { Edit, Send, CheckCircle, Download, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvoiceDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  client?: Client | null;
  appSettings: AppSettings;
  onOpenSendModal: (invoice: Invoice) => void;
  onUpdateStatus: (invoiceId: string, status: InvoiceStatus) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onOpenBillModal: (invoice: Invoice) => void;
  payments: Payment[];
}

const formatCurrency = (amount: number, currencyCode: string) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode }).format(amount);

export const InvoiceDetailPanel: React.FC<InvoiceDetailPanelProps> = ({
  isOpen, onClose, invoice, client, appSettings, onOpenSendModal, onUpdateStatus, onEditInvoice, onOpenBillModal, payments = []
}) => {
  const currency = invoice.currency || appSettings.defaultCurrency || 'INR';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1050] overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Overlay */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
                aria-hidden="true" 
                onClick={onClose}
            />

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-screen max-w-3xl h-full"
              >
                <div className="flex h-full flex-col overflow-y-scroll bg-bg-base dark:bg-slate-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800">
                  <header className="bg-white dark:bg-zinc-900 px-4 py-4 sm:px-6 sticky top-0 z-10 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 id="slide-over-title" className="text-xl font-bold text-zinc-900 dark:text-white">Invoice: {invoice.invoiceNumber}</h2>
                        <p className="text-sm text-zinc-500 font-medium">Client: {client?.name || invoice.clientName}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={invoice.status} />
                        <button type="button" className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 dark:hover:text-zinc-200" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </header>
                  <div className="relative flex-1">
                    <div className="py-6 px-4 sm:px-6 space-y-6">
                      {/* Actions Bar */}
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEditInvoice(invoice)} leftIcon={<Edit className="w-4 h-4"/>}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => onOpenSendModal(invoice)} leftIcon={<Send className="w-4 h-4"/>}>Send Invoice</Button>
                        <Button size="sm" variant="outline" onClick={() => onUpdateStatus(invoice.id, 'Paid')} leftIcon={<CheckCircle className="w-4 h-4"/>}>Mark as Paid</Button>
                        <Button size="sm" variant="primary" onClick={() => onOpenBillModal(invoice)} leftIcon={<Download className="w-4 h-4"/>}>Download PDF</Button>
                      </div>

                      {/* Invoice Details */}
                      <Card className="bg-zinc-50 dark:bg-zinc-800/40 border-none shadow-none">
                        <dl className="grid grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                          <div><dt className="text-zinc-500 font-medium mb-1 uppercase tracking-wider text-[10px]">Issue Date</dt><dd className="font-semibold text-zinc-900 dark:text-white">{new Date(invoice.issueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</dd></div>
                          <div><dt className="text-zinc-500 font-medium mb-1 uppercase tracking-wider text-[10px]">Due Date</dt><dd className="font-semibold text-zinc-900 dark:text-white">{new Date(invoice.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</dd></div>
                          <div><dt className="text-zinc-500 font-medium mb-1 uppercase tracking-wider text-[10px]">Sent Date</dt><dd className="font-semibold text-zinc-900 dark:text-white">{invoice.sentDate ? new Date(invoice.sentDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Not Sent'}</dd></div>
                        </dl>
                      </Card>

                      {/* Items Table */}
                      <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <table className="min-w-full text-sm">
                          <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-[11px] uppercase tracking-wider font-bold text-zinc-500"><tr className="text-left"><th className="p-4">Description</th><th className="p-4 text-center w-24">Qty</th><th className="p-4 text-right w-32">Unit Price</th><th className="p-4 text-right w-32">Total</th></tr></thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-600 dark:text-zinc-300">{invoice.items.map(item => (<tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"><td className="p-4">{item.description}</td><td className="p-4 text-center">{item.quantity}</td><td className="p-4 text-right">{formatCurrency(item.unitPrice, currency)}</td><td className="p-4 text-right font-bold text-zinc-900 dark:text-white">{formatCurrency(item.quantity * item.unitPrice, currency)}</td></tr>))}</tbody>
                        </table>
                      </div>

                      {/* Totals Section */}
                      <div className="flex justify-end pt-4">
                        <div className="w-full max-w-xs space-y-3 p-4 bg-zinc-50 dark:bg-zinc-800/20 rounded-xl">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500 font-medium">Subtotal</span>
                                <span className="font-semibold">{formatCurrency(invoice.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0), currency)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-zinc-200 dark:border-zinc-700 pt-3 text-zinc-900 dark:text-white">
                                <span className="uppercase tracking-tight">Total</span>
                                <span>{formatCurrency(calculateInvoiceGrandTotal(invoice), currency)}</span>
                            </div>
                        </div>
                      </div>

                      {/* Payment History */}
                      <div className="mt-8">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 px-1">Payment History</h3>
                        {(() => {
                          const invoicePayments = (payments || [])
                            .filter(p => p.invoiceId === invoice.id)
                            .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
                          const grandTotal = calculateInvoiceGrandTotal(invoice);
                          const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
                          const balanceDue = Math.max(0, grandTotal - totalPaid);

                          if (invoicePayments.length === 0) {
                            return (
                              <p className="text-sm text-zinc-500 px-1 py-3 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg text-center">
                                No payments recorded yet.
                              </p>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              {invoicePayments.map(p => (
                                <div key={p.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(p.amount, currency)}</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                      {new Date(p.paymentDate).toLocaleDateString([], { dateStyle: 'medium' })} · {p.paymentMethod}
                                    </p>
                                    {p.notes && <p className="text-xs text-zinc-500 mt-1 break-words">{p.notes}</p>}
                                  </div>
                                </div>
                              ))}

                              <div className="pt-3 mt-1 border-t border-zinc-200 dark:border-zinc-700 space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-zinc-500">Total Paid</span>
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid, currency)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold">
                                  <span className="text-zinc-600 dark:text-zinc-300">Balance Due</span>
                                  <span className={balanceDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                                    {formatCurrency(balanceDue, currency)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Activity Log */}
                      <div className="mt-8">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-4 px-1">Recent Activity</h3>
                        <div className="space-y-4">
                            {(invoice.activityLog || []).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log, index) => (
                            <div key={index} className="flex gap-4 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-lg transition-colors border border-zinc-50 dark:border-zinc-800/20">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 w-24 shrink-0 mt-1">{new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short'})}</span>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-200 leading-none">{log.action}</span>
                                    <span className="text-xs text-zinc-500 mt-1">by {log.actorName}</span>
                                </div>
                            </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
