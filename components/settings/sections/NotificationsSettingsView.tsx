import React, { useState } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Button } from '../../common/Button';
import { NotificationChannelSettings } from './notifications/NotificationChannelSettings';
import { NotificationTypesSettings } from './notifications/NotificationTypesSettings';
import { QuietHoursSettings } from './notifications/QuietHoursSettings';
import { BrandingSettings } from './notifications/BrandingSettings';
import { NotificationHistory } from './notifications/NotificationHistory';

// --- DUMMY DATA ---
const dummyNotificationEvents = [
    { id: 'lead_assigned', name: 'New Lead Assigned', description: 'When a new lead is assigned to a team member.', settings: { inApp: true, email: true, sms: false } },
    { id: 'lead_status', name: 'Lead Status Changed', description: 'When a lead\'s status is updated.', settings: { inApp: true, email: false, sms: false } },
    { id: 'client_added', name: 'New Client Added', description: 'When a lead is converted to a client.', settings: { inApp: true, email: true, sms: false } },
    { id: 'project_created', name: 'New Project Created', description: 'When a new project is created for a client.', settings: { inApp: true, email: false, sms: false } },
    { id: 'invoice_paid', name: 'Invoice Paid', description: 'When an invoice is successfully paid by a client.', settings: { inApp: true, email: true, sms: true } },
    { id: 'payment_received', name: 'Payment Received', description: 'When a payment is logged against an invoice.', settings: { inApp: true, email: true, sms: true } },
    { id: 'task_assigned', name: 'Task Assigned', description: 'When a new task is assigned to you.', settings: { inApp: true, email: true, sms: false } },
    { id: 'leave_submitted', name: 'Leave Request Submitted', description: 'When a team member submits a leave request (for admins).', settings: { inApp: true, email: true, sms: false } },
    { id: 'leave_approved', name: 'Leave Request Approved/Rejected', description: 'When your leave request is reviewed.', settings: { inApp: true, email: true, sms: false } },
];

export const NotificationsSettingsView: React.FC = () => {
    // --- TOP LEVEL STATE ---
    const [channels, setChannels] = useState({ inApp: true, email: true, sms: false, push: false });
    const [events, setEvents] = useState(dummyNotificationEvents);
    const [quietHours, setQuietHours] = useState({ enabled: false, startTime: '22:00', endTime: '08:00', allowCritical: true });
    const [branding, setBranding] = useState({ logoUrl: null, senderName: 'TECHINFIGO', footerText: '© 2024 TECHINFIGO CRM. All Rights Reserved.' });
    
    // --- HANDLERS ---
    const handleChannelChange = (channel: keyof typeof channels, value: boolean) => {
        setChannels(prev => ({ ...prev, [channel]: value }));
    };

    const handleEventChange = (eventId: string, channel: 'inApp' | 'email' | 'sms', value: boolean) => {
        setEvents(prev => prev.map(event =>
            event.id === eventId ? { ...event, settings: { ...event.settings, [channel]: value } } : event
        ));
    };

    const handleQuietHoursChange = (field: keyof typeof quietHours, value: any) => {
        setQuietHours(prev => ({ ...prev, [field]: value }));
    };

    const handleBrandingChange = (field: keyof typeof branding, value: any) => {
        setBranding(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveAll = () => {
        console.log("Saving all notification settings:", { channels, events, quietHours, branding });
        alert("All notification settings saved! (Check console for data)");
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <NotificationChannelSettings channels={channels} onChannelChange={handleChannelChange} />
                    <QuietHoursSettings settings={quietHours} onSettingChange={handleQuietHoursChange} />
                    <BrandingSettings settings={branding} onSettingChange={handleBrandingChange} />
                </div>
                <div className="space-y-6">
                     <NotificationTypesSettings events={events} onEventChange={handleEventChange} enabledChannels={channels as any} />
                </div>
            </div>
            
            <NotificationHistory />

            <SettingsSectionCard
                title="Test Notification"
                description="Send a test notification to ensure your channels are configured correctly."
            >
                <Button variant="outline" onClick={() => alert("Sent test notification!")}>Send Test Notification</Button>
            </SettingsSectionCard>


            <div className="mt-8 pt-6 border-t border-border-base dark:border-slate-700 flex justify-end">
                <Button onClick={handleSaveAll} size="lg">Save All Notification Settings</Button>
            </div>
        </div>
    );
};
