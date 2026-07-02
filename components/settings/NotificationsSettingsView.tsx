
import React from 'react';
import { SettingsSectionCard } from './SettingsSectionCard';
import { Checkbox } from '../common/Checkbox';

const NotificationToggle: React.FC<{ label: string; description: string }> = ({ label, description }) => (
    <div className="flex items-start justify-between p-3 border-b border-border-base dark:border-border-muted last:border-b-0">
        <div>
            <h4 className="font-medium text-text-base dark:text-text-base">{label}</h4>
            <p className="text-xs text-text-muted dark:text-text-muted">{description}</p>
        </div>
        <Checkbox className="mt-1" defaultChecked />
    </div>
);


export const NotificationsSettingsView: React.FC = () => {
  return (
    <SettingsSectionCard
      title="Notifications Settings"
      description="Manage your email and in-app notification preferences."
    >
      <div className="divide-y divide-border-base dark:divide-border-muted rounded-md border border-border-base dark:border-border-muted overflow-hidden">
        <NotificationToggle 
            label="Overdue Tasks"
            description="Get notified when a task assigned to you becomes overdue."
        />
        <NotificationToggle 
            label="Lead Follow-up Reminders"
            description="Receive an alert when a lead's next follow-up date is near."
        />
        <NotificationToggle 
            label="Invoice Payments"
            description="Be notified when a client successfully pays an invoice."
        />
        <NotificationToggle 
            label="New Client Assigned"
            description="Get an email when you are assigned as the lead for a new client."
        />
         <NotificationToggle 
            label="Weekly Summary"
            description="Receive a weekly summary email of your team's performance and key metrics."
        />
      </div>
    </SettingsSectionCard>
  );
};
