
import React, { useMemo, useState } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Invoice, Client, View, calculateInvoiceGrandTotal, AppSettings, Expense, FeatureKey, PermissionAction, expenseCategories, ExpenseCategory } from '../../../types'; 

interface AdminFinanceViewProps {
  invoices: Invoice[];
  clients: Client[]; 
  expenses: Expense[];
  appSettings: AppSettings;
  onNavigateToMainView: (view: View) => void;
  onProcessRecurringInvoices: () => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

const RefreshCwIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const ChartPieIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10 3.5A1.5 1.5 0 0111.5 2h.096a1.5 1.5 0 011.006.41l5.993 4.494A1.5 1.5 0 0119 8.398V10.5a1.5 1.5 0 01-1.5 1.5H16v.096a1.5 1.5 0 01-.41 1.006l-4.494 5.993A1.5 1.5 0 018.398 19H6.5A1.5 1.5 0 015 17.5V16H3.5A1.5 1.5 0 012 14.5v-.096a1.5 1.5 0 01.41-1.006l4.494-5.993A1.5 1.5 0 018.602 5H10V3.5zM10 6.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM13.5 10a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM6.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" /></svg>;


export const AdminFinanceView: React.FC<AdminFinanceViewProps> = ({ invoices, clients, expenses, appSettings, onNavigateToMainView, onProcessRecurringInvoices, hasPermission }) => {
  const [viewCurrency, setViewCurrency] = useState<string>(appSettings.defaultCurrency || 'INR');

  // Filter logic
  const filteredInvoices = invoices.filter(inv => (inv.currency || appSettings.defaultCurrency || 'INR') === viewCurrency);
  const filteredExpenses = expenses.filter(exp => (exp.currency || appSettings.defaultCurrency || 'INR') === viewCurrency);

  const totalInvoiced = filteredInvoices.reduce((sum, inv) => sum + calculateInvoiceGrandTotal(inv), 0);
  const totalPaid = filteredInvoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + calculateInvoiceGrandTotal(inv), 0);
  const totalOutstanding = filteredInvoices.filter(inv => inv.status === 'Sent' || inv.status === 'Overdue').reduce((sum, inv) => sum + calculateInvoiceGrandTotal(inv), 0);
  const totalDraft = filteredInvoices.filter(inv => inv.status === 'Draft').reduce((sum, inv) => sum + calculateInvoiceGrandTotal(inv), 0);
  const totalExpensesAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = totalPaid - totalExpensesAmount;


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: viewCurrency }).format(amount);
  };

  const expensesByCategoryForAdmin = useMemo(() => {
    const summary: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
    expenseCategories.forEach(cat => summary[cat] = 0);
    filteredExpenses.forEach(expense => {
      summary[expense.category] = (summary[expense.category] || 0) + expense.amount;
    });
    return Object.entries(summary)
                 .filter(([, total]) => total > 0)
                 .sort(([, aTotal], [, bTotal]) => bTotal - aTotal)
                 .slice(0, 5); // Show top 5 for admin dashboard brevity
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
    <Card 
        title={
            <div className="flex justify-between items-center w-full">
                <span>Finance Overview</span>
                 <div className="flex items-center gap-2 text-sm font-normal">
                    <span className="text-text-muted">View in:</span>
                    <select 
                        value={viewCurrency} 
                        onChange={(e) => setViewCurrency(e.target.value)}
                        className="p-1 text-xs bg-white dark:bg-slate-700 border border-border-base dark:border-border-muted rounded shadow-sm focus:ring-1 focus:ring-premium-accent cursor-pointer text-slate-900 dark:text-slate-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                    </select>
                </div>
            </div>
        } 
        className="bg-white dark:bg-slate-800"
    >
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        This section provides a summary of your financial data for the selected currency ({viewCurrency}).
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
        <Card className="bg-teal-50 dark:bg-teal-700/30 hover:bg-teal-100 dark:hover:bg-teal-700/40 transition-colors" contentClassName="text-center p-5">
          <h3 className="text-base font-semibold text-teal-700 dark:text-teal-300">Net Profit</h3>
          <p className="text-3xl font-bold text-teal-600 dark:text-teal-200 mt-1">{formatCurrency(netProfit)}</p>
        </Card>
        <Card className="bg-green-50 dark:bg-green-700/30 hover:bg-green-100 dark:hover:bg-green-700/40 transition-colors" contentClassName="text-center p-5">
          <h3 className="text-base font-semibold text-green-700 dark:text-green-300">Total Paid Revenue</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-200 mt-1">{formatCurrency(totalPaid)}</p>
        </Card>
         <Card className="bg-red-50 dark:bg-red-700/30 hover:bg-red-100 dark:hover:bg-red-700/40 transition-colors" contentClassName="text-center p-5">
          <h3 className="text-base font-semibold text-red-700 dark:text-red-300">Total Expenses</h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-200 mt-1">{formatCurrency(totalExpensesAmount)}</p>
           <p className="text-xs text-red-500 dark:text-red-400">{filteredExpenses.length} expenses</p>
        </Card>
        <Card className="bg-emerald-50 dark:bg-emerald-700/30 hover:bg-emerald-100 dark:hover:bg-emerald-700/40 transition-colors" contentClassName="text-center p-5">
          <h3 className="text-base font-semibold text-emerald-700 dark:text-emerald-300">Total Invoiced (All)</h3>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-200 mt-1">{formatCurrency(totalInvoiced)}</p>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-700/30 hover:bg-amber-100 dark:hover:bg-amber-700/40 transition-colors" contentClassName="text-center p-5">
          <h3 className="text-base font-semibold text-amber-700 dark:text-amber-300">Total Outstanding</h3>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-200 mt-1">{formatCurrency(totalOutstanding)}</p>
          <p className="text-xs text-amber-500 dark:text-amber-400">{filteredInvoices.filter(inv => inv.status === 'Sent' || inv.status === 'Overdue').length} invoices</p>
        </Card>
         <Card className="bg-yellow-50 dark:bg-yellow-700/30 hover:bg-yellow-100 dark:hover:bg-yellow-700/40 transition-colors" contentClassName="text-center p-5">
          <h3 className="text-base font-semibold text-yellow-700 dark:text-yellow-300">Total in Draft</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-200 mt-1">{formatCurrency(totalDraft)}</p>
          <p className="text-xs text-yellow-500 dark:text-yellow-400">{filteredInvoices.filter(inv => inv.status === 'Draft').length} invoices</p>
        </Card>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <Button 
          variant="primary" 
          onClick={() => onNavigateToMainView('INVOICES')}
          className="flex-grow sm:flex-grow-0"
          disabled={!hasPermission('invoices', 'canView')}
        >
          Manage All Invoices
        </Button>
         <Button 
          variant="secondary" 
          onClick={() => onNavigateToMainView('EXPENSES')}
          className="flex-grow sm:flex-grow-0"
          disabled={!hasPermission('expenses', 'canView')}
        >
          Manage All Expenses
        </Button>
        {hasPermission('invoices', 'canManageRecurring') && (
            <Button
                variant="outline"
                onClick={onProcessRecurringInvoices}
                leftIcon={<RefreshCwIcon />}
                className="flex-grow sm:flex-grow-0"
            >
                Process Recurring Invoices
            </Button>
        )}
      </div>
    </Card>

    <Card title="Expense Breakdown by Category (Top 5)" icon={<ChartPieIcon />} className="bg-white dark:bg-slate-800">
        {expensesByCategoryForAdmin.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">No expenses to display for {viewCurrency}.</p>
        ) : (
            <ul className="space-y-2">
                {expensesByCategoryForAdmin.map(([category, total]) => (
                    <li key={category} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{category}</span>
                        <span className="font-semibold text-slate-600 dark:text-slate-200">{formatCurrency(total)}</span>
                    </li>
                ))}
            </ul>
        )}
    </Card>
    
    <Card title="Conceptual Finance Enhancements" className="bg-white dark:bg-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Revenue Dashboards" className="bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600" contentClassName="p-3">
               <p className="text-xs text-slate-500 dark:text-slate-400">Detailed monthly/quarterly revenue reports, profit margins, client profitability.</p>
          </Card>
          <Card title="Automated Tax/GST" className="bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600" contentClassName="p-3">
               <p className="text-xs text-slate-500 dark:text-slate-400">Automatic calculation of regional taxes (e.g., GST/VAT) on invoices if applicable.</p>
          </Card>
           <Card title="Accounting Integration" className="bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600" contentClassName="p-3">
               <p className="text-xs text-slate-500 dark:text-slate-400">Sync invoice and payment data with popular accounting software (e.g., QuickBooks, Xero).</p>
          </Card>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-6 text-center">These enhancements would provide a more robust financial management system.</p>
    </Card>
  </div>
  );
};
