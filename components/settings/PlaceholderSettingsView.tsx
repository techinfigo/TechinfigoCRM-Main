
import React from 'react';
import { SettingsSectionCard } from './SettingsSectionCard';

interface PlaceholderSettingsViewProps {
  title: string;
  description: string;
}

const WrenchScrewdriverIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-slate-300 dark:text-slate-600">
        <path d="M15.901 2.585a2.25 2.25 0 013.181 0l.001.002.002.001a2.25 2.25 0 010 3.181L13.06 11.83a2.25 2.25 0 01-1.272.93L9.5 13.5a2.25 2.25 0 01-2.47-1.242l-.501-1.503a2.25 2.25 0 01.33-2.31L13.599.34a2.25 2.25 0 012.302 2.245z" />
        <path d="M8.288 12.235A2.25 2.25 0 006 14.25v2.25H3.75a2.25 2.25 0 00-2.25 2.25v.001A2.25 2.25 0 003.75 21h12.5a2.25 2.25 0 002.25-2.25v-.001a2.25 2.25 0 00-2.25-2.25H13.5v-2.25a2.25 2.25 0 00-2.013-2.235L10.5 9l-2.212 3.235z" />
    </svg>
);


export const PlaceholderSettingsView: React.FC<PlaceholderSettingsViewProps> = ({ title, description }) => {
  return (
    <SettingsSectionCard title={title} description={description}>
      <div className="text-center py-16 px-6 bg-slate-50 dark:bg-slate-800/20 rounded-lg border-2 border-dashed border-border-muted dark:border-slate-700">
        <WrenchScrewdriverIcon />
        <h4 className="mt-6 text-xl font-semibold text-text-muted dark:text-text-muted">Module Under Construction</h4>
        <p className="text-sm text-text-muted dark:slate-400 mt-2 max-w-md mx-auto">
          This settings section is planned for a future update. The necessary infrastructure is being prepared to support these features.
        </p>
      </div>
    </SettingsSectionCard>
  );
};
