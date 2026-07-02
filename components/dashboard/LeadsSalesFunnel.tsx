
import React, { useRef, useEffect, useMemo } from 'react';
import { Card } from '../common/Card';
import { Lead, LeadStatus, AppSettings } from '../../types';
import Chart from 'chart.js/auto';

interface LeadsSalesFunnelProps {
    summary: {
        pipelineValue: number;
        dealsWonThisMonth: number;
    };
    leads: Lead[];
    appSettings: AppSettings;
}

// Icons for Stat Cards
const BriefcaseIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
const TrophyIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V22"/><path d="M14 14.66V22"/><path d="M8 8.5c0-1.71 1.24-4.5 4-4.5s4 2.79 4 4.5c0 2.22-1.54 4.5-4 4.5s-4-2.28-4-4.5Z"/></svg>;
const TimerIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="13" r="8"/><path d="M12 9v4"/><path d="M5 2 2.5 4.5"/><path d="m19 2 2.5 4.5"/></svg>;


export const LeadsSalesFunnel: React.FC<LeadsSalesFunnelProps> = ({ summary, leads, appSettings }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    const { leadStatusCounts, totalLeads, leadStatusColors } = useMemo(() => {
        const counts: Partial<Record<LeadStatus, number>> = {};
        leads.forEach(lead => {
            counts[lead.status] = (counts[lead.status] || 0) + 1;
        });

        // Filter and sort to match the image legend
        const displayOrder: LeadStatus[] = ['Closed Won', 'New Lead', 'Negotiation'];
        const sortedCounts: Record<string, number> = {};
        displayOrder.forEach(status => {
            if (counts[status]) {
                sortedCounts[status] = counts[status] as number;
            } else {
                 // To ensure the color mapping is correct even if a status has 0 leads
                sortedCounts[status] = 0;
            }
        });

        const total = leads.length;

        const colors: Record<string, string> = {
            'Closed Won': '#22c55e', // green-500
            'New Lead': '#2563eb', // blue-600
            'Negotiation': '#f59e0b', // amber-500
            'Audit Completed – Ready for Follow-Up': '#8B5CF6',
            'Not Interested': '#6B7280',
        };

        return { leadStatusCounts: sortedCounts, totalLeads: total, leadStatusColors: colors };
    }, [leads]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact' }).format(amount);
    };

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const centerTextPlugin = {
                    id: 'centerText',
                    afterDraw: (chart: Chart) => {
                        const { width, height, ctx } = chart;
                        ctx.restore();
                        
                        ctx.font = `600 ${height/6}px Inter, sans-serif`;
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#ffffff' : '#001d21';
                        
                        const text = totalLeads.toString();
                        const textX = Math.round((width - ctx.measureText(text).width) / 2);
                        const textY = height / 2 + 10;
                        ctx.fillText(text, textX, textY);
                        
                        ctx.font = `500 ${height/16}px Inter, sans-serif`;
                        ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#a3b5b7' : '#666666';
                        const labelText = 'Total Leads';
                        const labelX = Math.round((width - ctx.measureText(labelText).width) / 2);
                        const labelY = height / 2 - (height/10);
                        ctx.fillText(labelText, labelX, labelY);
                        ctx.save();
                    }
                };
                
                chartInstance.current = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(leadStatusCounts),
                        datasets: [{
                            data: Object.values(leadStatusCounts),
                            backgroundColor: Object.keys(leadStatusCounts).map(status => leadStatusColors[status as LeadStatus]),
                            borderWidth: 4,
                            borderColor: document.documentElement.classList.contains('dark') ? '#001d21' : '#f0f9ff',
                            hoverBorderColor: document.documentElement.classList.contains('dark') ? '#003f47' : '#e0f2fe',
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false,
                        animation: {
                            duration: 1200,
                        },
                        // @ts-ignore
                        cutout: '80%', 
                        plugins: { 
                            legend: { display: false },
                            tooltip: { enabled: false },
                        } 
                    },
                    plugins: [centerTextPlugin]
                });
            }
        }
        return () => chartInstance.current?.destroy();
    }, [leadStatusCounts, totalLeads, leadStatusColors]);

    const stats = [
        { label: "Pipeline Value", value: formatCurrency(summary.pipelineValue), icon: BriefcaseIcon, color: "text-blue-500" },
        { label: "Deals Won (Month)", value: summary.dealsWonThisMonth, icon: TrophyIcon, color: "text-green-500" },
        { label: "Avg. Deal Closing", value: "12 Days", icon: TimerIcon, color: "text-purple-500" }
    ];

    return (
        <Card title="Leads Funnel" className="h-full flex flex-col bg-bg-muted dark:bg-bg-base">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {stats.map(stat => (
                    <div key={stat.label} className="relative bg-bg-base dark:bg-slate-800/60 p-4 rounded-lg border border-border-base dark:border-border-muted shadow-sm overflow-hidden">
                        <stat.icon className={`absolute top-2 right-2 w-5 h-5 ${stat.color}`} />
                        <div>
                            <p className="text-xs text-text-muted dark:slate-400 pr-6">{stat.label}</p>
                            <p className="font-bold text-xl text-text-heading dark:text-text-heading mt-1">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="relative h-48 sm:h-56 flex-grow">
                <canvas ref={chartRef}></canvas>
            </div>

            <div className="pt-4 mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
                {Object.entries(leadStatusCounts).map(([status, count]) => (
                    <div key={status} className="flex items-center">
                        <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: leadStatusColors[status as LeadStatus] }}></span>
                        <span className="text-text-muted dark:text-slate-400">{status}:</span>
                        <span className="font-semibold text-text-base dark:text-slate-200 ml-1">{count}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
};
