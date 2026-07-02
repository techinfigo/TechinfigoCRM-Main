
import React, { useState, useMemo } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { TeamMember, PayrollRecord, PayrollStatus, AppSettings } from '../../../types';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '../../common/Pagination';
import { IndianRupee, Users, CheckCircle2, Eye, Play, AlertCircle } from 'lucide-react';

interface PayrollViewProps {
  teamMembers: TeamMember[];
  payrollRecords: PayrollRecord[];
  onOpenPayslipModal: (payrollRecord: PayrollRecord, member: TeamMember) => void;
  onOpenProcessSalaryModal: (payrollRecord: PayrollRecord, member: TeamMember) => void;
  appSettings: AppSettings;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string }> = ({ title, value, icon, colorClass }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        </div>
    </div>
);

const getStatusBadgeStyle = (status: PayrollStatus) => {
    switch (status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
        case 'Processed': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
        case 'Approved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
        case 'Hold': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
        default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
};

export const PayrollView: React.FC<PayrollViewProps> = ({ teamMembers, payrollRecords, onOpenPayslipModal, onOpenProcessSalaryModal, appSettings }) => {
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));

    const payrollDataForMonth = useMemo(() => {
        return teamMembers.map(member => {
            const existingRecord = payrollRecords.find(pr => pr.employeeId === member.id && pr.monthYear === selectedMonth);
            if (existingRecord) {
                return { member, record: existingRecord };
            }
            // Generate a pending record if none exists for the selected month
            const baseSalary = member.monthlySalary || 0;
            const deductions = baseSalary * 0.12; // Example deduction logic
            const bonuses = 0;
            const netSalary = baseSalary + bonuses - deductions;
            
            const pendingRecord: PayrollRecord = {
                id: `pending-${member.id}-${selectedMonth}`,
                employeeId: member.id,
                monthYear: selectedMonth,
                baseSalary: baseSalary,
                attendanceDays: 22, // Example fixed days
                deductions: parseFloat(deductions.toFixed(2)),
                bonuses,
                netSalary: parseFloat(netSalary.toFixed(2)),
                status: 'Pending',
            };
            return { member, record: pendingRecord };
        });
    }, [teamMembers, payrollRecords, selectedMonth]);

    const { paginatedData, ...paginationProps } = usePagination({ data: payrollDataForMonth });
    
    const dashboardStats = useMemo(() => {
        const currentMonthRecords = payrollDataForMonth.map(d => d.record);
        const totalPayout = currentMonthRecords.reduce((sum, r) => sum + r.netSalary, 0);
        const processedCount = currentMonthRecords.filter(r => r.status === 'Processed' || r.status === 'Approved').length;
        return { totalPayout, processedCount };
    }, [payrollDataForMonth]);
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: appSettings.defaultCurrency || 'INR' }).format(amount);
    };

    return (
        <div className="space-y-6">
             {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Employees" value={teamMembers.length} icon={<Users className="text-blue-600" />} colorClass="bg-blue-100 dark:bg-blue-900/30" />
                <StatCard title="Total Payout" value={formatCurrency(dashboardStats.totalPayout)} icon={<IndianRupee className="text-green-600" />} colorClass="bg-green-100 dark:bg-green-900/30" />
                <StatCard title="Processed" value={`${dashboardStats.processedCount} / ${teamMembers.length}`} icon={<CheckCircle2 className="text-purple-600" />} colorClass="bg-purple-100 dark:bg-purple-900/30" />
            </div>

            <Card title="Payroll Management" className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700">
                {/* Filters & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                    <div className="w-full sm:w-auto">
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payroll Period</label>
                         <Input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            containerClassName="w-full sm:w-48"
                        />
                    </div>
                    <Button variant="primary" onClick={() => alert('Conceptual: Run bulk payroll.')} leftIcon={<Play className="w-4 h-4"/>}>Run Bulk Payroll</Button>
                </div>
                
                {/* Payroll Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gross Salary</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Deductions</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Pay</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                            {paginatedData.map(({ member, record }) => (
                                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-slate-900 dark:text-white">{member.name}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{member.department}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-300 font-mono">{formatCurrency(record.baseSalary + record.bonuses)}</td>
                                    <td className="px-6 py-4 text-right text-red-600 dark:text-red-400 font-mono">-{formatCurrency(record.deductions)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(record.netSalary)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(record.status)}`}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {record.status === 'Pending' ? (
                                            <Button size="xs" variant="secondary" onClick={() => onOpenProcessSalaryModal(record, member)}>Process</Button>
                                        ) : (
                                            <Button size="xs" variant="ghost" onClick={() => onOpenPayslipModal(record, member)} className="text-slate-500 hover:text-premium-accent" title="View Payslip"><Eye className="w-4 h-4" /></Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="pt-4">
                    <Pagination {...paginationProps} />
                 </div>
            </Card>
        </div>
    );
};
