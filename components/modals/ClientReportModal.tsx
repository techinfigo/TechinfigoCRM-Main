
import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TextArea } from '../common/Input';
import { Client, Project, Task, Campaign, AppSettings } from '../../types';
import { Copy, Mail, RefreshCw, CheckCircle2, Clock, BarChart3, AlertTriangle } from 'lucide-react';

interface ClientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  projects: Project[];
  tasks: Task[];
  campaigns: Campaign[];
  appSettings: AppSettings;
  onOpenEmailCompose: (emailData: { subject: string, body: string, to: string }) => void;
}

const formatDateRange = (start: Date, end: Date) => {
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
};

export const ClientReportModal: React.FC<ClientReportModalProps> = ({ 
    isOpen, onClose, client, projects, tasks, campaigns, appSettings, onOpenEmailCompose 
}) => {
    const [timeRange, setTimeRange] = useState<'this_week' | 'last_week' | 'this_month'>('this_week');
    const [customReportText, setCustomReportText] = useState('');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: appSettings.defaultCurrency || 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    // --- Computed Data based on Time Range ---
    const reportData = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        const endDate = new Date(); // Today

        if (timeRange === 'this_week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0,0,0,0);
        } else if (timeRange === 'last_week') {
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0,0,0,0);
             // End date becomes end of last week
             endDate.setDate(startDate.getDate() + 6);
             endDate.setHours(23,59,59,999);
        } else if (timeRange === 'this_month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const completedTasks = tasks.filter(t => t.status === 'Done' && t.updatedAt && new Date(t.updatedAt) >= startDate && new Date(t.updatedAt) <= endDate);
        const inProgressTasks = tasks.filter(t => (t.status === 'In Progress' || t.status === 'Review'));
        const upcomingTasks = tasks.filter(t => t.status === 'To Do' || t.status === 'Blocked');
        
        // Filter campaigns for this client that are Active or Paused (not Archived)
        const activeCampaigns = campaigns.filter(c => c.clientId === client.id && c.status !== 'Archived');

        return {
            period: formatDateRange(startDate, endDate),
            completed: completedTasks,
            inProgress: inProgressTasks,
            upcoming: upcomingTasks,
            activeProjects: projects.filter(p => p.status !== 'Cancelled' && p.status !== 'Done'),
            activeCampaigns
        };
    }, [timeRange, tasks, projects, campaigns, client.id]);

    // --- Generate Text Report ---
    const generateReport = () => {
        const { period, completed, inProgress, upcoming, activeProjects, activeCampaigns } = reportData;
        
        let text = `Subject: Weekly Update: ${client.companyName || client.name} (${period})\n\n`;
        text += `Hi ${client.primaryContactName || client.name.split(' ')[0]},\n\n`;
        text += `Here is your weekly performance and activity report. \n\n`;

        // 1. Campaign Performance (The "Money" Section)
        if (activeCampaigns.length > 0) {
            text += `📊 **Campaign Performance**\n`;
            activeCampaigns.forEach(c => {
                const spend = c.actualSpend || 0;
                const revenue = c.kpis?.revenueGenerated || 0;
                const roas = c.kpis?.roas || 0;
                text += `- **${c.name}** (${c.platform}): Spend ${formatCurrency(spend)} | Rev ${formatCurrency(revenue)} | ROAS ${roas.toFixed(1)}x\n`;
            });
            text += `\n`;
        }

        // 2. Key Wins / Completed
        text += `✅ **Key Wins & Completed Items**\n`;
        if (completed.length > 0) {
            // Group by project if possible
            completed.slice(0, 8).forEach(t => text += `- ${t.title}\n`);
            if (completed.length > 8) text += `- ...and ${completed.length - 8} other minor tasks.\n`;
        } else {
            text += `- Strategic planning and ongoing optimization (no closures this week).\n`;
        }
        text += `\n`;

        // 3. Project Health & Status
        if (activeProjects.length > 0) {
             text += `📂 **Project Health Check**\n`;
             activeProjects.forEach(p => {
                 const healthIcon = p.health === 'On Track' ? '🟢' : p.health === 'At Risk' ? '🟡' : '🔴';
                 text += `${healthIcon} **${p.name}**: ${p.health} (${p.status})\n`;
             });
             text += `\n`;
        }

        // 4. Priorities for Next Week
        text += `🚀 **Focus for Next Week**\n`;
        if (inProgress.length > 0 || upcoming.length > 0) {
             const priorities = [...inProgress, ...upcoming].slice(0, 5);
             priorities.forEach(t => text += `- ${t.title}\n`);
        } else {
            text += `- Continuing with scheduled campaign optimizations.\n`;
        }
        text += `\n`;

        text += `Let us know if you have any questions or want to adjust priorities.\n\nBest,\nThe ${appSettings.agencyName} Team`;

        setCustomReportText(text);
    };

    // Auto-generate on open or change
    useEffect(() => {
        if (isOpen) generateReport();
    }, [isOpen, reportData, appSettings.agencyName]);


    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(customReportText);
        // Simple alert for feedback
        const btn = document.getElementById('copy-btn');
        if(btn) {
            const originalText = btn.innerText;
            btn.innerText = "Copied!";
            setTimeout(() => btn.innerText = originalText, 2000);
        }
    };

    const handleSendEmail = () => {
        // Extract subject line from the generated text
        const subjectMatch = customReportText.match(/Subject: (.*)\n/);
        const subject = subjectMatch ? subjectMatch[1] : `Progress Report - ${client.name}`;
        
        // Remove subject line from body for the email composer
        const body = customReportText.replace(/Subject: .*\n\n/, '');

        onOpenEmailCompose({
            to: client.email,
            subject: subject,
            body: body.replace(/\n/g, '<br/>') // Simple conversion for HTML editor
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generate Client Report"
            size="2xl"
            footer={
                <div className="flex justify-between w-full">
                    <Button id="copy-btn" variant="ghost" onClick={handleCopyToClipboard} leftIcon={<Copy className="w-4 h-4"/>}>Copy to Clipboard</Button>
                    <div className="flex gap-2">
                         <Button variant="secondary" onClick={onClose}>Cancel</Button>
                         <Button variant="primary" onClick={handleSendEmail} leftIcon={<Mail className="w-4 h-4"/>}>Preview in Email</Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-border-base dark:border-slate-600 gap-4">
                    <div className="flex items-center gap-4">
                        <label className="text-sm font-medium text-text-muted">Time Period:</label>
                        <select 
                            value={timeRange} 
                            onChange={(e) => setTimeRange(e.target.value as any)}
                            className="p-2 bg-white dark:bg-slate-800 border border-border-base dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-premium-accent"
                        >
                            <option value="this_week">This Week</option>
                            <option value="last_week">Last Week</option>
                            <option value="this_month">This Month</option>
                        </select>
                    </div>
                    <div className="flex gap-2 text-xs text-text-muted">
                        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3"/> Campaigns: {reportData.activeCampaigns.length}</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Completed: {reportData.completed.length}</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-heading dark:text-slate-200">Generated Report (Editable)</label>
                    <TextArea 
                        value={customReportText} 
                        onChange={(e) => setCustomReportText(e.target.value)} 
                        rows={16} 
                        className="font-mono text-sm leading-relaxed"
                    />
                </div>
            </div>
        </Modal>
    );
};
