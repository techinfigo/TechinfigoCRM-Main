
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Invoice, Client, InvoiceStatus, AppSettings, FeatureKey, PermissionAction, calculateInvoiceGrandTotal } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { InvoiceTable } from '@/components/finance/InvoiceTable';
import { Input } from '../common/Input';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';
import { isDateInRange } from '@/utils';
import { Checkbox } from '../common/Checkbox';
import { Search, SlidersHorizontal, ChevronDown, RefreshCw } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { ConfirmationModal } from '../modals/ConfirmationModal';


interface InvoicesViewProps {
  invoices: Invoice[];
  clients: Client[]; 
  onAddInvoice: () => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  onUpdateStatus: (invoiceId: string, status: InvoiceStatus) => void;
  onProcessRecurring: () => void;
  appSettings: AppSettings;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onOpenInvoiceBillModal: (invoice: Invoice) => void;
  onOpenInvoiceDetailPanel: (invoice: Invoice) => void;
  baseZIndex?: number;
}

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
)

export const InvoicesView: React.FC<InvoicesViewProps> = (props) => {
  const { invoices, clients, onAddInvoice, onEditInvoice, onDeleteInvoice, onUpdateStatus, onProcessRecurring, appSettings, hasPermission, onOpenInvoiceBillModal, onOpenInvoiceDetailPanel, baseZIndex = 50 } = props;
  const canCreateInvoices = hasPermission('invoices', 'canCreate');
  const canEditInvoices = hasPermission('invoices', 'canEdit');
  const canDeleteInvoices = hasPermission('invoices', 'canDelete');
  const canManageRecurring = hasPermission('invoices', 'canManageRecurring');
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('invoiceNumber-desc');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Set<InvoiceStatus>>(new Set());
  const [clientFilters, setClientFilters] = useState<Set<string>>(new Set());
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [filterPanelStyle, setFilterPanelStyle] = useState<React.CSSProperties>({});

  const sortOptions: { [key: string]: string } = {
    'issueDate-desc': 'Latest Issue Date',
    'dueDate-asc': 'Due Date Soonest',
    'amount-desc': 'Amount (High-Low)',
    'amount-asc': 'Amount (Low-High)',
    'invoiceNumber-desc': 'Invoice Number',
  };

  const allStatuses: InvoiceStatus[] = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFilterOpen && filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node) && filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);
  
  useEffect(() => {
    if (isFilterOpen) {
        const calculatePosition = () => {
            if (filterButtonRef.current && filterPanelRef.current) {
                const buttonRect = filterButtonRef.current.getBoundingClientRect();
                const panelRect = filterPanelRef.current.getBoundingClientRect();
                const PADDING = 8;
                
                let top = buttonRect.bottom + PADDING;
                if (top + panelRect.height > window.innerHeight && buttonRect.top > panelRect.height + PADDING) {
                    top = buttonRect.top - panelRect.height - PADDING;
                }
                
                let left = buttonRect.right - panelRect.width;
                if (left < PADDING) { left = PADDING; }
                
                setFilterPanelStyle({
                    position: 'fixed',
                    top: `${top}px`,
                    left: `${left}px`,
                    zIndex: baseZIndex,
                });
            }
        };

        const timer = setTimeout(calculatePosition, 0);
        window.addEventListener('scroll', calculatePosition, true);
        window.addEventListener('resize', calculatePosition);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('scroll', calculatePosition, true);
            window.removeEventListener('resize', calculatePosition);
        };
    }
  }, [isFilterOpen, baseZIndex]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call to refetch data
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const filteredAndSortedInvoices = useMemo(() => {
    const minAmount = parseFloat(amountRange.min) || 0;
    const maxAmount = parseFloat(amountRange.max) || Infinity;

    let filtered = invoices.filter(invoice => {
        const grandTotal = calculateInvoiceGrandTotal(invoice);
        const lowerSearch = searchTerm.toLowerCase();
        
        const searchMatch = !searchTerm || (
            invoice.invoiceNumber.toLowerCase().includes(lowerSearch) ||
            (invoice.clientName || '').toLowerCase().includes(lowerSearch)
        );

        const dateMatch = isDateInRange(invoice.issueDate, dateRange);
        
        const statusMatch = statusFilters.size === 0 || statusFilters.has(invoice.status);
        const clientMatch = clientFilters.size === 0 || clientFilters.has(invoice.clientId);
        const amountMatch = grandTotal >= minAmount && grandTotal <= maxAmount;

        return searchMatch && dateMatch && statusMatch && clientMatch && amountMatch;
    });

    const [key, direction] = sortBy.split('-');
    return filtered.sort((a, b) => {
        let valA: any, valB: any;
        switch(key) {
            case 'invoiceNumber': valA = a.invoiceNumber; valB = b.invoiceNumber; break;
            case 'clientName': valA = (a.clientName || '').toLowerCase(); valB = (b.clientName || '').toLowerCase(); break;
            case 'issueDate': valA = new Date(a.issueDate).getTime(); valB = new Date(b.issueDate).getTime(); break;
            case 'dueDate': valA = new Date(a.dueDate).getTime(); valB = new Date(b.dueDate).getTime(); break;
            case 'amount': valA = calculateInvoiceGrandTotal(a); valB = calculateInvoiceGrandTotal(b); break;
            default: return 0;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [invoices, searchTerm, dateRange, statusFilters, clientFilters, sortBy, amountRange]);
  
  const { paginatedData, ...paginationProps } = usePagination({ data: filteredAndSortedInvoices });
  
  const toggleFilter = (setter: React.Dispatch<React.SetStateAction<Set<any>>>, value: any) => {
    setter(prev => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
    });
  };

  const clearFilters = () => {
    setStatusFilters(new Set());
    setClientFilters(new Set());
    setAmountRange({ min: '', max: '' });
  };
  
  const handleDeleteClick = (id: string) => {
      const inv = invoices.find(i => i.id === id);
      if(inv) setInvoiceToDelete(inv);
  };
  
  const handleConfirmDelete = () => {
      if (invoiceToDelete) {
          onDeleteInvoice(invoiceToDelete.id);
          setInvoiceToDelete(null);
      }
  };

  return (
    <>
    <Card 
        title="All Invoices"
        className="bg-transparent shadow-none border-0 p-0"
        contentClassName="p-0"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" isLoading={isRefreshing} leftIcon={<RefreshCw className="w-4 h-4" />}>
                Refresh
            </Button>
            {canManageRecurring && (
              <Button onClick={onProcessRecurring} size="sm" className="bg-[#fcb632] text-black hover:bg-[#e5a800]">
                  Process Recurring
              </Button>
            )}
            {canCreateInvoices && (
                <Button onClick={onAddInvoice} size="sm" className="bg-[#001d21] text-white hover:bg-[#002e32]" leftIcon={<PlusIcon />} disabled={clients.length === 0}>
                    {clients.length === 0 ? "Add a Client First" : "Create Invoice"}
                </Button>
            )}
          </div>
        }
    >
      <div className="p-3 border-y border-border-base dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20 mb-4">
        <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="flex-grow">
                <Input
                  type="search"
                  placeholder="Search by invoice #, client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                  containerClassName="w-full"
                />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative" ref={sortDropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsSortDropdownOpen(prev => !prev)}
                        className="flex items-center justify-between w-full md:w-auto px-4 py-2 h-10 bg-bg-base dark:bg-slate-800 border border-border-base dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-accent text-sm shadow-sm text-text-base dark:text-text-base"
                    >
                        <span>{sortOptions[sortBy]}</span>
                        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isSortDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-800 z-20 p-1.5 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                            <ul className="p-1">
                                {Object.entries(sortOptions).map(([value, label]) => (
                                    <li key={value}>
                                        <button
                                            onClick={() => { setSortBy(value); setIsSortDropdownOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors font-medium ${ sortBy === value ? 'bg-secondary-accent/10 text-secondary-accent' : 'text-gray-700 dark:text-gray-300 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20 dark:hover:text-secondary-accent' }`}
                                        >
                                            {label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
                <DateRangePicker onApply={setDateRange} initialRange={dateRange || undefined} />
                <div className="relative">
                <Button ref={filterButtonRef} variant="outline" onClick={() => setIsFilterOpen(p => !p)} leftIcon={<SlidersHorizontal className="w-4 h-4"/>}>Filter</Button>
                {isFilterOpen && createPortal(
                    <div ref={filterPanelRef} style={filterPanelStyle} className="w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 z-[9999]">
                        <div className="flex justify-between items-center"><h4 className="font-semibold text-gray-900 dark:text-white">Filters</h4><Button variant="ghost" size="xs" onClick={clearFilters}>Clear All</Button></div>
                        <div><p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase">Status</p><div className="space-y-1">{allStatuses.map(s => <Checkbox key={s} label={s} checked={statusFilters.has(s)} onChange={() => toggleFilter(setStatusFilters, s)}/>)}</div></div>
                        <div><p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase">Client</p><div className="space-y-1 max-h-32 overflow-y-auto">{clients.map(c => <Checkbox key={c.id} label={c.name} checked={clientFilters.has(c.id)} onChange={() => toggleFilter(setClientFilters, c.id)}/>)}</div></div>
                        <div><p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase">Amount Range</p><div className="flex items-center gap-2"><Input type="number" placeholder="Min" value={amountRange.min} onChange={e => setAmountRange(p => ({...p, min: e.target.value}))} /><span className="text-text-muted">-</span><Input type="number" placeholder="Max" value={amountRange.max} onChange={e => setAmountRange(p => ({...p, max: e.target.value}))} /></div></div>
                    </div>, document.body
                )}
                </div>
            </div>
        </div>
      </div>

      {filteredAndSortedInvoices.length === 0 ? (
        <p className="text-text-muted dark:text-text-muted text-center py-8">
            No invoices match your criteria.
        </p>
      ) : (
        <>
        <InvoiceTable
          invoices={paginatedData}
          clients={clients}
          appSettings={appSettings}
          onEditInvoice={onEditInvoice}
          onDeleteInvoice={handleDeleteClick}
          onOpenInvoiceBillModal={onOpenInvoiceBillModal}
          onOpenInvoiceDetailPanel={onOpenInvoiceDetailPanel}
          canEdit={canEditInvoices}
          canDelete={canDeleteInvoices}
        />
        <Pagination {...paginationProps} />
        </>
      )}
    </Card>
    
    {invoiceToDelete && (
        <ConfirmationModal
            isOpen={true}
            onClose={() => setInvoiceToDelete(null)}
            onConfirm={handleConfirmDelete}
            title="Delete Invoice"
            message={
                <span>
                    Are you sure you want to delete invoice <strong>{invoiceToDelete.invoiceNumber}</strong>?
                    <br/><span className="text-xs text-red-500 mt-2 block">This action cannot be undone.</span>
                </span>
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            variant="danger"
            overrideZIndex="z-[1100]"
        />
    )}
    </>
  );
};
