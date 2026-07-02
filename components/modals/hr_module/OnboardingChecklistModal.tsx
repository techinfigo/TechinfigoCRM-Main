
import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { TeamMember, OnboardingChecklist } from '../../../types';

interface OnboardingChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember;
  onSave: (updatedMember: TeamMember) => void;
}

const initialChecklist: OnboardingChecklist = {
  documentsCollected: false,
  orientationScheduled: false,
  systemAccessProvided: false,
  hrPoliciesShared: false,
};

export const OnboardingChecklistModal: React.FC<OnboardingChecklistModalProps> = ({ isOpen, onClose, member, onSave }) => {
  const [checklist, setChecklist] = useState<OnboardingChecklist>(initialChecklist);

  useEffect(() => {
    if (isOpen) {
      setChecklist(member.onboardingChecklist || initialChecklist);
    }
  }, [isOpen, member.onboardingChecklist]);

  const handleToggle = (key: keyof OnboardingChecklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    const updatedMember = { ...member, onboardingChecklist: checklist };
    onSave(updatedMember);
  };

  const checklistItems: { key: keyof OnboardingChecklist; label: string; description: string }[] = [
    { key: 'documentsCollected', label: 'Document Collection', description: 'Offer letter, ID proofs, educational certificates, etc.' },
    { key: 'orientationScheduled', label: 'Orientation Scheduled', description: 'Company overview, team introductions, and culture presentation.' },
    { key: 'systemAccessProvided', label: 'System Access Provided', description: 'Email, CRM, project management tools, and other necessary software.' },
    { key: 'hrPoliciesShared', label: 'HR Policies Shared', description: 'Leave policy, code of conduct, and other HR documents have been shared.' },
  ];
  
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const progressPercentage = (completedCount / checklistItems.length) * 100;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Onboarding Checklist: ${member.name}`}
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
          <label className="text-sm font-medium text-text-muted dark:text-text-muted">Onboarding Progress</label>
          <div className="mt-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
            <div 
                className="bg-secondary-accent h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-right text-text-muted dark:text-slate-400 mt-1">{completedCount} of {checklistItems.length} tasks complete</p>
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
