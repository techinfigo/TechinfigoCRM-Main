
import React, { useState, useEffect } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { FormField } from '../../common/FormField';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { ToggleSwitch } from '../../common/ToggleSwitch';
import { Checkbox } from '../../common/Checkbox';

// --- ICONS (self-contained for modularity) ---
const EditIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M11.354 1.646a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708L5.061 13.939a.5.5 0 0 1-.353.146H2.5a.5.5 0 0 1-.5-.5V11.293a.5.5 0 0 1 .146-.353L11.354 1.646ZM12.5 2.5 4.207 10.793V13h2.207L13.5 4.707 12.5 3.707V2.5Z" /><path d="m10.854 3.146 2.292 2.292-8.5 8.5H2.5v-2.292l8.5-8.5Z" /></svg>;
const TrashIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5zM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498-.075l-.275-5.5A.75.75 0 0 1 6.05 6zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711z" clipRule="evenodd" /></svg>;

// --- TYPE DEFINITIONS for local state ---
interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

interface CalendarSettings {
  defaultView: 'Month' | 'Week' | 'Day';
  workingHours: {
    start: string; // HH:MM
    end: string;   // HH:MM
  };
  colorCoding: {
    enabled: boolean;
    by: 'Priority' | 'Project' | 'Event Type';
  };
  autoReminders: {
    enabled: boolean;
    remindFor: {
      tasks: boolean;
      meetings: boolean;
      leaveApprovals: boolean;
    };
    defaultTime: '10' | '30' | '60'; // in minutes
  };
  integrations: {
    googleCalendar: boolean;
    emailReminders: boolean;
  };
  displayPreferences: {
    showApprovedLeaves: boolean;
    showPendingLeaves: boolean;
    autoAddMilestones: boolean;
    autoAddTasks: boolean;
  };
  blockHolidays: boolean;
}

const initialSettings: CalendarSettings = {
    defaultView: 'Month',
    workingHours: { start: '09:30', end: '18:30' },
    colorCoding: { enabled: true, by: 'Event Type' },
    autoReminders: {
        enabled: true,
        remindFor: { tasks: true, meetings: true, leaveApprovals: false },
        defaultTime: '30',
    },
    integrations: { googleCalendar: false, emailReminders: true },
    displayPreferences: {
        showApprovedLeaves: true,
        showPendingLeaves: false,
        autoAddMilestones: true,
        autoAddTasks: true,
    },
    blockHolidays: true,
};

