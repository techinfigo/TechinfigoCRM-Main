
import React from 'react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, children, className, icon }) => {
  return (
    <div className={`bg-bg-base dark:bg-bg-muted shadow-lg rounded-xl p-5 ${className || ''}`}>
      <div className="flex items-center mb-4">
        {icon && <span className="mr-3 text-premium-accent dark:text-premium-accent-dark text-xl">{icon}</span>}
        <h3 className="text-lg font-semibold text-text-base dark:text-text-base">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default SectionCard;