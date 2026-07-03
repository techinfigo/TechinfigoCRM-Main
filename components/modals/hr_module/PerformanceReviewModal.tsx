
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Input, TextArea } from '../../common/Input';
import { Card } from '../../common/Card';
import { TeamMember, PerformanceReview, PerformanceRating, PerformanceGoalStatus, performanceGoalStatuses, EmailAttachment } from '../../../types';

interface PerformanceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reviewData: PerformanceReview) => void;
  employee: TeamMember | null;
  currentUser: TeamMember | null; // For reviewer details
  existingReview?: PerformanceReview | null;
  onSetDirty: (isDirty: boolean) => void;
}

interface PerformanceReviewFormData {
  performanceRatings: PerformanceRating;
  goalsAchieved: PerformanceGoalStatus;
  managerFeedback: string;
  growthDevelopmentPlan: string;
  nextReviewDate?: string;
  // attachments are handled separately for simplicity in this example
}

const initialRatings: PerformanceRating = {
  communication: 3,
  taskCompletion: 3,
  innovation: 3,
  punctuality: 3,
};

const initialFormData: PerformanceReviewFormData = {
  performanceRatings: { ...initialRatings },
  goalsAchieved: 'Partially Achieved',
  managerFeedback: '',
  growthDevelopmentPlan: '',
  nextReviewDate: '',
};

const ratingLabels: { [key in keyof PerformanceRating]: string } = {
    communication: "Communication & Teamwork",
    taskCompletion: "Task Completion & Quality",
    innovation: "Innovation & Problem Solving",
    punctuality: "Punctuality & Reliability"
};

const ratingDescriptions: { [key: number]: string } = {
    1: 'Needs Improvement',
    2: 'Below Expectations',
    3: 'Meets Expectations',
    4: 'Exceeds Expectations',
    5: 'Outstanding',
};


