
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Checkbox } from '../common/Checkbox';
import { TeamMember, HRDocument, HRDocumentCategory, hrDocumentCategories, HRDocumentStatus, hrDocumentStatuses } from '../../types';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { EmptyStatePlaceholder } from '../partials/EmptyStatePlaceholder';
import { FileText } from 'lucide-react';


interface DocumentManagementViewProps {
  hrDocuments: HRDocument[];
  teamMembers: TeamMember[];
  onSaveHRDocument: (docData: Omit<HRDocument, 'id' | 'uploadedByUserId' | 'uploadedByUserName'>) => void;
  onOpenUploadHRDocumentModal: (defaults?: {employeeId?: string}) => void;
}

const getStatusBadgeStyle = (status: HRDocumentStatus): string => {
    switch (status) {
        case 'Approved': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
        case 'Pending Approval': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800';
        case 'Rejected': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
        case 'Expired': return 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600';
        default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
};

export const DocumentManagementView: React.FC<DocumentManagementViewProps> = ({ hrDocuments, teamMembers, onOpenUploadHRDocumentModal }) => {
    const [filterCategory, setFilterCategory] = useState<HRDocumentCategory | 'All'>('All');
    const [filterStatus, setFilterStatus] = useState<HRDocumentStatus | 'All'>('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

    const getEmployeeName = (employeeId?: string): string => {
        if (!employeeId) return 'N/A';
        const member = teamMembers.find(tm => tm.id === employeeId);
        return member?.name || 'Unknown';
    };

    const filteredDocuments = useMemo(() => {
        return hrDocuments.filter(doc => {
            const employeeName = getEmployeeName(doc.employeeId).toLowerCase();
            const searchMatch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || employeeName.includes(searchTerm.toLowerCase());
            const categoryMatch = filterCategory === 'All' || doc.category === filterCategory;
            const statusMatch = filterStatus === 'All' || doc.status === filterStatus;
            return searchMatch && categoryMatch && statusMatch;
        });
    }, [hrDocuments, searchTerm, filterCategory, filterStatus, teamMembers]);

    const isAllSelected = useMemo(() => {
        if (filteredDocuments.length === 0) return false;
        return filteredDocuments.every(doc => selectedDocs.has(doc.id));
    }, [filteredDocuments, selectedDocs]);


    const handleBatchDownload = async () => {
        if (selectedDocs.size === 0) {
            alert('Please select documents to download.');
            return;
        }
        const zip = new JSZip();
        const docsToDownload = hrDocuments.filter(doc => selectedDocs.has(doc.id));
        
        for (const doc of docsToDownload) {
            if (doc.file) {
                zip.file(doc.name, doc.file);
            } else {
                console.warn(`Document ${doc.name} does not have a local file object. Skipping download.`);
            }
        }
        
        if (Object.keys(zip.files).length > 0) {
            zip.generateAsync({ type: 'blob' }).then(content => {
                saveAs(content, `TECHINFIGO_HR_Documents_${new Date().toISOString().split('T')[0]}.zip`);
            });
        } else {
            alert("No downloadable files were found for the selected documents.");
        }
    };
    
    return (
        <Card title="Document Management" className="bg-transparent shadow-none border-0 p-0 h-full flex flex-col">
            <div className="flex-grow space-y-6 overflow-y-auto p-1">
                <Card className="bg-bg-base dark:bg-bg-muted">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                         <input type="search" placeholder="Search by name, employee..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted text-sm rounded-lg focus:ring-premium-accent block w-full p-2.5" />
                         <select onChange={e => setFilterCategory(e.target.value as any)} value={filterCategory} className="bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted text-sm rounded-lg focus:ring-premium-accent block w-full p-2.5"><option value="All">All Categories</option>{hrDocumentCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                         <select onChange={e => setFilterStatus(e.target.value as any)} value={filterStatus} className="bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted text-sm rounded-lg focus:ring-premium-accent block w-full p-2.5"><option value="All">All Statuses</option>{hrDocumentStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                     <div className="mt-4 flex gap-2">
                        <Button variant="primary" onClick={() => onOpenUploadHRDocumentModal()}>Upload Document</Button>
                        <Button variant="secondary" onClick={handleBatchDownload} disabled={selectedDocs.size === 0}>Download Selected as ZIP</Button>
                     </div>
                </Card>

                {filteredDocuments.length === 0 ? (
                    <EmptyStatePlaceholder
                        icon={<FileText className="w-16 h-16" />}
                        title="No Documents Found"
                        message="No documents match your current filters, or none have been uploaded yet."
                    />
                ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50"><tr><th className="p-2 w-8"></th><th className="p-2 text-left">Document Name</th><th className="p-2 text-left">Category</th><th className="p-2 text-left">Employee</th><th className="p-2 text-left">Upload Date</th><th className="p-2 text-center">Status</th><th className="p-2 text-right">Actions</th></tr></thead>
                        <tbody className="divide-y divide-border-base dark:divide-border-muted">
                            {filteredDocuments.map(doc => (
                                <tr key={doc.id}>
                                    <td className="p-2"><Checkbox checked={selectedDocs.has(doc.id)} onChange={() => setSelectedDocs(prev => { const next = new Set(prev); if(next.has(doc.id)) next.delete(doc.id); else next.add(doc.id); return next; })} /></td>
                                    <td className="p-2 font-medium">{doc.name}</td><td>{doc.category}</td><td>{getEmployeeName(doc.employeeId)}</td><td>{new Date(doc.uploadDate).toLocaleDateString()}</td>
                                    <td className="text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(doc.status)}`}>{doc.status}</span></td>
                                    <td className="p-2 text-right space-x-1"><Button size="xs" variant="outline">View</Button><Button size="xs" variant="secondary">Approve</Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>
        </Card>
    );
};
