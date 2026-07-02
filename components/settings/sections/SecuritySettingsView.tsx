
import React, { useState, useEffect } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';
import { ToggleSwitch } from '../../common/ToggleSwitch';
import { AppSettings, TeamMember, FeatureKey, PermissionAction } from '../../../types';

// --- ICONS (self-contained for modularity) ---
const LockClosedIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;
const DevicePhoneMobileIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M3.5 2A1.5 1.5 0 002 3.5v13A1.5 1.5 0 003.5 18h13a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-13zM12 4.25a.75.75 0 010 1.5H8a.75.75 0 010-1.5h4zM8.25 12a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" /></svg>;
const GlobeAltIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM5.032 4.22a.75.75 0 01.023 1.06l-1.06 1.06a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 011.037 0zM14.968 4.22a.75.75 0 011.037 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 01.023-1.06zM17 10a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0117 10zM14.968 15.78a.75.75 0 01.023-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06a.75.75 0 01-1.037 0zM10 17a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 17zM5.032 15.78a.75.75 0 01-1.037 0l-1.06-1.06a.75.75 0 011.06-1.06l1.06 1.06a.75.75 0 01-.023 1.06zM3 10a.75.75 0 01-.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 013 10z" /><path fillRule="evenodd" d="M10 4a6 6 0 100 12 6 6 0 000-12zM8.5 7.5a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" /></svg>;
const FingerPrintIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M7 3.5A1.5 1.5 0 018.5 2h3A1.5 1.5 0 0113 3.5v.192c.421.13.813.31 1.157.534a1.5 1.5 0 01.843 1.346V10a1.5 1.5 0 01-1.5 1.5h-.192c-.13.421-.31.813-.534 1.157a1.5 1.5 0 01-1.346.843H10a1.5 1.5 0 01-1.5-1.5v-.192c-.421-.13-.813-.31-1.157-.534a1.5 1.5 0 01-.843-1.346V5.53a1.5 1.5 0 01.843-1.346C7.623 3.999 8.01 3.829 8.5 3.692V3.5zM8.5 5.14v3.169c-.06.012-.118.028-.175.048a2.52 2.52 0 00-.675.29 2.493 2.493 0 00-.543.462c-.17.21-.31.442-.424.693a.75.75 0 01-1.3-.75 4.01 4.01 0 01.488-1.037A3.992 3.992 0 018.25 5.5H8.5V3.5h3v1.64c.06.012.118.028.175.048a2.52 2.52 0 00.675.29 2.493 2.493 0 00.543.462c.17.21.31.442.424.693a.75.75 0 11-1.3.75 4.01 4.01 0 01-.488-1.037A3.992 3.992 0 0111.75 5.5h-.25V3.5a.5.5 0 00-.5-.5h-2a.5.5 0 00-.5.5v1.64zM10 11.5a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /><path d="M5.5 6a1 1 0 00-1 1v5.025a2.5 2.5 0 011.08-1.632A3.504 3.504 0 007 9.5v-2a1 1 0 00-1.5-1.5.5.5 0 01-.5-.5z" /><path d="M12.5 6a.5.5 0 01.5-.5A1.5 1.5 0 0114.5 7v2.5a3.504 3.504 0 001.42-1.093A2.5 2.5 0 0114.5 7h-1a1 1 0 00-1-1z" /></svg>;
const MapPinIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.106.377-.218.574-.334l1.004-.577c.23-.132.45-.27.658-.41a5.952 5.952 0 002.583-4.103.75.75 0 00-.63-1.002l-1.06-.212a2.25 2.25 0 01-1.585-.653l-.348-.348a2.25 2.25 0 01-.653-1.585l-.212-1.06a.75.75 0 00-1.002-.63c-1.39.736-2.91.736-4.3 0a.75.75 0 00-1.002.63l-.213 1.06a2.25 2.25 0 01-.653 1.585l-.348.348a2.25 2.25 0 01-1.585.653l-1.06.212a.75.75 0 00-.63 1.002 5.952 5.952 0 002.583 4.103c.208.14.428.278.658.41l1.004.577c.197.116.388.228.574.334.095.054.19.101.282.14l.018.008.006.003zM10 8.25a1.75 1.75 0 100 3.5 1.75 1.75 0 000-3.5z" clipRule="evenodd" /></svg>;

