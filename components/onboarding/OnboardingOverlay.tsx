import React from 'react';
import { Button } from '@/components/common/Button';
import { FolderKanban, ClipboardList, Bell, Database, X } from 'lucide-react';

interface OnboardingOverlayProps {
  onDismiss: () => void;
  onPopulateData: () => void;
}

const StepCard: React.FC<{
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ step, icon, title, description }) => (
  <div className="flex items-start gap-4">
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary-accent/20 text-secondary-accent font-bold text-lg shrink-0">
      {step}
    </div>
    <div>
      <h4 className="font-semibold text-text-heading dark:text-text-heading flex items-center gap-2">
        {icon}
        {title}
      </h4>
      <p className="text-sm text-text-muted">{description}</p>
    </div>
  </div>
);

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onDismiss, onPopulateData }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/40 backdrop-blur-sm animate-content-fade-in">
      <div className="relative w-full max-w-2xl bg-bg-base dark:bg-bg-muted rounded-2xl shadow-2xl p-8 border border-border-base dark:border-border-muted transform transition-all animate-[scale-in_0.3s_ease-out]">
        <Button
          variant="ghost"
          size="sm"
          className="!absolute top-3 right-3 !p-2"
          onClick={onDismiss}
          aria-label="Dismiss onboarding"
        >
          <X className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-text-heading dark:text-text-heading">Welcome to Your CRM!</h2>
          <p className="mt-2 text-text-muted">
            Let's get you started. Here are the first few steps to get your workspace running.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <StepCard
            step={1}
            icon={<FolderKanban size={18} />}
            title="Create a Project"
            description="Group all your related work for a client or internal goal."
          />
          <StepCard
            step={2}
            icon={<ClipboardList size={18} />}
            title="Add a Task"
            description="Break down your project into actionable to-do items for your team."
          />
          <StepCard
            step={3}
            icon={<Bell size={18} />}
            title="Set a Reminder"
            description="Never miss a deadline by setting reminders on important tasks."
          />
        </div>

        <div className="mt-8 pt-6 border-t border-border-base dark:border-border-muted text-center">
          <p className="text-sm text-text-muted mb-4">
            Or, jump right in by adding some sample data to explore.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onPopulateData}
              leftIcon={<Database size={18} />}
            >
              Populate with Sample Data
            </Button>
            <Button variant="secondary" size="lg" onClick={onDismiss}>
              I'll set it up myself
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};