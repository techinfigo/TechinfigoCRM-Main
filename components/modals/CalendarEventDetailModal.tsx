import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CalendarEvent, View, Project, MarketingAuditRequest, Invoice, Lead, Task, CampaignAnomaly } from '../../types';

interface CalendarEventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  events: CalendarEvent[];
  projects: Project[]; 
  setCurrentView: (view: View) => void;
  setSelectedProjectForDetail: (project: Project | null) => void;
  handleViewAuditDetail: (audit: MarketingAuditRequest) => void;
  onOpenInvoiceModal: (invoice: Invoice | null) => void;
  onOpenLeadModal: (lead: Lead | null) => void;
  // Future: Add handler for CampaignAnomaly if needed
  // onOpenCampaignReportModal?: (campaign: Campaign) => void; 
}

export const CalendarEventDetailModal: React.FC<CalendarEventDetailModalProps> = ({
  isOpen,
  onClose,
  date,
  events,
  projects,
  setCurrentView,
  setSelectedProjectForDetail,
  handleViewAuditDetail,
  onOpenInvoiceModal,
  onOpenLeadModal,
}) => {

  const handleViewDetails = (event: CalendarEvent) => {
    onClose(); 
    switch (event.type) {
      case 'project':
        setSelectedProjectForDetail(event.originalItem as Project);
        setCurrentView('PROJECT_DETAIL');
        break;
      case 'task':
        const task = event.originalItem as Task;
        const parentProject = projects.find(p => p.tasks.some(t => t.id === task.id));
        if (parentProject) {
          setSelectedProjectForDetail(parentProject);
          setCurrentView('PROJECT_DETAIL');
        } else {
          alert("Could not find parent project for this task.");
        }
        break;
      case 'invoice':
        onOpenInvoiceModal(event.originalItem as Invoice);
        break;
      case 'lead':
        onOpenLeadModal(event.originalItem as Lead);
        break;
      case 'audit':
        handleViewAuditDetail(event.originalItem as MarketingAuditRequest);
        break;
      case 'anomaly':
        // Placeholder: Navigate to campaign view or open campaign report modal
        const anomaly = event.originalItem as CampaignAnomaly;
        alert(`Anomaly detected for ${anomaly.campaignName}: ${anomaly.metric}. Details would be shown in the campaign report.`);
        // Example: if (onOpenCampaignReportModal) onOpenCampaignReportModal(campaigns.find(c => c.id === anomaly.campaignId));
        setCurrentView('CAMPAIGNS'); // Or navigate to a specific campaign's detail/report view
        break;
      default:
        console.warn("Unknown event type for navigation:", event.type);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Events for ${date.toLocaleDateString()}`}
      size="lg"
      footer={
        <Button variant="secondary" onClick={onClose}>Close</Button>
      }
    >
      <div className="px-1">
        {events.length === 0 ? (
            <p className="text-text-muted dark:text-text-muted text-center py-6 italic">No events for this day.</p>
        ) : (
            <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {events.map(event => (
                <li key={event.id} className={`p-3 rounded-lg border ${event.colorClass} bg-opacity-10 dark:bg-opacity-20 border-opacity-30 flex justify-between items-center hover:shadow-sm transition-shadow`}>
                <div>
                    <p className={`font-semibold text-sm ${event.colorClass.replace(/bg-(.+?(-?\d{2,3})?)/, 'text-$1')}`}>
                    {event.title}
                    </p>
                    <p className="text-xs text-text-muted dark:text-text-muted capitalize mt-0.5">{event.type}</p>
                </div>
                <Button variant="outline" size="xs" onClick={() => handleViewDetails(event)} className="!border-opacity-50 hover:!bg-opacity-20">
                    View Details
                </Button>
                </li>
            ))}
            </ul>
        )}
      </div>
    </Modal>
  );
};