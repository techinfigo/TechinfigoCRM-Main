

import React, { useState, useMemo } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { TeamMember, PayrollRecord, PayrollStatus, AppSettings } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { EmptyStatePlaceholder } from '../partials/EmptyStatePlaceholder';
import { Wallet } from 'lucide-react';

interface PayrollViewProps {
  teamMembers: TeamMember[];
  payrollRecords: PayrollRecord[];
  onOpenPayslipModal: (payrollRecord: PayrollRecord, member: TeamMember) => void;
  onOpenProcessSalaryModal: (payrollRecord: PayrollRecord, member: TeamMember) => void;
  onRunBulkPayroll: (monthYear: string) => void;
  appSettings: AppSettings;
}

const CurrencyRupeeIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path d="M10.06 5.895a.75.75 0 00-1.062.014l-3.75 4.061a.75.75 0 00.53 1.28h2.472v.531A2.53 2.53 0 0010.75 14h.5a.75.75 0 000-1.5h-.5a1.03 1.03 0 01-1.03-1.031v-.531h.97a.75.75 0 00.53-1.28l-3.75-4.061a.75.75 0 00-.638-.289zM10.75 3.5a.75.75 0 00-1.5 0v1.25h1.5V3.5z" /><path fillRule="evenodd" d="M7.25 1A5.75 5.75 0 001.5 6.75v6.5A5.75 5.75 0 007.25 19h5.5A5.75 5.75 0 0018.5 13.25v-6.5A5.75 5.75 0 0012.75 1h-5.5zM6.293 3.22a4.25 4.25 0 017.414 0H6.293zM4.5 6.75a4.25 4.25 0 014.087-4.244.75.75 0 00.326 1.456A2.75 2.75 0 004.5 6.75v6.5A2.75 2.75 0 007.25 16h5.5A2.75 2.75 0 0015.5 13.25v-6.5a2.75 2.75 0 00-3.413-2.706.75.75 0 00.326-1.456A4.25 4.25 0 0115.5 6.75v6.5a4.25 4.25 0 01-4.25 4.25h-5.5A4.25 4.25 0 013 13.25v-6.5c0-.35.043-.69.125-1.018A4.232 4.232 0 014.5 6.75z" clipRule="evenodd" /></svg>;
const UserGroupIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326C1.38 14.544 1.503 13.712 1.838 13.018A6.985 6.985 0 013 12.5a6.985 6.985 0 011-2.482 1.036 1.036 0 00-.733-1.63C2.112 8.281 1.085 9.074.8 10.022A7.003 7.003 0 000 12.5a7.003 7.003 0 00.8 2.478.998.998 0 001.65-.036A6.985 6.985 0 013 12.5c0-1.26.368-2.439.996-3.461a1 1 0 00-1.44-1.23C1.619 8.951 1 10.082 1 11.318a7.982 7.982 0 001.49 4.008zM19.199 10.022C18.914 9.074 17.887 8.28 16.742 8.384a1.036 1.036 0 00-.733 1.63A6.985 6.985 0 0117 12.5a6.985 6.985 0 01-1.004 3.461 1 1 0 001.44 1.23c.895-1.12.96-2.428.96-3.873a7.982 7.982 0 00-1.49-4.009zM14 8a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-6 h-6"}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
const EyeIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /><path fillRule="evenodd" d="M1.31 8.157a.75.75 0 0 1 0-.314C2.172 6.296 4.886 4.25 8 4.25s5.829 2.046 6.69 3.593a.75.75 0 0 1 0 .314C13.828 9.704 11.114 11.75 8 11.75S2.172 9.704 1.31 8.157ZM8 6.25a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z" clipRule="evenodd" /></svg>;

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <Card className="bg-bg-base dark:bg-bg-muted" contentClassName="flex items-center space-x-4 p-4">
        <div className="p-3 bg-secondary-accent/10 rounded-lg text-secondary-accent">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-text-heading dark:text-text-heading">{value}</p>
            <p className="text-sm text-text-muted dark:text-text-muted">{title}</p>
        </div>
    </Card>
);

