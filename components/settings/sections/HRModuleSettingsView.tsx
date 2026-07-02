
import React, { useState } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { FormField } from '../../common/FormField';
import { ToggleSwitch } from '../../common/ToggleSwitch';

interface Holiday {
    name: string;
    date: string;
}

export const HRModuleSettingsView: React.FC = () => {
    const [leaveTypes, setLeaveTypes] = useState(['Annual', 'Sick', 'Casual', 'Work From Home', 'Unpaid']);
    const [newLeaveType, setNewLeaveType] = useState('');
    const [holidays, setHolidays] = useState<Holiday[]>([
        { name: 'Republic Day', date: '2024-01-26'},
        { name: 'Independence Day', date: '2024-08-15'},
    ]);
    const [newHoliday, setNewHoliday] = useState<Holiday>({ name: '', date: '' });
    
    const handleAddLeaveType = () => {
        if (newLeaveType.trim()) {
            setLeaveTypes(prev => [...prev, newLeaveType.trim()]);
            setNewLeaveType('');
        }
    };
    
    const handleDeleteLeaveType = (index: number) => {
        setLeaveTypes(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleAddHoliday = () => {
        if(newHoliday.name.trim() && newHoliday.date) {
            setHolidays(prev => [...prev, newHoliday].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setNewHoliday({name: '', date: ''});
        }
    };
    
    const handleDeleteHoliday = (index: number) => {
        setHolidays(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Leave Management"
                description="Define available leave types and the company's holiday calendar."
            >
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <h4 className="font-semibold text-text-heading mb-2">Leave Types</h4>
                        <div className="space-y-2">
                           {leaveTypes.map((type, index) => (
                               <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                                   <p className="font-medium text-text-base dark:text-text-base text-sm">{type}</p>
                                   <Button variant="ghost" size="sm" className="text-status-negative" onClick={() => handleDeleteLeaveType(index)}>Delete</Button>
                               </div>
                           ))}
                           <div className="flex items-center gap-2 pt-2 border-t border-border-muted dark:border-slate-700">
                               <Input value={newLeaveType} onChange={e => setNewLeaveType(e.target.value)} placeholder="New leave type" containerClassName="flex-grow" />
                               <Button onClick={handleAddLeaveType}>Add</Button>
                           </div>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-text-heading mb-2">Company Holidays</h4>
                         <div className="space-y-2">
                           {holidays.map((holiday, index) => (
                               <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                                   <div>
                                       <p className="font-medium text-text-base dark:text-text-base text-sm">{holiday.name}</p>
                                       <p className="text-xs text-text-muted dark:text-slate-400">{new Date(holiday.date).toLocaleDateString()}</p>
                                    </div>
                                   <Button variant="ghost" size="sm" className="text-status-negative" onClick={() => handleDeleteHoliday(index)}>Delete</Button>
                               </div>
                           ))}
                           <div className="flex items-end gap-2 pt-2 border-t border-border-muted dark:border-slate-700">
                               <Input label="Holiday Name" value={newHoliday.name} onChange={e => setNewHoliday(p => ({...p, name: e.target.value}))} containerClassName="flex-grow" />
                               <Input label="Date" type="date" value={newHoliday.date} onChange={e => setNewHoliday(p => ({...p, date: e.target.value}))} />
                               <Button onClick={handleAddHoliday}>Add</Button>
                           </div>
                        </div>
                    </div>
                 </div>
            </SettingsSectionCard>
            
            <SettingsSectionCard
                title="Attendance & Payroll Policy"
                description="Configure working hours and payroll settings."
            >
                <div className="space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Official Working Hours Start" type="time" defaultValue="09:30"/>
                        <Input label="Official Working Hours End" type="time" defaultValue="18:30"/>
                     </div>
                     <ToggleSwitch id="auto-late" label="Auto-mark as Late" description="Automatically mark attendance as 'Late' if check-in is after the official start time." checked={true} onChange={()=>{}}/>
                     <FormField label="Payroll Cycle Date" description="The day of the month on which the payroll cycle closes.">
                        <Input type="number" min="1" max="31" defaultValue="25" className="max-w-xs" />
                     </FormField>
                </div>
            </SettingsSectionCard>

            <div className="mt-6 flex justify-end">
                <Button onClick={() => alert('HR settings saved!')}>Save HR Settings</Button>
            </div>
        </div>
    );
};
