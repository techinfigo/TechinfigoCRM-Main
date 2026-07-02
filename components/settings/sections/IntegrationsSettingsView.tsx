
import React from 'react';
import { IntegrationPlatform, FeatureKey, PermissionAction } from '../../../types';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Button } from '../../common/Button';

// Props for this component
interface IntegrationsSettingsViewProps {
  platforms: IntegrationPlatform[];
  onConnect: (platformId: string) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}


// --- START: Copied from components/views/IntegrationsView.tsx and adapted ---
const getLogo = (platform: IntegrationPlatform) => {
    if (platform.logoUrl) {
      return <img src={platform.logoUrl} alt={`${platform.name} logo`} className="w-12 h-12 object-contain rounded-lg shadow-md bg-white p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />;
    }
    return <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 font-bold text-xl shadow-md">{platform.name.charAt(0)}</div>;
};

const getStatusBadgeStyle = (status: IntegrationPlatform['status']): string => {
    switch (status) {
      case 'Connected': return 'bg-status-positive/10 text-status-positive border-status-positive/30';
      case 'Not Connected': return 'bg-slate-100 dark:bg-slate-700/30 text-text-muted dark:text-text-muted border-border-muted dark:border-slate-600';
      case 'Coming Soon': return 'bg-sky-100 dark:bg-sky-700/20 text-sky-600 dark:text-sky-300 border-sky-300 dark:border-sky-600';
      case 'Error': return 'bg-status-negative/10 text-status-negative border-status-negative/30';
      case 'Disabled': return 'bg-status-warning/10 text-status-warning border-status-warning/30';
      default: return 'bg-slate-100 dark:bg-slate-700/30 text-text-muted dark:text-text-muted border-border-muted dark:border-slate-600';
    }
};


const IntegrationCard: React.FC<{ platform: IntegrationPlatform; onConnect: (id: string) => void; canManage: boolean }> = ({ platform, onConnect, canManage }) => {
  return (
    <div className="bg-bg-base dark:bg-bg-muted shadow-lg hover:shadow-xl transition-shadow duration-200 flex flex-col justify-between border border-border-base dark:border-border-muted rounded-xl p-4">
      <div>
        <div className="flex items-start gap-4 mb-3">
          {getLogo(platform)}
          <div>
            <h3 className="text-lg font-semibold text-text-base dark:text-text-base">{platform.name}</h3>
            <p className="text-xs text-text-muted dark:text-text-muted">{platform.category}</p>
          </div>
        </div>
        <p className="text-sm text-text-muted dark:text-text-muted mb-4 min-h-[3.5em] line-clamp-3">{platform.description}</p>
      </div>
      <div className="mt-auto pt-4 border-t border-border-base dark:border-border-muted flex flex-col sm:flex-row justify-between items-center gap-2">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeStyle(platform.status)}`}>
          {platform.status}
        </span>
        <div className="flex gap-2 items-center">
            {platform.docsUrl && (
            <a href={platform.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-premium-accent dark:text-premium-accent-dark hover:underline">
                Learn More
            </a>
            )}
            {platform.status === 'Not Connected' && canManage && (
            <Button variant="primary" size="sm" onClick={() => onConnect(platform.id)}>
                Connect
            </Button>
            )}
            {platform.status === 'Connected' && canManage && (
            <Button variant="secondary" size="sm" onClick={() => platform.manageUrl ? window.open(platform.manageUrl, '_blank') : alert('Manage settings (conceptual).')}>
                Manage
            </Button>
            )}
            {platform.status === 'Coming Soon' && (
                <Button variant="outline" size="sm" disabled>Coming Soon</Button>
            )}
        </div>
      </div>
    </div>
  );
};
// --- END: Copied from components/views/IntegrationsView.tsx ---


export const IntegrationsSettingsView: React.FC<IntegrationsSettingsViewProps> = ({ platforms, onConnect, hasPermission }) => {
    const canManageIntegrations = hasPermission('integrations', 'canManage');
    
    return (
        <SettingsSectionCard
            title="Integrations"
            description="Connect your favorite third-party apps to streamline your workflow and enhance productivity."
        >
             {platforms.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-text-muted dark:text-text-muted">No integrations are currently available.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {platforms.map(platform => (
                        <IntegrationCard key={platform.id} platform={platform} onConnect={onConnect} canManage={canManageIntegrations} />
                    ))}
                </div>
            )}
        </SettingsSectionCard>
    );
};
