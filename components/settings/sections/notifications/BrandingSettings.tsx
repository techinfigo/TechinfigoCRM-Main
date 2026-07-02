import React, { useRef } from 'react';
import { SettingsSectionCard } from '../../SettingsSectionCard';
import { FormField } from '../../../common/FormField';
import { Input, TextArea } from '../../../common/Input';
import { Button } from '../../../common/Button';

interface BrandingSettingsProps {
    settings: {
        logoUrl: string | null;
        senderName: string;
        footerText: string;
    };
    onSettingChange: (field: keyof BrandingSettingsProps['settings'], value: any) => void;
}

const ImageIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 0A.75.75 0 013.25 4.5h13.5A.75.75 0 0117.5 5.25v9.5a.75.75 0 01-.75.75H3.25a.75.75 0 01-.75-.75v-9.5z" clipRule="evenodd" /><path d="M10 6.5a.75.75 0 01.75.75v1.521l.081.044.002.001a2.666 2.666 0 013.334 0l.002-.001.081-.044V7.25A.75.75 0 0115 6.5h.25a.75.75 0 010 1.5h-.013l-.081.044.002.001a4.166 4.166 0 00-5.176 0l.002-.001-.081-.044H9.25a.75.75 0 010-1.5H9.5A.75.75 0 0110 6.5zM6.085 9.614A.75.75 0 016.5 9.25h7a.75.75 0 01.415.364l.997 1.497a.75.75 0 01-1.017 1.1l-.997-1.497H6.614l-.997 1.497a.75.75 0 11-1.017-1.1l.997-1.497A.75.75 0 016.085 9.614z" /></svg>;

export const BrandingSettings: React.FC<BrandingSettingsProps> = ({ settings, onSettingChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => onSettingChange('logoUrl', reader.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <SettingsSectionCard
            title="Notification Branding"
            description="Customize the look and feel of your email notifications."
        >
            <div className="space-y-4">
                <FormField label="Custom Logo">
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-16 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-md border border-border-muted dark:border-slate-600">
                            {settings.logoUrl ? <img src={settings.logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" /> : <ImageIcon />}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/png, image/jpeg" className="hidden"/>
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>Upload Logo</Button>
                        {settings.logoUrl && <Button variant="ghost" size="sm" className="text-status-negative" onClick={() => onSettingChange('logoUrl', null)}>Remove</Button>}
                    </div>
                </FormField>
                <FormField label="Sender Name" htmlFor="senderName">
                    <Input id="senderName" value={settings.senderName} onChange={e => onSettingChange('senderName', e.target.value)} placeholder="e.g., TECHINFIGO Alerts"/>
                </FormField>
                 <FormField label="Custom Email Footer" htmlFor="footerText">
                    <TextArea id="footerText" value={settings.footerText} onChange={e => onSettingChange('footerText', e.target.value)} rows={3} placeholder="e.g., © 2024 TECHINFIGO. All rights reserved."/>
                </FormField>
            </div>
        </SettingsSectionCard>
    );
};
