import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import Chart from 'chart.js/auto';
import type { ChartType } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Download } from 'lucide-react';
import { Invoice, Expense, calculateInvoiceGrandTotal } from '../../types';
import { format } from 'date-fns';
import { convertToINR } from '../../utils';

// Register the datalabels plugin
Chart.register(ChartDataLabels);

interface FinancialOverviewChartProps {
    invoices: Invoice[];
    expenses: Expense[];
}

type ActiveTab = 'Revenue' | 'Profit' | 'Expenses' | 'Compare';

export const FinancialOverviewChart: React.FC<FinancialOverviewChartProps> = ({ invoices, expenses }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('Revenue');

    const data = useMemo(() => {
        const monthlyData: Record<string, { revenue: number, expenses: number, profit: number, timestamp: number }> = {};
        
        invoices.forEach(inv => {
            if (inv.status !== 'Paid' && inv.status !== 'Sent') return; // Only count sent/paid for revenue tracking
            const date = new Date(inv.issueDate);
            const monthKey = format(date, "MMM ''yy");
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { revenue: 0, expenses: 0, profit: 0, timestamp: date.getTime() };
            }
            monthlyData[monthKey].revenue += convertToINR(calculateInvoiceGrandTotal(inv), inv.currency);
        });

        expenses.forEach(exp => {
            const date = new Date(exp.date);
            const monthKey = format(date, "MMM ''yy");
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { revenue: 0, expenses: 0, profit: 0, timestamp: date.getTime() };
            }
            monthlyData[monthKey].expenses += convertToINR(exp.amount, exp.currency);
        });

        return Object.entries(monthlyData)
            .map(([month, values]) => ({
                month,
                ...values,
                profit: values.revenue - values.expenses
            }))
            .sort((a, b) => a.timestamp - b.timestamp);
    }, [invoices, expenses]);

    const bestMonth = useMemo(() => {
        if (!data || data.length === 0) return 'N/A';
        const best = data.reduce((max, current) => current.profit > max.profit ? current : max, data[0]);
        return best.month;
    }, [data]);
    
    const formatCurrencyAxis = (value: number) => `₹${(value / 100000).toFixed(1)}L`;
    const formatCurrencyLabel = (value: number) => `₹${(value / 100000).toFixed(1)}L`;

    const handleExport = () => {
        if (chartInstance.current) {
            const link = document.createElement('a');
            link.href = chartInstance.current.toBase64Image();
            link.download = `monthly_revenue_6m.png`;
            link.click();
        }
    };

    useEffect(() => {
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        if (chartRef.current && data.length > 0) {
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                const createGradient = (color: string) => {
                    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                    const isDark = document.documentElement.classList.contains('dark');
                    gradient.addColorStop(0, `${color}${isDark ? '60' : '40'}`);
                    gradient.addColorStop(1, `${color}00`);
                    return gradient;
                };

                const isDarkTheme = document.documentElement.classList.contains('dark');
                const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                const textColor = isDarkTheme ? '#e2e8f0' : '#475569';
                
                const datasetsConfig = {
                    Revenue: { color: '#f59e0b', data: data.map(d => d.revenue) },
                    Profit: { color: '#22c55e', data: data.map(d => d.profit) },
                    Expenses: { color: '#ef4444', data: data.map(d => d.expenses) },
                };

                const activeDatasets = activeTab === 'Compare' 
                    ? ['Revenue', 'Profit', 'Expenses']
                    : [activeTab];
                
                chartInstance.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.map(d => d.month),
                        datasets: activeDatasets.map(tab => {
                            const config = datasetsConfig[tab as keyof typeof datasetsConfig];
                            return {
                                label: tab,
                                data: config.data,
                                borderColor: config.color,
                                backgroundColor: createGradient(config.color),
                                tension: 0.4,
                                fill: true,
                                pointBackgroundColor: config.color,
                                pointBorderColor: isDarkTheme ? '#001d21' : '#f0f9ff',
                                pointBorderWidth: 2,
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: config.color,
                                pointRadius: 5,
                                pointHoverRadius: 7,
                                borderWidth: 2.5,
                            };
                        })
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        layout: {
                            padding: {
                                top: 30 // Add padding to prevent labels from being cut off
                            }
                        },
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: { callback: (value) => formatCurrencyAxis(Number(value)), color: textColor },
                                grid: { color: gridColor },
                                border: { display: false }
                            },
                             x: {
                                ticks: { color: textColor },
                                grid: { display: false }
                            }
                        },
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: false }, // Using custom labels on points
                            datalabels: {
                                align: 'end',
                                anchor: 'end',
                                offset: 8,
                                backgroundColor: (context: any) => context.dataset.borderColor as string,
                                borderRadius: 4,
                                color: 'white',
                                font: { size: 10, weight: '600' },
                                padding: { top: 3, bottom: 2, left: 6, right: 6 },
                                formatter: (value: any) => formatCurrencyLabel(value),
                            }
                        } as any,
                    },
                });
            }
        }
        return () => chartInstance.current?.destroy();
    }, [data, activeTab]);

    const TabButton: React.FC<{ label: ActiveTab }> = ({ label }) => {
        const isActive = activeTab === label;
        return (
            <button
                className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium ${isActive ? 'bg-secondary-accent text-secondary-accent-text shadow' : 'text-text-muted hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                onClick={() => setActiveTab(label)}
            >
                {label}
            </button>
        );
    };

    return (
        <Card title="Monthly Revenue" className="h-full flex flex-col bg-bg-muted dark:bg-bg-base">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {(['Revenue', 'Profit', 'Expenses', 'Compare'] as ActiveTab[]).map(tab => (
                        <TabButton key={tab} label={tab} />
                    ))}
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-center">
                     <Button variant="outline" size="sm" onClick={handleExport} leftIcon={<Download className="w-4 h-4" />}>
                        Export PNG
                    </Button>
                    <div className="hidden md:flex items-center gap-2 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-3 py-1.5 rounded-lg text-sm font-semibold">
                        Best Month: <span className="font-bold">{bestMonth}</span>
                    </div>
                </div>
            </div>
             <div className="md:hidden flex items-center gap-2 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-3 py-1.5 rounded-lg text-xs font-semibold self-start">
                Best Month: <span className="font-bold">{bestMonth}</span>
            </div>

            <div className="h-80 w-full mt-4 flex-grow">
                {data.length > 0 ? (
                    <canvas ref={chartRef}></canvas>
                ) : (
                    <div className="flex items-center justify-center h-full text-text-muted">No data to display.</div>
                )}
            </div>
        </Card>
    );
};
