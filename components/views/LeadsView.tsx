
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lead, LeadStatus, FeatureKey, PermissionAction, LeadViewMode, AuditRecord, TeamMember, KANBAN_STAGE_ORDER } from '../../types'; 
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';
import { Checkbox } from '../common/Checkbox';
import { ChevronDown, SlidersHorizontal, Columns, Search, RefreshCw, Undo2, GripVertical, Mail, Phone, Calendar, Download, Upload, Instagram, Globe, Webhook, StickyNote, Eye, Trash2, FileText } from 'lucide-react';
import { ConfirmationModal } from '../modals/ConfirmationModal';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { safeFormatDate, safeFormatRelativeTime, isDateInRange } from '@/utils';

interface LeadsViewProps {
  leads: Lead[];
  auditRecords: AuditRecord[]; 
  teamMembers: TeamMember[];
  onAddLead: () => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onCreateProposal: (leadId: string) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onImportLeads: (leadsToImport: any[]) => number; 
  onSelectLeadForDetail: (lead: Lead) => void; 
  onOpenAuditFormModal: (lead: Lead) => void; 
  onOpenAuditReportModal: (lead: Lead, auditRecord: AuditRecord) => void; 
  onOpenFollowUpModal: (lead: Lead) => void; 
  onOpenEmailComposeModal: (lead: Lead) => void; 
  onNavigateToAuditCreate: (data: { type: 'Lead' | 'Client', id: string, name: string }) => void;
  onNavigateToIntegrations?: () => void;
}

const getStatusClassNames = (status: LeadStatus): string => {
    let baseClasses = 'px-2.5 py-0.5 text-xs font-semibold rounded-full border ';
    switch (status) {
        case 'New Lead': return baseClasses + 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
        case 'Contacted': return baseClasses + 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
        case 'Audit in Progress': return baseClasses + 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
        case 'Proposal Sent': return baseClasses + 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
        case 'Negotiation': return baseClasses + 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
        case 'Closed Won': return baseClasses + 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
        case 'Closed Lost': return baseClasses + 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
        default: return baseClasses + 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
};

const getStatusColumnBgColor = (status: LeadStatus): string => {
    switch (status) {
        case 'New Lead': return 'bg-blue-50 dark:bg-blue-900/10';
        case 'Contacted': return 'bg-yellow-50 dark:bg-yellow-900/10';
        case 'Audit in Progress': return 'bg-purple-50 dark:bg-purple-900/10';
        case 'Proposal Sent': return 'bg-amber-50 dark:bg-amber-900/10';
        case 'Negotiation': return 'bg-orange-50 dark:bg-orange-900/10';
        case 'Closed Won': return 'bg-green-50 dark:bg-green-900/10';
        case 'Closed Lost': return 'bg-red-50 dark:bg-red-900/10';
        default: return 'bg-slate-100 dark:bg-slate-800';
    }
};

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

const isSameDay = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const today = new Date();
    const date = new Date(dateStr);
    return today.getFullYear() === date.getFullYear() &&
           today.getMonth() === date.getMonth() &&
           today.getDate() === date.getDate();
};

const isRecentActivity = (dateStr?: string): boolean => {
    if (!dateStr) return false;
    const timeDiff = Math.abs(Date.now() - new Date(dateStr).getTime());
    return timeDiff <= (24 * 60 * 60 * 1000); // 24 hours
};

