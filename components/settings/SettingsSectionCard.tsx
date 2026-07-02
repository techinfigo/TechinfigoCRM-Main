
import React from 'react';
import { Card } from '../common/Card';

interface SettingsSectionCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const SettingsSectionCard: React.FC<SettingsSectionCardProps> = ({
  title,
  description,
  children,
  className,
  contentClassName = 'p-5'
}) => {
  return (
    <Card 
        className={`bg-bg-base dark:bg-bg-muted shadow-lg ${className || ''}`}
        title={
            <div>
                <h3 className="text-lg font-semibold text-text-heading dark:text-text-heading">{title}</h3>
                <p className="text-sm text-text-muted dark:text-text-muted mt-1">{description}</p>
            </div>
        }
        contentClassName={contentClassName}
    >
      {children}
    </Card>
  );
};
