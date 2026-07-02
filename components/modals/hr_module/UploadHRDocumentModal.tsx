
import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { Input, TextArea } from '../../common/Input';
import { TeamMember, HRDocument, HRDocumentCategory, hrDocumentCategories } from '../../../types';

interface UploadHRDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onSave: (docData: Omit<HRDocument, 'id' | 'uploadedByUserId' | 'uploadedByUserName'>) => void;
  defaults?: { employeeId?: string };
  onSetDirty: (isDirty: boolean) => void;
}

interface DocFormData {
  employeeId: string;
  category: HRDocumentCategory;
  name: string;
  expiryDate?: string;
  notes?: string;
  file: File | null;
}

const initialFormData: DocFormData = {
  employeeId: '',
  category: 'Offer Letter',
  name: '',
  expiryDate: '',
  notes: '',
  file: null,
};

export const UploadHRDocumentModal: React.FC<UploadHRDocumentModalProps> = ({ isOpen, onClose, teamMembers, onSave, defaults, onSetDirty }) => {
  const [formData, setFormData] = useState<DocFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialFormStateRef = useRef<DocFormData | null>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultEmployee = defaults?.employeeId || (teamMembers.length > 0 ? teamMembers[0].id : '');
      const newInitialState = { ...initialFormData, employeeId: defaultEmployee };
      setFormData(newInitialState);
      initialFormStateRef.current = newInitialState;
      onSetDirty(false);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen, teamMembers, defaults, onSetDirty]);
  
  useEffect(() => {
    if (!isOpen) return;
    if (JSON.stringify(formData) !== JSON.stringify(initialFormStateRef.current)) {
      onSetDirty(true);
    } else {
      onSetDirty(false);
    }
  }, [formData, isOpen, onSetDirty]);


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File is too large. Maximum size is 10MB.');
        setFormData(prev => ({ ...prev, file: null, name: '' }));
      } else {
        setFormData(prev => ({ ...prev, file, name: prev.name || file.name }));
        setError(null);
      }
    }
  };

  const handleUpload = () => {
    if (!formData.employeeId) {
      setError('Please select an employee.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Document name is required.');
      return;
    }
    if (!formData.file) {
      setError('Please select a file to upload.');
      return;
    }
    setError(null);

    const docData: Omit<HRDocument, 'id' | 'uploadedByUserId' | 'uploadedByUserName'> = {
        name: formData.name.trim(),
        category: formData.category,
        employeeId: formData.employeeId,
        uploadDate: new Date().toISOString(),
        expiryDate: formData.expiryDate || undefined,
        status: 'Pending Approval', // Default status for new uploads
        file: formData.file,
        size: formData.file.size,
        notes: formData.notes,
    };
    onSave(docData);
  };
  
  const selectBaseClass = "w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm";
  const labelClass = "block text-sm font-medium text-text-muted dark:text-text-muted mb-1";


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload HR Document"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleUpload} disabled={!formData.file}>Upload Document</Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded-md">{error}</p>}
        <div>
            <label htmlFor="employee-select" className={labelClass}>Assign to Employee *</label>
            <select
                id="employee-select"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                className={selectBaseClass}
            >
                <option value="" disabled>-- Select an employee --</option>
                {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                ))}
            </select>
        </div>
        <div>
            <label htmlFor="doctype-select" className={labelClass}>Document Category *</label>
            <select
                id="doctype-select"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={selectBaseClass}
            >
                {hrDocumentCategories.map(type => (
                    <option key={type} value={type}>{type}</option>
                ))}
            </select>
        </div>
        <Input
          label="Document Name *"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Offer Letter - John Doe"
        />
        <Input
            label="Expiry Date (Optional)"
            id="expiryDate"
            name="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={handleChange}
        />
        <TextArea 
            label="Notes (Optional)"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Any relevant notes about this document..."
        />
        <div>
            <label htmlFor="file-upload" className={labelClass}>Select File *</label>
            <Input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="text-sm file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-premium-accent-light file:text-premium-accent dark:file:bg-premium-accent-dark/70 dark:file:text-premium-accent-dark hover:file:bg-premium-accent-light/80 file:cursor-pointer"
            />
            {formData.file && <p className="text-xs text-text-muted dark:text-slate-400 mt-1">Selected: {formData.file.name}</p>}
        </div>
      </div>
    </Modal>
  );
};
