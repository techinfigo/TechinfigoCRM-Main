import React from 'react';
import { ProfitRevenueEstimator } from '@/components/tools/ProfitRevenueEstimator';

export const ToolsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-heading dark:text-text-heading">Tools & Utilities</h1>
      <p className="text-text-muted dark:text-text-muted">A collection of handy calculators and tools to help with your agency's planning and forecasting.</p>
      
      <ProfitRevenueEstimator />
      
      {/* Other tools can be added here in the future */}
    </div>
  );
};
