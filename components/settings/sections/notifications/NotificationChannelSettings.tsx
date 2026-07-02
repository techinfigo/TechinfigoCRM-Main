import React from 'react';
import { SettingsSectionCard } from '../../SettingsSectionCard';
import { ToggleSwitch } from '../../../common/ToggleSwitch';

interface NotificationChannelSettingsProps {
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  onChannelChange: (channel: keyof NotificationChannelSettingsProps['channels'], value: boolean) => void;
}

export const NotificationChannelSettings: React.FC<NotificationChannelSettingsProps> = ({ channels, onChannelChange }) => {
  return (
    <SettingsSectionCard
      title="Notification Channels"
      description="Enable or disable entire notification channels globally."
    >
      <div className="space-y-4">
        <ToggleSwitch
          id="inApp-channel"
          label="In-App Notifications"
          description="Receive alerts inside the CRM web/desktop app."
          checked={channels.inApp}
          onChange={(checked) => onChannelChange('inApp', checked)}
        />
        <ToggleSwitch
          id="email-channel"
          label="Email Notifications"
          description="Receive alerts directly to your registered email address."
          checked={channels.email}
          onChange={(checked) => onChannelChange('email', checked)}
        />
        <ToggleSwitch
          id="sms-channel"
          label="SMS Notifications"
          description="Receive critical alerts via text message (charges may apply)."
          checked={channels.sms}
          onChange={(checked) => onChannelChange('sms', checked)}
        />
        <ToggleSwitch
          id="push-channel"
          label="Push Notifications"
          description="Receive alerts on your mobile/desktop devices."
          checked={channels.push}
          onChange={(checked) => onChannelChange('push', checked)}
        />
      </div>
    </SettingsSectionCard>
  );
};
