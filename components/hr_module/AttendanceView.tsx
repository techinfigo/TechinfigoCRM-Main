
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TeamMember, DailyAttendanceRecord, AttendanceEntry, AttendanceStatus, attendanceStatuses } from '../../types';
import Chart from 'chart.js/auto';
import { EmptyStatePlaceholder } from '../partials/EmptyStatePlaceholder';
import { Users } from 'lucide-react';

const getAttendanceStatusBadgeStyle = (status: AttendanceStatus): string => {
    switch (status) {
        case 'Present': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
        case 'Late': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
        case 'Half-Day': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
        case 'Leave': return 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800';
        case 'Absent': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
        default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/30 dark:text-slate-400 dark:border-slate-600';
    }
};

interface AttendanceViewProps {
  teamMembers: TeamMember[];
  dailyAttendanceRecords: DailyAttendanceRecord[];
  onOpenMarkAttendanceModal: () => void;
  onSaveAttendance: (record: DailyAttendanceRecord) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode; }> = ({ title, value, icon }) => (
    <Card className="bg-bg-base dark:bg-bg-muted" contentClassName="flex items-center space-x-4 p-4">
        {icon && <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">{icon}</div>}
        <div>
            <p className="text-2xl font-bold text-text-heading dark:text-text-heading">{value}</p>
            <p className="text-sm text-text-muted dark:text-text-muted">{title}</p>
        </div>
    </Card>
);

export const AttendanceView: React.FC<AttendanceViewProps> = ({ teamMembers, dailyAttendanceRecords, onOpenMarkAttendanceModal, onSaveAttendance }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState<Date>(today);

    const weeklyTrendChartRef = useRef<HTMLCanvasElement>(null);
    const departmentPieChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ weekly?: any; department?: any }>({});

    const todayAttendance = useMemo(() => {
        const todayRecord = dailyAttendanceRecords.find(r => r.date === today.toISOString().split('T')[0]);
        if (!todayRecord) return { present: 0, absent: teamMembers.length, late: 0, onLeave: 0 };
        const present = todayRecord.entries.filter(e => e.status === 'Present').length;
        const late = todayRecord.entries.filter(e => e.status === 'Late').length;
        const onLeave = todayRecord.entries.filter(e => e.status === 'Leave').length;
        const absent = teamMembers.length - present - late - onLeave;
        return { present: present + late, absent, late, onLeave };
    }, [dailyAttendanceRecords, teamMembers, today]);

    const firstDayOfMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);
    const daysInMonth = useMemo(() => {
        const days: (Date | null)[] = [];
        const startDayOfWeek = firstDayOfMonth.getDay();
        const numDays = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0).getDate();
        for (let i = 0; i < startDayOfWeek; i++) days.push(null);
        for (let i = 1; i <= numDays; i++) days.push(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), i));
        const remainingCells = (7 - (days.length % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) days.push(null);
        return days;
    }, [firstDayOfMonth, currentMonthDate]);

    const dailyStatuses = useMemo(() => {
      const statuses: { [key: string]: { present: number; absent: number; late: number } } = {};
      dailyAttendanceRecords.forEach(record => {
          statuses[record.date] = record.entries.reduce((acc, entry) => {
              if(entry.status === 'Present') acc.present++;
              if(entry.status === 'Absent') acc.absent++;
              if(entry.status === 'Late') acc.late++;
              return acc;
          }, {present: 0, absent: 0, late: 0});
      });
      return statuses;
    }, [dailyAttendanceRecords]);
    
    useEffect(() => {
        Object.values(chartInstances.current).forEach((chart: any) => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        chartInstances.current = {};
        
        // Dummy data for charts
        if(weeklyTrendChartRef.current) {
            const ctx = weeklyTrendChartRef.current.getContext('2d');
            if(ctx) chartInstances.current.weekly = new Chart(ctx, { type: 'line', data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], datasets: [{ label: 'Attendance %', data: [95, 98, 92, 97, 94], tension: 0.1, borderColor: '#fcb632' }] }, options: { responsive: true, maintainAspectRatio: false } });
        }
        if(departmentPieChartRef.current) {
            const ctx = departmentPieChartRef.current.getContext('2d');
            if(ctx) chartInstances.current.department = new Chart(ctx, { type: 'pie', data: { labels: ['Development', 'Design', 'Marketing', 'Management'], datasets: [{ data: [12, 7, 9, 3] }] }, options: { responsive: true, maintainAspectRatio: false } });
        }
    }, []);

    const selectedDayEntries = useMemo(() => {
        const record = dailyAttendanceRecords.find(r => r.date === selectedDate.toISOString().split('T')[0]);
        return teamMembers.map(member => {
            const entry = record?.entries.find(e => e.memberId === member.id);
            return {
                member,
                entry: entry || { memberId: member.id, status: 'N/A' as AttendanceStatus }
            };
        });
    }, [selectedDate, dailyAttendanceRecords, teamMembers]);


    return (
        <Card title="Attendance Dashboard" className="bg-transparent shadow-none border-0 p-0 h-full flex flex-col">
            <div className="flex-grow space-y-6 overflow-y-auto p-1">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
                    <StatCard title="Total Employees" value={teamMembers.length} />
                    <StatCard title="Present Today" value={todayAttendance.present} />
                    <StatCard title="Absent Today" value={todayAttendance.absent} />
                    <StatCard title="Late Comers" value={todayAttendance.late} />
                    <StatCard title="On Leave" value={todayAttendance.onLeave} />
                </div>
                
                {/* Calendar */}
                <Card title="Monthly Attendance Calendar" actions={<Button onClick={onOpenMarkAttendanceModal} variant="primary">Mark Today's Attendance</Button>}>
                    <div className="flex justify-between items-center mb-4">
                        <Button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1))}>&lt; Prev</Button>
                        <h4 className="font-semibold">{currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
                        <Button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1))}>Next &gt;</Button>
                    </div>
                    <div className="grid grid-cols-7 gap-px border border-border-base dark:border-border-muted bg-border-base dark:bg-border-muted rounded-lg overflow-hidden">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2 text-center text-xs font-semibold bg-bg-muted dark:bg-slate-700/50">{day}</div>)}
                        {daysInMonth.map((day, index) => {
                            if (!day) return <div key={index} className="bg-slate-50 dark:bg-slate-800/30"></div>;
                            const dayStr = day.toISOString().split('T')[0];
                            const status = dailyStatuses[dayStr];
                            const isSelected = day.getTime() === selectedDate.getTime();
                            return (
                                <div key={index} onClick={() => setSelectedDate(day)} className={`p-2 min-h-[80px] cursor-pointer ${isSelected ? 'bg-secondary-accent/20 border-2 border-secondary-accent' : 'bg-bg-base dark:bg-bg-muted hover:bg-highlight-accent'}`}>
                                    <span className={`text-xs font-semibold ${day.getTime() === today.getTime() ? 'text-secondary-accent font-bold' : ''}`}>{day.getDate()}</span>
                                    {status && <div className="flex justify-center mt-2 space-x-1">{status.present > 0 && <span className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Present"></span>}{status.late > 0 && <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" title="Late"></span>}{status.absent > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" title="Absent"></span>}</div>}
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Daily Records Table */}
                <Card title={`Attendance for ${selectedDate.toLocaleDateString()}`}>
                    {selectedDayEntries.length === 0 ? (
                        <EmptyStatePlaceholder
                            icon={<Users className="w-16 h-16" />}
                            title="No Attendance Records"
                            message="There are no team members to show attendance for yet."
                        />
                    ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-left">Department</th><th className="p-2 text-left">Check-in</th><th className="p-2 text-left">Check-out</th><th className="p-2 text-center">Status</th></tr></thead>
                            <tbody className="divide-y divide-border-base dark:divide-border-muted">
                                {selectedDayEntries.map(({member, entry}) => (
                                    <tr key={member.id}>
                                        <td className="p-2 font-medium">{member.name}</td><td>{member.department}</td><td>{entry.checkInTime || 'N/A'}</td><td>{entry.checkOutTime || 'N/A'}</td>
                                        <td className="text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getAttendanceStatusBadgeStyle(entry.status)}`}>{entry.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    )}
                </Card>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <Card title="Weekly Attendance Trend"><div className="h-64"><canvas ref={weeklyTrendChartRef}></canvas></div></Card>
                    <Card title="Department-wise Attendance"><div className="h-64 flex items-center justify-center"><canvas ref={departmentPieChartRef}></canvas></div></Card>
                </div>
            </div>
        </Card>
    );
};