const getStatusBadgeStyle = (status: PayrollStatus) => {
    switch (status) {
        case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'Processed': return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'Approved': return 'bg-green-100 text-green-800 border-green-300';
        case 'Hold': return 'bg-red-100 text-red-800 border-red-300';
        default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
};

export const PayrollView: React.FC<PayrollViewProps> = ({ teamMembers, payrollRecords, onOpenPayslipModal, onOpenProcessSalaryModal, onRunBulkPayroll, appSettings }) => {
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const [isRunningPayroll, setIsRunningPayroll] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const payrollDataForMonth = useMemo(() => {
        return teamMembers.map(member => {
            const existingRecord = payrollRecords.find(pr => pr.employeeId === member.id && pr.monthYear === selectedMonth);
            if (existingRecord) {
                return { member, record: existingRecord };
            }
            // Generate a pending record if none exists for the selected month
            const baseSalary = member.monthlySalary || 0;
            const deductions = baseSalary * 0.12; // Example
            const bonuses = 0;
            const netSalary = baseSalary + bonuses - deductions;
            
            const pendingRecord: PayrollRecord = {
                id: `pending-${member.id}-${selectedMonth}`,
                employeeId: member.id,
                monthYear: selectedMonth,
                baseSalary: baseSalary,
                attendanceDays: 22,
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

    const handleRunBulkPayroll = () => {
        if (isRunningPayroll) return;
        setIsRunningPayroll(true);
        onRunBulkPayroll(selectedMonth);
        setTimeout(() => setIsRunningPayroll(false), 400);
    };

    const handleProcessClick = (member: TeamMember, record: PayrollRecord) => {
        if (processingId) return;
        setProcessingId(record.id);
        onOpenProcessSalaryModal(record, member);
        setTimeout(() => setProcessingId(null), 400);
    };

    return (
        <Card title="Payroll Processing" className="bg-transparent shadow-none border-0 p-0 h-full flex flex-col">
            <div className="flex-grow space-y-6 overflow-y-auto p-1">
                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <StatCard title="Total Employees" value={teamMembers.length} icon={<UserGroupIcon />} />
                    <StatCard title="Total Payout this Month" value={formatCurrency(dashboardStats.totalPayout)} icon={<CurrencyRupeeIcon />} />
                    <StatCard title="Salaries Processed" value={`${dashboardStats.processedCount} / ${teamMembers.length}`} icon={<CheckCircleIcon />} />
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <Input
                        label="Select Payroll Month"
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        containerClassName="max-w-xs"
                    />
                    <Button variant="primary" onClick={handleRunBulkPayroll} isLoading={isRunningPayroll} disabled={isRunningPayroll}>Run Bulk Payroll</Button>
                </div>

                {payrollDataForMonth.length === 0 ? (
                    <EmptyStatePlaceholder
                        icon={<Wallet className="w-16 h-16" />}
                        title="No Payroll Records"
                        message="There are no team members to generate payroll for yet."
                    />
                ) : (
                <>
                {/* Payroll Table */}
                <div className="overflow-x-auto rounded-lg border border-border-base dark:border-border-muted">
                    <table className="min-w-full text-sm">
                        <thead className="text-xs text-text-muted dark:text-text-muted uppercase bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-3 text-left">Employee</th>
                                <th className="p-3 text-right">Gross Salary</th>
                                <th className="p-3 text-right">Deductions</th>
                                <th className="p-3 text-right">Net Salary</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-base dark:divide-border-muted">
                            {paginatedData.map(({ member, record }) => (
                                <tr key={member.id}>
                                    <td className="p-3 font-medium">{member.name} <span className="text-xs text-text-muted">({member.department})</span></td>
                                    <td className="p-3 text-right">{formatCurrency(record.baseSalary + record.bonuses)}</td>
                                    <td className="p-3 text-right text-red-500">{formatCurrency(record.deductions)}</td>
                                    <td className="p-3 text-right font-semibold">{formatCurrency(record.netSalary)}</td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xxs border ${getStatusBadgeStyle(record.status)}`}>{record.status}</span>
                                    </td>
                                    <td className="p-3 text-right space-x-1">
                                        {record.status === 'Pending' && (
                                            <Button size="xs" onClick={() => handleProcessClick(member, record)} isLoading={processingId === record.id} disabled={processingId === record.id}>Process</Button>
                                        )}
                                        {record.status !== 'Pending' && (
                                            <Button size="xs" variant="outline" onClick={() => onOpenPayslipModal(record, member)} leftIcon={<EyeIcon />}>Payslip</Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     <Pagination {...paginationProps} />
                </div>
                </>
                )}
            </div>
        </Card>
    );
};
