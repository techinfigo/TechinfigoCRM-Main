
import React, { useState, useEffect } from 'react';
import { AppSettings, FeatureKey, PermissionAction } from '../../../types';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import { FormField } from '../../common/FormField';
import { TextArea } from '../../common/Input';

/** Shown as placeholder + used by the invoice when no custom terms are saved. */
const DEFAULT_INVOICE_TERMS = [
  'This invoice is system generated and does not require a physical signature.',
  'Services are provided on a best-effort basis and results may vary based on market conditions, platform policies, and client inputs.',
  'Fees once paid are non-refundable.',
  'Any third-party costs (ad spend, tools, software, taxes) are not included unless mentioned separately.',
  'Payment must be made within the due date mentioned on the invoice.',
  'Late payments may result in pause or discontinuation of services.',
  'The client is requested to verify that the payment details, GST information, and bank account name mentioned on this invoice match the registered company name before making payment.',
  'All disputes, if any, shall be subject to AGRA jurisdiction only.',
].join('\n');

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
  
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setIsChanged(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Stored inline as a data URL (there is no file server). Firestore documents
    // cap at 1MB, so keep logos small or cloud sync will start failing.
    if (file.size > 200 * 1024) {
      alert('Please choose a logo under 200KB so it can sync to the cloud reliably.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, agencyLogoUrl: String(reader.result) }));
      setIsChanged(true);
    };
    reader.readAsDataURL(file);
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
            <FormField label="Default Currency" htmlFor="defaultCurrency">
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
            </FormField>
          
            <FormField label="Default Payment Terms (in days)" htmlFor="defaultPaymentTerms">
                <Input
                    id="defaultPaymentTerms"
                    name="defaultPaymentTerms"
                    type="number"
                    value={formData.defaultPaymentTerms?.toString() || ''}
                    onChange={handleChange}
                    disabled={!canManage}
                    className="max-w-xs"
                />
          </FormField>

          <FormField label="Agency GSTIN / Tax ID" htmlFor="agencyGstin">
                <Input
                    id="agencyGstin"
                    name="agencyGstin"
                    value={formData.agencyGstin || ''}
                    onChange={handleChange}
                    disabled={!canManage}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                />
          </FormField>

        </div>
      </SettingsSectionCard>

      <SettingsSectionCard
        title="Invoice Branding & Terms"
        description="Your logo and terms & conditions as they appear on the invoice PDF."
      >
        <div className="space-y-5">
          <FormField label="Agency Logo" htmlFor="agencyLogoFile">
            <div className="flex items-start gap-4 flex-wrap">
              <div className="w-40 h-20 rounded-lg border border-border-base dark:border-border-muted flex items-center justify-center bg-[#0C2B2B] overflow-hidden shrink-0">
                {formData.agencyLogoUrl
                  ? <img src={formData.agencyLogoUrl} alt="Agency logo preview" className="max-h-16 max-w-[9rem] object-contain" />
                  : <span className="text-[10px] text-white/60 px-2 text-center">No logo — built-in TECHINFIGO logo will be used</span>}
              </div>
              <div className="space-y-2">
                <input
                  id="agencyLogoFile"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  disabled={!canManage}
                  className="block text-sm text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-premium-accent file:text-white hover:file:opacity-90"
                />
                <p className="text-xs text-text-muted">PNG, JPG, SVG or WebP. Max 200KB. Shown on a dark background, so a white/transparent logo works best.</p>
                {formData.agencyLogoUrl && canManage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => { setFormData(prev => ({ ...prev, agencyLogoUrl: undefined })); setIsChanged(true); }}
                  >
                    Remove logo
                  </Button>
                )}
              </div>
            </div>
          </FormField>

          <FormField label="Invoice Terms & Conditions (one per line)" htmlFor="invoiceTerms">
            <TextArea
              id="invoiceTerms"
              name="invoiceTerms"
              rows={9}
              value={formData.invoiceTerms ?? ''}
              onChange={handleTextAreaChange}
              disabled={!canManage}
              placeholder={DEFAULT_INVOICE_TERMS}
            />
            <p className="text-xs text-text-muted mt-1">Leave blank to use the default terms shown above.</p>
          </FormField>
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
