
import React, { useState, useMemo } from 'react';
import { LeaveRequest, LeaveRequestStatus, LeaveType, TeamMember, FeatureKey, PermissionAction, leaveTypes, leaveRequestStatuses } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { EmptyStatePlaceholder } from '../partials/EmptyStatePlaceholder';
import { CalendarClock, Users } from 'lucide-react';

interface LeavesViewProps {
  leaveRequests: LeaveRequest[];
  currentUser: TeamMember;
  teamMembers: TeamMember[]; // For admin view to show names
  onOpenLeaveRequestModal: (leaveRequest?: LeaveRequest) => void; // This will now trigger TeamActionModal
  onUpdateLeaveStatus: (requestId: string, status: LeaveRequestStatus, adminNotes?: string) => void;
  onCancelLeaveRequest: (requestId: string) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

// Icons
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.35 2.35 4.492-6.738a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M2.697 2.697a.75.75 0 0 1 1.06 0L8 6.94l4.243-4.243a.75.75 0 1 1 1.06 1.06L9.06 8l4.243 4.243a.75.75 0 1 1-1.06 1.06L8 9.06l-4.243 4.243a.75.75 0 0 1-1.06-1.06L6.94 8 2.697 3.757a.75.75 0 0 1 0-1.06Z" /></svg>;

const getStatusBadgeStyle = (status: LeaveRequestStatus): string => {
  switch (status) {
    case 'Pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-700/30 dark:text-yellow-300 dark:border-yellow-800';
    case 'Approved': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-700/30 dark:text-green-300 dark:border-green-800';
    case 'Rejected': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-700/30 dark:text-red-300 dark:border-red-800';
    case 'CancelledByEmployee':
    case 'CancelledByAdmin': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-600/30 dark:text-slate-400 dark:border-slate-600';
    default: return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600';
  }
};

export const LeavesView: React.FC<LeavesViewProps> = ({
  leaveRequests, currentUser, teamMembers, onOpenLeaveRequestModal, onUpdateLeaveStatus, onCancelLeaveRequest, hasPermission
}) => {
  const canRequestLeave = hasPermission('leaves', 'canRequestLeave');
  const canViewAllLeave = hasPermission('leaves', 'canViewAllLeave');
  const canManageLeaveRequests = hasPermission('leaves', 'canManageLeaveRequests');
  const canCancelOwnLeave = hasPermission('leaves', 'canCancelOwnLeave');

  const [filterStatus, setFilterStatus] = useState<LeaveRequestStatus | 'All'>('All');
  const [filterMemberId, setFilterMemberId] = useState<string>('All');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const withProcessing = (requestId: string, action: () => void) => {
    if (processingIds.has(requestId)) return;
    setProcessingIds(prev => new Set(prev).add(requestId));
    action();
    setTimeout(() => {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }, 400);
  };

  const myLeaveRequests = useMemo(() =>
    leaveRequests.filter(req => req.memberId === currentUser.id)
                 .sort((a,b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()),
  [leaveRequests, currentUser.id]);

  const teamLeaveRequests = useMemo(() => {
    if (!canViewAllLeave) return [];
    return leaveRequests
      .filter(req => {
        const statusMatch = filterStatus === 'All' || req.status === filterStatus;
        const memberMatch = filterMemberId === 'All' || req.memberId === filterMemberId;
        return statusMatch && memberMatch;
      })
      .sort((a,b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime());
  }, [leaveRequests, canViewAllLeave, filterStatus, filterMemberId]);
  
  const selectBaseClass = "p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm text-text-base dark:text-text-base";
  const optionClass = "bg-bg-base dark:bg-bg-muted text-text-base dark:text-text-base";

  const renderLeaveTable = (requests: LeaveRequest[], isTeamView: boolean) => (
    <div className="overflow-x-auto rounded-lg border border-border-base dark:border-border-muted">
      <table className="min-w-full divide-y divide-border-base dark:divide-border-muted">
        <thead className="bg-bg-muted dark:bg-slate-700/50">
          <tr>
            {isTeamView && <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Member</th>}
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Leave Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Dates (Start - End)</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Reason</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Requested On</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-bg-base dark:bg-bg-muted divide-y divide-border-base dark:divide-border-muted">
          {requests.map(req => (
            <tr key={req.id} className="hover:bg-highlight-accent dark:hover:bg-slate-700/60 transition-colors">
              {isTeamView && <td className="px-4 py-3 whitespace-nowrap text-sm text-text-base dark:text-text-base">{req.memberName}</td>}
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted dark:text-text-muted">{req.leaveType}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted dark:text-text-muted">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-sm text-text-muted dark:text-text-muted max-w-xs truncate" title={req.reason}>{req.reason}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(req.status)}`}>{req.status}</span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-text-muted dark:text-text-muted">{new Date(req.requestedDate).toLocaleDateString()}</td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-1">
                {req.status === 'Pending' && (
                  <>
                    {isTeamView && canManageLeaveRequests && (
                      <>
                        <Button variant="primary" size="xs" onClick={() => withProcessing(req.id, () => onUpdateLeaveStatus(req.id, 'Approved'))} isLoading={processingIds.has(req.id)} disabled={processingIds.has(req.id)} className="!p-1.5" title="Approve"><CheckIcon/></Button>
                        <Button variant="danger" size="xs" onClick={() => withProcessing(req.id, () => {
                            const reason = prompt("Reason for rejection (optional):");
                            onUpdateLeaveStatus(req.id, 'Rejected', reason || undefined);
                        })} isLoading={processingIds.has(req.id)} disabled={processingIds.has(req.id)} className="!p-1.5" title="Reject"><XMarkIcon/></Button>
                      </>
                    )}
                    {!isTeamView && canCancelOwnLeave && (
                      <Button variant="outline" size="xs" onClick={() => withProcessing(req.id, () => onCancelLeaveRequest(req.id))} isLoading={processingIds.has(req.id)} disabled={processingIds.has(req.id)} className="text-red-600 border-red-500 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/30">Cancel</Button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card title="Leave Management" className="bg-teal-50 dark:bg-teal-900/60 shadow-xl rounded-xl">
      {canRequestLeave && (
        <div className="mb-4">
            <Button onClick={() => onOpenLeaveRequestModal()} variant="primary" size="md" leftIcon={<PlusIcon />}>
                Request Leave
            </Button>
        </div>
      )}

      {/* My Leaves Section */}
      <Card title="My Leave Requests" className="mb-6 bg-bg-base dark:bg-bg-muted shadow-md">
        {myLeaveRequests.length === 0 ?
            <EmptyStatePlaceholder
                icon={<CalendarClock className="w-16 h-16" />}
                title="No Leave Requests"
                message="You haven't requested any leaves yet."
            />
            : renderLeaveTable(myLeaveRequests, false)
        }
      </Card>

      {/* Team Leaves Section (for Admins) */}
      {canViewAllLeave && (
        <Card title="Team Leave Requests" className="bg-bg-base dark:bg-bg-muted shadow-md">
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as LeaveRequestStatus | 'All')} className={selectBaseClass}>
              <option value="All" className={optionClass}>All Statuses</option>
              {leaveRequestStatuses.map(s => <option key={s} value={s} className={optionClass}>{s}</option>)}
            </select>
            <select value={filterMemberId} onChange={(e) => setFilterMemberId(e.target.value)} className={selectBaseClass}>
              <option value="All" className={optionClass}>All Team Members</option>
              {teamMembers.map(tm => <option key={tm.id} value={tm.id} className={optionClass}>{tm.name}</option>)}
            </select>
          </div>
          {teamLeaveRequests.length === 0 ?
            <EmptyStatePlaceholder
                icon={<Users className="w-16 h-16" />}
                title="No Leave Requests"
                message="No team leave requests match your filters."
            />
            : renderLeaveTable(teamLeaveRequests, true)
          }
        </Card>
      )}
    </Card>
  );
};
