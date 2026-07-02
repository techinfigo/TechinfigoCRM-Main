
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Campaign, Client, AppSettings, CampaignPlatform, campaignPlatforms, CampaignStatus, campaignStatuses, FeatureKey, PermissionAction } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CampaignsTable } from '@/components/tables/CampaignsTable';
import { EmptyStatePlaceholder } from '@/components/partials/EmptyStatePlaceholder';
import { LoadingSpinner } from '@/components/partials/LoadingSpinner';

const GearIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-16 h-16"}><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.542L9.03 5.513A1.5 1.5 0 007.5 6.75h-1.5a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.5 1.5h1.5a1.5 1.5 0 001.53 1.237l.198.297a1.5 1.5 0 001.237 1.53h.03a1.5 1.5 0 001.5-1.5l.298-.198a1.5 1.5 0 001.237-1.53v-.03a1.5 1.5 0 00-1.5-1.5l-1.237-1.53.198-.297a1.5 1.5 0 00-1.53-1.237h-.03a1.5 1.5 0 00-1.237 1.53l-.297.198A1.5 1.5 0 009 13.5v1.5a1.5 1.5 0 001.5 1.5h1.5a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.237-1.53l-.198-.297A1.5 1.5 0 0012.97 9h.03a1.5 1.5 0 001.5-1.5l1.53 1.237-.297-.198a1.5 1.5 0 00-1.237-1.53h-.03a1.5 1.5 0 00-1.5 1.5l-1.53 1.237.297-.198a1.5 1.5 0 001.53-1.237h.03a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5h-1.5a1.5 1.5 0 00-1.5 1.5v1.5a1.5 1.5 0 001.237 1.53l.198.297a1.5 1.5 0 001.53 1.237h.03a1.5 1.5 0 001.5-1.5V9.75a1.5 1.5 0 00-1.5-1.5h-1.5a1.5 1.5 0 00-1.53-1.237l-.198-.297a1.5 1.5 0 00-1.237-1.53h-.03a1.5 1.5 0 00-1.5 1.5v.03a1.5 1.5 0 001.5 1.5h1.237l1.53-1.237v.03a1.5 1.5 0 001.5 1.5h1.5a1.5 1.5 0 001.5-1.5v-1.5a1.5 1.5 0 00-1.5-1.5H15a1.5 1.5 0 00-1.5-1.5l-2.19-2.19a3.002 3.002 0 00-2.122-.879zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" /></svg>;
const PlusIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;

interface ClientCampaignsTabProps {
  campaigns: Campaign[];
  client: Client;
  appSettings: AppSettings;
  onAddCampaign: () => void;
  onEditCampaign: (campaign: Campaign) => void;
  onOpenReportModal: (campaign: Campaign) => void;
}

export const ClientCampaignsTab: React.FC<ClientCampaignsTabProps> = ({ campaigns, client, onAddCampaign, ...props }) => {
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | 'All'>('All');
  const [filterPlatform, setFilterPlatform] = useState<CampaignPlatform | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock a loading state
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300); // Simulate a short delay
    return () => clearTimeout(timer);
  }, [campaigns]); // Re-trigger loading if campaigns prop changes

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
        const statusMatch = filterStatus === 'All' || campaign.status === filterStatus;
        const platformMatch = filterPlatform === 'All' || campaign.platform === filterPlatform;
        const searchMatch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
        return statusMatch && platformMatch && searchMatch;
    }).map(c => ({...c, clientNameDisplay: client.name })); // Add display name for table
  }, [campaigns, client.name, filterStatus, filterPlatform, searchTerm]);

  if (loading) {
    return <div className="flex justify-center items-center p-12"><LoadingSpinner message="Loading client campaigns..." /></div>;
  }
  
  const selectBaseClass = "p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-lg focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm text-text-base dark:text-text-base shadow-sm";
  const optionClass = "bg-bg-base dark:bg-bg-muted text-text-base dark:text-text-base";


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
            type="search"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="flex-grow"
        />
        <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value as CampaignPlatform | 'All')} className={selectBaseClass}>
          <option value="All" className={optionClass}>All Platforms</option>
          {campaignPlatforms.map(p => <option key={p} value={p} className={optionClass}>{p.replace('Ads', ' Ads')}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as CampaignStatus | 'All')} className={selectBaseClass}>
          <option value="All" className={optionClass}>All Statuses</option>
          {campaignStatuses.map(s => <option key={s} value={s} className={optionClass}>{s}</option>)}
        </select>
        <Button onClick={onAddCampaign} variant="primary" className="shrink-0" leftIcon={<PlusIcon />}>New Campaign</Button>
      </div>
      
      {filteredCampaigns.length === 0 ? (
        <EmptyStatePlaceholder
          icon={<GearIcon />}
          title={searchTerm || filterPlatform !== 'All' || filterStatus !== 'All' ? "No Matching Campaigns" : "No Campaigns Yet"}
          message={searchTerm || filterPlatform !== 'All' || filterStatus !== 'All' ? "No campaigns for this client match your current filters." : `This client doesn't have any campaigns yet. You can create the first one.`}
          actionButton={!searchTerm && filterPlatform === 'All' && filterStatus === 'All' ? <Button onClick={onAddCampaign} variant="primary">+ New Campaign</Button> : undefined}
        />
      ) : (
        <CampaignsTable 
            campaigns={filteredCampaigns}
            appSettings={props.appSettings}
            onEditCampaign={props.onEditCampaign}
            onOpenReportModal={props.onOpenReportModal}
            onDeleteCampaign={() => {}} // Placeholder, not needed in tab view
            hasPermission={() => true} // Assume true within client detail context
            sortConfig={null} // Sorting not implemented in this tab view for simplicity
            requestSort={() => {}} // Sorting not implemented in this tab view
        />
      )}
    </div>
  );
};
