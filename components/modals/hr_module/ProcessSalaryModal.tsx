
import React from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { PayrollRecord, TeamMember } from '../../../types';

interface ProcessSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payrollRecord: PayrollRecord;
  member: TeamMember;
}

export const ProcessSalaryModal: React.FC<ProcessSalaryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  payrollRecord,
  member,
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Salary Processing"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm}>Confirm & Process</Button>
        </>
      }
    >
      <div className="text-sm text-text-muted dark:text-text-base">
        <p className="mb-4">
          Are you sure you want to process the salary for the following employee for the month of <strong>{new Date(payrollRecord.monthYear + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</strong>?
        </p>
        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-border-base dark:border-border-muted space-y-1">
          <p><strong>Employee:</strong> {member.name}</p>
          <p><strong>Net Salary:</strong> ₹{payrollRecord.netSalary.toLocaleString()}</p>
        </div>
        <p className="mt-4 text-xs text-status-warning">
          This action will mark the salary as 'Processed' and is generally irreversible from this interface.
        </p>
      </div>
    </Modal>
  );
};
