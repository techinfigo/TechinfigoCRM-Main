
import React, { useState } from 'react';
import { Audit, Lead, Client } from '../../types';
import { AuditsList } from '../audits/AuditsList';
import { AuditBuilder } from '../audits/AuditBuilder';
import { AuditDetail } from '../audits/AuditDetail';

interface AuditsViewProps {
  audits: Audit[];
  onSaveAudit: (audit: Audit) => void;
  onDeleteAudit?: (auditId: string) => void;
  prefillData?: { type: 'Lead' | 'Client', id: string, name: string };
  leads?: Lead[];
  clients?: Client[];
}

type SubView = 'LIST' | 'CREATE' | 'DETAIL';

export const AuditsView: React.FC<AuditsViewProps> = ({ audits, onSaveAudit, onDeleteAudit, prefillData, leads = [], clients = [] }) => {
  const [subView, setSubView] = useState<SubView>(prefillData ? 'CREATE' : 'LIST');
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  const handleCreateAudit = () => {
    setSelectedAudit(null);
    setSubView('CREATE');
  };

  const handleSelectAudit = (audit: Audit) => {
    setSelectedAudit(audit);
    setSubView('DETAIL');
  };

  const handleBack = () => {
    setSubView('LIST');
    setSelectedAudit(null);
  };

  const handleSave = (newAudit: Audit) => {
    onSaveAudit(newAudit);
    setSubView('LIST');
  };

  // Generate initial data if prefillData exists
  const initialData = prefillData ? {
      entityType: prefillData.type,
      entityId: prefillData.id,
      entityName: prefillData.name
  } : undefined;

  if (subView === 'CREATE') {
    // If we arrived here via Edit, seed the builder with the existing audit.
    return <AuditBuilder onBack={handleBack} onSave={handleSave} initialData={selectedAudit || initialData} leads={leads} clients={clients} />;
  }

  if (subView === 'DETAIL' && selectedAudit) {
    return <AuditDetail
      audit={selectedAudit}
      onBack={handleBack}
      onEdit={(a) => { setSelectedAudit(a); setSubView('CREATE'); }}
      onMarkSent={(a) => onSaveAudit({ ...a, status: 'Sent' })}
      onDelete={(a) => {
        if (window.confirm('Delete this audit? This cannot be undone.')) {
          onDeleteAudit && onDeleteAudit(a.id);
          handleBack();
        }
      }}
    />;
  }

  return <AuditsList audits={audits} onSelectAudit={handleSelectAudit} onCreateAudit={handleCreateAudit} />;
};
