
import React, { useState, useEffect } from 'react';
import { AppSettings, FeatureKey, PermissionAction } from '../../types';
import { SettingsSectionCard } from './SettingsSectionCard';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface FinanceSettingsViewProps {
  appSettings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
}

const availableCurrencies: AppSettings['defaultCurrency'][] = ['INR', 'USD', 'EUR', 'GBP'];

export const FinanceSettingsView: React.FC<FinanceSettingsViewProps> = ({ appSettings, onSaveSettings, hasPermission }) => {
  const [formData, setFormData] = useState<AppSettings>(appSettings);
  const [isChanged, setIsChanged] = useState(false);
  const canManage = hasPermission('adminSettings', 'canManage');

  useEffect(() => {
    setFormData(appSettings);
    setIsChanged(false);
  }, [appSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number = value;
    if (type === 'number') {
      processedValue = value === '' ? 0 : parseInt(value, 10);
      if (isNaN(processedValue as number) || (processedValue as number) < 0) processedValue = 0;
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    setIsChanged(true);
  };
  
  const handleSave = () => {
    onSaveSettings(formData);
    setIsChanged(false);
  };

  return (
    <div className="space-y-6">
      <SettingsSectionCard
        title="Financial Defaults"
        description="Set default currency, payment terms, and tax settings for invoices."
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="defaultCurrency" className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">Default Currency</label>
            <select
              id="defaultCurrency"
              name="defaultCurrency"
              value={formData.defaultCurrency}
              onChange={handleChange}
              disabled={!canManage}
              className="w-full sm:w-1/2 p-2 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent"
            >
              {availableCurrencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          <Input
            label="Default Payment Terms (in days)"
            id="defaultPaymentTerms"
            name="defaultPaymentTerms"
            type="number"
            value={formData.defaultPaymentTerms?.toString() || ''}
            onChange={handleChange}
            disabled={!canManage}
            containerClassName="sm:max-w-xs"
          />
        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Payment Gateway Integration"
        description="Connect with payment gateways like Stripe or Razorpay to accept online payments. (Conceptual)"
      >
        <div className="space-y-4">
            <p className="text-sm text-text-muted dark:text-text-muted">This is where you would configure API keys for your chosen payment provider.</p>
            <Input label="Stripe Publishable Key" placeholder="pk_live_************************" disabled/>
            <Input label="Stripe Secret Key" type="password" placeholder="sk_live_************************" disabled/>
            <Button disabled>Connect Stripe (Conceptual)</Button>
        </div>
      </SettingsSectionCard>
      
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={!isChanged || !canManage}>
          {isChanged ? 'Save Finance Settings' : 'Settings Saved'}
        </Button>
      </div>
    </div>
  );
};
