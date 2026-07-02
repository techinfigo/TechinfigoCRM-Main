
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Campaign, AppSettings } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { BarChart, LineChart, Target, TrendingUp, Trophy, Lightbulb, Download } from 'lucide-react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

interface ClientCampaignsReportTabProps {
  campaigns: Campaign[];
  appSettings: AppSettings;
}

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-bg-base dark:bg-bg-muted p-4 rounded-xl shadow-md border border-border-muted flex items-center gap-4">
    <div className="p-2 bg-secondary-accent/10 text-secondary-accent rounded-lg">{icon}</div>
    <div>
      <p className="text-xs text-text-muted uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-text-heading dark:text-text-heading">{value}</p>
    </div>
  </div>
);

export const ClientCampaignsReportTab: React.FC<ClientCampaignsReportTabProps> = ({ campaigns, appSettings }) => {
  const lineChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const chartInstances = useRef<{ line?: any; bar?: any }>({});

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: appSettings.defaultCurrency || 'INR', notation: 'compact', maximumFractionDigits: 1 }).format(amount);
  };

  const summary = useMemo(() => {
    if (campaigns.length === 0) return { bestCampaign: null, overallROAS: 0 };
    let bestCampaign = campaigns[0];
    let totalRevenue = 0;
    let totalSpend = 0;

    for (const campaign of campaigns) {
      if ((campaign.kpis?.roas || 0) > (bestCampaign.kpis?.roas || 0)) {
        bestCampaign = campaign;
      }
      totalRevenue += campaign.kpis?.revenueGenerated || 0;
      totalSpend += campaign.actualSpend || 0;
    }
    const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    return { bestCampaign, overallROAS };
  }, [campaigns]);

  useEffect(() => {
    Object.values(chartInstances.current).forEach((chart: any) => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    chartInstances.current = {};
    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? '#e2e8f0' : '#475569';

    // Line Chart: Spend vs Revenue
    if (lineChartRef.current) {
      const lineCtx = lineChartRef.current.getContext('2d');
      const allPerformanceData = campaigns.flatMap(c => c.dailyPerformance || []).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (lineCtx && allPerformanceData.length > 0) {
        chartInstances.current.line = new Chart(lineCtx, {
          type: 'line',
          data: {
            labels: allPerformanceData.map(d => new Date(d.date).toLocaleDateString('en-CA', {month: 'short', day: 'numeric'})),
            datasets: [
              { label: 'Revenue', data: allPerformanceData.map(d => d.revenue), borderColor: '#22c55e', tension: 0.3, pointBackgroundColor: '#22c55e' },
              { label: 'Spend', data: allPerformanceData.map(d => d.spend), borderColor: '#ef4444', tension: 0.3, pointBackgroundColor: '#ef4444' }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { color: textColor }, grid: { color: gridColor } }, x: { ticks: { color: textColor }, grid: { display: false } } }, plugins: { legend: { labels: { color: textColor } } } }
        });
      }
    }

    // Bar Chart: Campaign Comparison
    if (barChartRef.current) {
        const barCtx = barChartRef.current.getContext('2d');
        if (barCtx) {
            chartInstances.current.bar = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: campaigns.map(c => c.name),
                    datasets: [{
                        label: 'ROAS',
                        data: campaigns.map(c => c.kpis?.roas || 0),
                        backgroundColor: '#fcb632',
                        borderRadius: 4,
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { display: false } } }, plugins: { legend: { display: false } } }
            });
        }
    }

  }, [campaigns, summary]);

  return (
    <div className="space-y-6">
      <Card title="Campaign Performance Summary" actions={<Button variant="outline" size="sm" leftIcon={<Download size={16}/>}>Export Report</Button>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard title="Best Performing Campaign" value={summary.bestCampaign?.name || 'N/A'} icon={<Trophy size={20}/>} />
            <MetricCard title="Overall ROAS Trend" value={`${summary.overallROAS.toFixed(2)}x`} icon={<TrendingUp size={20}/>} />
            <MetricCard title="AI Suggested Next Action" value="Boost budget for 'Q3 Social Push'" icon={<Lightbulb size={20}/>} />
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Spend vs. Revenue" icon={<LineChart size={20} />} className="h-96"><canvas ref={lineChartRef}></canvas></Card>
          <Card title="Campaign ROAS Comparison" icon={<BarChart size={20} />} className="h-96"><canvas ref={barChartRef}></canvas></Card>
      </div>
      
      <Card title="Detailed Campaign Metrics">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800/50 text-xs uppercase">
              <tr>
                <th className="p-3 text-left">Campaign</th>
                <th className="p-3 text-right">Ad Spend</th>
                <th className="p-3 text-right">Revenue</th>
                <th className="p-3 text-right">ROAS</th>
                <th className="p-3 text-right">CTR</th>
                <th className="p-3 text-right">CPM</th>
                <th className="p-3 text-right">CPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base dark:divide-border-muted">
              {campaigns.map(c => (
                <tr key={c.id}>
                  <td className="p-3 font-medium">{c.name} <span className="text-xs text-text-muted">({c.platform})</span></td>
                  <td className="p-3 text-right">{formatCurrency(c.actualSpend)}</td>
                  <td className="p-3 text-right">{formatCurrency(c.kpis?.revenueGenerated)}</td>
                  <td className="p-3 text-right font-semibold text-premium-accent dark:text-secondary-accent">{c.kpis?.roas?.toFixed(2) || 'N/A'}x</td>
                  <td className="p-3 text-right">{c.kpis?.ctr?.toFixed(2) || 'N/A'}%</td>
                  <td className="p-3 text-right">{formatCurrency(c.kpis?.cpm)}</td>
                  <td className="p-3 text-right">{formatCurrency(c.kpis?.cpa)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
