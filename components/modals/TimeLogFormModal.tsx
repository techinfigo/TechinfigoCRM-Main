import React, { useState, useEffect, useRef } from 'react';
import { TimeLog, Project, Task, TeamMember } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Select } from '../common/Select';

interface TimeLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timeLog: TimeLog) => void;
  timeLog: TimeLog | null;
  projects: Project[];
  tasks: Task[];
  teamMembers: TeamMember[];
  currentUserId: string;
  defaultProjectId?: string;
  defaultTaskId?: string;
  onSetDirty: (isDirty: boolean) => void;
}

interface TimeLogFormData {
  projectId: string;
  taskId?: string;
  memberId: string;
  date: string;
  hours: string;
  notes?: string;
}

const initialFormData: TimeLogFormData = {
  projectId: '',
  taskId: '',
  memberId: '',
  date: new Date().toISOString().split('T')[0],
  hours: '',
  notes: '',
};

interface TimeLogFormErrors {
  projectId?: string;
  memberId?: string;
  date?: string;
  hours?: string;
}

export const TimeLogFormModal: React.FC<TimeLogFormModalProps> = ({
  isOpen, onClose, onSave, timeLog, projects, tasks, teamMembers, currentUserId, defaultProjectId, defaultTaskId, onSetDirty
}) => {
  const [formData, setFormData] = useState<TimeLogFormData>(initialFormData);
  const [errors, setErrors] = useState<TimeLogFormErrors>({});
  const initialFormStateRef = useRef<TimeLogFormData | null>(null);

  const availableTasksForSelectedProject = formData.projectId
    ? tasks.filter(task => projects.find(p => p.id === formData.projectId)?.tasks.some(pt => pt.id === task.id))
    : [];

  useEffect(() => {
    if (isOpen) {
        let currentInitialState: TimeLogFormData;
        if (timeLog) {
            currentInitialState = {
                projectId: timeLog.projectId,
                taskId: timeLog.taskId || '',
                memberId: timeLog.memberId,
                date: (timeLog.date ?? '').split('T')[0],
                hours: (timeLog.hours ?? '').toString(),
                notes: timeLog.notes || '',
            };
        } else {
            currentInitialState = {
                ...initialFormData,
                memberId: currentUserId,
                projectId: defaultProjectId || (projects.length > 0 ? projects[0].id : ''),
                taskId: defaultTaskId || '',
            };
        }
        setFormData(currentInitialState);
        initialFormStateRef.current = JSON.parse(JSON.stringify(currentInitialState));
        onSetDirty(false);
        setErrors({});
    }
  }, [timeLog, isOpen, currentUserId, projects, defaultProjectId, defaultTaskId, onSetDirty]);

  useEffect(() => {
    if (!isOpen) return;
    if (JSON.stringify(formData) !== JSON.stringify(initialFormStateRef.current)) {
      onSetDirty(true);
    } else {
      onSetDirty(false);
    }
  }, [formData, isOpen, onSetDirty]);

  useEffect(() => {
    if (!timeLog && defaultProjectId && projects.find(p => p.id === defaultProjectId)) {
      setFormData(prev => ({ ...prev, projectId: defaultProjectId, taskId: defaultTaskId || '' }));
    }
  }, [defaultProjectId, defaultTaskId, timeLog, projects, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof TimeLogFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const clearError = (name: keyof TimeLogFormErrors) => {
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: TimeLogFormErrors = {};
    if (!formData.projectId) newErrors.projectId = "Project is required.";
    if (!formData.memberId) newErrors.memberId = "Team member is required.";
    if (!formData.date) newErrors.date = "Date is required.";
    if (!formData.hours.trim()) {
      newErrors.hours = "Hours are required.";
    } else if (isNaN(parseFloat(formData.hours)) || parseFloat(formData.hours) <= 0) {
      newErrors.hours = "Hours must be a positive number.";
    } else if (parseFloat(formData.hours) > 24) {
      newErrors.hours = "Hours cannot exceed 24 for a single day.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const logToSave: TimeLog = {
      id: timeLog?.id || '',
      projectId: formData.projectId,
      taskId: formData.taskId || undefined,
      memberId: formData.memberId,
      date: formData.date,
      hours: parseFloat(formData.hours),
      notes: formData.notes?.trim() || undefined,
      dateLogged: timeLog?.dateLogged || new Date().toISOString(),
    };
    onSave(logToSave);
    onSetDirty(false);
  };

  const labelClass = "block text-xs font-semibold uppercase tracking-wide text-text-muted mb-1.5";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={timeLog ? 'Edit Time Log' : 'Log Time'}
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">
            {timeLog ? 'Save Changes' : 'Log Time'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Project *</label>
            <Select
              value={formData.projectId}
              onChange={(v) => { setFormData(prev => ({ ...prev, projectId: v, taskId: '' })); clearError('projectId'); }}
              placeholder="Select project"
              searchable
              options={projects.map(p => ({ value: p.id, label: p.name }))}
            />
            {errors.projectId && <p className="mt-1 text-xs text-red-600">{errors.projectId}</p>}
          </div>
          <div>
            <label className={labelClass}>Task (Optional)</label>
            <Select
              value={formData.taskId || ''}
              onChange={(v) => setFormData(prev => ({ ...prev, taskId: v }))}
              placeholder={!formData.projectId ? 'Select a project first' : 'Select task (optional)'}
              searchable
              options={[{ value: '', label: 'No specific task' }, ...availableTasksForSelectedProject.map(t => ({ value: t.id, label: t.title }))]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className={labelClass}>Date *</label>
            <Input id="date" name="date" type="date" value={formData.date} onChange={handleChange} error={errors.date} required />
          </div>
          <div>
            <label className={labelClass}>Hours *</label>
            <Input id="hours" name="hours" type="number" placeholder="e.g., 2.5" value={formData.hours} onChange={handleChange} error={errors.hours} min="0.1" step="0.1" required />
          </div>
          <div>
            <label className={labelClass}>Team Member *</label>
            <Select
              value={formData.memberId}
              onChange={(v) => { setFormData(prev => ({ ...prev, memberId: v })); clearError('memberId'); }}
              placeholder="Select member"
              searchable
              options={teamMembers.map(tm => ({ value: tm.id, label: tm.name }))}
            />
            {errors.memberId && <p className="mt-1 text-xs text-red-600">{errors.memberId}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes (Optional)</label>
          <TextArea id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={3} placeholder="Describe the work done..." />
        </div>
      </form>
    </Modal>
  );
};
