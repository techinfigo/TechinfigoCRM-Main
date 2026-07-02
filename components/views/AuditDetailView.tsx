
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MarketingAuditRequest, Client, MarketingAuditStatus, FeatureKey, PermissionAction, AuditChecklistHeading, AuditFindingStatus } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../partials/LoadingSpinner';
import { Modal } from '../common/Modal';

// Icon Props Interface
interface IconProps {
  className?: string;
}

// Icons
const SparklesIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${propClassName || ''}`}><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.423 3.595c-.736.771.256 1.991.984 1.991H6.9l-1.296 4.401c-.16.546.435.946.945.626L10 15.11l2.371 2.754c.484.563 1.377.206 1.486-.459l.526-3.23L15.013 18c.554.01.98-.426.98-.979l.003-3.712 2.768-.23c.63-.053.923-.83.486-1.309l-3.423-3.595-4.753-.39-1.83-4.401z" clipRule="evenodd" /></svg>;
const EditIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${propClassName || ''}`}><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const InfoIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-5 h-5 ${propClassName || ''}`}><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>;
const ClipboardIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${propClassName || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>;
const DownloadIcon: React.FC<IconProps> = ({ className: propClassName }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${propClassName || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;


interface AuditDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  audit: MarketingAuditRequest;
  clients: Client[];
  onGenerateReport: (auditId: string) => Promise<void>;
  onUpdateStatus: (auditId: string, status: MarketingAuditStatus) => void;
  onEditAuditRequest: (audit: MarketingAuditRequest) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

const auditStatusesList: MarketingAuditStatus[] = ['Requested', 'InProgress', 'AIGenerating', 'ReviewPending', 'Completed', 'Error'];

const getStatusBadgeStyle = (status: MarketingAuditStatus | AuditFindingStatus): string => {
    switch (status) {
        case 'Requested': return 'bg-sky-100 text-sky-700 dark:bg-sky-700/30 dark:text-sky-300';
        case 'InProgress': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
        case 'AIGenerating': return 'bg-purple-100 text-purple-700 dark:bg-purple-700/30 dark:text-purple-300 animate-pulse';
        case 'ReviewPending': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700/30 dark:text-indigo-300';
        case 'Completed': case 'Good': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
        case 'Error': case 'Critical': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
        case 'Needs Improvement': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
        case 'Not Applicable': case 'Not Evaluated': return 'bg-slate-100 text-slate-600 dark:bg-slate-600/30 dark:text-slate-400';
        default: return 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200';
    }
};

export const AuditDetailView: React.FC<AuditDetailViewProps> = ({
  isOpen, onClose, audit, clients, onGenerateReport, onUpdateStatus, onEditAuditRequest, hasPermission
}) => {
  const clientForDisplay = audit.clientInfoForReport 
    ? audit.clientInfoForReport
    : clients.find(c => c.id === audit.clientId) || { name: 'N/A', companyName: 'N/A', website: audit.websiteUrl };

  const handleGenerateReportClick = () => {
    if (window.confirm("This will use the AI to generate a new report. Any existing report content may be overwritten. Proceed?")) {
      onGenerateReport(audit.id);
    }
  };
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateStatus(audit.id, e.target.value as MarketingAuditStatus);
  };

  const handleCopyReport = () => {
    if (audit.reportContent) {
      navigator.clipboard.writeText(audit.reportContent)
        .then(() => alert('Report content copied to clipboard!'))
        .catch(err => alert('Failed to copy report. Please try manually.'));
    } else {
      alert('No report content available to copy.');
    }
  };

  const handleDownloadReport = () => {
    if (audit.reportContent) {
      const blob = new Blob([audit.reportContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `audit-report-${(audit.websiteUrl || 'untitled').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('No report content available to download.');
    }
  };

  const selectBaseClass = "p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-text-base dark:text-text-base text-sm";
  const optionClass = "bg-bg-base dark:bg-bg-muted text-text-base dark:text-text-base";
  
  const renderRecommendations = (recommendations?: string) => {
    if (!recommendations) return <p className="text-sm text-text-muted dark:text-text-muted">No specific recommendations.</p>;
    const lines = recommendations.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.some(line => /^\d+\.\s+/.test(line) || /^[-*+]\s+/.test(line))) {
        return (
            <ul className="list-disc space-y-1 pl-5 text-sm text-text-base dark:text-text-base">
                {lines.map((line, index) => <li key={index}>{line.replace(/^\s*(\d+\.|[-*+])\s+/, '')}</li>)}
            </ul>
        );
    }
    return <p className="text-sm text-text-base dark:text-text-base whitespace-pre-wrap">{recommendations}</p>;
  };

  const renderMarkdownReport = (markdownText?: string): { __html: string } => {
    if (!markdownText) return { __html: "" };
    let html = markdownText;
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-5 mb-3">$1</h1>');
    
    // Bold and Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Lists
    const blocks = html.split(/\n\s*\n/); 
    html = blocks.map(block => {
      block = block.trim();
      if (block.match(/^\s*([-*+]|\d+\.)\s+/m)) {
        const listItems = block.split('\n').map(line => {
          line = line.trim();
          if (line.match(/^\s*([-*+])\s+(.*)/)) return `<li>${line.replace(/^\s*[-*+]\s+/, '')}</li>`;
          if (line.match(/^\s*\d+\.\s+(.*)/)) return `<li>${line.replace(/^\s*\d+\.\s+/, '')}</li>`;
          return null; 
        }).filter(item => item !== null).join('');
        const listTagAttributes = block.match(/^\s*\d+\.\s+/) ? 'ol class="list-decimal pl-5 my-2"' : 'ul class="list-disc pl-5 my-2"';
        const closingTagName = listTagAttributes.startsWith('ol') ? 'ol' : 'ul';
        return `<${listTagAttributes}>${listItems}</${closingTagName}>`;
      }
      else if (block.match(/^<(h[1-6]|strong|em|ul|ol|li)/i) && block.match(/<\/(h[1-6]|strong|em|ul|ol|li)>$/i)) return block; 
      else if (block) return `<p>${block.replace(/\n/g, '<br />')}</p>`;
      return '';
    }).join('');

    // Clean up extra breaks around block elements
    html = html.replace(/<br\s*\/?>\s*<(ul|ol|li|h[1-6]|p)/gi, '<$1');
    html = html.replace(/<\/(ul|ol|li|h[1-6]|p)><br\s*\/?>/gi, '</$1>');
    html = html.replace(/<p>\s*<\/p>/gi, ''); // Remove empty paragraphs
    return { __html: html };
  };


  return (
    <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
            <div className="flex flex-col">
                 <span className="text-xl md:text-2xl font-bold text-text-base dark:text-text-base">
                    Marketing Audit: <span className="text-premium-accent dark:text-premium-accent-dark">{audit.websiteUrl}</span>
                 </span>
                 <span className={`mt-1 px-2 py-0.5 self-start rounded-full text-xs font-semibold border ${getStatusBadgeStyle(audit.status)}`}>
                    Status: {audit.status}
                 </span>
            </div>
        }
        size="5xl" 
        footer={<Button onClick={onClose} variant="secondary">Close</Button>}
    >
        <div className="space-y-6 pb-10">
            <Card title="Audit Request Details" icon={<InfoIcon />} className="bg-bg-base dark:bg-bg-muted shadow-md rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <p><strong className="text-text-muted dark:text-text-muted">Client:</strong> <span className="text-text-base dark:text-text-base">{clientForDisplay.name} ({clientForDisplay.companyName || 'N/A'})</span></p>
                    <p><strong className="text-text-muted dark:text-text-muted">Website:</strong> <a href={`http://${audit.websiteUrl}`} target="_blank" rel="noopener noreferrer" className="text-premium-accent hover:underline">{audit.websiteUrl}</a></p>
                    <p><strong className="text-text-muted dark:text-text-muted">Date Requested:</strong> <span className="text-text-base dark:text-text-base">{new Date(audit.dateRequested).toLocaleDateString()}</span></p>
                    <p><strong className="text-text-muted dark:text-text-muted">Focus Areas:</strong> <span className="text-text-base dark:text-text-base">{audit.focusAreas.join(', ') || 'N/A'}</span></p>
                    <div className="md:col-span-2"><strong className="text-text-muted dark:text-text-muted">Primary Goals:</strong> <p className="text-text-base dark:text-text-base whitespace-pre-wrap mt-0.5">{audit.primaryGoals || 'N/A'}</p></div>
                    {audit.competitors && audit.competitors.length > 0 && <div className="md:col-span-2"><strong className="text-text-muted dark:text-text-muted">Competitors:</strong> <p className="text-text-base dark:text-text-base mt-0.5">{audit.competitors.join(', ')}</p></div>}
                    {audit.additionalNotes && <div className="md:col-span-2"><strong className="text-text-muted dark:text-text-muted">Additional Notes:</strong> <p className="text-text-base dark:text-text-base mt-0.5 whitespace-pre-wrap">{audit.additionalNotes}</p></div>}
                </div>
                {hasPermission('marketingAudits', 'canEdit') && (
                    <div className="mt-4 pt-3 border-t border-border-base dark:border-border-muted">
                        <Button onClick={() => onEditAuditRequest(audit)} variant="outline" size="sm" leftIcon={<EditIcon />}>
                            Edit Audit Request Details
                        </Button>
                    </div>
                 )}
            </Card>
            
            <Card title="AI Report Generation" icon={<SparklesIcon />} className="bg-bg-base dark:bg-bg-muted shadow-md rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex flex-wrap gap-2">
                    {hasPermission('auditDetail', 'canGenerateReport') && (
                    <Button 
                        onClick={handleGenerateReportClick} 
                        variant="primary" 
                        size="md" 
                        leftIcon={audit.status === 'AIGenerating' ? <LoadingSpinner /> : <SparklesIcon />}
                        disabled={audit.status === 'AIGenerating'}
                        className="w-full sm:w-auto"
                    >
                        {audit.status === 'AIGenerating' ? 'Generating Report...' : audit.reportContent ? 'Re-generate AI Report' : 'Generate AI Report'}
                    </Button>
                    )}
                    {audit.reportContent && (
                        <>
                        <Button onClick={handleCopyReport} variant="secondary" size="md" leftIcon={<ClipboardIcon />} className="w-full sm:w-auto">Copy Report Text</Button>
                        <Button onClick={handleDownloadReport} variant="secondary" size="md" leftIcon={<DownloadIcon />} className="w-full sm:w-auto">Download Report (.md)</Button>
                        </>
                    )}
                </div>
                {audit.lastGeneratedDate && (
                    <p className="text-xs text-text-muted dark:text-text-muted mt-2 sm:mt-0">Last generated: {new Date(audit.lastGeneratedDate).toLocaleString()}</p>
                )}
                </div>
                {audit.status === 'Error' && audit.errorMessage && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-status-negative dark:bg-status-negative/20 dark:text-status-negative dark:border-status-negative/50">
                    <strong>Error generating report:</strong> {audit.errorMessage}
                </div>
                )}
                {audit.status === 'AIGenerating' && !audit.reportContent && (
                <div className="mt-4 text-center text-text-muted dark:text-text-muted">
                    <LoadingSpinner message="AI is analyzing and generating the report. This might take a few moments..." />
                </div>
                )}
            </Card>
            
            {(audit.aiExecutiveSummary || audit.aiOverallAuditScore !== undefined || audit.aiTotalEstimatedConversionLoss) && (
                <Card title="AI Audit Summary" icon={<SparklesIcon />} className="bg-highlight-accent dark:bg-slate-800 shadow-lg rounded-lg border-premium-accent/30 dark:border-premium-accent-dark/30">
                    <div className="space-y-4">
                        {audit.aiExecutiveSummary && (
                            <div> <h3 className="text-md font-semibold text-text-base dark:text-text-base mb-1">Executive Summary</h3> <p className="text-sm text-text-muted dark:text-text-muted whitespace-pre-wrap">{audit.aiExecutiveSummary}</p> </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                            {audit.aiOverallAuditScore !== undefined && ( <div className="p-3 bg-bg-base dark:bg-bg-muted rounded-lg text-center shadow"> <h4 className="text-xs font-medium text-text-muted dark:text-text-muted uppercase">Overall Score</h4> <p className="text-3xl font-bold text-premium-accent dark:text-premium-accent-dark">{audit.aiOverallAuditScore}<span className="text-lg">/100</span></p> </div> )}
                            {audit.aiTotalEstimatedConversionLoss && ( <div className="p-3 bg-bg-base dark:bg-bg-muted rounded-lg text-center shadow"> <h4 className="text-xs font-medium text-text-muted dark:text-text-muted uppercase">Est. Conversion Uplift</h4> <p className="text-xl font-semibold text-status-positive dark:text-status-positive">{audit.aiTotalEstimatedConversionLoss}</p> </div> )}
                        </div>
                        {audit.aiChartsData?.conversionLossByHeading && Object.keys(audit.aiChartsData.conversionLossByHeading).length > 0 && (
                            <div className="pt-3"> <h3 className="text-md font-semibold text-text-base dark:text-text-base mb-1">Performance by Category</h3> 
                            <ul className="text-xs list-disc pl-4">
                                {Object.entries(audit.aiChartsData.conversionLossByHeading).map(([heading, data]) => (
                                <li key={heading} className="text-text-muted dark:text-text-muted">
                                    <strong>{heading}:</strong> Score: {(data as any).score || 'N/A'}, Impact: {(data as any).impact}, Est. Loss: {(data as any).percentage || 'N/A'}
                                </li>
                                ))}
                            </ul>
                            </div>
                        )}
                    </div>
                </Card>
            )}
            
            <Card title="Detailed Audit Report Content" icon={<ClipboardIcon />} className="bg-bg-base dark:bg-bg-muted shadow-md rounded-lg">
                {audit.reportContent ? (
                    <article
                        className="prose prose-sm dark:prose-invert max-w-none p-1"
                        dangerouslySetInnerHTML={renderMarkdownReport(audit.reportContent)}
                    />
                ) : (
                    <p className="text-sm text-center text-text-muted dark:text-text-muted py-6">
                        No detailed report content available. Please generate the report using the AI tool.
                    </p>
                )}
            </Card>
        </div>
    </Modal>
  );
};
