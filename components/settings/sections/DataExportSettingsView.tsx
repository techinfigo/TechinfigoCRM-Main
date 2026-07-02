import React, { useRef, useState } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Button } from '../../common/Button';
import { FeatureKey, PermissionAction, ImportSummary, BackupData } from '../../../types';

interface DataExportSettingsViewProps {
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onRepairStorage: () => void;
  onExportData: () => void;
  onImportData: (fileContent: string) => void;
}

const ArrowDownTrayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const ArrowUpTrayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9.25 13.75a.75.75 0 001.5 0V4.793l2.97 2.97a.75.75 0 001.06-1.06l-4.25-4.25a.75.75 0 00-1.06 0L5.22 6.703a.75.75 0 001.06 1.06L9.25 4.793V13.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const ArchiveBoxXMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1.5 3.5A1.5 1.5 0 013 2h14a1.5 1.5 0 011.5 1.5v13A1.5 1.5 0 0117 18H3a1.5 1.5 0 01-1.5-1.5v-13zM3 3.5a.5.5 0 00-.5.5v13a.5.5 0 00.5.5h14a.5.5 0 00.5-.5v-13a.5.5 0 00-.5-.5H3z" clipRule="evenodd" /><path d="M7.854 8.146a.5.5 0 10-.708.708L9.293 11l-2.147 2.146a.5.5 0 00.708.708L10 11.707l2.146 2.147a.5.5 0 00.708-.708L10.707 11l2.147-2.146a.5.5 0 00-.708-.708L10 10.293 7.854 8.146z" /></svg>;
const WrenchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.09 4.846A3.992 3.992 0 0010 4.5a3.992 3.992 0 00-1.09.346l-.37-.37a1.5 1.5 0 00-2.122 2.122l.371.37A3.992 3.992 0 006 8.09V10H4.5a1.5 1.5 0 000 3H6v1.91a3.992 3.992 0 001.154 1.09l-.37.371a1.5 1.5 0 002.122 2.122l.37-.37A3.992 3.992 0 0010 17.5a3.992 3.992 0 001.09-.346l.37.37a1.5 1.5 0 002.122-2.122l-.371-.37A3.992 3.992 0 0014 13.91V13h1.5a1.5 1.5 0 000-3H14v-1.91a3.992 3.992 0 00-1.154-1.09l.37-.371a1.5 1.5 0 00-2.122-2.122l-.37.37zM10 12.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" /></svg>;


export const DataExportSettingsView: React.FC<DataExportSettingsViewProps> = ({ hasPermission, onRepairStorage, onExportData, onImportData }) => {
    const canManageData = hasPermission('adminData', 'canManage');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result;
                if (typeof text === 'string') {
                    onImportData(text);
                }
            };
            reader.readAsText(file);
        } else {
            setFileName('');
        }
    };
    
    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Full Backup & Restore"
                description="Create a full snapshot of your entire CRM workspace, or restore from a previous backup. Use with caution."
            >
                <div className="space-y-6">
                    <div>
                        <h4 className="font-semibold text-text-base dark:text-text-base">Create Backup</h4>
                        <p className="text-xs text-text-muted dark:text-text-muted mb-2">This will generate a single JSON file containing all your CRM data. Keep this file secure.</p>
                        <Button leftIcon={<ArrowDownTrayIcon />} onClick={onExportData} disabled={!canManageData}>
                            Download Full Backup (JSON)
                        </Button>
                    </div>
                    <div className="pt-4 border-t border-border-base dark:border-border-muted">
                        <h4 className="font-semibold text-text-base dark:text-text-base">Import & Restore</h4>
                         <p className="text-xs text-text-muted dark:text-text-muted mb-2">
                            Select a previously exported <code className="text-xs">.json</code> file to restore from. You will be asked to confirm before any data is changed.
                        </p>
                        <div className="flex items-center gap-2">
                             <Button
                                leftIcon={<ArrowUpTrayIcon />}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!canManageData}
                                variant="outline"
                            >
                                Choose Backup File...
                            </Button>
                             <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            {fileName && <span className="text-sm text-text-muted">{fileName}</span>}
                        </div>
                    </div>
                </div>
            </SettingsSectionCard>
            
            <SettingsSectionCard
                title="Danger Zone"
                description="Irreversible actions. Please be absolutely certain before proceeding."
                className="border-status-negative bg-red-50 dark:bg-red-900/20"
            >
                <div className="flex flex-wrap gap-3">
                    <Button variant="danger" leftIcon={<ArchiveBoxXMarkIcon />} onClick={() => alert('Conceptual: Trigger clear data confirmation flow.')} disabled={!canManageData}>
                        Clear All CRM Data
                    </Button>
                     <Button variant="outline" className="!border-status-warning !text-status-warning hover:!bg-status-warning/10" leftIcon={<WrenchIcon />} onClick={onRepairStorage} disabled={!canManageData}>
                        Repair Storage
                    </Button>
                </div>
            </SettingsSectionCard>
        </div>
    );
};