// --- DUMMY DATA ---
const activeSessionsData = [
    { id: '1', device: 'Chrome on macOS', location: 'Bengaluru, IN', ip: '103.22.201.245', loginTime: '2024-05-20 10:30 AM', isCurrent: true },
    { id: '2', device: 'iPhone App', location: 'Mumbai, IN', ip: '157.32.112.98', loginTime: '2024-05-19 08:15 PM', isCurrent: false },
    { id: '3', device: 'Firefox on Windows', location: 'Delhi, IN', ip: '202.142.76.11', loginTime: '2024-05-18 11:00 AM', isCurrent: false },
];

const loginActivityData = [
    { id: 'a', date: '2024-05-20', time: '10:30 AM', device: 'Chrome on macOS', ip: '103.22.201.245', status: 'Success' },
    { id: 'b', date: '2024-05-20', time: '09:15 AM', device: 'Unknown Browser', ip: '115.98.2.17', status: 'Failed' },
    { id: 'c', date: '2024-05-19', time: '08:15 PM', device: 'iPhone App', ip: '157.32.112.98', status: 'Success' },
    { id: 'd', date: '2024-05-18', time: '11:00 AM', device: 'Firefox on Windows', ip: '202.142.76.11', status: 'Success' },
];

interface SecuritySettingsViewProps {
  appSettings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  currentUser: TeamMember | null;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

// --- MAIN COMPONENT ---
export const SecuritySettingsView: React.FC<SecuritySettingsViewProps> = ({ appSettings, onSaveSettings, currentUser, hasPermission }) => {
    // States for various sections
    const [password, setPassword] = useState({ old: '', new: '', confirm: '' });
    const [passwordError, setPasswordError] = useState('');
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(appSettings.security.twoFactorEnabled);
    const [sessionTimeout, setSessionTimeout] = useState(appSettings.security.sessionTimeoutMinutes);
    const [allowedIps, setAllowedIps] = useState(['103.22.201.245', '192.168.1.1']);
    const [newIp, setNewIp] = useState('');
    const [ipRestrictionEnabled, setIpRestrictionEnabled] = useState(false);
    const [ipError, setIpError] = useState('');
    const [isChanged, setIsChanged] = useState(false);

    useEffect(() => {
        setIsTwoFactorEnabled(appSettings.security.twoFactorEnabled);
        setSessionTimeout(appSettings.security.sessionTimeoutMinutes);
        setIsChanged(false);
    }, [appSettings]);

    const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
        setter(value);
        setIsChanged(true);
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        if (!password.old || !password.new || !password.confirm) {
            setPasswordError('All password fields are required.');
            return;
        }
        if (password.new.length < 8) {
            setPasswordError('New password must be at least 8 characters long.');
            return;
        }
        if (password.new !== password.confirm) {
            setPasswordError('New passwords do not match.');
            return;
        }
        // In a real app, you would make an API call here
        console.log('Changing password...', password);
        alert('Password changed successfully! (Conceptual)');
        setPassword({ old: '', new: '', confirm: '' });
    };

