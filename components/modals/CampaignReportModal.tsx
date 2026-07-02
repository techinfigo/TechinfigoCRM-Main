


import React, { useEffect, useRef } from 'react';
import { Campaign, AppSettings, CampaignAnomaly } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
// @ts-ignore
import { Chart } from 'chart.js/auto';

interface CampaignReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  appSettings: AppSettings;
}

// Icon Props Interface for local icons
interface IconProps extends React.SVGProps<SVGSVGElement> {
    className?: string;
    title?: string;
}

// Icons
const ClipboardIcon: React.FC<IconProps> = ({ className, ...rest }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5"} {...rest}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>;
const ChartBarIcon: React.FC<IconProps> = ({ className, ...rest }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 text-blue-500"} {...rest}><path d="M2 10a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V10zM8.25 3a.75.75 0 01.75.75v11.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V3.75a.75.75 0 01.75-.75h1.5zM14.5 6a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v8.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V6z" /></svg>;
const TrendingUpIcon: React.FC<IconProps> = ({ className, ...rest }) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "w-5 h-5 text-green-500"} {...rest}><path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="m16 7 6 0 0 6"/></svg>;
const AlertTriangleIcon: React.FC<IconProps> = ({ className, ...rest }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 text-yellow-500"} {...rest}><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;


export const CampaignReportModal: React.FC<CampaignReportModalProps> = ({ isOpen, onClose, campaign, appSettings }) => {
    const budgetChartRef = useRef<HTMLCanvasElement>(null);
    const trendChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ budget?: any; trend?: any }>({});

    useEffect(() => {
        // Destroy existing charts on re-render
        Object.values(chartInstances.current).forEach((chart: any) => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        chartInstances.current = {};

        if (!isOpen) return;

        // Budget Chart
        if (budgetChartRef.current && campaign.chartData?.spendVsBudget) {
            const ctx = budgetChartRef.current.getContext('2d');
            if (ctx) {
                chartInstances.current.budget = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Spent', 'Remaining'],
                        datasets: [{
                            data: [campaign.chartData.spendVsBudget.spent, campaign.chartData.spendVsBudget.budget - campaign.chartData.spendVsBudget.spent],
                            backgroundColor: ['#3B82F6', '#E5E7EB'],
                            borderColor: document.documentElement.classList.contains('dark') ? '#4B5563' : '#FFFFFF',
                            borderWidth: 2,
                        }]
                    },
                    options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'bottom' } } }
                });
            }
        }
        
        // Trend Chart
        if (trendChartRef.current && campaign.chartData?.performanceTrend) {
            const ctx = trendChartRef.current.getContext('2d');
            if(ctx) {
                chartInstances.current.trend = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: campaign.chartData.performanceTrend.data.map(d => new Date(d.date).toLocaleDateString('en-CA')),
                        datasets: [{
                            label: campaign.chartData.performanceTrend.metricName,
                            data: campaign.chartData.performanceTrend.data.map(d => d.revenue), // Assuming revenue for now
                            borderColor: '#10B981',
                            tension: 0.3,
                            fill: true,
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
        }
    }, [isOpen, campaign]);
    
    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) return 'N/A';
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: appSettings.defaultCurrency || 'INR' }).format(amount);
    };

    const kpis = [
        { label: 'ROAS', value: `${campaign.kpis?.roas?.toFixed(2) || 'N/A'}x` },
        { label: 'Conversions', value: campaign.kpis?.conversions || 'N/A' },
        { label: 'CPA', value: formatCurrency(campaign.kpis?.cpa) },
        { label: 'CTR', value: `${campaign.kpis?.ctr?.toFixed(2) || 'N/A'}%` },
    ];

    const getAnomalySeverityClass = (severity?: CampaignAnomaly['severity']): string => {
        switch (severity) {
            case 'Critical': return 'border-l-red-500 bg-red-50 dark:bg-red-900/30';
            case 'High': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/30';
            case 'Medium': return 'border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/30';
            case 'Low': return 'border-l-sky-400 bg-sky-50 dark:bg-sky-900/30';
            default: return 'border-l-slate-400 bg-slate-50 dark:bg-slate-800/30';
        }
    }


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Campaign Report: ${campaign.name}`}
            size="4xl"
            footer={<Button onClick={onClose}>Close</Button>}
        >
            <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
                <Card title="Key Performance Indicators (KPIs)" icon={<TrendingUpIcon />}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        {kpis.map(kpi => (
                            <div key={kpi.label} className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                <p className="text-xs text-text-muted dark:text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                                <p className="text-xl font-bold text-text-heading dark:text-slate-100 mt-1">{kpi.value}</p>
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card title="Budget vs Spend" icon={<ChartBarIcon />} className="lg:col-span-1 h-80">
                         {campaign.chartData?.spendVsBudget ? <canvas ref={budgetChartRef}></canvas> : <p className="text-sm text-center text-text-muted">No budget data available.</p>}
                    </Card>
                    <Card title="Performance Trend" icon={<TrendingUpIcon />} className="lg:col-span-2 h-80">
                         {campaign.chartData?.performanceTrend?.data.length > 0 ? <canvas ref={trendChartRef}></canvas> : <p className="text-sm text-center text-text-muted">No performance trend data available.</p>}
                    </Card>
                </div>
                
                {campaign.anomalies && campaign.anomalies.length > 0 && (
                    <Card title="Detected Anomalies" icon={<AlertTriangleIcon />}>
                         <div className="space-y-3">
                            {campaign.anomalies.map(anomaly => (
                                <div key={anomaly.id} className={`p-3 rounded-lg border-l-4 ${getAnomalySeverityClass(anomaly.severity)}`}>
                                    <p className="text-sm font-semibold text-text-heading dark:text-slate-200">
                                        {anomaly.metric} {anomaly.deviationDescription} on {new Date(anomaly.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-text-muted dark:text-slate-400">
                                        Observed: {anomaly.observedValue} {anomaly.expectedValue && `(Expected: ${anomaly.expectedValue})`}
                                    </p>
                                    {anomaly.potentialExplanation && <p className="text-xs mt-1 italic text-text-muted dark:text-slate-300">AI Suggestion: {anomaly.potentialExplanation}</p>}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <Card title="AI Performance Insights" icon={<ClipboardIcon />}>
                    {campaign.aiPerformanceInsights ? (
                        <pre className="text-sm bg-slate-100 dark:bg-slate-700/50 p-3 rounded-md whitespace-pre-wrap font-sans">{campaign.aiPerformanceInsights}</pre>
                    ) : (
                        <p className="text-sm text-center text-text-muted">No AI insights generated for this campaign yet.</p>
                    )}
                </Card>
            </div>
        </Modal>
    );
};
