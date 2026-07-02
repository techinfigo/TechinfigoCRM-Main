

import React, { useState, useEffect, useId, useRef } from 'react';
import { 
    MarketingAuditRequest, Client, MarketingAuditFocusArea, marketingAuditFocusAreas, 
    AuditChecklistHeading, AuditConcernItem, auditFindingStatuses, AuditFindingStatus
} from '../../types';
import { ECOMMERCE_AUDIT_CHECKLIST_TEMPLATE } from '../../constants';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Card } from '../common/Card'; // Import Card for better layout

interface AuditRequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (auditRequest: MarketingAuditRequest) => void;
  auditRequest: MarketingAuditRequest | null;
  clients: Client[];
  onSetDirty: (isDirty: boolean) => void;
}

interface AuditRequestFormData {
  clientId: string;
  websiteUrl: string;
  focusAreas: MarketingAuditFocusArea[];
  primaryGoals: string;
  competitors: string; 
  additionalNotes: string;
  detailedChecklist: AuditChecklistHeading[]; // New field for the checklist
}

const initialFormData: AuditRequestFormData = {
  clientId: '',
  websiteUrl: '',
  focusAreas: [],
  primaryGoals: '',
  competitors: '',
  additionalNotes: '',
  detailedChecklist: JSON.parse(JSON.stringify(ECOMMERCE_AUDIT_CHECKLIST_TEMPLATE)), // Deep copy
};

interface AuditRequestFormErrors {
  clientId?: string;
  websiteUrl?: string;
  focusAreas?: string;
  primaryGoals?: string;
}

