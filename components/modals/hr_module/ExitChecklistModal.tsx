
import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { TeamMember, ExitChecklist } from '../../../types';

interface ExitChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  onSave: (updatedMember: TeamMember) => void;
}

const initialChecklist: ExitChecklist = {
  clearanceFormSubmitted: false,
  assetHandoverComplete: false,
  exitInterviewConducted: false,
  systemAccessRevoked: false,
};

export const ExitChecklistModal: React.FC<ExitChecklistModalProps> = ({ isOpen, onClose, member, onSave }) => {
  const [checklist, setChecklist] = useState<ExitChecklist>(initialChecklist);

  useEffect(() => {
    if (isOpen) {
      setChecklist(member.exitChecklist || initialChecklist);
    }
  }, [isOpen, member.exitChecklist]);

  const handleToggle = (key: keyof ExitChecklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const updatedMember = { ...member, exitChecklist: checklist };
    onSave(updatedMember);
  };

  const checklistItems: { key: keyof ExitChecklist; label: string; description: string }[] = [
    { key: 'clearanceFormSubmitted', label: 'Department Clearance Form', description: 'Signed off by all relevant department heads (IT, Admin, Finance).' },
    { key: 'assetHandoverComplete', label: 'Company Asset Handover', description: 'Laptop, ID card, phone, and other company property returned.' },
    { key: 'exitInterviewConducted', label: 'Exit Interview Conducted', description: 'Feedback session completed with HR.' },
    { key: 'systemAccessRevoked', label: 'System Access Revoked', description: 'All system and email access has been deactivated.' },
  ];
  
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const progressPercentage = (completedCount / checklistItems.length) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Exit Checklist: ${member.name}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Checklist</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-text-muted dark:text-text-muted">Offboarding Progress</label>
          <div className="mt-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div 
                className="bg-red-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-right text-text-muted dark:slate-400 mt-1">{completedCount} of {checklistItems.length} tasks complete</p>
        </div>

        <div className="space-y-3">
            {checklistItems.map(item => (
                <div key={item.key} className="flex items-start p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                    <input
                        type="checkbox"
                        id={item.key}
                        checked={checklist[item.key]}
                        onChange={() => handleToggle(item.key)}
                        className="h-5 w-5 mt-0.5 text-premium-accent border-border-muted rounded focus:ring-premium-accent cursor-pointer"
                    />
                    <div className="ml-3">
                        <label htmlFor={item.key} className="font-medium text-text-base dark:text-text-base cursor-pointer">
                            {item.label}
                        </label>
                        <p className="text-xs text-text-muted dark:text-slate-400">{item.description}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </Modal>
  );
};
