import React from 'react';
import { AppSettings } from '../../types';
import { t } from '@/i18n';

// --- ICONS (lucide-react style) ---
const LucideTrendingUpIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="m16 7 6 0 0 6"/></svg>;
const LucideCircleDollarSignIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>;
const CreditCardIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>;
const WalletIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5V3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><path d="M3 10h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg>;
const UsersIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const LineChartIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;

// --- Metric Card Component (Refactored) ---
interface MetricCardProps {
    title: string;
    value: string;
    icon: React.ComponentType<{ className?: string }>;
    change?: { value: number, period: string };
    description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, change, description }) => {
    
    const iconStyles: { [key: string]: { text: string }} = {
        [t('dashboard.totalRevenue')]: { text: 'text-green-500' },
        [t('dashboard.netProfit')]: { text: 'text-green-500' },
        [t('dashboard.totalExpenses')]: { text: 'text-red-500' },
        [t('dashboard.outstandingRevenue')]: { text: 'text-yellow-400' },
        "Avg. Revenue / Client": { text: 'text-indigo-500' },
        [t('dashboard.leadsThisMonth')]: { text: 'text-violet-500' },
        [t('dashboard.leadConversionRate')]: { text: 'text-cyan-500' },
    };
    const currentIconStyle = iconStyles[title] || { text: 'text-slate-500' };
    
    const iconWrapperClasses = 'absolute top-4 right-4';
    const iconClasses = 'w-5 h-5';

    return (
        <div className="relative bg-bg-base dark:bg-bg-base p-4 rounded-xl shadow-lg border border-border-base dark:border-border-muted hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className={iconWrapperClasses}>
                <Icon className={`${iconClasses} ${currentIconStyle.text}`} />
            </div>
            
            <p className="text-sm font-medium text-text-muted dark:text-text-muted">{title}</p>
            <p className="text-2xl lg:text-3xl font-bold text-text-heading dark:text-text-heading mt-2">{value}</p>
            
            {change && (
                <div className="flex items-center text-xs mt-1">
                    <span className={`flex items-center font-semibold ${change.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change.value >= 0 ? 
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 14a.75.75 0 01-.75-.75V3.56l-1.97 1.97a.75.75 0 01-1.06-1.06l3.5-3.5a.75.75 0 011.06 0l3.5 3.5a.75.75 0 11-1.06 1.06L8.75 3.56V13.25A.75.75 0 018 14z" clipRule="evenodd" /></svg> :
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M8 2a.75.75 0 01.75.75v9.69l1.97-1.97a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 111.06 1.06l1.97 1.97V2.75A.75.75 0 018 2z" clipRule="evenodd" /></svg>
                        }
                        {Math.abs(change.value)}%
                    </span>
                    <span className="text-text-muted dark:slate-500 ml-1">{change.period}</span>
                </div>
            )}
            {description && <p className="text-xs text-text-muted dark:slate-500 mt-1">{description}</p>}
        </div>
    );
};


// --- Main MetricsCards Component ---
interface MetricsCardsProps {
  summary: {
    totalRevenue: number;
    netProfit: number;
    totalExpenses: number;
    outstandingRevenue: number;
    avgRevenuePerClient: number;
    leadsThisMonth: number;
    leadConversionRate: number;
  };
  appSettings: AppSettings;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ summary, appSettings }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(amount);
    };

    const metrics: MetricCardProps[] = [
        { title: t('dashboard.totalRevenue'), value: formatCurrency(summary.totalRevenue), icon: LucideTrendingUpIcon, change: { value: 12.5, period: "vs last month" } },
        { title: t('dashboard.netProfit'), value: formatCurrency(summary.netProfit), icon: LucideCircleDollarSignIcon, description: "(Revenue - Expenses)", change: { value: 8.2, period: "vs last month" } },
        { title: t('dashboard.totalExpenses'), value: formatCurrency(summary.totalExpenses), icon: CreditCardIcon, change: { value: 4.5, period: "vs last month" } },
        { title: t('dashboard.outstandingRevenue'), value: formatCurrency(summary.outstandingRevenue), icon: WalletIcon, change: { value: -2.1, period: "vs last month" } },
        { title: t('dashboard.leadsThisMonth'), value: summary.leadsThisMonth.toString(), icon: UsersIcon, change: { value: -5.2, period: "vs last month" } },
        { title: t('dashboard.leadConversionRate'), value: `${summary.leadConversionRate.toFixed(1)}%`, icon: LineChartIcon, change: { value: 1.8, period: "vs last month" } },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {metrics.map(metric => (
                <MetricCard key={metric.title} {...metric} />
            ))}
        </div>
    );
};