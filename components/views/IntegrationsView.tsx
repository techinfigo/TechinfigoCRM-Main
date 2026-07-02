
import React from 'react';
import { IntegrationPlatform, FeatureKey, PermissionAction } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface IntegrationsViewProps {
  platforms: IntegrationPlatform[];
  onConnect: (platformId: string) => void; // Conceptual connection handler
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

// Generic Placeholder Icons (can be replaced with actual SVGs or images)
const GoogleAdsIcon = () => <img src="https://www.gstatic.com/images/branding/product/1x/ads_64dp.png" alt="Google Ads" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const StripeIcon = () => <img src="https://js.stripe.com/v3/fingerprinted/img/stripe-logo-blurple-90a1089939283963990428f869499682.svg" alt="Stripe" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const CalendarIcon = () => <img src="https://www.gstatic.com/images/branding/product/1x/calendar_64dp.png" alt="Google Calendar" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const SlackIcon = () => <img src="https://a.slack-edge.com/80588/marketing/img/meta/favicon-32.png" alt="Slack" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const QuickBooksIcon = () => <img src="https://quickbooks.intuit.com/etc.clientlibs/settings/wcm/designs/uxcore/clientlib-core/resources/images/icon-quickbooks-green-square.svg" alt="QuickBooks" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const MetaIcon = () => <img src="https://static.xx.fbcdn.net/rsrc.php/v3/yN/r/p_t2V2ODEqJ.png" alt="Meta Ads" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const GmailIcon = () => <img src="https://www.gstatic.com/images/branding/product/1x/gmail_64dp.png" alt="Gmail" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const ShopifyIcon = () => <img src="https://cdn.shopify.com/shopify-marketing_assets/static/shopify-favicon.png" alt="Shopify" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const WooCommerceIcon = () => <img src="https://woocommerce.com/wp-content/themes/woo/images/logo-woocommerce.svg" alt="WooCommerce" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const WhatsAppIcon = () => <img src="https://static.whatsapp.net/rsrc.php/v3/y7/r/DSxOAUB0raA.png" alt="WhatsApp" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const CalendlyIcon = () => <img src="https://assets.calendly.com/assets/favicon-6c2c1c155b2726b95c53574644118019.ico" alt="Calendly" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const ZapierIcon = () => <img src="https://zapier.com/favicon.ico" alt="Zapier" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const MakeIcon = () => <img src="https://www.make.com/assets/img/favicon/favicon-32x32.png" alt="Make.com" className="w-10 h-10 object-contain rounded-md shadow-md" />;
const ZoomIcon = () => <img src="https://st1.zoom.us/zoom.ico" alt="Zoom" className="w-10 h-10 object-contain rounded-md shadow-md" />;


const IntegrationCard: React.FC<{ platform: IntegrationPlatform; onConnect: (id: string) => void; canManage: boolean }> = ({ platform, onConnect, canManage }) => {
  const getLogo = () => {
    if (platform.logoUrl) return <img src={platform.logoUrl} alt={`${platform.name} logo`} className="w-12 h-12 object-contain rounded-lg shadow-md bg-white p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />;
    
    // Fallback to specific icons if logoUrl is missing or fails
    if (platform.id === 'google-ads') return <GoogleAdsIcon />;
    if (platform.id === 'stripe') return <StripeIcon />;
    if (platform.id === 'google-calendar') return <CalendarIcon />;
    if (platform.id === 'slack') return <SlackIcon />;
    if (platform.id === 'quickbooks') return <QuickBooksIcon />;
    if (platform.id === 'meta-ads') return <MetaIcon />;
    if (platform.id === 'gmail') return <GmailIcon />;
    if (platform.id === 'shopify') return <ShopifyIcon />;
    if (platform.id === 'woocommerce') return <WooCommerceIcon />;
    if (platform.id === 'whatsapp-cloud') return <WhatsAppIcon />;
    if (platform.id === 'calendly') return <CalendlyIcon />;
    if (platform.id === 'zapier') return <ZapierIcon />;
    if (platform.id === 'make-com') return <MakeIcon />;
    if (platform.id === 'zoom') return <ZoomIcon />;

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

  return (
    <Card className="bg-bg-base dark:bg-bg-muted shadow-lg hover:shadow-xl transition-shadow duration-200 flex flex-col justify-between border border-border-base dark:border-border-muted rounded-xl">
      <div>
        <div className="flex items-start gap-4 mb-3">
          {getLogo()}
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
    </Card>
  );
};

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ platforms, onConnect, hasPermission }) => {
  const canManageIntegrations = hasPermission('integrations', 'canManage');

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/60 p-4 sm:p-6 rounded-lg shadow-inner">
      <h2 className="text-2xl md:text-3xl font-semibold text-text-base dark:text-text-base mb-2">
        Manage Integrations
      </h2>
      <p className="text-sm text-text-muted dark:text-text-muted mb-8">
        Connect your favorite third-party services to streamline your workflow and enhance productivity.
      </p>

      {platforms.length === 0 ? (
        <Card className="bg-bg-base dark:bg-bg-muted">
            <p className="text-text-muted dark:text-text-muted text-center py-8">
                No integrations are currently available. Check back later or contact support.
            </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map(platform => (
            <IntegrationCard key={platform.id} platform={platform} onConnect={onConnect} canManage={canManageIntegrations} />
          ))}
        </div>
      )}
       <p className="text-xs text-center text-text-muted dark:text-text-muted mt-10">
        Note: Connecting integrations typically involves OAuth or API key configurations and may require backend support. This module provides a conceptual framework.
      </p>
    </div>
  );
};