export const AuditRequestFormModal: React.FC<AuditRequestFormModalProps> = ({ isOpen, onClose, onSave, auditRequest, clients, onSetDirty }) => {
  const [formData, setFormData] = useState<AuditRequestFormData>(initialFormData);
  const [errors, setErrors] = useState<AuditRequestFormErrors>({});
  const uniqueId = useId();
  const initialFormStateRef = useRef<AuditRequestFormData | null>(null);


  useEffect(() => {
    if (isOpen) {
        let currentInitialState: AuditRequestFormData;
        if (auditRequest) {
            currentInitialState = {
                clientId: auditRequest.clientId,
                websiteUrl: auditRequest.websiteUrl,
                focusAreas: auditRequest.focusAreas || [],
                primaryGoals: auditRequest.primaryGoals || '',
                competitors: (auditRequest.competitors || []).join('\n'),
                additionalNotes: auditRequest.additionalNotes || '',
                detailedChecklist: auditRequest.detailedChecklist ? JSON.parse(JSON.stringify(auditRequest.detailedChecklist)) : JSON.parse(JSON.stringify(ECOMMERCE_AUDIT_CHECKLIST_TEMPLATE)),
            };
        } else {
            currentInitialState = {
                ...initialFormData,
                clientId: clients.length > 0 ? clients[0].id : '',
                detailedChecklist: JSON.parse(JSON.stringify(ECOMMERCE_AUDIT_CHECKLIST_TEMPLATE)),
            };
        }
        setFormData(currentInitialState);
        initialFormStateRef.current = JSON.parse(JSON.stringify(currentInitialState)); // Deep copy for comparison
        onSetDirty(false);
        setErrors({});
    }
  }, [auditRequest, isOpen, clients, onSetDirty]);

  useEffect(() => {
    if (!isOpen) return;
    if (JSON.stringify(formData) !== JSON.stringify(initialFormStateRef.current)) {
      onSetDirty(true);
    } else {
      onSetDirty(false);
    }
  }, [formData, isOpen, onSetDirty]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof AuditRequestFormErrors]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleFocusAreaChange = (area: MarketingAuditFocusArea) => {
    setFormData(prev => {
      const newFocusAreas = prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area];
      return { ...prev, focusAreas: newFocusAreas };
    });
     if (errors.focusAreas) {
        setErrors(prev => ({ ...prev, focusAreas: undefined }));
    }
  };

  const handleChecklistChange = (headingIndex: number, concernIndex: number, field: keyof AuditConcernItem, value: string | AuditFindingStatus) => {
    setFormData(prev => {
        const newChecklist = JSON.parse(JSON.stringify(prev.detailedChecklist));
        // @ts-ignore
        newChecklist[headingIndex].concerns[concernIndex][field] = value;
        return { ...prev, detailedChecklist: newChecklist };
    });
  };
  
  const validate = (): boolean => {
    const newErrors: AuditRequestFormErrors = {};
    if (!formData.clientId) newErrors.clientId = "Client is required.";
    if (!formData.websiteUrl.trim()) {
        newErrors.websiteUrl = "Website URL is required.";
    } else if (!/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(formData.websiteUrl) && !/^([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(formData.websiteUrl) ) {
        newErrors.websiteUrl = "Please enter a valid website URL (e.g., example.com or http://example.com).";
    }
    // Focus areas are now optional if detailed checklist is used
    // if (formData.focusAreas.length === 0) newErrors.focusAreas = "At least one focus area must be selected.";
    if (!formData.primaryGoals.trim()) newErrors.primaryGoals = "Primary goals/objectives are required.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let website = formData.websiteUrl.trim();
    if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
        website = 'http://' + website; // Prepend http for consistency if not present
    }
    
    const requestToSave: MarketingAuditRequest = {
      ...(auditRequest || { id: '', dateRequested: '', status: 'Requested' }), 
      clientId: formData.clientId,
      websiteUrl: website,
      focusAreas: formData.focusAreas,
      primaryGoals: formData.primaryGoals.trim(),
      competitors: formData.competitors.split('\n').map(c => c.trim()).filter(c => c),
      additionalNotes: formData.additionalNotes.trim(),
      detailedChecklist: formData.detailedChecklist,
    };
    onSave(requestToSave);
    onSetDirty(false);
  };
  
  const selectBaseClass = "w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm";
  const optionClass = "bg-bg-base dark:bg-bg-muted text-text-base dark:text-text-base";
  const labelClassSmall = "block text-xs font-medium text-text-muted dark:text-text-muted mb-1";


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={auditRequest ? 'Edit Marketing Audit Request' : 'Request New Marketing Audit'}
      size="4xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">
            {auditRequest ? 'Save Changes' : 'Submit Request'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info Section */}
        <Card title="Basic Information" className="bg-bg-muted dark:bg-slate-700/30" contentClassName="space-y-4 p-4">
            <div>
                <label htmlFor={`${uniqueId}-clientId`} className="block text-sm font-medium text-text-base dark:text-text-base mb-1">Client *</label>
                <select id={`${uniqueId}-clientId`} name="clientId" value={formData.clientId} onChange={handleChange} className={`${selectBaseClass} ${errors.clientId ? 'border-status-negative' : ''}`} disabled={clients.length === 0} required>
                    {clients.length === 0 ? <option className={optionClass}>Please add a client first</option> : <option value="" className={optionClass}>Select a client</option>}
                    {clients.map(c => <option key={c.id} value={c.id} className={optionClass}>{c.name} ({c.companyName || 'Individual'})</option>)}
                </select>
                {errors.clientId && <p className="mt-1 text-xs text-status-negative">{errors.clientId}</p>}
            </div>
            <Input label="Website URL *" id={`${uniqueId}-websiteUrl`} name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} error={errors.websiteUrl} placeholder="e.g., www.example.com" required />
            <TextArea label="Primary Goals/Objectives *" id={`${uniqueId}-primaryGoals`} name="primaryGoals" value={formData.primaryGoals} onChange={handleChange} error={errors.primaryGoals} rows={2} placeholder="What does the client want to achieve?" required />
             <div>
                <label className="block text-sm font-medium text-text-base dark:text-text-base mb-1">General Focus Areas (Optional)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-bg-base dark:bg-slate-700/50 rounded-md border border-border-muted dark:border-slate-600">
                    {marketingAuditFocusAreas.map(area => (
                        <label key={area} className="flex items-center space-x-2 text-text-base dark:text-text-base cursor-pointer hover:text-premium-accent dark:hover:text-premium-accent-dark text-xs">
                            <input type="checkbox" className="form-checkbox h-3.5 w-3.5 text-premium-accent border-border-muted rounded focus:ring-premium-accent" checked={formData.focusAreas.includes(area)} onChange={() => handleFocusAreaChange(area)} />
                            <span>{area.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                    ))}
                </div>
            </div>
            <TextArea label="Main Competitors (one per line)" id={`${uniqueId}-competitors`} name="competitors" value={formData.competitors} onChange={handleChange} rows={2} placeholder="www.competitor1.com&#10;Competitor Name 2" />
            <TextArea label="Additional General Notes" id={`${uniqueId}-additionalNotes`} name="additionalNotes" value={formData.additionalNotes} onChange={handleChange} rows={2} placeholder="Any other high-level instructions." />
        </Card>

        {/* Detailed E-commerce Checklist Section */}
        <Card title="Detailed E-commerce Audit Checklist" className="bg-bg-muted dark:bg-slate-700/30" contentClassName="p-0">
          <div className="max-h-[50vh] overflow-y-auto p-4 space-y-4">
            {formData.detailedChecklist.map((heading, headingIdx) => (
              <Card key={`${uniqueId}-heading-${headingIdx}`} title={heading.headingName} className="bg-bg-base dark:bg-slate-800/50 shadow-md" contentClassName="space-y-3 p-3">
                {heading.concerns.map((concern, concernIdx) => (
                  <div key={`${uniqueId}-concern-${headingIdx}-${concernIdx}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start border-b border-border-muted dark:border-border-muted/50 pb-2 last:border-b-0 last:pb-0">
                    <label htmlFor={`${uniqueId}-concern-notes-${headingIdx}-${concernIdx}`} className="block text-xs font-medium text-text-muted dark:text-text-muted sm:col-span-5 pt-1.5 break-words">
                      {concern.concernName}
                    </label>
                    <div className="sm:col-span-4">
                      <TextArea
                        id={`${uniqueId}-concern-notes-${headingIdx}-${concernIdx}`}
                        value={concern.notes || ''}
                        onChange={(e) => handleChecklistChange(headingIdx, concernIdx, 'notes', e.target.value)}
                        placeholder="Your notes/observations..."
                        rows={1}
                        className="!text-xs !py-1 leading-snug"
                      />
                    </div>
                    <div className="sm:col-span-3">
                         <select
                            value={concern.status}
                            onChange={(e) => handleChecklistChange(headingIdx, concernIdx, 'status', e.target.value as AuditFindingStatus)}
                            className={`${selectBaseClass} !text-xs !py-1.5`}
                            aria-label={`Status for ${concern.concernName}`}
                        >
                            {auditFindingStatuses.map(statusVal => (
                                <option key={statusVal} value={statusVal} className={optionClass}>{statusVal}</option>
                            ))}
                        </select>
                    </div>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </Card>
      </form>
    </Modal>
  );
};