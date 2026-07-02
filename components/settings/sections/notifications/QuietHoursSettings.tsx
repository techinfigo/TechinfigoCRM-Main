import React from 'react';
import { SettingsSectionCard } from '../../SettingsSectionCard';
import { ToggleSwitch } from '../../../common/ToggleSwitch';
import { Checkbox } from '../../../common/Checkbox';
import { FormField } from '../../../common/FormField';
import { Input } from '../../../common/Input';

interface QuietHoursSettingsProps {
    settings: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        allowCritical: boolean;
    };
    onSettingChange: (field: keyof QuietHoursSettingsProps['settings'], value: any) => void;
}

export const QuietHoursSettings: React.FC<QuietHoursSettingsProps> = ({ settings, onSettingChange }) => {
    return (
        <SettingsSectionCard
            title="Quiet Hours"
            description="Pause notifications during specific times to maintain focus."
        >
            <div className="space-y-4">
                <ToggleSwitch
                    id="quiet-hours-enabled"
                    label="Enable Quiet Hours"
                    checked={settings.enabled}
                    onChange={(checked) => onSettingChange('enabled', checked)}
                />
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border-muted dark:border-slate-700 ${!settings.enabled && 'opacity-50'}`}>
                    <FormField label="Start Time" htmlFor="start-time">
                        <Input type="time" id="start-time" value={settings.startTime} onChange={e => onSettingChange('startTime', e.target.value)} disabled={!settings.enabled}/>
                    </FormField>
                    <FormField label="End Time" htmlFor="end-time">
                        <Input type="time" id="end-time" value={settings.endTime} onChange={e => onSettingChange('endTime', e.target.value)} disabled={!settings.enabled}/>
                    </FormField>
                </div>
                <div className="pt-2">
                    <Checkbox
                        id="allow-critical"
                        label="Only Critical Notifications During Quiet Hours"
                        checked={settings.allowCritical}
                        onChange={e => onSettingChange('allowCritical', e.target.checked)}
                        disabled={!settings.enabled}
                    />
                </div>
            </div>
        </SettingsSectionCard>
    );
};
