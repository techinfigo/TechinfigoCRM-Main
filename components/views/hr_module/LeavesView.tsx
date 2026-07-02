
import React, { useState, useMemo } from 'react';
import { LeaveRequest, LeaveRequestStatus, TeamMember, FeatureKey, PermissionAction, leaveRequestStatuses } from '../../../types';
import { Button } from '../../common/Button';
import { Card } from '../../common/Card';
import { Plus, Check, X, Calendar, Clock, User } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { DateRangePicker, DateRange } from '../../common/DateRangePicker';
import { isDateInRange } from '@/utils';

interface LeavesViewProps {
  leaveRequests: LeaveRequest[];
  currentUser: TeamMember;
  teamMembers: TeamMember[]; 
  onOpenLeaveRequestModal: (leaveRequest?: LeaveRequest) => void; 
  onUpdateLeaveStatus: (requestId: string, status: LeaveRequestStatus, adminNotes?: string) => void;
  onCancelLeaveRequest: (requestId: string) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

const getStatusBadgeStyle = (status: LeaveRequestStatus): string => {
  switch (status) {
    case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
    case 'Approved': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
    case 'Rejected': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    case 'CancelledByEmployee':
    case 'CancelledByAdmin': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export const LeavesView: React.FC<LeavesViewProps> = ({
  leaveRequests, currentUser, teamMembers, onOpenLeaveRequestModal, onUpdateLeaveStatus, onCancelLeaveRequest, hasPermission
}) => {
  const canRequestLeave = hasPermission('leaves', 'canRequestLeave');
  const canViewAllLeave = hasPermission('leaves', 'canViewAllLeave');
  const canManageLeaveRequests = hasPermission('leaves', 'canManageLeaveRequests');
  const canCancelOwnLeave = hasPermission('leaves', 'canCancelOwnLeave');

  const [activeTab, setActiveTab] = useState<'My Leaves' | 'Team Requests'>('My Leaves');
  const [filterStatus, setFilterStatus] = useState<LeaveRequestStatus | 'All'>('All');
  const [filterMemberId, setFilterMemberId] = useState<string>('All');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const myLeaveRequests = useMemo(() => 
    leaveRequests.filter(req => req.memberId === currentUser.id && isDateInRange(req.startDate, dateRange))
                 .sort((a,b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()),
  [leaveRequests, currentUser.id, dateRange]);

  const teamLeaveRequests = useMemo(() => {
    if (!canViewAllLeave) return [];
    return leaveRequests
      .filter(req => {
        const statusMatch = filterStatus === 'All' || req.status === filterStatus;
        const memberMatch = filterMemberId === 'All' || req.memberId === filterMemberId;
        const rangeMatch = isDateInRange(req.startDate, dateRange);
        return statusMatch && memberMatch && rangeMatch;
      })
      .sort((a,b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
  }, [leaveRequests, canViewAllLeave, filterStatus, filterMemberId, dateRange]);
  
  const renderLeaveTable = (requests: LeaveRequest[], isTeamView: boolean) => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
          <tr>
            {isTeamView && <th className="px-4 py-3">Employee</th>}
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Duration</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3 text-center">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {requests.map(req => (
            <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
              {isTeamView && (
                  <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                          <div className="p-1 bg-slate-100 dark:bg-slate-700 rounded-full"><User className="w-3 h-3 text-slate-500"/></div>
                          {req.memberName}
                      </div>
                  </td>
              )}
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{req.leaveType}</td>
              <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-400"/>
                      <span>{new Date(req.startDate).toLocaleDateString()}</span>
                      <span className="text-slate-400">-</span>
                      <span>{new Date(req.endDate).toLocaleDateString()}</span>
                  </div>
              </td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate italic">"{req.reason}"</td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(req.status)}`}>
                    {req.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {req.status === 'Pending' && (
                  <div className="flex justify-end gap-2">
                    {isTeamView && canManageLeaveRequests && (
                      <>
                        <Button variant="ghost" size="xs" onClick={() => onUpdateLeaveStatus(req.id, 'Approved')} className="text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 !p-1.5" title="Approve"><Check className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="xs" onClick={() => {
                            const reason = prompt("Reason for rejection (optional):");
                            onUpdateLeaveStatus(req.id, 'Rejected', reason || undefined);
                        }} className="text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 !p-1.5" title="Reject"><X className="w-4 h-4"/></Button>
                      </>
                    )}
                    {!isTeamView && canCancelOwnLeave && (
                      <Button variant="outline" size="xs" onClick={() => onCancelLeaveRequest(req.id)} className="text-slate-500 border-slate-300 hover:text-red-600 hover:border-red-500 transition-colors">Cancel</Button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg inline-flex">
            <button 
                onClick={() => setActiveTab('My Leaves')} 
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'My Leaves' ? 'bg-white dark:bg-slate-700 text-premium-accent dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
                My Leaves
            </button>
            {canViewAllLeave && (
                <button 
                    onClick={() => setActiveTab('Team Requests')} 
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'Team Requests' ? 'bg-white dark:bg-slate-700 text-premium-accent dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                    Team Requests
                </button>
            )}
          </div>
          {canRequestLeave && (
            <Button onClick={() => onOpenLeaveRequestModal()} variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                Request Leave
            </Button>
          )}
      </div>

      <Card className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700" contentClassName="p-0">
          {activeTab === 'My Leaves' ? (
             myLeaveRequests.length === 0 ? 
                <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                    <p>You haven't requested any leaves yet.</p>
                </div> : 
                renderLeaveTable(myLeaveRequests, false)
          ) : (
             <div className="flex flex-col">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap gap-3">
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value as LeaveRequestStatus | 'All')}
                        className="text-sm p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-premium-accent outline-none cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        {leaveRequestStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select 
                        value={filterMemberId} 
                        onChange={(e) => setFilterMemberId(e.target.value)}
                        className="text-sm p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-premium-accent outline-none cursor-pointer"
                    >
                        <option value="All">All Team Members</option>
                        {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
                    </select>
                    <DateRangePicker onApply={setDateRange} initialRange={dateRange || undefined} />
                </div>
                {teamLeaveRequests.length === 0 ? 
                    <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                         <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                        <p>No matching leave requests found.</p>
                    </div> : 
                    renderLeaveTable(teamLeaveRequests, true)
                }
             </div>
          )}
      </Card>
    </div>
  );
};