export const CalendarSettingsView: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [settings, setSettings] = useState<CalendarSettings>(initialSettings);
    const [holidays, setHolidays] = useState<Holiday[]>([
        { id: 'h1', name: 'Republic Day', date: '2024-01-26' },
        { id: 'h2', name: 'Independence Day', date: '2024-08-15' },
    ]);
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '' });
    
    const showSaveNotification = () => {
        // In a real app, this would trigger a toast notification
        console.log("Calendar settings saved!");
        alert("Calendar settings saved!");
    };
    
    // Auto-save simulation
    useEffect(() => {
        // This effect can be debounced in a real application
        showSaveNotification();
    }, [settings, holidays]);

    // --- HANDLERS ---
    const handleSettingChange = (section: keyof CalendarSettings, field: string, value: any) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            // @ts-ignore
            if (typeof newSettings[section] === 'object' && newSettings[section] !== null) {
                // @ts-ignore
                newSettings[section][field] = value;
            } else {
                // @ts-ignore
                newSettings[field] = value;
            }
            return newSettings;
        });
    };
    
    const handleReminderForChange = (field: keyof CalendarSettings['autoReminders']['remindFor'], value: boolean) => {
        setSettings(prev => ({
            ...prev,
            autoReminders: {
                ...prev.autoReminders,
                remindFor: { ...prev.autoReminders.remindFor, [field]: value }
            }
        }));
    };

    const handleAddHoliday = () => {
        if (newHoliday.name.trim() && newHoliday.date) {
            setHolidays(prev => [...prev, { ...newHoliday, id: `h-${Date.now()}` }].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setNewHoliday({ name: '', date: '' });
        }
    };
    const handleDeleteHoliday = (id: string) => setHolidays(prev => prev.filter(h => h.id !== id));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1 */}
                <div className="space-y-6">
                    <SettingsSectionCard title="General & Display" description="Configure default views and working hours.">
                        <div className="space-y-4">
                            <FormField label="Default Calendar View" htmlFor="defaultView">
                                <select id="defaultView" value={settings.defaultView} onChange={e => setSettings(p => ({ ...p, defaultView: e.target.value as any }))} className="w-full p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm">
                                    <option>Month</option><option>Week</option><option>Day</option>
                                </select>
                            </FormField>
                             <div className="grid grid-cols-2 gap-3">
                                <FormField label="Working Hours Start" htmlFor="startTime"><Input id="startTime" type="time" value={settings.workingHours.start} onChange={e => handleSettingChange('workingHours', 'start', e.target.value)} /></FormField>
                                <FormField label="Working Hours End" htmlFor="endTime"><Input id="endTime" type="time" value={settings.workingHours.end} onChange={e => handleSettingChange('workingHours', 'end', e.target.value)} /></FormField>
                            </div>
                        </div>
                    </SettingsSectionCard>
                     <SettingsSectionCard title="Event Color Coding" description="Customize how events are colored on the calendar.">
                        <div className="space-y-4">
                            <ToggleSwitch id="color-coding-enabled" label="Enable Color Coding" checked={settings.colorCoding.enabled} onChange={checked => handleSettingChange('colorCoding', 'enabled', checked)} />
                            <FormField label="Color Code Events By" htmlFor="colorCodeBy">
                                <select id="colorCodeBy" value={settings.colorCoding.by} onChange={e => handleSettingChange('colorCoding', 'by', e.target.value)} disabled={!settings.colorCoding.enabled} className="w-full p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm">
                                    <option>By Event Type</option><option>By Priority</option><option>By Project</option>
                                </select>
                            </FormField>
                        </div>
                    </SettingsSectionCard>
                     <SettingsSectionCard title="Data Display Preferences" description="Choose what information is automatically shown on your calendar.">
                        <div className="space-y-3 divide-y divide-border-base dark:divide-slate-700">
                             <ToggleSwitch id="disp-approved-leave" label="Show Approved Leaves" checked={settings.displayPreferences.showApprovedLeaves} onChange={checked => handleSettingChange('displayPreferences', 'showApprovedLeaves', checked)} />
                             <ToggleSwitch id="disp-pending-leave" label="Show Pending Leaves" checked={settings.displayPreferences.showPendingLeaves} onChange={checked => handleSettingChange('displayPreferences', 'showPendingLeaves', checked)} />
                             <ToggleSwitch id="disp-milestones" label="Auto-add Project Milestones" checked={settings.displayPreferences.autoAddMilestones} onChange={checked => handleSettingChange('displayPreferences', 'autoAddMilestones', checked)} />
                             <ToggleSwitch id="disp-tasks" label="Auto-add Assigned Tasks" checked={settings.displayPreferences.autoAddTasks} onChange={checked => handleSettingChange('displayPreferences', 'autoAddTasks', checked)} />
                        </div>
                    </SettingsSectionCard>
                </div>
                {/* Column 2 */}
                <div className="space-y-6">
                    <SettingsSectionCard title="Reminders & Integrations" description="Configure automated reminders and third-party integrations.">
                        <div className="space-y-4">
                             <ToggleSwitch id="reminders-enabled" label="Enable Auto-Reminders" checked={settings.autoReminders.enabled} onChange={checked => handleSettingChange('autoReminders', 'enabled', checked)} />
                             <div className={`pl-4 border-l-2 ml-2 ${settings.autoReminders.enabled ? 'border-premium-accent' : 'border-border-muted'}`}>
                                <p className="text-sm font-medium mb-2">Remind me for:</p>
                                <div className="space-y-2">
                                    <Checkbox id="remind-tasks" label="Tasks" checked={settings.autoReminders.remindFor.tasks} onChange={e => handleReminderForChange('tasks', e.target.checked)} disabled={!settings.autoReminders.enabled} />
                                    <Checkbox id="remind-meetings" label="Meetings" checked={settings.autoReminders.remindFor.meetings} onChange={e => handleReminderForChange('meetings', e.target.checked)} disabled={!settings.autoReminders.enabled} />
                                    <Checkbox id="remind-leaves" label="Leave Approvals" checked={settings.autoReminders.remindFor.leaveApprovals} onChange={e => handleReminderForChange('leaveApprovals', e.target.checked)} disabled={!settings.autoReminders.enabled} />
                                </div>
                                <FormField label="Default Reminder Time" htmlFor="reminderTime" className="mt-3">
                                    <select id="reminderTime" value={settings.autoReminders.defaultTime} onChange={e => handleSettingChange('autoReminders', 'defaultTime', e.target.value)} disabled={!settings.autoReminders.enabled} className="w-full p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm">
                                        <option value="10">10 minutes before</option><option value="30">30 minutes before</option><option value="60">1 hour before</option>
                                    </select>
                                </FormField>
                             </div>
                            <div className="pt-4 border-t border-border-base dark:border-slate-700">
                                <ToggleSwitch id="gcal-sync" label="Enable Google Calendar Sync" description="Two-way sync with your Google Calendar account." checked={settings.integrations.googleCalendar} onChange={checked => handleSettingChange('integrations', 'googleCalendar', checked)} />
                            </div>
                            <div className="pt-2">
                                <ToggleSwitch id="email-reminders" label="Enable Email Reminders" description="Send reminders via email in addition to in-app notifications." checked={settings.integrations.emailReminders} onChange={checked => handleSettingChange('integrations', 'emailReminders', checked)} />
                            </div>
                        </div>
                    </SettingsSectionCard>
                    <SettingsSectionCard title="Holidays & Company Events" description="Manage company-wide holidays that will appear on all calendars.">
                        <div className="space-y-2 mb-4 max-h-40 overflow-y-auto pr-1">
                            {holidays.map((holiday) => (
                                <div key={holiday.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                                    <div>
                                        <p className="font-medium text-sm">{holiday.name}</p>
                                        <p className="text-xs text-text-muted">{new Date(holiday.date + 'T00:00:00').toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="xs" className="p-1" title="Edit Holiday"><EditIcon/></Button>
                                        <Button variant="ghost" size="xs" className="p-1 text-status-negative" onClick={() => handleDeleteHoliday(holiday.id)} title="Delete Holiday"><TrashIcon/></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-end gap-2 pt-3 border-t border-border-muted dark:border-slate-700">
                            <Input label="Holiday Name" value={newHoliday.name} onChange={e => setNewHoliday(p => ({...p, name: e.target.value}))} containerClassName="flex-grow"/>
                            <Input type="date" label="Date" value={newHoliday.date} onChange={e => setNewHoliday(p => ({...p, date: e.target.value}))}/>
                            <Button onClick={handleAddHoliday}>Add</Button>
                        </div>
                         <div className="pt-4 mt-2 border-t border-border-base dark:border-slate-700">
                            <ToggleSwitch id="block-holidays" label="Auto-block Holidays" description="Prevent users from creating events on these dates." checked={settings.blockHolidays} onChange={checked => setSettings(p => ({ ...p, blockHolidays: checked }))} />
                         </div>
                    </SettingsSectionCard>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                <Button onClick={showSaveNotification}>Save Calendar Settings</Button>
            </div>
        </div>
    );
};