    const handleAddIp = () => {
        setIpError('');
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipRegex.test(newIp)) {
            setIpError('Please enter a valid IPv4 address.');
            return;
        }
        if (allowedIps.includes(newIp)) {
            setIpError('This IP address is already on the list.');
            return;
        }
        setAllowedIps([...allowedIps, newIp]);
        setNewIp('');
    };

    const handleRemoveIp = (ipToRemove: string) => {
        setAllowedIps(allowedIps.filter(ip => ip !== ipToRemove));
    };

    const handleSaveSecuritySettings = () => {
        const newSettings = {
            ...appSettings,
            security: {
                twoFactorEnabled: isTwoFactorEnabled,
                sessionTimeoutMinutes: sessionTimeout,
            }
        };
        onSaveSettings(newSettings);
        setIsChanged(false);
        alert('Security settings saved!');
    };
    
    return (
        <div className="space-y-6">
            <SettingsSectionCard title="Change Password" description="Update your password for enhanced security.">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Input label="Old Password" type="password" value={password.old} onChange={(e) => setPassword(p => ({ ...p, old: e.target.value }))} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="New Password" type="password" value={password.new} onChange={(e) => setPassword(p => ({ ...p, new: e.target.value }))} required />
                        <Input label="Confirm New Password" type="password" value={password.confirm} onChange={(e) => setPassword(p => ({ ...p, confirm: e.target.value }))} required />
                    </div>
                    {passwordError && <p className="text-sm text-status-negative">{passwordError}</p>}
                    <div className="flex justify-end">
                        <Button type="submit">Update Password</Button>
                    </div>
                </form>
            </SettingsSectionCard>

            <SettingsSectionCard title="Account Security" description="Manage 2FA and session timeout settings for all users.">
                 <div className="space-y-4">
                    <ToggleSwitch id="2fa-toggle" label="Enable Two-Factor Authentication (2FA)" description="Require a second verification step for all users upon login." checked={isTwoFactorEnabled} onChange={(checked) => handleFieldChange(setIsTwoFactorEnabled, checked)} />
                    <div className="max-w-xs pt-4 border-t border-border-base dark:border-border-muted">
                        <Input 
                            label="Session Timeout (minutes)" 
                            type="number" 
                            min="5" 
                            value={sessionTimeout}
                            onChange={(e) => handleFieldChange(setSessionTimeout, parseInt(e.target.value, 10) || 60)}
                        />
                    </div>
                 </div>
                 <div className="mt-6 flex justify-end">
                    <Button onClick={handleSaveSecuritySettings} disabled={!isChanged}>
                        {isChanged ? 'Save Account Security Settings' : 'Settings Saved'}
                    </Button>
                </div>
            </SettingsSectionCard>
            
            <SettingsSectionCard title="Active Sessions" description="This is a list of devices that have logged into your account. Revoke any sessions that you do not recognize.">
                <div className="space-y-3">
                    {activeSessionsData.map(session => (
                        <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-border-muted dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <DevicePhoneMobileIcon className="text-text-muted w-8 h-8"/>
                                <div>
                                    <p className="font-semibold text-text-base">{session.device} {session.isCurrent && <span className="text-xs text-green-600 dark:text-green-400 font-medium">(This device)</span>}</p>
                                    <p className="text-xs text-text-muted">{session.location} &middot; {session.ip}</p>
                                    <p className="text-xs text-text-muted">Last active: {session.loginTime}</p>
                                </div>
                            </div>
                            {!session.isCurrent && <Button variant="secondary" size="sm" className="mt-2 sm:mt-0" onClick={() => alert(`Logging out session ${session.id}...`)}>Logout</Button>}
                        </div>
                    ))}
                </div>
                <div className="mt-4 border-t border-border-muted dark:border-slate-700 pt-4">
                    <Button variant="danger" onClick={() => alert('Logging out all other sessions...')}>Logout All Other Sessions</Button>
                </div>
            </SettingsSectionCard>

            <SettingsSectionCard title="Allowed IP Addresses" description="Restrict account access to a specific list of IP addresses. Leave empty to allow access from any IP.">
                <ToggleSwitch id="ip-restrict-toggle" label="Enable IP Address Restriction" checked={ipRestrictionEnabled} onChange={setIpRestrictionEnabled} />
                 {ipRestrictionEnabled && (
                    <div className="mt-4 space-y-3">
                        <div className="flex items-end gap-2">
                           <Input label="Add IP Address" value={newIp} onChange={e => setNewIp(e.target.value)} error={ipError || undefined} placeholder="e.g., 192.168.1.100" containerClassName="flex-grow"/>
                           <Button onClick={handleAddIp}>Add</Button>
                        </div>
                        <div className="space-y-2">
                            {allowedIps.map(ip => (
                                <div key={ip} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 text-sm rounded-md">
                                    <span className="font-mono">{ip}</span>
                                    <Button variant="ghost" size="sm" className="text-status-negative" onClick={() => handleRemoveIp(ip)}>Remove</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
            </SettingsSectionCard>

            <SettingsSectionCard title="Login Activity" description="A log of recent login attempts to your account.">
                <div className="overflow-x-auto rounded-lg border border-border-base dark:border-border-muted">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="p-3 text-left">Date & Time</th>
                                <th className="p-3 text-left">Device</th>
                                <th className="p-3 text-left">IP Address</th>
                                <th className="p-3 text-left">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-muted dark:divide-slate-700">
                            {loginActivityData.map(log => (
                                <tr key={log.id}>
                                    <td className="p-3">{log.date} at {log.time}</td>
                                    <td className="p-3">{log.device}</td>
                                    <td className="p-3 font-mono">{log.ip}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${log.status === 'Success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </SettingsSectionCard>
        </div>
    );
};
