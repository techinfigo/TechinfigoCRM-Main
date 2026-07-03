import React, { useMemo, useState } from 'react';
import { Client, Invoice, Lead, Project, TeamMember, Expense, TimeLog, AppSettings, FeatureKey, PermissionAction, View, Campaign, DashboardSuggestion, ActivityLogItem, calculateInvoiceGrandTotal, Task, LeaveRequest, DailyAttendanceRecord, EmailMessage, Proposal, Audit } from '../../types';
import { RefreshCw } from 'lucide-react';
import { MetricsCards } from '@/components/dashboard/MetricsCards';
import { FinancialOverviewChart } from '@/components/dashboard/FinancialOverviewChart';
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
        const filteredInvoices = invoices.filter(inv => isDateInRange(inv.issueDate, dateRange));
        const filteredExpenses = expenses.filter(exp => isDateInRange(exp.date, dateRange));

        const paidInvoices = filteredInvoices.filter(inv => inv.status === 'Paid');
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + convertToINR(calculateInvoiceGrandTotal(inv), inv.currency), 0);
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + convertToINR(exp.amount, exp.currency), 0);
        const outstandingRevenue = filteredInvoices.filter(inv => inv.status === 'Sent' || inv.status === 'Overdue').reduce((sum, inv) => sum + convertToINR(calculateInvoiceGrandTotal(inv), inv.currency), 0);
        
        return {
            totalRevenue,
            totalExpenses,
            netProfit: totalRevenue - totalExpenses,
            outstandingRevenue,
            avgRevenuePerClient: clients.length > 0 ? totalRevenue / clients.length : 0,
            pendingInvoicesAmount: outstandingRevenue,
        };
    }, [invoices, expenses, clients, dateRange]);

    // --- Lead Metrics Calculations ---
    const leadSummary = useMemo(() => {
        const leadsInRange = leads.filter(l => isDateInRange(l.dateAdded, dateRange));

        const convertedInRange = leadsInRange.filter(l => l.status === 'Converted' || l.status === 'Closed Won');
        
        const pipelineValue = leadsInRange
            .filter(l => l.status === 'New Lead' || l.status === 'Negotiation')
            .reduce((sum, l) => {
                const budgetStr = (l.estimatedBudget || '').replace(/[^0-9.-]+/g,"");
                const budgetParts = budgetStr.split('-').map(p => parseFloat(p)).filter(p => !isNaN(p));
                const avgBudget = budgetParts.length > 0 ? budgetParts.reduce((a,b)=>a+b, 0) / budgetParts.length : 0;
                return sum + avgBudget;
            }, 0);

        return {
            leadsThisMonth: leadsInRange.length,
            leadConversionRate: leadsInRange.length > 0 ? (convertedInRange.length / leadsInRange.length) * 100 : 0,
            pipelineValue,
            dealsWonThisMonth: convertedInRange.length,
        };
    }, [leads, dateRange]);
    
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
        <div className="space-y-6">
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
            
            <div className={`transition-opacity duration-300 space-y-6 ${isRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
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
                        <h3 className="text-xl font-semibold text-text-heading dark:text-text-heading mb-3">Suggestions for you</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {dashboardSuggestions.map(s => <DashboardSuggestionCard key={s.id} suggestion={s}/>)}
                        </div>
                    </div>
                )}


                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3">
                        <FinancialOverviewChart 
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
                    <h3 className="text-xl font-semibold text-text-heading dark:text-text-heading mb-3">Client Health Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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