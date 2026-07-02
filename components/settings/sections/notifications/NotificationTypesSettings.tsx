import React from 'react';
import { SettingsSectionCard } from '../../SettingsSectionCard';
import { Checkbox } from '../../../common/Checkbox';

type Channels = 'inApp' | 'email' | 'sms';

interface NotificationEvent {
  id: string;
  name: string;
  description: string;
  settings: Record<Channels, boolean>;
}

interface NotificationTypesSettingsProps {
  events: NotificationEvent[];
  onEventChange: (eventId: string, channel: Channels, value: boolean) => void;
  enabledChannels: Record<Channels, boolean>;
}

export const NotificationTypesSettings: React.FC<NotificationTypesSettingsProps> = ({ events, onEventChange, enabledChannels }) => {
  return (
    <SettingsSectionCard
      title="Notification Types"
      description="Fine-tune which notifications you receive on each channel."
      contentClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-base dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-800/40">
            <tr>
              <th scope="col" className="py-3 px-4 text-left text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">Event</th>
              <th scope="col" className="py-3 px-4 text-center text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">In-App</th>
              <th scope="col" className="py-3 px-4 text-center text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">Email</th>
              <th scope="col" className="py-3 px-4 text-center text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">SMS</th>
            </tr>
          </thead>
          <tbody className="bg-bg-base dark:bg-bg-muted divide-y divide-border-base dark:divide-slate-700">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="py-3 px-4 whitespace-nowrap">
                  <p className="text-sm font-medium text-text-base dark:text-text-base">{event.name}</p>
                  <p className="text-xs text-text-muted dark:text-slate-400">{event.description}</p>
                </td>
                {(['inApp', 'email', 'sms'] as Channels[]).map(channel => (
                    <td key={channel} className="py-3 px-4 text-center">
                        <Checkbox
                            checked={event.settings[channel]}
                            onChange={e => onEventChange(event.id, channel, e.target.checked)}
                            disabled={!enabledChannels[channel]}
                            aria-label={`${channel} notification for ${event.name}`}
                        />
                    </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SettingsSectionCard>
  );
};
