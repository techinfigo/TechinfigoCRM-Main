
import React, { useState, useMemo } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { CustomField, CustomFieldModule, CustomFieldType } from '../../../types';
import { Checkbox } from '../../common/Checkbox';

// --- ICONS ---
const PlusIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const EditIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path d="M11.354 1.646a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708L5.061 13.939a.5.5 0 0 1-.353.146H2.5a.5.5 0 0 1-.5-.5V11.293a.5.5 0 0 1 .146-.353L11.354 1.646ZM12.5 2.5 4.207 10.793V13h2.207L13.5 4.707 12.5 3.707V2.5Z" /><path d="m10.854 3.146 2.292 2.292-8.5 8.5H2.5v-2.292l8.5-8.5Z" /></svg>;
const TrashIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5zM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498-.075l-.275-5.5A.75.75 0 0 1 6.05 6zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711z" clipRule="evenodd" /></svg>;

interface CustomFieldsSettingsViewProps {
  customFields: CustomField[];
  onDelete: (fieldId: string) => void;
  onOpenModal: (field: CustomField | null) => void;
}

export const CustomFieldsSettingsView: React.FC<CustomFieldsSettingsViewProps> = ({ customFields, onDelete, onOpenModal }) => {
    const [filterModule, setFilterModule] = useState<string>('All');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFields = useMemo(() => {
        return customFields.filter(field => {
            const matchesModule = filterModule === 'All' || field.modules.includes(filterModule as any);
            const matchesSearch = field.label.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesModule && matchesSearch;
        });
    }, [customFields, filterModule, searchTerm]);

    return (
        <SettingsSectionCard
            title="Custom Fields Management"
            description="Add custom fields to different modules to capture specific data for your business needs."
            contentClassName="p-0"
        >
            <div className="p-4 border-b border-border-base dark:border-border-muted bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Input 
                        placeholder="Search fields..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        containerClassName="w-full sm:w-48"
                        className="!py-1.5"
                    />
                    <select 
                        value={filterModule} 
                        onChange={e => setFilterModule(e.target.value)} 
                        className="w-full sm:w-40 p-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-premium-accent"
                    >
                        <option value="All">All Modules</option>
                        <option value="Leads">Leads</option>
                        <option value="Clients">Clients</option>
                        <option value="Projects">Projects</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                    </select>
                </div>
                <Button onClick={() => onOpenModal(null)} leftIcon={<PlusIcon />} size="sm" variant="primary">Add New Field</Button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border-base dark:divide-border-muted">
                    <thead className="bg-bg-muted dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Label</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Modules</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Required</th>
                            <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-text-muted dark:text-text-muted uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-bg-base dark:bg-bg-muted divide-y divide-border-base dark:divide-border-muted">
                        {filteredFields.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-sm text-text-muted dark:text-text-muted">No custom fields found.</td>
                            </tr>
                        ) : (
                            filteredFields.map((field) => (
                                <tr key={field.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-text-base dark:text-text-base whitespace-nowrap">{field.label}</td>
                                    <td className="px-4 py-3 text-sm text-text-muted dark:text-text-muted whitespace-nowrap">{field.type}</td>
                                    <td className="px-4 py-3 text-sm text-text-muted dark:text-text-muted">
                                        <div className="flex flex-wrap gap-1">
                                            {field.modules.map(mod => (
                                                <span key={mod} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs border border-slate-200 dark:border-slate-600">{mod}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-text-muted dark:text-text-muted whitespace-nowrap">
                                        {field.isRequired ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-slate-400">No</span>}
                                    </td>
                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${field.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                                            {field.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-medium space-x-2 whitespace-nowrap">
                                        <Button variant="ghost" size="xs" className="p-1 text-slate-500 hover:text-premium-accent" onClick={() => onOpenModal(field)} title="Edit"><EditIcon /></Button>
                                        <Button variant="ghost" size="xs" className="p-1 text-slate-500 hover:text-status-negative" onClick={() => { if(window.confirm('Delete this field?')) onDelete(field.id) }} title="Delete"><TrashIcon /></Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </SettingsSectionCard>
    );
};
