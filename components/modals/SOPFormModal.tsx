
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { SOP, SOPCategory } from '../../types';

interface SOPFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sop: SOP) => void;
  sop: SOP | null;
}

interface SOPFormData {
  title: string;
  category: SOPCategory;
  description: string;
  steps: string; // Handled as newline separated string for editing ease
  checklists: string; // Handled as newline separated string
  additionalNotes: string;
}

const categories: SOPCategory[] = ['Audit', 'Ads', 'Creative', 'Retention', 'Reporting', 'Communication', 'CRO', 'Onboarding', 'Pricing', 'Other'];

const initialFormData: SOPFormData = {
  title: '',
  category: 'Other',
  description: '',
  steps: '',
  checklists: '',
  additionalNotes: '',
};

export const SOPFormModal: React.FC<SOPFormModalProps> = ({ isOpen, onClose, onSave, sop }) => {
  const [formData, setFormData] = useState<SOPFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof SOPFormData, string>>>({});

  useEffect(() => {
    if (isOpen) {
      if (sop) {
        setFormData({
          title: sop.title,
          category: sop.category,
          description: sop.description,
          steps: sop.steps.join('\n'),
          checklists: sop.checklists ? sop.checklists.join('\n') : '',
          additionalNotes: sop.additionalNotes || '',
        });
      } else {
        setFormData(initialFormData);
      }
      setErrors({});
    }
  }, [isOpen, sop]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof SOPFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof SOPFormData, string>> = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.steps.trim()) newErrors.steps = "At least one step is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const newSOP: SOP = {
      id: sop?.id || `sop-${Date.now()}`,
      title: formData.title,
      category: formData.category,
      description: formData.description,
      steps: formData.steps.split('\n').map(s => s.trim()).filter(s => s),
      checklists: formData.checklists.split('\n').map(s => s.trim()).filter(s => s),
      additionalNotes: formData.additionalNotes,
      updatedAt: new Date().toISOString(),
    };

    onSave(newSOP);
  };

  const selectBaseClass = "w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm text-text-base dark:text-text-base";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sop ? 'Edit SOP' : 'Create New SOP'}
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>{sop ? 'Save Changes' : 'Create SOP'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="SOP Title *" 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          error={errors.title} 
          placeholder="e.g., Client Onboarding Protocol"
        />

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">Category *</label>
          <select 
            id="category" 
            name="category" 
            value={formData.category} 
            onChange={handleChange} 
            className={selectBaseClass}
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <TextArea 
          label="Description *" 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          error={errors.description} 
          rows={3} 
          placeholder="Brief overview of this procedure..."
        />

        <TextArea 
          label="Steps (One per line) *" 
          name="steps" 
          value={formData.steps} 
          onChange={handleChange} 
          error={errors.steps} 
          rows={6} 
          placeholder="1. First step...&#10;2. Second step..."
          description="Enter each step on a new line."
        />

        <TextArea 
          label="Checklist Items (Optional, one per line)" 
          name="checklists" 
          value={formData.checklists} 
          onChange={handleChange} 
          rows={4} 
          placeholder="Item to verify...&#10;Another check..."
          description="Enter each checklist item on a new line."
        />

        <TextArea 
          label="Additional Notes (Optional)" 
          name="additionalNotes" 
          value={formData.additionalNotes} 
          onChange={handleChange} 
          rows={3} 
          placeholder="Any extra context, links, or resources..."
        />
      </form>
    </Modal>
  );
};
