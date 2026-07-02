
import React, { useState, useMemo } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { Checkbox } from '../../common/Checkbox';

// Dummy type for form responses
interface FormResponse {
  id: string;
  formName: string;
  submittedBy: string; // Could be client name, user name, etc.
  date: string;
  status: 'New' | 'Viewed' | 'Actioned';
  relatedEntity?: string; // e.g., Client ID or Lead ID
}

const dummyResponses: FormResponse[] = [
    { id: 'resp-1', formName: 'Client Onboarding Q&A', submittedBy: 'Wonderland Creations', date: new Date(2024, 4, 10).toISOString(), status: 'Actioned', relatedEntity: 'client-1629876543210' },
    { id: 'resp-2', formName: 'Marketing Audit Input', submittedBy: 'Bob\'s Fix-It Shop', date: new Date(2024, 4, 1).toISOString(), status: 'Viewed', relatedEntity: 'client-1629876543211' },
    { id: 'resp-3', formName: 'Lead Capture Form', submittedBy: 'lucy@peanuts.com', date: new Date(2024, 5, 1).toISOString(), status: 'New', relatedEntity: 'lead-1800000000002' },
    { id: 'resp-4', formName: 'Contact Us Form', submittedBy: 'snoopy@doghouse.com', date: new Date(2024, 5, 5).toISOString(), status: 'New', relatedEntity: 'lead-1800000000003' }
];

const getStatusBadgeStyle = (status: FormResponse['status']) => {
    switch (status) {
        case 'New': return 'bg-blue-100 text-blue-800 dark:bg-blue-700/30 dark:text-blue-300';
        case 'Viewed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/30 dark:text-yellow-300';
        case 'Actioned': return 'bg-green-100 text-green-800 dark:bg-green-700/30 dark:text-green-300';
        default: return 'bg-slate-100 text-slate-800';
    }
};

export const FormResponsesSettingsView: React.FC = () => {
    const [responses, setResponses] = useState(dummyResponses);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const filteredResponses = useMemo(() => {
        return responses.filter(resp => 
            resp.formName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            resp.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [responses, searchTerm]);
    
    const isAllSelected = useMemo(() => {
        return filteredResponses.length > 0 && filteredResponses.every(r => selectedIds.has(r.id));
    }, [filteredResponses, selectedIds]);

    const handleSelectAll = () => {
        if(isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredResponses.map(r => r.id)));
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };
    
    return (
        <SettingsSectionCard
            title="Form Responses"
            description="View and manage submissions from public and internal forms integrated with the CRM."
        >
            <div className="space-y-4">
                <div className="flex justify-between items-center flex-wrap gap-2">
                    <Input 
                        placeholder="Search forms or submitters..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-xs"
                    />
                    <div className="flex gap-2">
                        <Button variant="secondary" disabled={selectedIds.size === 0}>Mark as Viewed</Button>
                        <Button variant="danger" disabled={selectedIds.size === 0}>Delete Selected</Button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border-base dark:border-border-muted">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="p-3 w-10"><Checkbox checked={isAllSelected} onChange={handleSelectAll} indeterminate={selectedIds.size > 0 && !isAllSelected}/></th>
                                <th scope="col" className="p-3 text-left font-semibold text-text-muted dark:text-text-muted">Form Name</th>
                                <th scope="col" className="p-3 text-left font-semibold text-text-muted dark:text-text-muted">Submitted By</th>
                                <th scope="col" className="p-3 text-left font-semibold text-text-muted dark:text-text-muted">Date</th>
                                <th scope="col" className="p-3 text-center font-semibold text-text-muted dark:text-text-muted">Status</th>
                                <th scope="col" className="p-3 text-right font-semibold text-text-muted dark:text-text-muted">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-bg-base dark:bg-bg-muted divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredResponses.map(resp => (
                                <tr key={resp.id}>
                                    <td className="p-3"><Checkbox checked={selectedIds.has(resp.id)} onChange={() => handleSelectOne(resp.id)} /></td>
                                    <td className="p-3 font-medium">{resp.formName}</td>
                                    <td className="p-3 text-text-muted dark:text-text-muted">{resp.submittedBy}</td>
                                    <td className="p-3 text-text-muted dark:text-text-muted">{new Date(resp.date).toLocaleDateString()}</td>
                                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeStyle(resp.status)}`}>{resp.status}</span></td>
                                    <td className="p-3 text-right"><Button size="xs" variant="outline">View Response</Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {filteredResponses.length === 0 && <p className="text-center py-8 text-text-muted">No responses found.</p>}
            </div>
        </SettingsSectionCard>
    );
};