export const PerformanceReviewModal: React.FC<PerformanceReviewModalProps> = ({
  isOpen,
  onClose,
  onSave,
  employee,
  currentUser,
  existingReview,
  onSetDirty,
}) => {
  const [formData, setFormData] = useState<PerformanceReviewFormData>(initialFormData);
  const [attachments, setAttachments] = useState<File[]>([]); // For new file uploads
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialFormStateRef = useRef<PerformanceReviewFormData & { attachmentsCount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      let currentInitialState: PerformanceReviewFormData;
      if (existingReview) {
        currentInitialState = {
          performanceRatings: { ...initialRatings, ...existingReview.performanceRatings }, // Merge to ensure all keys are present
          goalsAchieved: existingReview.goalsAchieved,
          managerFeedback: existingReview.managerFeedback,
          growthDevelopmentPlan: existingReview.growthDevelopmentPlan,
          nextReviewDate: (existingReview.nextReviewDate ?? '').split('T')[0],
        };
        // Note: Existing attachments are not directly editable here, only new ones can be added for simplicity
        setAttachments([]); 
      } else {
        currentInitialState = { 
            ...initialFormData, 
            performanceRatings: { ...initialRatings },
            nextReviewDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default to 6 months from now
        };
        setAttachments([]);
      }
      setFormData(currentInitialState);
      initialFormStateRef.current = { ...currentInitialState, attachmentsCount: 0 }; // Store initial for comparison
      onSetDirty(false);
      setIsSubmitting(false);
    }
  }, [isOpen, existingReview, onSetDirty]);

  useEffect(() => {
    if (!isOpen) return;
    const currentDataWithAttachmentCount = { ...formData, attachmentsCount: attachments.length };
    if (JSON.stringify(currentDataWithAttachmentCount) !== JSON.stringify(initialFormStateRef.current)) {
      onSetDirty(true);
    } else {
      onSetDirty(false);
    }
  }, [formData, attachments, isOpen, onSetDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (field: keyof PerformanceRating, value: string) => {
    setFormData(prev => ({
      ...prev,
      performanceRatings: {
        ...prev.performanceRatings,
        [field]: parseInt(value, 10),
      },
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAttachments(prev => [...prev, ...Array.from(event.target.files || [])]);
    }
  };
  
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = () => {
    if (!employee || !currentUser || isSubmitting) return;
    setIsSubmitting(true);

    const reviewData: PerformanceReview = {
      id: existingReview?.id || `pr-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      reviewDate: existingReview?.reviewDate || new Date().toISOString(),
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      ...formData,
      nextReviewDate: formData.nextReviewDate || undefined,
      // Conceptual: map `attachments` (File[]) to EmailAttachment[] for storage
      attachments: attachments.map(file => ({ 
        id: `att-${Date.now()}-${file.name}`, 
        fileName: file.name, 
        fileType: file.type, 
        fileSize: file.size,
        // dataUrl: conceptual, might be generated before actual upload if needed
      })),
    };
    onSave(reviewData);
    onSetDirty(false);
  };
  
  const inputBaseClass = "bg-bg-base dark:bg-bg-muted border-border-base dark:border-border-muted text-text-base dark:text-text-base";
  const selectBaseClass = `w-full p-2.5 ${inputBaseClass} rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm`;
  const labelClass = "block text-sm font-medium text-text-muted dark:text-text-muted mb-1";

  if (!employee) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingReview ? `Edit Performance Review: ${employee.name}` : `New Performance Review: ${employee.name}`}
      size="3xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>
            {existingReview ? 'Save Changes' : 'Submit Review'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Card title="Employee Details" className={inputBaseClass}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm p-1">
            <p><strong>Name:</strong> {employee.name}</p>
            <p><strong>Employee ID:</strong> {employee.id}</p> {/* Assuming ID is used as Employee ID */}
            <p><strong>Department:</strong> {employee.department || 'N/A'}</p>
            <p><strong>Position:</strong> {employee.jobTitle || 'N/A'}</p>
          </div>
        </Card>

        <Card title="Performance Ratings (1-5)" className={inputBaseClass}>
          <div className="space-y-4 p-1">
            {(Object.keys(initialRatings) as Array<keyof PerformanceRating>).map(key => (
              <div key={key}>
                <label htmlFor={key} className="flex justify-between items-center text-sm font-medium text-text-muted dark:text-text-muted mb-1">
                  <span>{ratingLabels[key]}</span>
                  <span className="font-semibold text-text-base dark:text-text-base bg-secondary-accent/20 text-secondary-accent-text px-2 py-0.5 rounded-md text-xs">{ratingDescriptions[formData.performanceRatings[key]]}</span>
                </label>
                <input 
                    id={key}
                    name={key}
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.performanceRatings[key]} 
                    onChange={(e) => handleRatingChange(key, e.target.value)}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer range-thumb"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Goals & Feedback" className={inputBaseClass}>
            <div className="space-y-3 p-1">
                <div>
                    <label htmlFor="goalsAchieved" className={labelClass}>Goals Achievement Status</label>
                    <select id="goalsAchieved" name="goalsAchieved" value={formData.goalsAchieved} onChange={handleChange} className={selectBaseClass}>
                        {performanceGoalStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
                <TextArea label="Manager Feedback & Comments" name="managerFeedback" value={formData.managerFeedback} onChange={handleChange} rows={4} placeholder="Overall performance, strengths, areas for improvement..." />
                <TextArea label="Growth & Development Plan" name="growthDevelopmentPlan" value={formData.growthDevelopmentPlan} onChange={handleChange} rows={3} placeholder="Improvement suggestions, training needs, promotion opportunities..." />
            </div>
        </Card>
        <Card title="Follow-Up & Attachments" className={inputBaseClass}>
            <div className="space-y-3 p-1">
                <Input label="Next Review Date (Optional)" name="nextReviewDate" type="date" value={formData.nextReviewDate || ''} onChange={handleChange} />
                <div>
                    <label className={labelClass}>Attachments (Optional)</label>
                    <input type="file" multiple onChange={handleFileChange} ref={fileInputRef} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-premium-accent-light file:text-premium-accent dark:file:bg-premium-accent-dark/70 dark:file:text-premium-accent-dark hover:file:bg-premium-accent-light/80 file:cursor-pointer" />
                    {attachments.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs">
                        {attachments.map((file, index) => (
                            <li key={index} className="flex justify-between items-center p-1 bg-slate-100 dark:bg-slate-700 rounded">
                            <span className="truncate">{file.name} ({formatFileSize(file.size)})</span>
                            <Button size="xs" variant="ghost" onClick={() => handleRemoveAttachment(index)} className="text-red-500">Remove</Button>
                            </li>
                        ))}
                        </ul>
                    )}
                </div>
            </div>
        </Card>
      </div>
    </Modal>
  );
};
