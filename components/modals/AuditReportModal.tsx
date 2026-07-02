import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Lead, AuditRecord, TeamMember, AuditParameterDetail, AuditFindingStatus, Client } from '../../types';
import { ECOMMERCE_AUDIT_PARAMETERS } from '../../constants';
import AuditReportPDF from '@/components/pdf/AuditReportPDF';


interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  auditRecord: AuditRecord;
  onEditAudit: (lead: Lead) => void;
  currentUser: TeamMember; 
}

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5"><path d="M13 4.5a2.5 2.5 0 11.702 4.289l-3.296 3.296a2.5 2.5 0 11-1.414-1.414l3.296-3.296A2.5 2.5 0 0113 4.5z" /><path d="M6.5 12.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM17.5 6.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM11.53 8.47a.75.75 0 00-1.06-1.06l-3.296 3.296a.75.75 0 101.06 1.06l3.296-3.296z" /></svg>;


const getStatusBadgeStyle = (status?: AuditFindingStatus): string => {
    switch (status) {
        case 'Good': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
        case 'Critical': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
        case 'Needs Improvement': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
        case 'Not Applicable': case 'Not Evaluated': return 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400';
        default: return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
};

const TableHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <th scope="col" className={`p-2 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider ${className || ''}`}>
        {children}
    </th>
);


export const AuditReportModal: React.FC<AuditReportModalProps> = ({ isOpen, onClose, lead, auditRecord, onEditAudit, currentUser }) => {
  
  const totalEstimatedLoss = useMemo(() => {
    if (!auditRecord.eCommerceAuditFindings) return 0;
    const total = Object.values(auditRecord.eCommerceAuditFindings).reduce((sum: number, finding: any) => {
        return sum + (finding?.estimatedLossPercent || 0);
    }, 0);
    return Math.min(100, parseFloat((total as number).toFixed(1))); // Cap at 100
  }, [auditRecord.eCommerceAuditFindings]);

  const handleDownloadPdf = () => {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    const pdfContent = (
      <React.StrictMode>
        <AuditReportPDF 
          auditRecord={auditRecord} 
          client={lead as unknown as Client} // Treat lead as client for prop compatibility
        />
      </React.StrictMode>
    );

    const root = ReactDOM.createRoot(tempContainer);
    root.render(pdfContent);
    
    // Allow React to render before capturing
    setTimeout(() => {
        const element = tempContainer.firstChild as HTMLElement;
        const opt = {
            margin:       0,
            filename:     `Audit_Report_${lead.name.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // @ts-ignore
        const html2pdfLib = window.html2pdf;

        if (typeof html2pdfLib !== 'undefined') {
             html2pdfLib().set(opt).from(element).save().then(() => {
                root.unmount();
                document.body.removeChild(tempContainer);
            });
        } else {
            alert("PDF generator library not loaded. Please try 'Print' and 'Save as PDF'.");
             root.unmount();
             document.body.removeChild(tempContainer);
        }
       
    }, 500);
  };

  const handleShareLink = () => {
    const link = `${window.location.origin}/share/audit/${auditRecord.id}`;
    navigator.clipboard.writeText(link).then(() => {
        alert(`Link copied to clipboard: ${link}`);
    }).catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Could not copy link to clipboard.');
    });
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Audit Report for: ${lead.name}`}
      size="5xl" // Increased size for table
      footer={
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-text-muted dark:text-slate-400 text-center sm:text-left">
                Audit by {auditRecord.conductedByUserName} on {new Date(auditRecord.dateConducted).toLocaleDateString()}
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                <Button variant="secondary" onClick={onClose}>Close</Button>
                <Button variant="outline" size="sm" onClick={handleShareLink} leftIcon={<ShareIcon/>}>Share Link</Button>
                <Button variant="outline" size="sm" onClick={handleDownloadPdf} leftIcon={<DownloadIcon/>}>Download PDF</Button>
                <Button variant="primary" onClick={() => onEditAudit(lead)} leftIcon={<EditIcon/>}>Edit Report</Button>
            </div>
        </div>
      }
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto p-1 pr-2">
        <Card title="Overall Summary" className="bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <h4 className="font-semibold text-sm mb-1">Manual Summary</h4>
                <p className="text-sm text-text-base dark:text-slate-200 whitespace-pre-wrap">{auditRecord.overallSummary || <span className="italic text-slate-400 dark:text-slate-500">No manual summary provided.</span>}</p>
              </div>
              <div className="p-3 bg-bg-base dark:bg-bg-muted rounded-lg text-center shadow">
                 <h4 className="text-xs font-medium text-text-muted dark:text-text-muted uppercase">Total Est. Conversion Loss</h4>
                 <p className="text-3xl font-bold text-status-warning dark:text-status-warning">{totalEstimatedLoss}%</p>
              </div>
          </div>
        </Card>

        {ECOMMERCE_AUDIT_PARAMETERS.map((headingSection, idx) => (
          <Card 
            key={`${headingSection.headingName}-${idx}`} 
            title={headingSection.headingName}
            className="bg-bg-base dark:bg-bg-muted"
            contentClassName="p-0 overflow-x-auto"
          >
            <table className="min-w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        <TableHeader className="w-1/5">Parameter</TableHeader>
                        <TableHeader className="w-1/4">Current Situation</TableHeader>
                        <TableHeader className="w-1/4">Ideal Benchmark (AI)</TableHeader>
                        <TableHeader className="w-1/4">Suggestion (AI)</TableHeader>
                        <TableHeader className="w-[10%] text-center">Loss (%)</TableHeader>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-base dark:divide-border-muted">
                    {headingSection.concerns.map(concern => {
                        const finding: any = auditRecord.eCommerceAuditFindings?.[concern.key];
                        return (
                            <tr key={concern.key}>
                                <td className="p-2 align-top">
                                    <p className="font-semibold">{concern.label}</p>
                                    <span className={`mt-1 inline-block px-1.5 py-0.5 rounded-full text-xxs ${getStatusBadgeStyle(finding?.status)}`}>{finding?.status || 'N/A'}</span>
                                </td>
                                <td className="p-2 align-top text-text-muted dark:text-slate-300">{finding?.currentSituation || '-'}</td>
                                <td className="p-2 align-top text-text-muted dark:text-slate-300">{finding?.idealBenchmark || '-'}</td>
                                <td className="p-2 align-top text-text-muted dark:text-slate-300">{finding?.suggestion || '-'}</td>
                                <td className={`p-2 align-top text-center font-bold ${finding?.estimatedLossPercent && finding.estimatedLossPercent > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {finding?.estimatedLossPercent !== undefined ? `${finding.estimatedLossPercent}%` : '-'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
          </Card>
        ))}
      </div>
    </Modal>
  );
};