const LeadCardComponent: React.FC<{
    lead: Lead; 
    onRevert: (lead: Lead) => void;
    onSelectLeadForDetail: (lead: Lead) => void; 
}> = React.memo(({ lead, onRevert, onSelectLeadForDetail }) => {
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('leadId', lead.id);
        e.currentTarget.style.opacity = '0.5';
    };
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
    };
    
    return (
      <div 
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onSelectLeadForDetail(lead)}
        className="group relative p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-secondary-accent/50 transition-all duration-200 mb-2.5"
      >
        <div className="flex justify-between items-start mb-1.5">
            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate hover:text-secondary-accent transition-colors">{lead.name}</h4>
             <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-2 font-medium">
             {lead.companyName || 'No Company'}
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
             {lead.revenueBand && (
                 <span className="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] font-medium rounded border border-green-100 dark:border-green-800">
                     {lead.revenueBand}
                 </span>
             )}
             {lead.adStatus === 'Active' && (
                 <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] font-medium rounded border border-blue-100 dark:border-blue-800">
                     Ads Active
                 </span>
             )}
             {lead.nextFollowUpDateTime && (
                 isSameDay(lead.nextFollowUpDateTime) ? (
                     <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded border border-rose-200 dark:border-rose-900/50 animate-pulse flex items-center gap-1">
                         <span className="h-1 w-1 rounded-full bg-rose-500 animate-ping"></span>
                         Follow-up Today
                     </span>
                 ) : (new Date(lead.nextFollowUpDateTime).getTime() < Date.now()) ? (
                     <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded border border-amber-200 dark:border-amber-900/50 flex items-center gap-1">
                         Overdue Follow-up
                     </span>
                 ) : null
             )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-2">
             <div className="flex items-center gap-2 text-slate-400">
                {lead.instagramHandle && <Instagram className="w-3 h-3" />}
                {lead.website && <Globe className="w-3 h-3" />}
             </div>
             <p className="text-[10px] text-slate-400">{safeFormatRelativeTime(lead.dateAdded)}</p>
        </div>
      </div>
    );
});

