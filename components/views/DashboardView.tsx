import React, { useMemo, useState } from 'react';
import type { Payment, Opportunity } from '../../types';
import { Client, Invoice, Lead, Project, TeamMember, Expense, TimeLog, AppSettings, FeatureKey, PermissionAction, View, Campaign, DashboardSuggestion, ActivityLogItem, calculateInvoiceGrandTotal, Task, LeaveRequest, DailyAttendanceRecord, EmailMessage, Proposal, Audit } from '../../types';
import { RefreshCw } from 'lucide-react';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { FinancialOverviewChart } from '@/components/dashboard/FinancialOverviewChart';
import { moneySummary } from '../../selectors/money';
import { LeadsSalesFunnel } from '@/components/dashboard/LeadsSalesFunnel';
import { TeamPerformanceSnapshot } from '@/components/dashboard/TeamPerformanceSnapshot';
import { MyTasks } from '@/components/dashboard/MyTasks';
import { TaskStatsWidget } from '@/components/dashboard/TaskStatsWidget';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { DashboardSuggestionCard } from '@/components/DashboardSuggestionCard';
import { DateRangePicker, DateRange } from '@/components/common/DateRangePicker';
import { isDateInRange, convertToINR } from '@/utils';
import { Button } from '@/components/common/Button';
import { ClientSummaryCard } from '@/components/dashboard/ClientSummaryCard';
import { t } from '@/i18n';

// Props Interface
interface DashboardViewProps {
  clients: Client[];
  invoices: Invoice[];
  payments?: Payment[];
  opportunities?: Opportunity[];
  leads: Lead[];
  projects: Project[];
  teamMembers: TeamMember[];
  expenses: Expense[];
  timeLogs: TimeLog[];
  leaveRequests: LeaveRequest[];
  dailyAttendanceRecords: DailyAttendanceRecord[];
  activityHistory: ActivityLogItem[];
  appSettings: AppSettings;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  setCurrentView: (view: View) => void;
  campaigns: Campaign[];
  proposals: Proposal[];
  audits: Audit[];
  dashboardSuggestions: DashboardSuggestion[];
  onOpenCampaignReportModal: (campaign: Campaign) => void;
  currentUser: TeamMember | null;
  onOpenLeadFormModal: () => void;
  onOpenClientFormModal: () => void;
  onOpenProjectFormModal: () => void;
  onOpenInvoiceModal: () => void;
  onOpenExpenseModal: () => void;
  onOpenPaymentModal: () => void;
  onOpenTimeLogModal: (log: TimeLog | null, defaults?: { projectId?: string, taskId?: string }) => void;
  onOpenTaskModal: () => void;
  onMarkTaskAsDone: (taskId: string, projectId?: string) => void;
  onOpenEmailComposeModal: (initialEmail?: Partial<EmailMessage>) => void;
  onSelectClientForDetail: (client: Client) => void;
  allTasks: (Task & { projectName?: string })[];
  onSelectTask: (task: Task) => void;
}


