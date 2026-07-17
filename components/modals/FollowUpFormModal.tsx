import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { DateTimePicker } from '../common/DateTimePicker';
import { Select } from '../common/Select';
import { FollowUpLogItem, FollowUpType, followUpTypes } from '../../types';

interface FollowUpFormModalProps {
  isOpen: boolean;
  onClose: () => void; // Provided by App.tsx's handleCloseActiveModal
  onSave: (followUpData: Omit<FollowUpLogItem, 'id' | 'timestamp' | 'addedByUserId' | 'addedByUserName'>, leadId: string) => void;
  leadName: string;
  leadId: string;
  onSetDirty: (isDirty: boolean) => void; // New prop
  initialNote?: string;
}

interface FollowUpFormData {
  note: string;
  nextFollowUpDateTime: string;
  followUpType?: FollowUpType;
  isHighPriority?: boolean;
}

const initialFormData: FollowUpFormData = {
  note: '',
  nextFollowUpDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 16),
  followUpType: 'Call',
  isHighPriority: false,
};

export const FollowUpFormModal: React.FC<FollowUpFormModalProps> = ({ isOpen, onClose, onSave, leadName, leadId, onSetDirty, initialNote = '' }) => {
  const [formData, setFormData] = useState<FollowUpFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<FollowUpFormData>>({});
  const initialFormStateRef = useRef<FollowUpFormData | null>(null);

  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const year = tomorrow.getFullYear();
      const month = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
      const day = tomorrow.getDate().toString().padStart(2, '0');
      const hours = tomorrow.getHours().toString().padStart(2, '0');
      const minutes = tomorrow.getMinutes().toString().padStart(2, '0');
      const defaultDateTimeLocal = `${year}-${month}-${day}T${hours}:${minutes}`;

      const newInitialState = {
        ...initialFormData,
        note: initialNote,
        nextFollowUpDateTime: defaultDateTimeLocal,
      };
      setFormData(newInitialState);
      initialFormStateRef.current = newInitialState;
      onSetDirty(false);
      setErrors({});
    }
  }, [isOpen, onSetDirty, initialNote]);

  useEffect(() => {
    if (!isOpen) return;
    if (JSON.stringify(formData) !== JSON.stringify(initialFormStateRef.current)) {
      onSetDirty(true);
    } else {
      onSetDirty(false);
    }
  }, [formData, isOpen, onSetDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof FollowUpFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDateTimeChange = (value: string) => {
    setFormData(prev => ({ ...prev, nextFollowUpDateTime: value }));
    if (errors.nextFollowUpDateTime) {
      setErrors(prev => ({ ...prev, nextFollowUpDateTime: undefined }));
    }
  };

  const handleFollowUpTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, followUpType: value as FollowUpType }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<FollowUpFormData> = {};
    if (!formData.note.trim()) {
      newErrors.note = "Follow-up notes are required.";
    }
    if (!formData.nextFollowUpDateTime) {
      newErrors.nextFollowUpDateTime = "Next follow-up date and time are required.";
    } else if (new Date(formData.nextFollowUpDateTime) < new Date()) {
      newErrors.nextFollowUpDateTime = "Next follow-up date cannot be in the past.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData, leadId);
    onSetDirty(false); // Mark as not dirty after save
    // onClose will be called by App.tsx after successful save if needed
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose} // This now calls handleCloseActiveModal in App.tsx
      title={`Log Follow-Up for: ${leadName}`}
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" onClick={handleSubmit}>Save Follow-Up</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextArea
          label="Follow-Up Notes *"
          id="note"
          name="note"
          value={formData.note}
          onChange={handleChange}
          error={errors.note}
          rows={4}
          placeholder="What was discussed? Next steps?"
          required
        />
        <DateTimePicker
          label="Next Follow-Up Date & Time *"
          value={formData.nextFollowUpDateTime}
          onChange={handleDateTimeChange}
          error={errors.nextFollowUpDateTime}
          required
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <Select
                label="Follow-Up Type"
                options={followUpTypes.map(type => ({ value: type, label: type }))}
                value={formData.followUpType || 'Call'}
                onChange={handleFollowUpTypeChange}
            />
            <div className="flex items-center pt-5 sm:pt-3">
                <input
                    type="checkbox"
                    id="isHighPriority"
                    name="isHighPriority"
                    checked={!!formData.isHighPriority}
                    onChange={handleChange}
                    className="h-4 w-4 text-premium-accent border-border-base rounded focus:ring-premium-accent"
                />
                <label htmlFor="isHighPriority" className="ml-2 text-sm text-text-base dark:text-text-base">
                    Mark as High Priority
                </label>
            </div>
        </div>
      </form>
    </Modal>
  );
};
