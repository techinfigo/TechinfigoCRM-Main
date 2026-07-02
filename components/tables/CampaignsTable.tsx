
import React from 'react';
import { Campaign, AppSettings, FeatureKey, PermissionAction, CampaignStatus, CampaignPlatform } from '../../types';
import { Button } from '../common/Button';

// Icon Props Interface for local icons
interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    title?: string;
}

// Icons
const SortAscIcon: React.FC<IconProps> = ({ className, ...rest }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-3 h-3 ml-1 opacity-70"} {...rest}><path fillRule="evenodd" d="M8 3a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 8 3ZM3.75 6.75a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z" clipRule="evenodd" /></svg>;
const SortDescIcon: React.FC<IconProps> = ({ className, ...rest }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-3 h-3 ml-1 opacity-70"} {...rest}><path fillRule="evenodd" d="M8 13a.75.75 0 0 1-.75-.75V3.75a.75.75 0 0 1 1.5 0v8.5A.75.75 0 0 1 8 13Zm-4.25-5.5a.75.75 0 0 0 0-1.5h8.5a.75.75 0 0 0 0 1.5h-8.5Z" clipRule="evenodd" /></svg>;
const EyeIcon: React.FC<IconProps> = ({ className, ...rest }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"} {...rest}><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>;
const EditIcon: React.FC<IconProps> = ({ className: propClassName, ...rest }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={propClassName || "w-5 h-5"} {...rest}><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;

interface CampaignsTableProps {
  campaigns: (Campaign & { clientNameDisplay: string })[];
  appSettings: AppSettings;
  onEditCampaign: (campaign: Campaign) => void;
  onDeleteCampaign: (campaignId: string) => void;
  onOpenReportModal: (campaign: Campaign) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  sortConfig: { key: string, direction: string } | null;
  requestSort: (key: string) => void;
}

const getStatusClassNames = (status: CampaignStatus): string => {
    let baseClasses = 'px-2.5 py-1 text-xs font-semibold rounded-full border ';
    switch (status) {
        case 'Planning': return baseClasses + 'bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-400 border-slate-300 dark:border-slate-600';
        case 'Active': return baseClasses + 'bg-green-100 text-status-positive dark:bg-status-positive/20 dark:text-status-positive border-status-positive/50 dark:border-status-positive/40';
        case 'Paused': return baseClasses + 'bg-yellow-100 text-status-warning dark:bg-status-warning/20 dark:text-status-warning border-status-warning/50 dark:border-status-warning/40';
        case 'Completed': return baseClasses + 'bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-300 border-sky-400/50 dark:border-sky-300/40';
        case 'Archived': return baseClasses + 'bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-400 border-slate-400 dark:border-slate-500';
        default: return baseClasses + 'bg-slate-100 text-slate-700 dark:bg-slate-600/30 dark:text-slate-300 border-slate-300 dark:border-slate-600';
    }
};

const getPlatformColor = (platform: CampaignPlatform): string => {
    switch (platform) {
        case 'GoogleAds': return 'bg-google-blue/20 text-google-blue dark:bg-google-blue/30 dark:text-google-blue';
        case 'MetaAds': return 'bg-blue-600/20 text-blue-800 dark:bg-blue-600/30 dark:text-blue-300';
        case 'EmailMarketing': return 'bg-teal-500/20 text-teal-800 dark:bg-teal-500/30 dark:text-teal-300';
        case 'LinkedInAds': return 'bg-sky-700/20 text-sky-900 dark:bg-sky-700/30 dark:text-sky-200';
        case 'TwitterAds': return 'bg-sky-500/20 text-sky-700 dark:bg-sky-500/30 dark:text-sky-300';
        default: return 'bg-slate-500/20 text-slate-800 dark:bg-slate-500/30 dark:text-slate-200';
    }
};

export const CampaignsTable: React.FC<CampaignsTableProps> = ({ campaigns, appSettings, onEditCampaign, onDeleteCampaign, onOpenReportModal, hasPermission, sortConfig, requestSort }) => {

  const canEditCampaigns = hasPermission('campaigns', 'canEdit');
    
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 ml-1 opacity-30 group-hover:opacity-60"><path fillRule="evenodd" d="M8 3a.75.75 0 0 1 .75.75v8.5a.75.75 0 0 1-1.5 0v-8.5A.75.75 0 0 1 8 3ZM3.75 6.75a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5Z" clipRule="evenodd" /></svg>;
    }
    return sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />;
  };

  const TableHeader: React.FC<{ sortKey: string; label: string; className?: string; textAlign?: 'left' | 'right' | 'center' }> = ({ sortKey, label, className, textAlign = 'left' }) => (
    <th
        scope="col"
        className={`px-4 py-3.5 text-${textAlign} text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider group whitespace-nowrap ${className || ''}`}
        onClick={() => requestSort(sortKey)}
        role="columnheader"
        aria-sort={sortConfig?.key === sortKey ? (sortConfig.direction === 'ascending' ? 'ascending' : 'descending') : 'none'}
    >
        <div className={`flex items-center cursor-pointer hover:text-text-base dark:hover:text-text-base transition-colors duration-150 ${textAlign === 'right' ? 'justify-end' : textAlign === 'center' ? 'justify-center' : 'justify-start'}`}>
            {label}
            {getSortIcon(sortKey)}
        </div>
    </th>
  );
  
  const formatCurrencyLocal = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: appSettings.defaultCurrency || 'INR', minimumFractionDigits: 0, maximumFractionDigits: (amount % 1 === 0) ? 0 : 2 }).format(amount);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-base dark:border-border-muted">
      <table className="min-w-full w-full table-fixed divide-y divide-border-base dark:divide-border-muted">
        <colgroup>
            <col className="w-1/3" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-1/6" />
            <col className="w-1/6" />
            <col className="w-[10%]" />
        </colgroup>
        <thead className="bg-bg-muted dark:bg-slate-700/50">
          <tr>
            <TableHeader sortKey="name" label="Campaign & Client" />
            <TableHeader sortKey="platform" label="Platform" textAlign="center"/>
            <TableHeader sortKey="status" label="Status" textAlign="center"/>
            <TableHeader sortKey="startDate" label="Dates" />
            <TableHeader sortKey="totalBudget" label="Budget / Spend" textAlign="right" />
            <th scope="col" className="px-4 py-3.5 text-right text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-bg-base dark:bg-bg-muted divide-y divide-border-base dark:divide-border-muted">
          {campaigns.map((campaign) => (
              <tr 
                key={campaign.id} 
                className="transition-colors hover:bg-highlight-accent dark:hover:bg-slate-700/60"
              >
                <td className="px-4 py-2 align-middle">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-slate-500">{getInitials(campaign.name)}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-text-base dark:text-text-base truncate" title={campaign.name}>
                                {campaign.name}
                            </p>
                            <p className="text-xs text-text-muted dark:text-text-muted truncate" title={campaign.clientNameDisplay}>
                                {campaign.clientNameDisplay}
                            </p>
                        </div>
                    </div>
                </td>
                <td className="px-4 py-2 align-middle">
                    <div className="flex justify-center">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPlatformColor(campaign.platform)}`}>
                            {campaign.platform.replace('Ads', ' Ads')}
                        </span>
                    </div>
                </td>
                <td className="px-4 py-2 align-middle">
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center ${getStatusClassNames(campaign.status)}`}>
                        {campaign.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs text-text-muted dark:text-text-muted align-middle">
                    <p>{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'}</p>
                    <p>to {campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'Ongoing'}</p>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-xs text-text-muted dark:text-text-muted align-middle">
                    <div className="flex flex-col items-end">
                        <span className="font-medium text-sm text-text-base dark:text-text-base" title="Actual Spend">{formatCurrencyLocal(campaign.actualSpend)}</span>
                        <span className="text-xxs text-slate-400 dark:text-slate-500" title="Total Budget">
                          of {formatCurrencyLocal(campaign.totalBudget)}
                        </span>
                    </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium align-middle">
                   <div className="flex justify-end items-center space-x-1">
                       <Button variant="ghost" size="xs" onClick={() => onOpenReportModal(campaign)} aria-label={`View report for ${campaign.name}`} className="p-1.5" title="View Report"><EyeIcon /></Button>
                      {canEditCampaigns && (
                        <Button variant="ghost" size="xs" onClick={() => onEditCampaign(campaign)} aria-label={`Edit ${campaign.name}`} className="p-1.5" title="Edit Campaign"><EditIcon /></Button>
                      )}
                   </div>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
};
