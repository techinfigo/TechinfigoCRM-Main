

import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { TeamMember, AttendanceStatus, AttendanceEntry, DailyAttendanceRecord, attendanceStatuses } from '../../../types';
import { Checkbox } from '../../common/Checkbox';

interface MarkAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onSaveAttendance: (record: DailyAttendanceRecord) => void;
}

export const MarkAttendanceModal: React.FC<MarkAttendanceModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  onSaveAttendance,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Initialize attendance entries for all team members when modal opens or date changes
      const initialEntries: AttendanceEntry[] = teamMembers.map(member => ({
        memberId: member.id,
        status: 'Present', // Default status
        checkInTime: '09:30',
        checkOutTime: '18:30',
      }));
      setAttendanceEntries(initialEntries);
    }
  }, [isOpen, selectedDate, teamMembers]);

  const handleEntryChange = (memberId: string, field: keyof AttendanceEntry, value: string | AttendanceStatus) => {
    setAttendanceEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.memberId === memberId ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleSave = () => {
    const record: DailyAttendanceRecord = {
      id: `att-${selectedDate}`, // Simple ID for now
      date: selectedDate,
      entries: attendanceEntries,
    };
    onSaveAttendance(record);
    onClose();
  };
  
  const labelClassSmall = "block text-xs font-medium text-text-muted dark:text-text-muted mb-1";
  const selectBaseClass = "w-full p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-xs";
  const optionClass = "bg-bg-base dark:bg-bg-muted text-text-base dark:text-text-base";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Team Attendance"
      size="3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Attendance</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Select Date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          containerClassName="max-w-xs"
        />
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
          {teamMembers.map(member => {
            const currentEntry = attendanceEntries.find(entry => entry.memberId === member.id);
            return (
              <div key={member.id} className="grid grid-cols-1 sm:grid-cols-4 gap-x-4 gap-y-2 items-end p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                <span className="sm:col-span-4 text-sm font-medium text-text-base dark:text-text-base mb-1">{member.name}</span>
                
                <div>
                  <label htmlFor={`status-${member.id}`} className={labelClassSmall}>Status</label>
                  <select
                    id={`status-${member.id}`}
                    value={currentEntry?.status || 'Present'}
                    onChange={(e) => handleEntryChange(member.id, 'status', e.target.value as AttendanceStatus)}
                    className={selectBaseClass}
                  >
                    {attendanceStatuses.map(status => (
                      <option key={status} value={status} className={optionClass}>{status}</option>
                    ))}
                  </select>
                </div>
                
                <Input
                    label="Check-in Time"
                    type="time"
                    id={`checkin-${member.id}`}
                    value={currentEntry?.checkInTime || ''}
                    onChange={(e) => handleEntryChange(member.id, 'checkInTime', e.target.value)}
                    labelClassName={labelClassSmall}
                    className="!py-1.5 !text-xs"
                    disabled={currentEntry?.status === 'Absent' || currentEntry?.status === 'Leave'}
                />

                <Input
                    label="Check-out Time"
                    type="time"
                    id={`checkout-${member.id}`}
                    value={currentEntry?.checkOutTime || ''}
                    onChange={(e) => handleEntryChange(member.id, 'checkOutTime', e.target.value)}
                    labelClassName={labelClassSmall}
                    className="!py-1.5 !text-xs"
                    disabled={currentEntry?.status === 'Absent' || currentEntry?.status === 'Leave'}
                />

              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
