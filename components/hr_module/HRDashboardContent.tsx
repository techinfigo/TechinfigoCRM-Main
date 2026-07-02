
import React, { useMemo, useEffect, useRef } from 'react';
import { TeamMember, LeaveRequest, DailyAttendanceRecord } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import Chart from 'chart.js/auto';
import { Users, UserCheck, Clock, CalendarCheck, Wallet, Cake, Plus, Calendar, FileText, LogOut } from 'lucide-react';

// Props Interface
interface HRDashboardContentProps {
  teamMembers: TeamMember[];
  leaveRequests: LeaveRequest[];
  dailyAttendanceRecords: DailyAttendanceRecord[];
  onOpenTeamMemberHRFormModal: (member?: TeamMember | null) => void;
  onOpenMarkAttendanceModal: () => void;
  onOpenApproveLeavesModal: () => void;
  onOpenUploadHRDocumentModal: () => void;
  onOpenScheduleExitInterviewModal: () => void;
}

// Enhanced StatCard Component
const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ElementType; 
    badge?: string; 
    colorClass: string;
    onClick?: () => void 
}> = ({ title, value, icon: Icon, badge, colorClass, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4 transition-all hover:shadow-md hover:border-premium-accent/30 ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100`}>
            <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div className="flex-1">
            <div className="flex justify-between items-start">
                 <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
                 {badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        </div>
    </div>
);

export const HRDashboardContent: React.FC<HRDashboardContentProps> = (props) => {
    const headcountChartRef = useRef<HTMLCanvasElement>(null);
    const attritionChartRef = useRef<HTMLCanvasElement>(null);
    const attendanceChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ headcount?: any, attrition?: any, attendance?: any }>({});

    // --- Data Processing ---
    const dashboardStats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = props.dailyAttendanceRecords.find(r => r.date === todayStr);
        let presentToday = 0;
        if (todayRecord) {
            presentToday = todayRecord.entries.filter(e => e.status === 'Present' || e.status === 'Late' || e.status === 'Half-Day').length;
        }

        return {
            totalEmployees: props.teamMembers.length,
            onboardingNow: props.teamMembers.filter(tm => tm.hrStatus === 'Probation').length,
            pendingLeaves: props.leaveRequests.filter(lr => lr.status === 'Pending').length,
            presentToday: presentToday,
            pendingPayroll: 5, // Placeholder
            upcomingBirthdays: 2, // Placeholder
        };
    }, [props.teamMembers, props.leaveRequests, props.dailyAttendanceRecords]);

    const pendingLeaveRequests = useMemo(() => {
        return props.leaveRequests.filter(lr => lr.status === 'Pending').slice(0, 5);
    }, [props.leaveRequests]);

    const recentOnboardings = useMemo(() => {
        return props.teamMembers.filter(tm => tm.hrStatus === 'Probation').sort((a,b) => new Date(b.dateJoined).getTime() - new Date(a.dateJoined).getTime()).slice(0, 5);
    }, [props.teamMembers]);
    
    const upcomingExits = useMemo(() => {
         return props.teamMembers.filter(tm => tm.hrStatus === 'Resigned').slice(0, 5);
    }, [props.teamMembers]);

    // --- Chart Initialization ---
    useEffect(() => {
        Object.values(chartInstances.current).forEach((chart: any) => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        chartInstances.current = {};

        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
        const textColor = isDark ? '#94a3b8' : '#64748b';

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { color: textColor, precision: 0 }, grid: { color: gridColor, drawBorder: false } },
                x: { ticks: { color: textColor }, grid: { display: false } }
            }
        };

        // Headcount Chart
        if (headcountChartRef.current) {
            const ctx = headcountChartRef.current.getContext('2d');
            const departmentCounts = {
                'Management': 3, 'Development': 12, 'Design': 7, 'Marketing': 9
            };
            if (ctx) {
                chartInstances.current.headcount = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: Object.keys(departmentCounts),
                        datasets: [{ label: 'Headcount', data: Object.values(departmentCounts), backgroundColor: '#3B82F6', borderRadius: 6 }]
                    },
                    options: chartOptions
                });
            }
        }

        // Attrition Chart
        if (attritionChartRef.current) {
            const ctx = attritionChartRef.current.getContext('2d');
            if (ctx) {
                chartInstances.current.attrition = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{ label: 'Attrition %', data: [2.1, 1.5, 3.2, 2.5, 1.8, 4.0], borderColor: '#EF4444', tension: 0.4, pointBackgroundColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true }]
                    },
                    options: chartOptions
                });
            }
        }
        
        // Attendance Trend Chart
        if(attendanceChartRef.current) {
            const ctx = attendanceChartRef.current.getContext('2d');
            const labels = [];
            const presentData = [];
            const absentData = [];
            for(let i=14; i>=0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', {weekday: 'short'}));
                const presentCount = Math.floor(Math.random() * (props.teamMembers.length - (props.teamMembers.length - 5)) + (props.teamMembers.length - 5));
                presentData.push(presentCount);
                absentData.push(props.teamMembers.length - presentCount);
            }
            if(ctx) {
                chartInstances.current.attendance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [
                            { label: 'Present', data: presentData, backgroundColor: '#10B981', borderRadius: 4 },
                            { label: 'Absent', data: absentData, backgroundColor: '#F59E0B', borderRadius: 4 }
                        ]
                    },
                    options: { ...chartOptions, scales: { x: { stacked: true, grid: { display: false }, ticks: { color: textColor } }, y: { stacked: true, grid: { color: gridColor }, ticks: { color: textColor } } } }
                });
            }
        }
    }, [props.teamMembers]);

    return (
        <div className="space-y-8">
            {/* Top Widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                <StatCard title="Total Employees" value={dashboardStats.totalEmployees} icon={Users} colorClass="bg-blue-500" />
                <StatCard title="Onboarding Now" value={dashboardStats.onboardingNow} icon={UserCheck} badge={dashboardStats.onboardingNow > 0 ? `${dashboardStats.onboardingNow} New` : undefined} colorClass="bg-purple-500" />
                <StatCard title="Pending Leaves" value={dashboardStats.pendingLeaves} icon={Clock} badge={dashboardStats.pendingLeaves > 0 ? `${dashboardStats.pendingLeaves}` : undefined} colorClass="bg-amber-500" />
                <StatCard title="Present Today" value={dashboardStats.presentToday} icon={CalendarCheck} colorClass="bg-green-500" />
                <StatCard title="Pending Payroll" value={dashboardStats.pendingPayroll} icon={Wallet} colorClass="bg-indigo-500" />
                <StatCard title="Upcoming Birthdays" value={dashboardStats.upcomingBirthdays} icon={Cake} colorClass="bg-rose-500" />
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center">
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 mr-2">Quick Actions:</span>
                <Button variant="primary" size="sm" onClick={() => props.onOpenTeamMemberHRFormModal()} leftIcon={<Plus className="w-4 h-4"/>}>Add Employee</Button>
                <Button variant="secondary" size="sm" onClick={props.onOpenMarkAttendanceModal} leftIcon={<Calendar className="w-4 h-4"/>}>Mark Attendance</Button>
                <Button variant="secondary" size="sm" onClick={props.onOpenApproveLeavesModal} leftIcon={<Clock className="w-4 h-4"/>}>Approve Leaves</Button>
                <Button variant="secondary" size="sm" onClick={props.onOpenUploadHRDocumentModal} leftIcon={<FileText className="w-4 h-4"/>}>Upload Docs</Button>
                <Button variant="secondary" size="sm" onClick={props.onOpenScheduleExitInterviewModal} leftIcon={<LogOut className="w-4 h-4"/>}>Exit Interview</Button>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <Card title="Headcount by Department" className="lg:col-span-2 bg-white dark:bg-slate-800"><div className="h-64"><canvas ref={headcountChartRef}></canvas></div></Card>
                <Card title="Attendance Trends (Last 15 Days)" className="lg:col-span-3 bg-white dark:bg-slate-800"><div className="h-64"><canvas ref={attendanceChartRef}></canvas></div></Card>
            </div>

            {/* Tables */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card title="Recent Onboardings" className="bg-white dark:bg-slate-800">
                    <div className="overflow-x-auto">
                         <table className="min-w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/30"><tr><th className="p-3 rounded-tl-lg">Name</th><th className="p-3">Department</th><th className="p-3">Joined</th><th className="p-3 rounded-tr-lg text-center">Status</th></tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {recentOnboardings.map(tm => (<tr key={tm.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{tm.name}</td>
                                    <td className="p-3 text-slate-500 dark:text-slate-400">{tm.department || 'N/A'}</td>
                                    <td className="p-3 text-slate-500 dark:text-slate-400">{new Date(tm.dateJoined).toLocaleDateString()}</td>
                                    <td className="p-3 text-center"><span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">{tm.hrStatus}</span></td>
                                </tr>))}
                                {recentOnboardings.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-400 text-xs">No recent onboardings.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                 </Card>
                 <Card title="Pending Leave Requests" className="bg-white dark:bg-slate-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/30"><tr><th className="p-3 rounded-tl-lg">Employee</th><th className="p-3">Type</th><th className="p-3">Dates</th><th className="p-3 rounded-tr-lg text-right">Action</th></tr></thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {pendingLeaveRequests.map(req => (<tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                                    <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{req.memberName}</td>
                                    <td className="p-3 text-slate-500 dark:text-slate-400">{req.leaveType}</td>
                                    <td className="p-3 text-slate-500 dark:text-slate-400 text-xs">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</td>
                                    <td className="p-3 text-right"><Button size="xs" variant="secondary" onClick={props.onOpenApproveLeavesModal}>Review</Button></td>
                                </tr>))}
                                {pendingLeaveRequests.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-slate-400 text-xs">No pending leave requests.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </Card>
             </div>
        </div>
    );
};
