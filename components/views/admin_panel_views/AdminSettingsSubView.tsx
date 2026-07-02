
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { AppSettings, Expense, FeatureKey, PermissionAction } from '../../../types'; 
import { Input, TextArea } from '../../common/Input'; 

interface AdminSettingsSubViewProps {
  appSettings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onExportData: () => void;
  onImportData: (jsonData: string) => void;
  onClearAllData: () => void;
  dataCounts: { 
    clients: number;
    invoices: number;
    leads: number;
    projects: number;
    teamMembers: number;
    expenses: number;
    marketingAudits: number; 
  };
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

// Icons
const ExportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const ImportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M9.25 17.25a.75.75 0 001.5 0V8.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03l2.955-3.129v8.614z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25-.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>;
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 0A.75.75 0 013.25 4.5h13.5A.75.75 0 0117.5 5.25v9.5a.75.75 0 01-.75.75H3.25a.75.75 0 01-.75-.75v-9.5z" clipRule="evenodd" /><path d="M10 6.5a.75.75 0 01.75.75v1.521l.081.044.002.001a2.666 2.666 0 013.334 0l.002-.001.081-.044V7.25A.75.75 0 0115 6.5h.25a.75.75 0 010 1.5h-.013l-.081.044.002.001a4.166 4.166 0 00-5.176 0l.002-.001-.081-.044H9.25a.75.75 0 010-1.5H9.5A.75.75 0 0110 6.5zM6.085 9.614A.75.75 0 016.5 9.25h7a.75.75 0 01.415.364l.997 1.497a.75.75 0 01-1.017 1.1l-.997-1.497H6.614l-.997 1.497a.75.75 0 11-1.017-1.1l.997-1.497A.75.75 0 016.085 9.614z" /></svg>;


export const AdminSettingsSubView: React.FC<AdminSettingsSubViewProps> = ({ 
    appSettings, 
    onSaveSettings,
    onExportData,
    onImportData,
    onClearAllData,
    dataCounts,
    hasPermission
}) => {
  const [formData, setFormData] = useState<AppSettings>(appSettings);
  const [isChanged, setIsChanged] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [clearConfirmText, setClearConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManageAppSettings = hasPermission('adminSettings', 'canManage');
  const canManageData = hasPermission('adminData', 'canManage');


  useEffect(() => {
    setFormData(appSettings);
    setIsChanged(false); 
  }, [appSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    if (name === 'defaultPaymentTerms') {
        processedValue = value === '' ? 0 : parseInt(value, 10);
         if (isNaN(processedValue as number) || (processedValue as number) < 0) processedValue = 0; 
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    setIsChanged(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Invalid file type. Please select an image (PNG, JPG, SVG).");
        return;
      }
      if (file.size > 500 * 1024) { // 500KB limit for data URL
        alert("File is too large. Maximum 500KB allowed for logo.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, agencyLogoUrl: reader.result as string }));
        setIsChanged(true);
      };
      reader.onerror = () => {
        alert("Failed to read logo file.");
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = () => {
    setFormData(prev => ({...prev, agencyLogoUrl: ""}));
    setIsChanged(true);
    if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
  };

  const handleSaveAgencyConfig = () => {
    onSaveSettings(formData);
    setIsChanged(false);
  };

  const handleImportClick = () => {
    if (!importJson.trim()) {
      alert("Please paste JSON data into the text area.");
      return;
    }
    onImportData(importJson);
    setImportJson(''); 
  };
  
  const handleClearDataClick = () => {
    if(clearConfirmText === "DELETE ALL DATA"){
        onClearAllData();
        setClearConfirmText('');
    } else {
        alert('Confirmation text does not match. Action cancelled.');
    }
  };

  const availableCurrencies: AppSettings['defaultCurrency'][] = ['USD', 'EUR', 'GBP', 'INR'];
  const inputBaseClass = "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100";
  const selectBaseClass = "w-full pl-3 pr-10 py-2.5 text-base border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 sm:text-sm rounded-lg shadow-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";


  return (
    <div className="space-y-6">
      <Card title="Core Application Settings" className="bg-white dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          Configure core application branding, default financial settings, and manage overall application data.
        </p>
      </Card>
        
      <Card title="Agency Configuration" className="bg-white dark:bg-slate-800">
        <div className="space-y-5 p-1">
          <Input
            label="Agency Name"
            id="agencyName"
            name="agencyName"
            value={formData.agencyName}
            onChange={handleChange}
            className={`!${inputBaseClass}`}
            disabled={!canManageAppSettings}
          />
          {/* Logo Configuration Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Agency Logo</label>
            <div className="flex items-center gap-4 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                <div className="w-24 h-16 flex items-center justify-center bg-slate-100 dark:bg-slate-600 rounded overflow-hidden border border-slate-300 dark:border-slate-500">
                {formData.agencyLogoUrl ? (
                    <img src={formData.agencyLogoUrl} alt="Agency Logo Preview" className="max-w-full max-h-full object-contain" />
                ) : (
                    <ImageIcon />
                )}
                </div>
                <div className="space-y-2">
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleLogoChange}
                        ref={fileInputRef}
                        className="block w-full text-sm text-slate-500 dark:text-slate-400
                                file:mr-4 file:py-1.5 file:px-3
                                file:rounded-md file:border-0
                                file:text-xs file:font-semibold
                                file:bg-premium-accent-light file:text-premium-accent
                                dark:file:bg-premium-accent-dark/70 dark:file:text-premium-accent-dark
                                hover:file:bg-premium-accent-light/80 dark:hover:file:bg-premium-accent-dark/90
                                file:cursor-pointer file:transition-colors"
                        disabled={!canManageAppSettings}
                    />
                    {formData.agencyLogoUrl && (
                        <Button variant="ghost" size="xs" onClick={handleRemoveLogo} disabled={!canManageAppSettings} className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-700/20">
                        Remove Logo
                        </Button>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400">Recommended: PNG, JPG, SVG. Max 500KB.</p>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="defaultCurrency" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Default Currency</label>
              <select 
                id="defaultCurrency" 
                name="defaultCurrency" 
                value={formData.defaultCurrency}
                onChange={handleChange}
                className={selectBaseClass}
                disabled={!canManageAppSettings}
              >
                {availableCurrencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="defaultPaymentTerms" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Default Payment Terms (days)</label>
              <Input
                type="number"
                id="defaultPaymentTerms"
                name="defaultPaymentTerms"
                value={formData.defaultPaymentTerms?.toString() || '30'}
                onChange={handleChange}
                min="0"
                className={`!${inputBaseClass}`}
                disabled={!canManageAppSettings}
              />
            </div>
          </div>
          <Input
            label="Agency GSTIN (for invoices)"
            id="agencyGstin"
            name="agencyGstin"
            value={formData.agencyGstin || ''}
            onChange={handleChange}
            placeholder="e.g., 22AAAAA0000A1Z5"
            className={`!${inputBaseClass}`}
            disabled={!canManageAppSettings}
          />
          <Button variant="primary" onClick={handleSaveAgencyConfig} disabled={!isChanged || !canManageAppSettings} className="w-full sm:w-auto">
            {isChanged ? 'Save Agency Configuration' : 'Configuration Saved'}
          </Button>
        </div>
      </Card>

      <Card title="Data Management" className="bg-white dark:bg-slate-800">
         <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 px-1">
            Current record counts: 
            Clients ({dataCounts.clients}), 
            Invoices ({dataCounts.invoices}), 
            Leads ({dataCounts.leads}), 
            Projects ({dataCounts.projects}), 
            Team ({dataCounts.teamMembers}),
            Expenses ({dataCounts.expenses}),
            Marketing Audits ({dataCounts.marketingAudits}).
        </p>
        <div className="space-y-6 p-1">
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Data Export</h4>
            <Button variant="secondary" onClick={onExportData} leftIcon={<ExportIcon />} className="w-full sm:w-auto" disabled={!canManageData}>Export All Application Data (JSON)</Button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">Download a JSON file containing all clients, projects, invoices, leads, team members, expenses, marketing audits, and app settings. Keep this file secure.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Data Import</h4>
            <TextArea
              placeholder='Paste previously exported JSON data here. This will REPLACE all current data in the application.'
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              rows={5}
              className={`!${inputBaseClass}`}
              disabled={!canManageData}
            />
            <Button variant="outline" onClick={handleImportClick} leftIcon={<ImportIcon />} className="w-full sm:w-auto mt-2" disabled={!canManageData}>Load & Replace Data from JSON</Button>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1.5"><strong>Warning:</strong> Importing data will overwrite ALL existing application data. This action cannot be undone. Ensure your JSON is correctly formatted from a previous export of this application.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Clear All Application Data</h4>
             <Input
                label='To confirm, type "DELETE ALL DATA" below:'
                id="clearConfirm"
                name="clearConfirm"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                className={`!${inputBaseClass} focus:!border-red-500 dark:focus:!border-red-400 focus:!ring-red-500 dark:focus:!ring-red-400`}
                disabled={!canManageData}
              />
            <Button variant="danger" onClick={handleClearDataClick} leftIcon={<TrashIcon />} className="w-full sm:w-auto" disabled={clearConfirmText !== "DELETE ALL DATA" || !canManageData}>Reset All Data</Button>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1.5"><strong>DANGER:</strong> This action is irreversible. It will delete all clients, invoices, leads, projects, expenses, marketing audits, and team members. Agency settings (name, logo, etc.) will be preserved.</p>
          </div>
        </div>
      </Card>
      
      <Card title="Theme Customization (Conceptual)" className="bg-white dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-300">This section would allow customization of the application's theme colors.</p>
        <Button variant="secondary" className="mt-3" disabled>Choose Theme Colors (Conceptual)</Button>
      </Card>
      
    </div>
  );
};
