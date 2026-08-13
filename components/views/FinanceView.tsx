
import React, { useState, useRef, useEffect } from 'react';
import { Invoice, Client, Expense, Project, AppSettings, FeatureKey, PermissionAction, InvoiceStatus } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { InvoicesView } from './InvoicesView';
import { ExpensesView } from './ExpensesView';
import { ChevronDown, Check } from 'lucide-react';

interface FinanceViewProps {
  // Props for InvoicesView
  invoices: Invoice[];
  clients: Client[];
  onAddInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onUpdateInvoiceStatus: (invoiceId: string, status: InvoiceStatus) => void;
  onProcessRecurringInvoices: () => void;
  onOpenInvoiceBillModal: (invoice: Invoice) => void;
  onOpenInvoiceDetailPanel: (invoice: Invoice) => void;

  // Props for ExpensesView
  expenses: Expense[];
  projects: Project[]; 
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  
  appSettings: AppSettings;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

type FinanceTab = 'invoices' | 'expenses';

const FileInvoiceDollarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M3.5 3A1.5 1.5 0 002 4.5v11A1.5 1.5 0 003.5 17h13a1.5 1.5 0 001.5-1.5v-8.586a1.5 1.5 0 00-.44-1.06L12.622 2.44A1.5 1.5 0 0011.56 2H3.5zm8.5 0v3.75A1.25 1.25 0 0013.25 7H17v8.5a.5.5 0 01-.5.5h-13a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5H12z" />
        <path d="M9.504 14.646a.75.75 0 101.06-1.06L9.03 12.053a3.25 3.25 0 014.667-4.544.75.75 0 00.938-1.156 4.75 4.75 0 00-6.792 6.62l.69-.693z" />
        <path d="M10 10.25a.75.75 0 00-1.06-1.061l-.97.97a.75.75 0 001.06 1.06l.97-.969z" />
    </svg>
);

const CreditCardIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M2.5 3A1.5 1.5 0 001 4.5v11A1.5 1.5 0 002.5 17h15A1.5 1.5 0 0019 15.5v-11A1.5 1.5 0 0017.5 3h-15zM2 7.5h16v-.75A.75.75 0 0017.25 6H2.75A.75.75 0 002 6.75V7.5zM3.5 9A.5.5 0 014 8.5h1A.5.5 0 015.5 9V10A.5.5 0 015 10.5h-1A.5.5 0 013.5 10V9zM7 8.5a.5.5 0 000 1h6a.5.5 0 000-1H7z" />
    </svg>
);

export const FinanceView: React.FC<FinanceViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('invoices');
  const [viewCurrency, setViewCurrency] = useState<string>('All');
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter data based on selected currency
  const filteredInvoices = viewCurrency === 'All' ? props.invoices : props.invoices.filter(inv => (inv.currency || props.appSettings.defaultCurrency || 'INR') === viewCurrency);
  const filteredExpenses = viewCurrency === 'All' ? props.expenses : props.expenses.filter(exp => (exp.currency || props.appSettings.defaultCurrency || 'INR') === viewCurrency);

  // Invoices and expenses are filtered by the selected currency, so records in
  // another currency vanish with no explanation. Warn instead of showing "0".
  const hiddenByCurrency = viewCurrency === 'All' ? 0 : (
    activeTab === 'invoices'
      ? props.invoices.length - filteredInvoices.length
      : props.expenses.length - filteredExpenses.length);

  const currencyHint = hiddenByCurrency > 0 ? (
    <div className="mb-4 p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-sm text-amber-800 dark:text-amber-200">
      {hiddenByCurrency} record{hiddenByCurrency === 1 ? ' is' : 's are'} hidden because {hiddenByCurrency === 1 ? 'it uses' : 'they use'} a different currency. Change the <strong>Currency</strong> selector above to see {hiddenByCurrency === 1 ? 'it' : 'them'}.
    </div>
  ) : null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'invoices':
        return <>{currencyHint}<InvoicesView
                    invoices={filteredInvoices}
                    clients={props.clients}
                    onAddInvoice={props.onAddInvoice}
                    onEditInvoice={props.onEditInvoice}
                    onDeleteInvoice={props.onDeleteInvoice}
                    onUpdateStatus={props.onUpdateInvoiceStatus}
                    onProcessRecurring={props.onProcessRecurringInvoices}
                    appSettings={props.appSettings}
                    hasPermission={props.hasPermission}
                    onOpenInvoiceBillModal={props.onOpenInvoiceBillModal}
                    onOpenInvoiceDetailPanel={props.onOpenInvoiceDetailPanel}
                    viewCurrency={viewCurrency}
                    onCurrencyChange={setViewCurrency}
                    currencyOptions={currencyOptions}
                /></>;
      case 'expenses':
        return <ExpensesView 
                    expenses={filteredExpenses} 
                    projects={props.projects}
                    onAddExpense={props.onAddExpense}
                    onEditExpense={props.onEditExpense}
                    onDeleteExpense={props.onDeleteExpense}
                    appSettings={props.appSettings}
                    hasPermission={props.hasPermission}
                    viewCurrency={viewCurrency}
                    onCurrencyChange={setViewCurrency}
                    currencyOptions={currencyOptions}
                />;
      default:
        return null;
    }
  };

  const currencyOptions = [
    { value: 'All', label: 'All Currencies' },
    { value: 'INR', label: 'INR (₹)' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (CA$)' },
    { value: 'AUD', label: 'AUD (A$)' },
    { value: 'AED', label: 'AED (AED)' },
    { value: 'SGD', label: 'SGD (S$)' },
    { value: 'JPY', label: 'JPY (¥)' },
    { value: 'CNY', label: 'CNY (CN¥)' }
  ];

  return (
    <div className="space-y-6">
       <Card
        title={
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
            <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-text-heading dark:text-text-heading">Financial Management</h2>
                <p className="text-sm text-text-muted dark:text-text-muted mt-1">Track and manage invoices and expenses.</p>
            </div>
          </div>
        }
        className="bg-bg-base dark:bg-bg-muted shadow-xl rounded-2xl"
        contentClassName="p-0"
        headerClassName="p-5"
      >
        <div className="border-b border-border-base dark:border-border-muted px-5">
          <nav className="-mb-px flex space-x-5" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium flex items-center transition-colors
                ${activeTab === 'invoices'
                  ? 'border-premium-accent text-premium-accent dark:border-premium-accent-dark dark:text-premium-accent-dark'
                  : 'border-transparent text-text-muted hover:text-text-base hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                }`}
            >
             <FileInvoiceDollarIcon /> <span className="ml-2">Invoices ({filteredInvoices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-sm font-medium flex items-center transition-colors
                ${activeTab === 'expenses'
                  ? 'border-premium-accent text-premium-accent dark:border-premium-accent-dark dark:text-premium-accent-dark'
                  : 'border-transparent text-text-muted hover:text-text-base hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                }`}
            >
              <CreditCardIcon/> <span className="ml-2">Expenses ({filteredExpenses.length})</span>
            </button>
          </nav>
        </div>
        <div className="p-5">
          {renderTabContent()}
        </div>
      </Card>
    </div>
  );
};
