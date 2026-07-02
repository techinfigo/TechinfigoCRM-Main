
import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, FeatureKey, PermissionAction } from '../../../types';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';

interface GeneralSettingsViewProps {
  appSettings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 0A.75.75 0 013.25 4.5h13.5A.75.75 0 0117.5 5.25v9.5a.75.75 0 01-.75.75H3.25a.75.75 0 01-.75-.75v-9.5z" clipRule="evenodd" /><path d="M10 6.5a.75.75 0 01.75.75v1.521l.081.044.002.001a2.666 2.666 0 013.334 0l.002-.001.081-.044V7.25A.75.75 0 0115 6.5h.25a.75.75 0 010 1.5h-.013l-.081.044.002.001a4.166 4.166 0 00-5.176 0l.002-.001-.081-.044H9.25a.75.75 0 010-1.5H9.5A.75.75 0 0110 6.5zM6.085 9.614A.75.75 0 016.5 9.25h7a.75.75 0 01.415.364l.997 1.497a.75.75 0 01-1.017 1.1l-.997-1.497H6.614l-.997 1.497a.75.75 0 11-1.017-1.1l.997-1.497A.75.75 0 016.085 9.614z" /></svg>;

export const GeneralSettingsView: React.FC<GeneralSettingsViewProps> = ({ appSettings, onSaveSettings, hasPermission }) => {
  const [formData, setFormData] = useState<AppSettings>(appSettings);
  const [isChanged, setIsChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canManage = hasPermission('adminSettings', 'canManage');

  useEffect(() => {
    setFormData(appSettings);
    setIsChanged(false);
  }, [appSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsChanged(true);
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) { alert("Invalid file type. Please select an image."); return; }
      if (file.size > 500 * 1024) { alert("File is too large. Max 500KB."); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, agencyLogoUrl: reader.result as string }));
        setIsChanged(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSaveSettings(formData);
    setIsChanged(false);
  };

  return (
    <SettingsSectionCard
      title="General App Settings"
      description="Manage your agency's branding and main contact information."
    >
      <div className="space-y-6">
        <Input
          label="Agency Name"
          id="agencyName"
          name="agencyName"
          value={formData.agencyName}
          onChange={handleChange}
          disabled={!canManage}
        />
        
        <div>
            <label className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1.5">Agency Logo</label>
            <div className="flex items-center gap-4 p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/20">
                <div className="w-24 h-16 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded overflow-hidden border border-slate-300 dark:border-slate-600">
                {formData.agencyLogoUrl ? (
                    <img src={formData.agencyLogoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                ) : (
                    <ImageIcon />
                )}
                </div>
                <div className="space-y-1">
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleLogoChange}
                        ref={fileInputRef}
                        className="hidden"
                    />
                    <Button variant='outline' size='sm' onClick={() => fileInputRef.current?.click()} disabled={!canManage}>Upload Logo</Button>
                    <p className="text-xs text-text-muted dark:text-slate-500">PNG, JPG, SVG. Max 500KB.</p>
                </div>
            </div>
          </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={!isChanged || !canManage}>
            {isChanged ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </div>
    </SettingsSectionCard>
  );
};