export const DashboardView: React.FC<DashboardViewProps> = (props) => {
    const { clients, invoices, expenses, leads, projects, teamMembers, timeLogs, leaveRequests, dailyAttendanceRecords, currentUser, activityHistory, appSettings, dashboardSuggestions, setCurrentView, onOpenTaskModal, onMarkTaskAsDone, allTasks, onSelectTask, campaigns, proposals, audits } = props;
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | null>(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        return { startDate: start, endDate: end };
    });

    const handleRefresh = () => {
        setIsRefreshing(true);
        // Simulate data refetch
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1500);
    };

    // --- Financial Metrics Calculations ---
    const financialSummary = useMemo(() => {
        const filteredExpenses = expenses.filter(exp => isDateInRange(exp.date, dateRange));
        // Revenue = money actually received in the dates (advances + payments), without GST.
        const money = moneySummary(clients, invoices, props.payments || [], (iso) => isDateInRange(iso, dateRange));
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + convertToINR(exp.amount, exp.currency), 0);
        return {
            totalRevenue: money.revenue,
            gstCollected: money.gstCollected,
            totalExpenses,
            netProfit: money.revenue - totalExpenses,
            outstandingRevenue: money.outstanding, // owed now, after advances and part payments
            avgRevenuePerClient: clients.length > 0 ? money.revenue / clients.length : 0,
            pendingInvoicesAmount: money.outstanding,
            revenueByMonth: money.monthly,
        };
    }, [invoices, expenses, clients, dateRange, props.payments]);

    // --- Lead Metrics Calculations ---
    const leadSummary = useMemo(() => {
        const leadsInRange = leads.filter(l => isDateInRange(l.dateAdded, dateRange));

        const convertedInRange = leadsInRange.filter(l => l.status === 'Converted' || l.status === 'Closed Won');
        
        // Open leads (anything not yet won or lost).
        const leadPipeline = leadsInRange
            .filter(l => l.status !== 'Closed Won' && l.status !== 'Closed Lost' && (l.status as string) !== 'Converted')
            .reduce((sum, l) => {
                const budgetStr = (l.estimatedBudget || '').replace(/[^0-9.-]+/g,"");
                const budgetParts = budgetStr.split('-').map(p => parseFloat(p)).filter(p => !isNaN(p));
                const avgBudget = budgetParts.length > 0 ? budgetParts.reduce((a,b)=>a+b, 0) / budgetParts.length : 0;
                return sum + avgBudget;
            }, 0);
        // Plus extra services existing clients are interested in.
        const upsellPipeline = (props.opportunities || [])
            .filter(o => o.stage === 'Interested' || o.stage === 'Quote sent')
            .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        const pipelineValue = leadPipeline + upsellPipeline;

        // Average days from lead added to client (for clients converted from a lead).
        const closeDays = clients
            .map(c => {
                const lead = c.convertedFromLeadId ? leads.find(l => l.id === c.convertedFromLeadId) : undefined;
                if (!lead) return null;
                const days = (new Date(c.dateAdded).getTime() - new Date(lead.dateAdded).getTime()) / 86400000;
                return Number.isFinite(days) && days >= 0 ? days : null;
            })
            .filter((d): d is number => d !== null);
        const avgDealDays = closeDays.length ? Math.round(closeDays.reduce((a, b) => a + b, 0) / closeDays.length) : null;

        return {
            leadsThisMonth: leadsInRange.length,
            leadConversionRate: leadsInRange.length > 0 ? (convertedInRange.length / leadsInRange.length) * 100 : 0,
            pipelineValue,
            upsellPipeline,
            avgDealDays,
            dealsWonThisMonth: convertedInRange.length,
        };
    }, [leads, dateRange, clients, props.opportunities]);
    
     // Team summary
    const teamSummary = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = dailyAttendanceRecords.find(r => r.date === todayStr);
        let activeToday = 0;
        if (todayRecord) {
            activeToday = todayRecord.entries.filter(e => e.status === 'Present' || e.status === 'Late' || e.status === 'Half-Day').length;
        }

        return {
            totalEmployees: teamMembers.length,
            activeToday: activeToday,
            attendancePercentage: teamMembers.length > 0 ? (activeToday / teamMembers.length) * 100 : 0,
            pendingLeaveRequests: leaveRequests.filter(lr => lr.status === 'Pending').length,
            topPerformer: { name: 'Sarah Manager', metric: 'Closed Deals' }, // Placeholder
        }
    }, [teamMembers, leaveRequests, dailyAttendanceRecords]);

    const myTasks = useMemo(() => {
        if (!currentUser) return [];
        return allTasks.filter(t => t.assignedMemberId === currentUser.id);
    }, [allTasks, currentUser]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h1 className="text-2xl font-bold text-text-heading dark:text-text-heading">{t('dashboard.title')}</h1>
                <div className="flex items-center gap-2">
                    <DateRangePicker onApply={setDateRange} initialRange={dateRange || undefined} />
                    <Button
                        variant="outline"
                        size="sm"
                        className="!p-2 h-9 w-9"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        title="Refresh Data"
                    >
                        <RefreshCw className={`h-4 w-4 text-text-muted transition-transform duration-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>
            
            <div className={`transition-opacity duration-300 space-y-4 ${isRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <QuickActions 
                    onOpenLeadFormModal={props.onOpenLeadFormModal}
                    onOpenClientFormModal={props.onOpenClientFormModal}
                    onOpenProjectFormModal={props.onOpenProjectFormModal}
                    onOpenInvoiceModal={props.onOpenInvoiceModal}
                    onOpenExpenseModal={props.onOpenExpenseModal}
                    onOpenPaymentModal={props.onOpenPaymentModal}
                    onOpenTaskModal={props.onOpenTaskModal}
                />

                <MetricsCards 
                    summary={{...financialSummary, ...leadSummary}}
                    appSettings={appSettings}
                />

                {dashboardSuggestions && dashboardSuggestions.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-xl font-semibold text-text-heading dark:text-text-heading mb-2">Suggestions for you</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            {dashboardSuggestions.map(s => <DashboardSuggestionCard key={s.id} suggestion={s}/>)}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-3">
                        <FinancialOverviewChart 
                            revenueByMonth={financialSummary.revenueByMonth}
                            invoices={invoices.filter(inv => isDateInRange(inv.issueDate, dateRange))}
                            expenses={expenses.filter(exp => isDateInRange(exp.date, dateRange))}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <LeadsSalesFunnel 
                            summary={leadSummary}
                            leads={leads.filter(l => isDateInRange(l.dateAdded, dateRange))}
                            appSettings={appSettings}
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <h3 className="text-xl font-semibold text-text-heading dark:text-text-heading mb-2">Client Health Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {clients.map(client => (
                            <ClientSummaryCard
                                key={client.id}
                                client={client}
                                invoices={invoices}
                                projects={projects}
                                campaigns={campaigns}
                                proposals={proposals}
                                audits={audits}
                                onViewClient={() => props.onSelectClientForDetail(client)}
                                onSendEmail={() => props.onOpenEmailComposeModal({ recipientEmail: client.email })}
                            />
                        ))}
                    </div>
                </div>

                <TeamPerformanceSnapshot summary={teamSummary} />
                
                <TaskStatsWidget tasks={myTasks.filter(t => isDateInRange(t.dueDate, dateRange))} />

                <MyTasks
                  tasks={myTasks.filter(t => isDateInRange(t.dueDate, dateRange))}
                  onSelectTask={onSelectTask}
                  onToggleTaskCompletion={onMarkTaskAsDone}
                  onOpenTaskModal={onOpenTaskModal}
                  setCurrentView={setCurrentView}
                />

                <RecentActivity 
                  activities={activityHistory.filter(a => isDateInRange(a.timestamp, dateRange))} 
                  teamMembers={teamMembers} 
                />
            </div>
        </div>
    );
};