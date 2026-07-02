import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Expense, Project, ExpenseCategory, expenseCategories, AppSettings, FeatureKey, PermissionAction } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Checkbox } from '../common/Checkbox';
import { Modal } from '../common/Modal';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';
import { isDateInRange } from '@/utils';
import { Search, SlidersHorizontal, ChevronDown, RefreshCw, Plus, FolderPlus, Trash2, Edit2 } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';

interface ExpensesViewProps {
  expenses: Expense[];
  projects: Project[];
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  appSettings: AppSettings;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  baseZIndex?: number;
}

export const ExpensesView: React.FC<ExpensesViewProps> = (props) => {
  const { expenses, projects, onAddExpense, onEditExpense, onDeleteExpense, appSettings, hasPermission, baseZIndex = 50 } = props;

  const canCreateExpenses = hasPermission('expenses', 'canCreate');
  const canEditExpenses = hasPermission('expenses', 'canEdit');
  const canDeleteExpenses = hasPermission('expenses', 'canDelete');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState<Set<string>>(new Set());
  const [projectFilters, setProjectFilters] = useState<Set<string>>(new Set());
  const [vendorFilters, setVendorFilters] = useState<Set<string>>(new Set());
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // New Category States for "Add dynamic category"
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('crm_custom_expense_categories');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [filterPanelStyle, setFilterPanelStyle] = useState<React.CSSProperties>({});

  const allCategories = useMemo(() => {
    return Array.from(new Set([...expenseCategories, ...customCategories]));
  }, [customCategories]);

  const uniqueVendors = useMemo(() => {
    const list = expenses.map(e => e.vendor).filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    return Array.from(new Set(list));
  }, [expenses]);

  const sortOptions: { [key: string]: string } = {
    'date-desc': 'Latest Date',
    'date-asc': 'Oldest Date',
    'amount-desc': 'Amount (High-Low)',
    'amount-asc': 'Amount (Low-High)',
    'category-asc': 'Category Name',
  };

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
          if (top + panelRect.height > window.innerHeight) {
            if (buttonRect.top > panelRect.height + PADDING) {
              top = buttonRect.top - panelRect.height - PADDING;
            } else {
              top = Math.max(PADDING, window.innerHeight - panelRect.height - PADDING);
            }
          }
          
          let left = buttonRect.right - panelRect.width;
          if (left < PADDING) { left = PADDING; }
          
          setFilterPanelStyle({
            position: 'fixed',
            top: `${top}px`,
            left: `${left}px`,
            zIndex: baseZIndex + 50,
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
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'N/A';
    return projects.find(p => p.id === projectId)?.name || 'Unknown Project';
  };

  const filteredAndSortedExpenses = useMemo(() => {
    const minAmount = parseFloat(amountRange.min) || 0;
    const maxAmount = parseFloat(amountRange.max) || Infinity;

    let filtered = expenses.filter(expense => {
      const lowerSearch = searchTerm.toLowerCase();
      const pName = getProjectName(expense.projectId);
      
      const searchMatch = !searchTerm || (
        expense.description.toLowerCase().includes(lowerSearch) ||
        (expense.vendor || '').toLowerCase().includes(lowerSearch) ||
        pName.toLowerCase().includes(lowerSearch) ||
        expense.category.toLowerCase().includes(lowerSearch)
      );

      const dateMatch = isDateInRange(expense.date, dateRange);
      
      const categoryMatch = categoryFilters.size === 0 || categoryFilters.has(expense.category);
      const projectMatch = projectFilters.size === 0 || projectFilters.has(expense.projectId || 'None');
      const vendorMatch = vendorFilters.size === 0 || vendorFilters.has(expense.vendor || 'None');
      const amountMatch = expense.amount >= minAmount && expense.amount <= maxAmount;

      return searchMatch && dateMatch && categoryMatch && projectMatch && vendorMatch && amountMatch;
    });

    const [key, direction] = sortBy.split('-');
    return filtered.sort((a, b) => {
      let valA: any, valB: any;
      switch(key) {
        case 'date': valA = new Date(a.date).getTime(); valB = new Date(b.date).getTime(); break;
        case 'amount': valA = a.amount; valB = b.amount; break;
        case 'category': valA = a.category.toLowerCase(); valB = b.category.toLowerCase(); break;
        default: return 0;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [expenses, searchTerm, dateRange, categoryFilters, projectFilters, vendorFilters, sortBy, amountRange]);

  const totalFilteredAmount = useMemo(() => {
    return filteredAndSortedExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredAndSortedExpenses]);

  const topCategoriesList = useMemo(() => {
    const record: Record<string, number> = {};
    allCategories.forEach(cat => record[cat] = 0);
    
    filteredAndSortedExpenses.forEach(exp => {
      record[exp.category] = (record[exp.category] || 0) + exp.amount;
    });

    return Object.entries(record)
      .filter(([, total]) => total > 0)
      .sort(([, aTotal], [, bTotal]) => bTotal - aTotal);
  }, [filteredAndSortedExpenses, allCategories]);

  const { paginatedData, ...paginationProps } = usePagination({ data: filteredAndSortedExpenses });

  const toggleFilter = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, value: string) => {
    setter(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const clearFilters = () => {
    setCategoryFilters(new Set());
    setProjectFilters(new Set());
    setVendorFilters(new Set());
    setAmountRange({ min: '', max: '' });
  };

  const handleAddCategorySubmit = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError('Category name is required');
      return;
    }

    const isDuplicate = allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setCategoryError('Category already exists.');
      return;
    }

    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    localStorage.setItem('crm_custom_expense_categories', JSON.stringify(updated));
    setIsAddCategoryOpen(false);
    setNewCategoryName('');
    setCategoryError('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: appSettings.defaultCurrency || 'INR'
    }).format(amount);
  };

  const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <th scope="col" className={`px-4 py-3.5 text-left text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider ${className || ''}`}>
      {children}
    </th>
  );

  return (
    <>
      <Card 
        title="All Expenses"
        className="bg-transparent shadow-none border-0 p-0"
        contentClassName="p-0"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm" isLoading={isRefreshing} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
            <Button 
              onClick={() => setIsAddCategoryOpen(true)} 
              size="sm" 
              className="bg-[#fcb632] text-black hover:bg-[#e5a800]" 
              leftIcon={<FolderPlus className="w-4 h-4" />}
            >
              Add Category
            </Button>
            {canCreateExpenses && (
              <Button onClick={onAddExpense} size="sm" className="bg-[#001d21] text-white hover:bg-[#002e32]" leftIcon={<Plus className="w-4 h-4" />}>
                Add Expense
              </Button>
            )}
          </div>
        }
      >
        <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'} pt-4`}>
          
          {/* Summary Cards aligned beautifully */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 flex flex-col justify-center items-center shadow-sm">
              <span className="text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider mb-1">Total Expenses (Filtered)</span>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalFilteredAmount)}</p>
              <p className="text-[11px] text-text-muted dark:text-slate-500 mt-1">{filteredAndSortedExpenses.length} expense(s)</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4 flex flex-col shadow-sm">
              <span className="text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider mb-2 text-center md:text-left">Top Categories (Filtered)</span>
              {topCategoriesList.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 text-xs h-10 overflow-y-auto custom-scrollbar">
                  {topCategoriesList.slice(0, 4).map(([category, total]) => (
                    <div key={category} className="flex justify-between items-center px-2 py-1 bg-white dark:bg-slate-800/80 rounded-md border border-slate-100 dark:border-slate-700/40 shadow-xs">
                      <span className="truncate max-w-[100px] text-text-muted dark:text-slate-400 font-medium" title={category}>{category}</span>
                      <span className="font-semibold text-text-base dark:text-slate-300 ml-1">{formatCurrency(total)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-10">
                  <p className="text-text-muted dark:text-slate-500 text-xs">No entries match criteria.</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 border-y border-border-base dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20 mb-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
              <div className="flex-grow w-full">
                <input
                  type="search"
                  placeholder="Search description, vendor, project, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 px-3 pl-10 pr-4 bg-white dark:bg-slate-800 border border-border-base dark:border-slate-600 rounded-lg text-sm text-text-base dark:text-text-base focus:ring-2 focus:ring-secondary-accent/50 focus:border-secondary-accent outline-none placeholder-text-muted font-medium"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: '12px 11px',
                    backgroundSize: '18px'
                  }}
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end">
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(prev => !prev)}
                    className="flex items-center justify-between w-full md:w-auto px-4 py-2 h-10 bg-white dark:bg-slate-800 border border-border-base dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-accent text-sm shadow-sm text-text-base dark:text-text-base font-medium"
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
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors font-medium ${ sortBy === value ? 'bg-secondary-accent/10 text-secondary-accent font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-secondary-accent/10 hover:text-secondary-accent dark:hover:bg-secondary-accent/20' }`}
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
                    <div ref={filterPanelRef} style={{ ...filterPanelStyle, maxHeight: 'min(480px, 80vh)', overflowY: 'auto' }} className="w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 z-[9999] custom-scrollbar">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-gray-900 dark:text-white">Filters</h4>
                        <Button variant="ghost" size="xs" onClick={clearFilters}>Clear All</Button>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase">Category</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                          {allCategories.map(cat => (
                            <Checkbox key={cat} label={cat} checked={categoryFilters.has(cat)} onChange={() => toggleFilter(setCategoryFilters, cat)}/>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase">Project</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                          <Checkbox key="None" label="None" checked={projectFilters.has('None')} onChange={() => toggleFilter(setProjectFilters, 'None')}/>
                          {projects.map(p => (
                            <Checkbox key={p.id} label={p.name} checked={projectFilters.has(p.id)} onChange={() => toggleFilter(setProjectFilters, p.id)}/>
                          ))}
                        </div>
                      </div>
                      {uniqueVendors.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase">Vendor</p>
                          <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                            {uniqueVendors.map(v => (
                              <Checkbox key={v} label={v} checked={vendorFilters.has(v)} onChange={() => toggleFilter(setVendorFilters, v)}/>
                            ))}
                          </div>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase">Amount Range</p>
                        <div className="flex items-center gap-2">
                          <Input type="number" placeholder="Min" value={amountRange.min} onChange={e => setAmountRange(p => ({...p, min: e.target.value}))} />
                          <span className="text-text-muted">-</span>
                          <Input type="number" placeholder="Max" value={amountRange.max} onChange={e => setAmountRange(p => ({...p, max: e.target.value}))} />
                        </div>
                      </div>
                    </div>, document.body
                  )}
                </div>
              </div>
            </div>
          </div>

          {filteredAndSortedExpenses.length === 0 ? (
            <p className="text-text-muted dark:text-text-muted text-center py-8">
              No expenses match your criteria.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate" style={{ borderSpacing: 0 }}>
                  <thead className="bg-[#f0f4f8] dark:bg-slate-800">
                    <tr>
                      <TableHeader className="rounded-l-lg">Date</TableHeader>
                      <TableHeader>Description</TableHeader>
                      <TableHeader>Category</TableHeader>
                      <TableHeader>Amount</TableHeader>
                      <TableHeader>Project</TableHeader>
                      <TableHeader>Vendor</TableHeader>
                      {(canEditExpenses || canDeleteExpenses) && <TableHeader className="text-right rounded-r-lg">Actions</TableHeader>}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((expense, index) => {
                      const isLast = index === paginatedData.length - 1;
                      const tdBaseClass = `px-4 py-3 whitespace-nowrap text-sm border-b border-slate-200 dark:border-slate-700`;
                      return (
                        <tr key={expense.id} className="transition-colors duration-150 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className={`${tdBaseClass} text-text-muted dark:text-slate-400 ${isLast ? 'rounded-bl-lg' : ''}`}>
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td className={`${tdBaseClass} text-text-base dark:text-slate-300 font-medium whitespace-normal max-w-xs break-words`} title={expense.description}>
                            {expense.description}
                          </td>
                          <td className={`${tdBaseClass} text-text-muted dark:text-slate-400`}>
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold">
                              {expense.category}
                            </span>
                          </td>
                          <td className={`${tdBaseClass} text-text-base dark:text-slate-300 font-semibold`}>
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className={`${tdBaseClass} text-text-muted dark:text-slate-400`}>
                            {getProjectName(expense.projectId)}
                          </td>
                          <td className={`${tdBaseClass} text-text-muted dark:text-slate-400`}>
                            {expense.vendor || '-'}
                          </td>
                          {(canEditExpenses || canDeleteExpenses) && (
                            <td className={`${tdBaseClass} text-right ${isLast ? 'rounded-br-lg' : ''}`}>
                              <div className="flex justify-end items-center gap-1">
                                {canEditExpenses && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => onEditExpense(expense)} 
                                    className="p-2" 
                                    title="Edit Expense"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                )}
                                {canDeleteExpenses && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setExpenseToDelete(expense);
                                    }} 
                                    className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400" 
                                    title="Delete Expense"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination {...paginationProps} />
            </>
          )}

        </div>
      </Card>

      {/* Add Custom Category Modal */}
      {isAddCategoryOpen && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsAddCategoryOpen(false);
            setNewCategoryName('');
            setCategoryError('');
          }}
          title="Add Custom Category/Revenue"
          size="md"
          overrideZIndex="z-[1090]"
          footer={
            <>
              <Button variant="secondary" onClick={() => {
                setIsAddCategoryOpen(false);
                setNewCategoryName('');
                setCategoryError('');
              }}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleAddCategorySubmit}
                disabled={!newCategoryName.trim()}
              >
                Save Category
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Category Name *"
              placeholder="e.g. Sales Commission, Web Ads, Offline Revenue"
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                if (categoryError) setCategoryError('');
              }}
              error={categoryError}
              required
            />
            <p className="text-xs text-text-muted mt-1">
              New custom categories are saved locally. They are automatically added to your available expense/revenue options and filtration options.
            </p>
          </div>
        </Modal>
      )}

      {expenseToDelete && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setExpenseToDelete(null)}
          onConfirm={() => {
            onDeleteExpense(expenseToDelete.id);
            setExpenseToDelete(null);
          }}
          title="Delete Expense"
          message={
            <span>
              Are you sure you want to delete expense: <strong>{expenseToDelete.description}</strong>?
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
