
import React, { useState, useMemo, useCallback } from 'react';
import { Campaign, Client, CampaignStatus, CampaignPlatform, AppSettings, FeatureKey, PermissionAction, campaignPlatforms, campaignStatuses } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { CampaignsTable } from '@/components/tables/CampaignsTable';
import { Pagination } from '../common/Pagination';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';
import { isDateInRange } from '@/utils';

// Icon Props Interface for local icons
interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    title?: string;
}

// Icons (ensure these are defined or imported if used elsewhere)
const PlusIcon: React.FC<IconProps> = ({ className, ...rest }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} {...rest}><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;

interface CampaignsViewProps {
  campaigns: Campaign[];
  clients: Client[];
  onAddCampaign: () => void;
  onEditCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onGenerateInsights: (campaignId: string) => Promise<void>; 
  onOpenReportModal: (campaign: Campaign) => void;
  appSettings: AppSettings;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onDetectAnomalies?: (campaignId: string) => Promise<void>;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns, clients, onAddCampaign, onEditCampaign, onDeleteCampaign, onGenerateInsights, onOpenReportModal, appSettings, hasPermission
}) => {
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'All'>('All');
  const [filterPlatform, setFilterPlatform] = useState<CampaignPlatform | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>({ key: 'dateAdded', direction: 'descending' } as any);

  const canCreateCampaigns = hasPermission('campaigns', 'canCreate');

  const getClientName = useCallback((clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'N/A';
  }, [clients]);

  const processedCampaigns = useMemo(() => {
    return campaigns.map(campaign => ({
        ...campaign,
        clientNameDisplay: getClientName(campaign.clientId)
    }));
  }, [campaigns, getClientName]);

  const filteredAndSortedCampaigns = useMemo(() => {
    let sortableItems = processedCampaigns.filter(campaign => {
        const statusMatch = filterStatus === 'All' || campaign.status === filterStatus;
        const platformMatch = filterPlatform === 'All' || campaign.platform === filterPlatform;
        const searchMatch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            campaign.clientNameDisplay.toLowerCase().includes(searchTerm.toLowerCase());
        const rangeMatch = isDateInRange(campaign.startDate, dateRange);
        return statusMatch && platformMatch && searchMatch && rangeMatch;
    });

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key as keyof Campaign];
        let valB = b[sortConfig.key as keyof Campaign];

        if (sortConfig.key === 'clientName') {
            valA = a.clientNameDisplay;
            valB = b.clientNameDisplay;
        }

        if (['startDate', 'endDate', 'dateAdded'].includes(sortConfig.key)) {
            const dateA = valA ? new Date(valA as string).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
            const dateB = valB ? new Date(valB as string).getTime() : (sortConfig.direction === 'ascending' ? Infinity : -Infinity);
            if (dateA < dateB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
            if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        }
        const strA = String(valA || '').toLowerCase();
        const strB = String(valB || '').toLowerCase();
        if (strA < strB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (strA > strB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [processedCampaigns, filterStatus, filterPlatform, searchTerm, sortConfig]);

  const { paginatedData, ...paginationProps } = usePagination({ data: filteredAndSortedCampaigns });

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Update to match new styling guidelines, even if native select
  const selectBaseClass = "p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm text-text-base dark:text-text-base shadow-sm cursor-pointer";
  const optionClass = "bg-bg-base dark:bg-bg-muted text-text-base dark:text-text-base";

  return (
    <Card
      title="Marketing Campaigns"
      actions={
        canCreateCampaigns && (
            <Button onClick={onAddCampaign} variant="primary" size="md" leftIcon={<PlusIcon />} disabled={clients.length === 0}>
                {clients.length === 0 ? "Add Client First" : "New Campaign"}
            </Button>
        )
      }
    >
      <div className="mb-4 flex flex-col sm:flex-row flex-wrap gap-3">
        <input
            type="text"
            placeholder="Search campaigns or clients..."
            className="flex-grow p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-lg focus:outline-none focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm text-text-base dark:text-text-base placeholder-text-muted dark:placeholder-text-muted/70 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value as CampaignPlatform | 'All')} className={selectBaseClass}>
          <option value="All" className={optionClass}>All Platforms</option>
          {campaignPlatforms.map(p => <option key={p} value={p} className={optionClass}>{p.replace('Ads', ' Ads')}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CampaignStatus | 'All')} className={selectBaseClass}>
          <option value="All" className={optionClass}>All Statuses</option>
          {campaignStatuses.map(s => <option key={s} value={s} className={optionClass}>{s}</option>)}
        </select>
        <DateRangePicker onApply={setDateRange} initialRange={dateRange || undefined} />
      </div>

      {filteredAndSortedCampaigns.length === 0 ? (
        <p className="text-text-muted dark:text-text-muted text-center py-8">
          {campaigns.length === 0 && canCreateCampaigns ? 'No campaigns created yet.' :
           campaigns.length === 0 && !canCreateCampaigns ? 'No campaigns found and you do not have permission to add them.' :
           'No campaigns match your current filters.'}
        </p>
      ) : (
        <>
        <CampaignsTable 
            campaigns={paginatedData}
            appSettings={appSettings}
            onEditCampaign={onEditCampaign}
            onDeleteCampaign={onDeleteCampaign}
            onOpenReportModal={onOpenReportModal}
            hasPermission={hasPermission}
            requestSort={requestSort}
            sortConfig={sortConfig}
        />
        <Pagination {...paginationProps} />
        </>
      )}
    </Card>
  );
};
