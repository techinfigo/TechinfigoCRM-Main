
import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Input, TextArea } from '../../common/Input';
import { TeamMember } from '../../../types';

interface ScheduleExitInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[]; // Especially those with 'Resigned' status
  onSchedule: (employeeId: string, dateTime: string, notes: string) => void;
}

export const ScheduleExitInterviewModal: React.FC<ScheduleExitInterviewModalProps> = ({ isOpen, onClose, teamMembers, onSchedule }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [interviewDateTime, setInterviewDateTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  const resignedMembers = teamMembers.filter(tm => tm.hrStatus === 'Resigned');

  useEffect(() => {
    if (isOpen) {
        // Reset state when modal opens
        setSelectedEmployeeId(resignedMembers.length > 0 ? resignedMembers[0].id : '');
        const defaultDateTime = new Date();
        defaultDateTime.setDate(defaultDateTime.getDate() + 1); // Default to tomorrow
        setInterviewDateTime(defaultDateTime.toISOString().substring(0, 16));
        setNotes('');
        setError(null);
        setIsScheduling(false);
    }
  }, [isOpen, resignedMembers]);

  const handleSchedule = () => {
    if (isScheduling) return;
    if (!selectedEmployeeId) {
      setError('Please select an employee.');
      return;
    }
    if (!interviewDateTime) {
      setError('Please select an interview date and time.');
      return;
    }
     if (new Date(interviewDateTime) < new Date()) {
      setError('Interview date cannot be in the past.');
      return;
    }
    setError(null);
    setIsScheduling(true);
    onSchedule(selectedEmployeeId, interviewDateTime, notes);
    onClose();
  };

  const selectBaseClass = "w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm";
  const labelClass = "block text-sm font-medium text-text-muted dark:text-text-muted mb-1";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Exit Interview"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isScheduling}>Cancel</Button>
          <Button variant="primary" onClick={handleSchedule} isLoading={isScheduling} disabled={isScheduling}>Schedule Interview</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
        <div>
            <label htmlFor="exit-employee-select" className={labelClass}>Select Employee (Resigned)</label>
            <select
                id="exit-employee-select"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className={selectBaseClass}
            >
                <option value="" disabled>-- Select an employee --</option>
                {resignedMembers.length > 0 ? (
                    resignedMembers.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                    ))
                ) : (
                    <option disabled>No employees marked as 'Resigned'</option>
                )}
            </select>
        </div>
        <Input
          label="Interview Date & Time"
          type="datetime-local"
          value={interviewDateTime}
          onChange={(e) => setInterviewDateTime(e.target.value)}
        />
        <TextArea
          label="Notes / Interviewer Details"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="e.g., Interviewer: Jane Doe. Focus on feedback for team culture."
        />
      </div>
    </Modal>
  );
};
