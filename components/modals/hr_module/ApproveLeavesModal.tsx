
import React, { useState } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { LeaveRequest, LeaveRequestStatus } from '../../../types';

interface ApproveLeavesModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingRequests: LeaveRequest[];
  onUpdateLeaveStatus: (requestId: string, status: LeaveRequestStatus, adminNotes?: string) => void;
}

const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.35 2.35 4.492-6.738a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" /></svg>;
const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M2.697 2.697a.75.75 0 0 1 1.06 0L8 6.94l4.243-4.243a.75.75 0 1 1 1.06 1.06L9.06 8l4.243 4.243a.75.75 0 1 1-1.06 1.06L8 9.06l-4.243 4.243a.75.75 0 0 1-1.06-1.06L6.94 8 2.697 3.757a.75.75 0 0 1 0-1.06Z" /></svg>;


export const ApproveLeavesModal: React.FC<ApproveLeavesModalProps> = ({ isOpen, onClose, pendingRequests, onUpdateLeaveStatus }) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = (id: string, status: LeaveRequestStatus, notes?: string) => {
    if (processingId) return;
    setProcessingId(id);
    onUpdateLeaveStatus(id, status, notes);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve Pending Leave Requests"
      size="2xl"
      footer={<Button variant="secondary" onClick={onClose}>Close</Button>}
    >
      <div className="max-h-[60vh] overflow-y-auto space-y-3">
        {pendingRequests.length === 0 ? (
          <p className="text-center text-text-muted dark:text-text-muted py-8">No pending leave requests to approve.</p>
        ) : (
          pendingRequests.map(req => (
            <div key={req.id} className="p-3 bg-bg-muted dark:bg-slate-800/50 rounded-lg border border-border-base dark:border-border-muted flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex-grow">
                <p className="font-semibold text-text-base dark:text-text-base">{req.memberName}</p>
                <p className="text-xs text-text-muted dark:text-slate-400">
                  <span className="font-medium">{req.leaveType}</span> from {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-text-muted dark:text-slate-400 mt-1 italic">Reason: {req.reason}</p>
              </div>
              <div className="flex-shrink-0 flex gap-2 self-end sm:self-center">
                <Button variant="primary" size="xs" onClick={() => handleAction(req.id, 'Approved')} isLoading={processingId === req.id} disabled={processingId === req.id} className="!p-1.5" title="Approve">
                  <CheckIcon />
                </Button>
                <Button variant="danger" size="xs" onClick={() => {
                  const adminNotes = prompt("Reason for rejection (optional):");
                  handleAction(req.id, 'Rejected', adminNotes || undefined);
                }} isLoading={processingId === req.id} disabled={processingId === req.id} className="!p-1.5" title="Reject">
                  <XMarkIcon />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};
