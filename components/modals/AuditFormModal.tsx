
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Lead, AuditRecord, TeamMember, D2CAuditSection } from '../../types';
import { GoogleGenAI } from '@google/genai';
import { Save, Sparkles, Send } from 'lucide-react';
import { AuditBuilder } from '../audits/AuditBuilder'; // Reusing the builder logic

interface AuditFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (auditData: AuditRecord, leadId: string) => void;
  onGenerateAiReport: (auditRecord: AuditRecord) => Promise<void>;
  lead: Lead;
  existingAuditRecord?: AuditRecord | null;
  currentUser: TeamMember;
  onSetDirty: (isDirty: boolean) => void; 
  ai: GoogleGenAI | null;
}

export const AuditFormModal: React.FC<AuditFormModalProps> = ({ isOpen, onClose, onSave, lead, existingAuditRecord, currentUser, onSetDirty, ai }) => {
  const saveRef = useRef<(() => void) | null>(null);
  
  // We delegate the UI to AuditBuilder, but we need to wrap it in the Modal structure 
  // and map the save logic correctly to the AuditRecord format expected by LeadsView.

  const handleSaveFromBuilder = (audit: any) => {
      // Map the generic 'Audit' type from builder back to 'AuditRecord' structure
      const auditRecord: AuditRecord = {
        id: existingAuditRecord?.id || `audit-${Date.now()}`,
        leadId: lead.id,
        leadName: lead.name,
        auditTypeSubmitted: 'Manual',
        dateConducted: new Date().toISOString(),
        conductedByUserId: currentUser.id,
        conductedByUserName: currentUser.name,
        d2cData: audit.d2cAuditData,
        aiOverallScore: audit.score,
        overallSummary: audit.notes
    };
    onSave(auditRecord, lead.id);
    onClose();
  };

  // Prepare initial data for the builder
  const initialData = existingAuditRecord ? {
      id: existingAuditRecord.id,
      title: 'Lead Growth Audit', // Default title if missing
      entityName: lead.name,
      entityType: 'Lead',
      d2cAuditData: existingAuditRecord.d2cData,
      score: existingAuditRecord.aiOverallScore,
      notes: existingAuditRecord.overallSummary
  } : {
      entityName: lead.name,
      entityType: 'Lead'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full pr-8">
            <div>
                <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                  D2C Brand Growth Audit
                </h1>
                <p className="text-xs text-slate-500 font-medium">Analyzing performance metrics for {lead.name}</p>
            </div>
            <div className="flex gap-2 shrink-0">
                <Button variant="secondary" onClick={() => saveRef.current?.()} leftIcon={<Save className="w-4 h-4"/>} size="sm">Save Draft</Button>
                <Button variant="primary" onClick={() => saveRef.current?.()} leftIcon={<Send className="w-4 h-4"/>} size="sm">Submit Audit</Button>
            </div>
        </div>
      }
      size="7xl"
      overrideZIndex="z-[1050]"
    >
      {/* We reuse AuditBuilder content but suppress its internal header/back buttons if needed via props, 
          or just render it. For now, rendering it directly. */}
      <AuditBuilder 
        onBack={onClose} 
        onSave={handleSaveFromBuilder} 
        initialData={initialData as any} 
        isPopup={true}
        saveRef={saveRef}
      />
    </Modal>
  );
};
