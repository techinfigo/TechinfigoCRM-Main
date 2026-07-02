
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Client, FeatureKey, PermissionAction, MarketingAuditRequest, ProjectsDrawerConfig } from '../../types'; 
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';
import { isDateInRange } from '@/utils';
import { Checkbox } from '../common/Checkbox';
import { Search, SlidersHorizontal, ChevronDown, RefreshCw, FolderKanban } from 'lucide-react';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { safeFormatDate } from '@/utils';

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
)
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
)
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25-.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
    </svg>
)
const UserCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-10 h-10 text-slate-400 dark:text-slate-500">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12.5a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" />
    </svg>
)


interface ClientsViewProps {
  clients: Client[];
  marketingAudits: MarketingAuditRequest[];
  onViewAuditDetail: (audit: MarketingAuditRequest) => void; 
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onSelectClientForDetail: (client: Client) => void;
  onOpenProjectsDrawer: (config?: ProjectsDrawerConfig) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ clients, marketingAudits, onViewAuditDetail, onAddClient, onEditClient, onDeleteClient, hasPermission, onSelectClientForDetail, onOpenProjectsDrawer }) => {
  const canCreateClients = hasPermission('clients', 'canCreate');
  const canEditClients = hasPermission('clients', 'canEdit');
  const canDeleteClients = hasPermission('clients', 'canDelete');
  const canViewAuditDetails = hasPermission('auditDetail', 'canView');
  const canViewProjects = hasPermission('projects', 'canView');

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded-desc');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [industryFilters, setIndustryFilters] = useState<Set<string>>(new Set());
  const [tagFilters, setTagFilters] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [filterPanelStyle, setFilterPanelStyle] = useState<React.CSSProperties>({});
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Set portal root after mount to ensure document.body is available.
    setPortalRoot(document.body);
  }, []);

  const sortOptions: { [key: string]: string } = {
    'dateAdded-desc': 'Latest First',
    'name-asc': 'Name A-Z',
    'companyName-asc': 'Company A-Z',
  };

  const allIndustries = useMemo(() => Array.from(new Set(clients.map(c => c.industry).filter(Boolean))), [clients]);
  const allTags = useMemo(() => Array.from(new Set(clients.flatMap(c => c.tags || []))), [clients]);

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
                    zIndex: 50,
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
  }, [isFilterOpen]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
        setIsRefreshing(false);
    }, 1500);
  };

  const filteredAndSortedClients = useMemo(() => {
    let filtered = clients.filter(client => {
        const lowerSearch = searchTerm.toLowerCase();
        const searchMatch = !searchTerm || (
            client.name.toLowerCase().includes(lowerSearch) ||
            (client.companyName || '').toLowerCase().includes(lowerSearch) ||
            client.email.toLowerCase().includes(lowerSearch)
        );

        const dateMatch = isDateInRange(client.dateAdded, dateRange);
        
        const industryMatch = industryFilters.size === 0 || (client.industry && industryFilters.has(client.industry));
        const tagMatch = tagFilters.size === 0 || (client.tags && client.tags.some(tag => tagFilters.has(tag)));

        return searchMatch && dateMatch && industryMatch && tagMatch;
    });

    const [key, direction] = sortBy.split('-');
    return filtered.sort((a, b) => {
        let valA: any, valB: any;
        switch(key) {
            case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
            case 'companyName': valA = (a.companyName || '').toLowerCase(); valB = (b.companyName || '').toLowerCase(); break;
            case 'dateAdded': valA = new Date(a.dateAdded).getTime(); valB = new Date(b.dateAdded).getTime(); break;
            default: return 0;
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });
  }, [clients, searchTerm, dateRange, industryFilters, tagFilters, sortBy]);

  const { paginatedData, ...paginationProps } = usePagination({ data: filteredAndSortedClients, initialEntriesPerPage: 10 });


  const toggleFilter = (setter: React.Dispatch<React.SetStateAction<Set<any>>>, value: any) => {
    setter(prev => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
    });
  };

  const clearFilters = () => {
    setIndustryFilters(new Set());
    setTagFilters(new Set());
  };

  const renderFilterPanel = () => (
    <div ref={filterPanelRef} style={filterPanelStyle} className="w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-100 dark:border-zinc-800 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5 z-[9999]">
        <div className="flex justify-between items-center"><h4 className="font-semibold text-gray-900 dark:text-white">Filters</h4><Button variant="ghost" size="xs" onClick={clearFilters}>Clear All</Button></div>
        <div><p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase">Industry</p><div className="space-y-1 max-h-32 overflow-y-auto">{allIndustries.map(s => <Checkbox key={s} label={s} checked={industryFilters.has(s)} onChange={() => toggleFilter(setIndustryFilters, s)}/>)}</div></div>
        <div><p className="text-xs font-semibold mb-1 text-gray-500 dark:text-gray-400 uppercase">Tags</p><div className="space-y-1 max-h-32 overflow-y-auto">{allTags.map(s => <Checkbox key={s} label={s} checked={tagFilters.has(s)} onChange={() => toggleFilter(setTagFilters, s)}/>)}</div></div>
    </div>
  );

  return (
    <Card 
      title="Manage Clients"
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" size="md" isLoading={isRefreshing} leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
          {canCreateClients && (
            <Button onClick={onAddClient} variant="primary" size="md" leftIcon={<PlusIcon />}>
              Add New Client
            </Button>
          )}
        </div>
      }
    >
      <div className={`transition-opacity duration-300 ${isRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="p-3 border-y border-border-base dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20 mb-4">
            <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="w-full md:flex-1 md:max-w-md">
                    <Input
                    type="search"
                    placeholder="Search by name, company, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                    containerClassName="w-full"
                    />
                </div>
                <div className="flex items-center gap-2 justify-end w-full md:w-auto flex-shrink-0">
                    <div className="relative" ref={sortDropdownRef}>
                        <button
                            type="button"
                            onClick={() => setIsSortDropdownOpen(prev => !prev)}
                            className="flex items-center justify-between w-full md:w-auto px-4 py-2 h-10 bg-bg-muted dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-accent text-sm shadow-sm text-text-base dark:text-text-base"
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
                    {isFilterOpen && (portalRoot ? createPortal(renderFilterPanel(), portalRoot) : renderFilterPanel())}
                    </div>
                </div>
            </div>
        </div>
        {filteredAndSortedClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserCircleIcon />
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg">No clients match your criteria.</p>
            {searchTerm === '' && industryFilters.size === 0 && tagFilters.size === 0 && canCreateClients && (
                <>
                <p className="text-slate-400 dark:text-slate-500 text-sm">Get started by adding your first client.</p>
                <Button onClick={onAddClient} variant="outline" size="sm" className="mt-6" leftIcon={<PlusIcon />}>
                    Add Client
                </Button>
                </>
            )}
            </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border-base dark:border-border-muted">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Industry</th>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Audit</th>
                    {(canEditClients || canDeleteClients) && <th scope="col" className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>}
                </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {paginatedData.map((client, index) => {
                    const clientAudit = marketingAudits.find(audit => audit.clientId === client.id && (audit.status === 'Completed' || audit.status === 'ReviewPending'));
                    return (
                    <tr 
                        key={client.id} 
                        className={`transition-colors cursor-pointer hover:bg-highlight-accent dark:hover:bg-slate-700/60 ${index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}
                        onClick={() => onSelectClientForDetail(client)}
                    >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-premium-accent dark:text-premium-accent-dark">{client.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{client.companyName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{client.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                        {client.website ? <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-sky-600 dark:text-sky-400 hover:underline">{client.website}</a> : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{client.industry || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {clientAudit && canViewAuditDetails ? (
                            <Button variant="outline" size="xs" onClick={(e) => { e.stopPropagation(); onViewAuditDetail(clientAudit); }}>
                                View Report
                            </Button>
                        ) : (
                            <span></span> 
                        )}
                    </td>
                    {(canEditClients || canDeleteClients) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1.5">
                        {canViewProjects && (
                             <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onOpenProjectsDrawer({ clientId: client.id });}} aria-label={`View projects for ${client.name}`} title="View Projects" className="text-slate-600 dark:text-slate-400 p-1.5">
                                <FolderKanban className="w-5 h-5"/>
                            </Button>
                        )}
                        {canEditClients && (
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEditClient(client);}} aria-label={`Edit ${client.name}`} title="Edit Client" className="text-slate-600 dark:text-slate-400 p-1.5">
                            <EditIcon />
                            </Button>
                        )}
                        {canDeleteClients && (
                            <Button variant="ghost" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Are you sure you want to delete client ${client.name}? This will also delete their invoices.`)) {
                                    onDeleteClient(client.id);
                                }
                            }} 
                            className="text-red-500 dark:text-red-400 p-1.5"
                            aria-label={`Delete ${client.name}`}
                            title="Delete Client">
                            <TrashIcon />
                            </Button>
                        )}
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
  );
};