export const LeadsView: React.FC<LeadsViewProps> = ({ leads, auditRecords, teamMembers, onAddLead, onEditLead, onDeleteLead, onUpdateStatus, onCreateProposal, hasPermission, onImportLeads, onSelectLeadForDetail, onOpenAuditFormModal, onOpenAuditReportModal, onOpenFollowUpModal, onOpenEmailComposeModal, onNavigateToAuditCreate, onNavigateToIntegrations }) => {
  const [viewMode, setViewMode] = useState<LeadViewMode>('List');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilters, setStatusFilters] = useState<Set<LeadStatus>>(new Set());
  const [ownerFilters, setOwnerFilters] = useState<Set<string>>(new Set());
  const [sourceFilters, setSourceFilters] = useState<Set<string>>(new Set());
  
  const [draggedOverStatus, setDraggedOverStatus] = useState<LeadStatus | null>(null);

  // Refs
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const kanbanColumnStatuses = KANBAN_STAGE_ORDER;
  const allSources = useMemo(() => Array.from(new Set(leads.map(l => l.source).filter(Boolean))), [leads]);
  const allStatuses = KANBAN_STAGE_ORDER; // Use defined order

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

 useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isFilterOpen && filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node) && filterButtonRef.current && !filterButtonRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: LeadStatus) => {
    e.preventDefault(); 
    setDraggedOverStatus(status);
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: LeadStatus) => {
    e.preventDefault();
    setDraggedOverStatus(null);
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) onUpdateStatus(leadId, targetStatus);
  };

  const handleRevert = (lead: Lead) => {
    const currentIndex = KANBAN_STAGE_ORDER.indexOf(lead.status);
    if (currentIndex > 0) {
      const previousStatus = KANBAN_STAGE_ORDER[currentIndex - 1];
      onUpdateStatus(lead.id, previousStatus);
    }
  };

  // CSV Import/Export Helpers
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentField = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            row.push(currentField.trim());
            currentField = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                if (char === '\r') i++;
                row.push(currentField.trim());
                if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
                    lines.push(row);
                }
                row = [];
                currentField = '';
            }
        } else {
            currentField += char;
        }
    }
    if (currentField || row.length > 0) {
        row.push(currentField.trim());
        lines.push(row);
    }
    return lines;
  };

  const downloadTemplate = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Company Name',
      'Source',
      'Status',
      'Website',
      'Notes',
      'Instagram Handle',
      'Revenue Band',
      'Ad Status',
      'Tech Stack',
      'Outreach Angle',
      'Offer Sent'
    ];
    
    const sampleRow = [
      'Acme Sales Pro',
      'hello@acme.com',
      '+1555123456',
      'Acme Enterprise',
      'Direct Outreach',
      'New Lead',
      'https://acme.com',
      'Met at conference. High interest in audits.',
      '@acme_enterprise',
      '$50k+',
      'Active',
      'Shopify, Klaviyo, Magento',
      'High priority cold email response',
      'Audit Package v1'
    ];
    
    const escapeVal = (val: string) => {
        if (val.includes('"') || val.includes(',') || val.includes('\n') || val.includes('\r')) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
    };
    
    const csvContent = [
        headers.join(','),
        sampleRow.map(escapeVal).join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportClick = () => {
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Company Name',
      'Source',
      'Status',
      'Website',
      'Notes',
      'Instagram Handle',
      'Revenue Band',
      'Ad Status',
      'Tech Stack',
      'Outreach Angle',
      'Offer Sent'
    ];
    
    const escapeVal = (val: any) => {
        if (val === null || val === undefined) return '';
        let str = '';
        if (Array.isArray(val)) {
            str = val.join(', ');
        } else {
            str = String(val);
        }
        if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };
    
    const targetLeads = filteredLeads.length > 0 ? filteredLeads : leads;
    const rows = targetLeads.map(lead => [
        lead.name,
        lead.email,
        lead.phone || '',
        lead.companyName || '',
        lead.source || '',
        lead.status,
        lead.website || '',
        lead.notes || '',
        lead.instagramHandle || '',
        lead.revenueBand || '',
        lead.adStatus || '',
        lead.techStack || [],
        lead.outreachAngle || '',
        lead.offerSent || ''
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(escapeVal).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          const text = e.target?.result as string;
          if (!text) return;
          try {
              const rows = parseCSV(text);
              if (rows.length < 2) {
                  alert("No rows found. Please upload a valid CSV file with data rows.");
                  return;
              }
              
              // Standardize column headers
              const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[\s_-]/g, ''));
              
              const nameIdx = headers.indexOf('name');
              const emailIdx = headers.indexOf('email');
              
              if (nameIdx === -1 || emailIdx === -1) {
                  alert("Headers must contain at least 'Name' and 'Email' columns.");
                  return;
              }
              
              const phoneIdx = headers.indexOf('phone');
              const companyIdx = headers.findIndex(h => h.includes('company') || h.includes('brand'));
              const sourceIdx = headers.indexOf('source');
              const statusIdx = headers.indexOf('status');
              const websiteIdx = headers.indexOf('website');
              const notesIdx = headers.indexOf('notes');
              const instagramIdx = headers.findIndex(h => h.includes('instagram') || h.includes('handle'));
              const revenueIdx = headers.findIndex(h => h.includes('revenue') || h.includes('band'));
              const adIdx = headers.findIndex(h => h.includes('ad') || h.includes('ads'));
              const techIdx = headers.findIndex(h => h.includes('tech') || h.includes('stack') || h.includes('tools'));
              const outreachIdx = headers.findIndex(h => h.includes('outreach') || h.includes('angle'));
              const offerIdx = headers.findIndex(h => h.includes('offer') || h.includes('proposal'));
              
              const importedLeadsList: Lead[] = [];
              
              for (let i = 1; i < rows.length; i++) {
                  const row = rows[i];
                  if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;
                  
                  const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx].trim() : '';
                  const email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx].trim() : '';
                  
                  if (!name || !email) continue;
                  
                  let status: LeadStatus = 'New Lead';
                  if (statusIdx !== -1 && row[statusIdx]) {
                      const csvStatus = row[statusIdx].trim();
                      const validStatuses: LeadStatus[] = [
                        'New Lead', 'Contacted', 'Audit in Progress', 
                        'Proposal Sent', 'Negotiation', 'Closed Won', 'Closed Lost'
                      ];
                      
                      const matchedStatus = validStatuses.find(
                        s => s.toLowerCase().replace(/[\s_-]/g, '') === csvStatus.toLowerCase().replace(/[\s_-]/g, '')
                      );
                      if (matchedStatus) {
                          status = matchedStatus;
                      }
                  }
                  
                  let techStack: string[] = [];
                  if (techIdx !== -1 && row[techIdx]) {
                      techStack = row[techIdx].split(/[,;|]/).map(t => t.trim()).filter(Boolean);
                  }
                  
                  let adStatus: 'Active' | 'Inactive' | undefined = undefined;
                  if (adIdx !== -1 && row[adIdx]) {
                      const csvAd = row[adIdx].trim().toLowerCase();
                      if (csvAd.includes('active') && !csvAd.includes('inactive')) {
                          adStatus = 'Active';
                      } else if (csvAd.includes('inactive')) {
                          adStatus = 'Inactive';
                      }
                  }
                  
                  importedLeadsList.push({
                      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`,
                      name,
                      email,
                      phone: phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx].trim() : undefined,
                      companyName: companyIdx !== -1 && row[companyIdx] ? row[companyIdx].trim() : undefined,
                      source: sourceIdx !== -1 && row[sourceIdx] ? row[sourceIdx].trim() : undefined,
                      status,
                      dateAdded: new Date().toISOString(),
                      website: websiteIdx !== -1 && row[websiteIdx] ? row[websiteIdx].trim() : undefined,
                      notes: notesIdx !== -1 && row[notesIdx] ? row[notesIdx].trim() : undefined,
                      instagramHandle: instagramIdx !== -1 && row[instagramIdx] ? row[instagramIdx].trim() : undefined,
                      revenueBand: revenueIdx !== -1 && row[revenueIdx] ? row[revenueIdx].trim() : undefined,
                      adStatus,
                      techStack,
                      outreachAngle: outreachIdx !== -1 && row[outreachIdx] ? row[outreachIdx].trim() : undefined,
                      offerSent: offerIdx !== -1 && row[offerIdx] ? row[offerIdx].trim() : undefined,
                  });
              }
              
              if (importedLeadsList.length === 0) {
                  alert("No valid leads could be imported. Verify Name and Email are filled.");
                  return;
              }
              
              onImportLeads(importedLeadsList);
              
          } catch (err: any) {
              console.error(err);
              alert("Error parsing CSV: " + err.message);
          }
      };
      reader.readAsText(file);
      if (event.target) event.target.value = '';
  };

  const handleGenerateDemoLeads = () => {
      const demoTestData: Lead[] = [
        {
          id: `demo-${Date.now()}-1`,
          name: "Arthur Dent",
          companyName: "Megadodo Publications",
          email: "arthur@guide.galaxy",
          phone: "555-4242",
          status: "Contacted",
          dateAdded: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Added 30 mins ago
          hasDigitalPresence: true,
          source: "Direct",
          estimatedBudget: "₹1,50,000",
          serviceInterest: ["SEO", "Web Dev"],
          followUpHistory: [],
          emailHistory: [],
          manualCompletionMarkers: {},
          nextFollowUpDateTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // Follow-up TODAY (in 45 mins)
        },
        {
          id: `demo-${Date.now()}-2`,
          name: "Selina Kyle",
          companyName: "Gotham Antiques",
          email: "selina@cats.com",
          phone: "555-9999",
          status: "Proposal Sent",
          dateAdded: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // Added yesterday (26 hours ago)
          hasDigitalPresence: false,
          source: "Referral",
          estimatedBudget: "₹2,50,000",
          serviceInterest: ["Social Media"],
          followUpHistory: [],
          emailHistory: [],
          manualCompletionMarkers: {},
          nextFollowUpDateTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // OVERDUE by 2 days
        },
        {
          id: `demo-${Date.now()}-3`,
          name: "Bruce Wayne",
          companyName: "Wayne Enterprises",
          email: "bruce@wayne.corp",
          phone: "555-0000",
          status: "New Lead",
          dateAdded: new Date().toISOString(), // Added right now (forces it to the top!)
          hasDigitalPresence: true,
          source: "Direct",
          estimatedBudget: "₹5,00,000+",
          serviceInterest: ["Security Audit", "SEO"],
          followUpHistory: [],
          emailHistory: [],
          manualCompletionMarkers: {},
        },
        {
          id: `demo-${Date.now()}-4`,
          name: "Clark Kent",
          companyName: "Daily Planet",
          email: "clark@planet.com",
          phone: "555-9876",
          status: "Negotiation",
          dateAdded: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // Added yesterday (20 hours ago)
          hasDigitalPresence: true,
          source: "LinkedIn",
          estimatedBudget: "₹1,80,000",
          serviceInterest: ["PPC", "Web Dev"],
          followUpHistory: [],
          emailHistory: [],
          manualCompletionMarkers: {},
        }
      ];
      onImportLeads(demoTestData);
  };
  
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
        const lowerSearch = searchTerm.toLowerCase();
        const searchMatch = !searchTerm || ( 
            lead.name.toLowerCase().includes(lowerSearch) || 
            (lead.companyName || '').toLowerCase().includes(lowerSearch) || 
            lead.email.toLowerCase().includes(lowerSearch) 
        );
        const dateMatch = isDateInRange(lead.dateAdded, dateRange);
        const statusMatch = statusFilters.size === 0 || statusFilters.has(lead.status);
        const ownerMatch = ownerFilters.size === 0 || (lead.assignedToUserId && ownerFilters.has(lead.assignedToUserId));
        const sourceMatch = sourceFilters.size === 0 || (lead.source && sourceFilters.has(lead.source));
        
        return searchMatch && dateMatch && statusMatch && ownerMatch && sourceMatch;
    });
  }, [leads, searchTerm, dateRange, statusFilters, ownerFilters, sourceFilters]);

  const sortedAndFilteredLeads = useMemo(() => {
    const leadsCopy = [...filteredLeads];
    return leadsCopy.sort((a, b) => {
        const aTime = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
        const bTime = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
        return bTime - aTime;
    });
  }, [filteredLeads]);

  const { paginatedData, ...paginationProps } = usePagination({ data: sortedAndFilteredLeads });

  const toggleFilter = (setter: React.Dispatch<React.SetStateAction<Set<any>>>, value: any) => {
    setter(prev => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value); else next.add(value);
        return next;
    });
  };

  const clearFilters = () => {
    setStatusFilters(new Set());
    setOwnerFilters(new Set());
    setSourceFilters(new Set());
  };

  return (
    <>
    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
    <Card
        title="Leads"
        actions={
            <div className="flex flex-wrap items-center gap-2">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center mr-1">
                    <button onClick={() => setViewMode('List')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'List' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>List</button>
                    <button onClick={() => setViewMode('Kanban')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${viewMode === 'Kanban' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Pipeline</button>
                </div>
                <Button onClick={handleImportClick} variant="outline" size="sm" leftIcon={<Upload className="w-3.5 h-3.5 mr-1" />}>
                    Import CSV
                </Button>
                <Button onClick={handleGenerateDemoLeads} variant="outline" size="sm" className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/25" leftIcon={<RefreshCw className="w-3.5 h-3.5 mr-1 fill-emerald-100 dark:fill-emerald-950/20" />}>
                    Seed Test Leads
                </Button>
                <Button onClick={handleExportClick} variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5 mr-1" />}>
                    Export CSV
                </Button>
                {onNavigateToIntegrations && (
                    <Button onClick={onNavigateToIntegrations} variant="outline" size="sm" className="text-secondary-accent hover:text-secondary-accent border-secondary-accent/20 hover:border-secondary-accent bg-secondary-accent/5 dark:bg-secondary-accent/5" leftIcon={<Webhook className="w-3.5 h-3.5 mr-1" />}>
                        Auto-Capture Webhooks
                    </Button>
                )}
                <Button onClick={onAddLead} variant="primary" size="sm">Add New Lead</Button>
            </div>
        }
        className="h-full flex flex-col"
        contentClassName="flex-grow flex flex-col p-0"
    >
      <div className="p-4 border-b border-border-base dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
        <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="w-full md:flex-1 md:max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search name, brand, email..." 
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-premium-accent outline-none"
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            
            <div className="flex items-center gap-2 justify-end w-full md:w-auto flex-shrink-0">
                 <DateRangePicker onApply={setDateRange} initialRange={dateRange || undefined} />
                 {/* Quick Filters */}
                 <div className="relative">
                    <Button ref={filterButtonRef} variant="outline" size="sm" onClick={() => setIsFilterOpen(p => !p)} leftIcon={<SlidersHorizontal className="w-3 h-3"/>}>Filters</Button>
                    {isFilterOpen && createPortal( 
                        <div ref={filterPanelRef} style={{ position: 'fixed', top: filterButtonRef.current?.getBoundingClientRect().bottom ?? 0, left: filterButtonRef.current?.getBoundingClientRect().left ?? 0, zIndex: 9999 }} className="w-64 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4 space-y-4 animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center"><h4 className="font-semibold text-sm">Filters</h4><button onClick={clearFilters} className="text-xs text-blue-500 hover:underline">Clear</button></div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Owner</p>
                                <div className="space-y-1">{teamMembers.map(tm => <Checkbox key={tm.id} label={tm.name} checked={ownerFilters.has(tm.id)} onChange={() => toggleFilter(setOwnerFilters, tm.id)}/>)}</div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Status</p>
                                <div className="space-y-1">{allStatuses.map(s => <Checkbox key={s} label={s} checked={statusFilters.has(s)} onChange={() => toggleFilter(setStatusFilters, s)}/>)}</div>
                            </div>
                        </div>, document.body 
                    )}
                 </div>
            </div>
        </div>
      </div>

    <div className={`flex-grow overflow-hidden ${viewMode === 'List' ? 'p-4' : 'p-0'}`}>
        {viewMode === 'List' ? (
            <div className="overflow-x-auto rounded-lg border border-border-base dark:border-slate-700">
                <table className="min-w-full divide-y divide-border-base dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name & Brand</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Latest Activity</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Est. Revenue</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Next Follow-up</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Owner</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase min-w-[200px]">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                    {paginatedData.map((lead) => {
                        const latestFollowUp = lead.followUpHistory && lead.followUpHistory.length > 0
                            ? [...lead.followUpHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
                            : null;
                        const isNextToday = lead.nextFollowUpDateTime ? isSameDay(lead.nextFollowUpDateTime) : false;
                        const isOverdue = lead.nextFollowUpDateTime
                            ? (new Date(lead.nextFollowUpDateTime).getTime() < Date.now() && !isSameDay(lead.nextFollowUpDateTime))
                            : false;
                        const hasRecent = latestFollowUp ? (isSameDay(latestFollowUp.timestamp) || isRecentActivity(latestFollowUp.timestamp)) : false;
                        const rowBgClass = isNextToday
                            ? "bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 border-l-4 border-l-rose-500 font-medium"
                            : isOverdue
                            ? "bg-amber-50/30 dark:bg-amber-950/15 hover:bg-amber-50/60 dark:hover:bg-amber-950/30 border-l-4 border-l-amber-500"
                            : hasRecent
                            ? "bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40 dark:hover:bg-amber-950/20"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-700/40";
                        return (
                            <tr key={lead.id} className={`${rowBgClass} transition-colors`}>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold text-sm text-slate-900 dark:text-white hover:text-premium-accent cursor-pointer" onClick={() => onSelectLeadForDetail(lead)}>{lead.name}</span>
                                            {isNextToday && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-900/80 text-[10px] font-black uppercase text-rose-800 dark:text-rose-100 border border-rose-200 dark:border-rose-800 tracking-wider animate-pulse shrink-0">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-300 animate-ping"></span>
                                                    Follow-up Today
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{lead.companyName}</span>
                                            {lead.phone && (
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-tight flex items-center gap-1 flex-wrap">
                                                    <span>{lead.phone}</span>
                                                </span>
                                            )}
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5 mt-1 flex-wrap">
                                                {isSameDay(lead.dateAdded) ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold uppercase text-[9px] tracking-wider">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-300 animate-ping shrink-0"></span>
                                                        Today ({safeFormatDate(lead.dateAdded, 'MMM d')})
                                                    </span>
                                                ) : isRecentActivity(lead.dateAdded) ? (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-extrabold uppercase text-[9px] tracking-wider">
                                                        Yesterday ({safeFormatDate(lead.dateAdded, 'MMM d')})
                                                    </span>
                                                ) : (
                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">{safeFormatDate(lead.dateAdded, 'MMM d, yyyy')}</span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Service Interest Tags */}
                                        {lead.serviceInterest && (Array.isArray(lead.serviceInterest) ? lead.serviceInterest : lead.serviceInterest.split(',')).length > 0 && (
                                            <div className="flex gap-1 flex-wrap mt-0.5">
                                                {(Array.isArray(lead.serviceInterest) ? lead.serviceInterest : lead.serviceInterest.split(',')).map(service => {
                                                    const sTrimmed = typeof service === 'string' ? service.trim() : '';
                                                    if (!sTrimmed) return null;
                                                    return (
                                                        <span key={sTrimmed} className="inline-flex text-[9px] px-1.5 py-0.25 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider scale-95 origin-left select-none border border-slate-200/55 dark:border-slate-700/40">
                                                            {sTrimmed}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3"><span className={getStatusClassNames(lead.status)}>{lead.status}</span></td>
                                <td className="px-4 py-3 max-w-[280px]">
                                    {latestFollowUp ? (
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                {latestFollowUp.followUpType === 'Call' && <Phone className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                                {latestFollowUp.followUpType === 'Email' && <Mail className="w-3.5 h-3.5 text-pink-500 shrink-0" />}
                                                {latestFollowUp.followUpType === 'Meeting' && <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                                                {latestFollowUp.followUpType === 'Other' && <StickyNote className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                                                <span className="truncate">{latestFollowUp.followUpType || 'Activity'}</span>
                                                <span className="text-[9px] text-slate-400 font-mono font-normal tracking-tight shrink-0 bg-slate-50 dark:bg-slate-800/80 px-1 py-0.25 rounded border border-slate-100 dark:border-slate-700">
                                                    {safeFormatRelativeTime(latestFollowUp.timestamp)}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50/70 dark:bg-slate-900/40 rounded-lg p-2 border border-slate-100 dark:border-slate-700/50 text-xs text-slate-600 dark:text-slate-300 shadow-3xs max-w-[260px]">
                                                <p className="line-clamp-2 leading-relaxed text-slate-700 dark:text-slate-200 font-semibold italic animate-none" title={latestFollowUp.note}>
                                                    "{latestFollowUp.note || 'No comment text'}"
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 dark:text-slate-500 italic">No activity logged</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{lead.revenueBand || lead.estimatedBudget || '-'}</td>
                                <td className="px-4 py-3 text-sm">
                                    {lead.nextFollowUpDateTime ? (
                                        isNextToday ? (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-150 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/80 text-[10px] font-black uppercase tracking-wider animate-pulse shrink-0">
                                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-300 animate-ping"></span>
                                                Today ({safeFormatDate(lead.nextFollowUpDateTime, 'h:mm a')})
                                            </span>
                                        ) : isOverdue ? (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-black uppercase tracking-wider shrink-0">
                                                Overdue ({safeFormatDate(lead.nextFollowUpDateTime, 'MMM d')})
                                            </span>
                                        ) : (
                                            <span className="font-semibold text-slate-600 dark:text-slate-300">{safeFormatDate(lead.nextFollowUpDateTime, 'MMM d, h:mm a')}</span>
                                        )
                                    ) : (
                                        <span className="text-slate-400 dark:text-slate-500 italic">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{lead.source || '-'}</td>
                                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                    {teamMembers.find(t => t.id === lead.assignedToUserId)?.name ? (
                                        <div className="flex items-center gap-1">
                                             <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{getInitials(teamMembers.find(t => t.id === lead.assignedToUserId)?.name)}</div>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                        <button 
                                            onClick={() => onSelectLeadForDetail(lead)} 
                                            className="p-1.5 bg-slate-50/60 hover:bg-slate-100/80 border border-slate-200/70 dark:bg-slate-800/40 dark:hover:bg-slate-700/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 rounded-lg shadow-3xs hover:shadow-2xs transition-all cursor-pointer group/btn"
                                            title="View Details"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-[#001d21] dark:text-[#fcb632] group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                        <button 
                                            onClick={() => onOpenFollowUpModal(lead)} 
                                            className="p-1.5 bg-blue-50/60 hover:bg-blue-100/80 border border-blue-100/70 dark:bg-blue-950/20 dark:hover:bg-blue-900/30 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg shadow-3xs hover:shadow-2xs transition-all cursor-pointer"
                                            title="Log Call / Update Activity"
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => onOpenEmailComposeModal(lead)} 
                                            className="p-1.5 bg-pink-50/60 hover:bg-pink-100/80 border border-pink-100/70 dark:bg-pink-950/20 dark:hover:bg-pink-900/30 dark:border-pink-900/50 text-pink-600 dark:text-pink-400 rounded-lg shadow-3xs hover:shadow-2xs transition-all cursor-pointer"
                                            title="Send Email"
                                        >
                                            <Mail className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => onOpenAuditFormModal(lead)} 
                                            className="p-1.5 bg-purple-50/60 hover:bg-purple-100/80 border border-purple-100/70 dark:bg-purple-950/20 dark:hover:bg-purple-900/30 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg shadow-3xs hover:shadow-2xs transition-all cursor-pointer"
                                            title="Conduct Audit"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                        </button>
                                        {hasPermission('leads', 'canDelete') && (
                                            <button 
                                                onClick={() => setLeadToDelete(lead)} 
                                                className="p-1.5 bg-red-50/60 hover:bg-red-100/80 border border-red-100/70 dark:bg-red-950/20 dark:hover:bg-red-900/30 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg shadow-3xs hover:shadow-2xs transition-all cursor-pointer"
                                                title="Delete Lead"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
                <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-2">
                    <Pagination {...paginationProps} />
                </div>
            </div>
        ) : ( 
          <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar h-full px-4 pb-4">
            <div className="inline-flex h-full min-w-full space-x-4">
                {kanbanColumnStatuses.map(status => (
                <div 
                    key={status} 
                    className={`flex-shrink-0 w-80 rounded-xl flex flex-col h-full bg-slate-100/50 dark:bg-slate-800/30 border-t-4 border-transparent ${draggedOverStatus === status ? 'bg-secondary-accent/5' : ''}`}
                    style={{ borderColor: draggedOverStatus === status ? 'var(--color-secondary-accent)' : 'transparent' }}
                    onDragOver={(e) => handleDragOver(e, status)} 
                    onDrop={(e) => handleDrop(e, status)}
                >
                    <h3 className="text-xs font-bold uppercase p-3 text-slate-500 dark:text-slate-400 flex justify-between items-center">
                        {status}
                        <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">{sortedAndFilteredLeads.filter(l => l.status === status).length}</span>
                    </h3>
                    <div className="px-2 pb-2 space-y-2 flex-grow overflow-y-auto custom-scrollbar">
                        {sortedAndFilteredLeads.filter(l => l.status === status).map(lead => (
                            <LeadCardComponent key={lead.id} lead={lead} onRevert={handleRevert} onSelectLeadForDetail={onSelectLeadForDetail} />
                        ))}
                    </div>
                </div>
                ))}
            </div>
          </div>
        )}
    </div>
    </Card>
    {leadToDelete && (
        <ConfirmationModal
            isOpen={true}
            onClose={() => setLeadToDelete(null)}
            onConfirm={() => { onDeleteLead(leadToDelete.id); setLeadToDelete(null); }}
            title="Delete Lead"
            message={`Are you sure you want to delete ${leadToDelete.name}?`}
            confirmLabel="Delete"
        />
    )}
    </>
  );
};
