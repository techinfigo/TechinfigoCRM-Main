
import React from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Lead, Client, View, FeatureKey, PermissionAction } from '../../../types'; 

interface AdminCrmViewProps {
  leads: Lead[];
  clients: Client[];
  onNavigateToMainView: (view: View) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

export const AdminCrmView: React.FC<AdminCrmViewProps> = ({ leads, clients, onNavigateToMainView, hasPermission }) => {
  return (
    <Card title="CRM & Lead Tracker Overview" className="bg-white dark:bg-slate-800">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
        This section provides a high-level administrative overview of your CRM data (Leads and Clients) and quick access to their respective management sections.
        Advanced features like a full Kanban view for lead stages or specific lead import/export tools are conceptual and would be part of a more developed CRM module.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-purple-50 dark:bg-purple-700/30 hover:bg-purple-100 dark:hover:bg-purple-700/40 transition-colors" contentClassName="text-center p-6">
          <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300">Total Leads</h3>
          <p className="text-4xl font-bold text-purple-600 dark:text-purple-200 mt-1">{leads.length}</p>
        </Card>
        <Card className="bg-sky-50 dark:bg-sky-700/30 hover:bg-sky-100 dark:hover:bg-sky-700/40 transition-colors" contentClassName="text-center p-6">
          <h3 className="text-lg font-semibold text-sky-700 dark:text-sky-300">Total Clients</h3>
          <p className="text-4xl font-bold text-sky-600 dark:text-sky-200 mt-1">{clients.length}</p>
        </Card>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <Button 
          variant="primary" 
          onClick={() => onNavigateToMainView('LEADS')}
          className="flex-grow sm:flex-grow-0"
          disabled={!hasPermission('leads', 'canView')}
        >
          Manage All Leads
        </Button>
        <Button 
          variant="primary" 
          onClick={() => onNavigateToMainView('CLIENTS')}
          className="flex-grow sm:flex-grow-0"
          disabled={!hasPermission('clients', 'canView')}
        >
          Manage All Clients
        </Button>
      </div>
      <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
        <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-lg mb-3">Conceptual CRM Enhancements:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="Kanban View for Leads" className="bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600" contentClassName="p-3">
                 <p className="text-xs text-slate-500 dark:text-slate-400">Visually track leads through stages: New → Contacted → Qualified → Proposal → Closed (Won/Lost).</p>
            </Card>
            <Card title="Detailed Activity Logging" className="bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600" contentClassName="p-3">
                 <p className="text-xs text-slate-500 dark:text-slate-400">Log notes, tasks, call reminders, and email history for each lead and client.</p>
            </Card>
            <Card title="Lead Import/Export" className="bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600" contentClassName="p-3">
                 <p className="text-xs text-slate-500 dark:text-slate-400">Bulk import leads from CSV/Excel or export lead data for external use.</p>
            </Card>
             <Card title="Automated Follow-ups" className="bg-slate-50 dark:bg-slate-700/50 border dark:border-slate-600" contentClassName="p-3">
                 <p className="text-xs text-slate-500 dark:text-slate-400">Set up automated email sequences or task reminders for lead nurturing.</p>
            </Card>
        </div>
      </div>
       <p className="text-xs text-slate-500 dark:text-slate-400 mt-6 text-center">These enhancements would provide a more robust CRM experience.</p>
    </Card>
  );
};