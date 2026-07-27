
import React, { useState, useEffect, useRef } from 'react';
import { Client, CustomField, PaymentMode, ClientDocumentType, paymentModes, clientDocumentTypes, AgreedService, ServiceBillingType, serviceBillingTypes } from '../../types';
import { getTotalAgreedValue, getMonthlyRecurringValue } from '../../selectors/clientBilling';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Select } from '../common/Select';
import { Checkbox } from '../common/Checkbox';
import { DynamicFormFields } from '@/components/forms/DynamicFormFields';
import { t } from '@/i18n';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  client: Client | null;
  onSetDirty: (isDirty: boolean) => void;
  customFields: CustomField[];
}

interface ClientFormData {
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  industry?: string;
  tags?: string; // Comma-separated for input
  primaryContactName?: string;
  primaryContactEmail?: string;
  clientNotes?: string;
  gstin?: string; // Added GSTIN field
  paymentMode?: PaymentMode;
  documentType: ClientDocumentType;
  invoiceRequired: boolean;
  internalNotes?: string;
  advanceAmount?: number;
  advancePaymentMode?: PaymentMode;
  advanceReceivedDate?: string;
  advanceNotes?: string;
  agreedServices: AgreedService[];
  customFieldValues: { [key: string]: any };
}

const initialFormData: ClientFormData = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  industry: '',
  tags: '',
  primaryContactName: '',
  primaryContactEmail: '',
  clientNotes: '',
  gstin: '', // Initialize GSTIN
  paymentMode: undefined,
  documentType: 'GST Invoice',
  invoiceRequired: true,
  internalNotes: '',
  advanceAmount: 0,
  advancePaymentMode: undefined,
  advanceReceivedDate: '',
  advanceNotes: '',
  agreedServices: [],
  customFieldValues: {},
};

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSave, client, onSetDirty, customFields }) => {
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        let currentInitialState: ClientFormData;
        if (client) {
          currentInitialState = {
            name: client.name,
            companyName: client.companyName || '',
            email: client.email,
            phone: client.phone || '',
            address: client.address || '',
            website: client.website || '',
            industry: client.industry || '',
            tags: Array.isArray(client.tags) ? client.tags.join(', ') : '',
            primaryContactName: client.primaryContactName || '',
            primaryContactEmail: client.primaryContactEmail || '',
            clientNotes: client.clientNotes || '',
            gstin: client.gstin || '',
            paymentMode: client.paymentMode,
            documentType: client.documentType ?? 'GST Invoice',
            invoiceRequired: client.invoiceRequired ?? true,
            internalNotes: client.internalNotes || '',
            advanceAmount: client.advanceAmount ?? 0,
            advancePaymentMode: client.advancePaymentMode,
            advanceReceivedDate: (client.advanceReceivedDate ?? '').split('T')[0],
            advanceNotes: client.advanceNotes || '',
            agreedServices: client.agreedServices || [],
            customFieldValues: client.customFieldValues || {},
          };
        } else {
          currentInitialState = {
            ...initialFormData,
            customFieldValues: customFields
                .filter(cf => cf.modules.includes('Clients'))
                .reduce((acc, field) => {
                    acc[field.id] = field.defaultValue ?? '';
                    if (field.type === 'Checkbox' && field.defaultValue === undefined) {
                        acc[field.id] = false;
                    }
                    return acc;
                }, {} as { [key: string]: any }),
        };
        }
        setFormData(currentInitialState);
        onSetDirty(false); // Reset dirty state when modal opens or client changes
        setErrors({});
    }
  }, [client, isOpen, onSetDirty, customFields]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onSetDirty(true);
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof ClientFormData]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

   const handleCustomFieldChange = (fieldId: string, value: any) => {
    onSetDirty(true);
    setFormData(prev => ({
      ...prev,
      customFieldValues: {
        ...prev.customFieldValues,
        [fieldId]: value,
      },
    }));
    // Optional: Add custom field validation logic here
  };

  const handlePaymentModeChange = (value: string) => {
    onSetDirty(true);
    setFormData(prev => ({ ...prev, paymentMode: (value || undefined) as PaymentMode | undefined }));
  };

  const handleDocumentTypeChange = (value: string) => {
    onSetDirty(true);
    setFormData(prev => ({ ...prev, documentType: value as ClientDocumentType }));
  };

  const handleInvoiceRequiredChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSetDirty(true);
    setFormData(prev => ({ ...prev, invoiceRequired: e.target.checked }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = t('validation.required', { field: t('clients.form.name') });
    if (!formData.email.trim()) {
        newErrors.email = t('validation.required', { field: t('clients.form.email') });
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = t('validation.invalid', { field: t('clients.form.email') });
    }
    if (formData.primaryContactEmail && !/\S+@\S+\.\S+/.test(formData.primaryContactEmail)) {
        newErrors.primaryContactEmail = t('validation.invalid', { field: t('clients.form.contactEmail') });
    }
     if (formData.website && !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(formData.website.trim())) {
        newErrors.website = t('validation.invalid', { field: t('clients.form.website') });
    }
    if (formData.documentType === 'GST Invoice' && formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(formData.gstin)) {
        newErrors.gstin = t('validation.invalid', { field: t('clients.form.gstin') });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addAgreedService = () => {
    setFormData(prev => ({
      ...prev,
      agreedServices: [
        ...prev.agreedServices,
        { id: `svc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: '', cost: 0, billingType: 'One-Time' as ServiceBillingType },
      ],
    }));
  };
  const updateAgreedService = (id: string, patch: Partial<AgreedService>) => {
    setFormData(prev => ({
      ...prev,
      agreedServices: prev.agreedServices.map(sv => sv.id === id ? { ...sv, ...patch } : sv),
    }));
  };
  const removeAgreedService = (id: string) => {
    setFormData(prev => ({ ...prev, agreedServices: prev.agreedServices.filter(sv => sv.id !== id) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      // Make it obvious WHY save was blocked — the failing field is often
      // scrolled out of view while the Save button sits in the footer.
      setShowErrorSummary(true);
      setTimeout(() => summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
      return;
    }
    setShowErrorSummary(false);

    // Start with the existing client data or defaults for a new client
    const baseClientData = client || {
        id: '', // Will be replaced by parent for new clients
        dateAdded: new Date().toISOString(), // will be overwritten by parent for new clients
        healthStatus: 'Healthy' as const,
        roi: { current: 0, goal: 50000 },
        nextAction: { title: 'Initial Follow-up', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        recentActivity: [{ id: `act-new-${Date.now()}`, action: 'Client Created', timestamp: new Date().toISOString(), icon: 'note' as const }],
    };
    
    // Merge form data and convert fields
    const clientToSave: Client = {
      ...baseClientData,
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      gstin: formData.documentType === 'GST Invoice' ? (formData.gstin?.trim() || undefined) : undefined,
      paymentMode: formData.paymentMode,
      documentType: formData.documentType,
      invoiceRequired: formData.invoiceRequired,
      internalNotes: formData.internalNotes?.trim() || undefined,
      advanceAmount: Number(formData.advanceAmount) || undefined,
      advancePaymentMode: formData.advancePaymentMode,
      advanceReceivedDate: formData.advanceReceivedDate ? new Date(formData.advanceReceivedDate).toISOString() : undefined,
      advanceNotes: formData.advanceNotes?.trim() || undefined,
      agreedServices: formData.agreedServices.filter(sv => sv.name.trim() || sv.cost),
      customFieldValues: formData.customFieldValues,
    };

    onSave(clientToSave);
    onSetDirty(false); // Mark as not dirty after save
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t(client ? 'clients.editTitle' : 'clients.addTitle')}
      size="2xl" 
      overrideZIndex="z-[1050]"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">
            {t(client ? 'common.save' : 'common.add')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div ref={summaryRef}>
          {showErrorSummary && Object.keys(errors).length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-sm" role="alert">
              <p className="font-semibold mb-1">Can't save yet — please fix:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {Object.values(errors).filter(Boolean).map((msg, i) => <li key={i}>{msg as string}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={`${t('clients.form.name')} *`} id="name" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
            <Input label={t('clients.form.companyName')} id="companyName" name="companyName" value={formData.companyName || ''} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={`${t('clients.form.email')} *`} id="email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} required />
            <Input label={t('clients.form.phone')} id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('clients.form.website')} id="website" name="website" type="url" placeholder="https://example.com" value={formData.website || ''} onChange={handleChange} error={errors.website}/>
            <Input label={t('clients.form.industry')} id="industry" name="industry" placeholder="e.g., E-commerce, Healthcare" value={formData.industry || ''} onChange={handleChange} />
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('clients.form.contactName')} id="primaryContactName" name="primaryContactName" value={formData.primaryContactName || ''} onChange={handleChange} />
            <Input label={t('clients.form.contactEmail')} id="primaryContactEmail" name="primaryContactEmail" type="email" value={formData.primaryContactEmail || ''} onChange={handleChange} error={errors.primaryContactEmail}/>
        </div>
        <Input label={t('clients.form.tags')} id="tags" name="tags" placeholder="e.g., key_account, local, b2c" value={formData.tags || ''} onChange={handleChange} />
        <TextArea label={t('clients.form.address')} id="address" name="address" value={formData.address || ''} onChange={handleChange} rows={2} />
        <TextArea label={t('clients.form.notes')} id="clientNotes" name="clientNotes" value={formData.clientNotes || ''} onChange={handleChange} rows={3} placeholder="General notes: preferences, history, how you met, etc."/>

        <div className="pt-2 border-t border-border-base dark:border-slate-700">
          <h4 className="text-sm font-semibold text-text-base dark:text-text-base mb-3 mt-3">Billing Preferences</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Payment Mode"
              value={formData.paymentMode || ''}
              onChange={handlePaymentModeChange}
              placeholder="Not set"
              options={[
                { value: '', label: 'Not set' },
                ...paymentModes.map(pm => ({ value: pm, label: pm })),
              ]}
            />
            <Select
              label="Document Type"
              value={formData.documentType}
              onChange={handleDocumentTypeChange}
              options={clientDocumentTypes.map(dt => ({ value: dt, label: dt }))}
            />
          </div>

          <div className="mt-4">
            <Checkbox
              id="invoiceRequired"
              label="Invoice required for this client"
              checked={formData.invoiceRequired}
              onChange={handleInvoiceRequiredChange}
            />
            {!formData.invoiceRequired && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                This client will be excluded from bulk invoice generation and automated invoice emails.
              </div>
            )}
          </div>

          {formData.documentType === 'GST Invoice' && (
            <div className="mt-4">
              <Input label={t('clients.form.gstin')} id="gstin" name="gstin" value={formData.gstin || ''} onChange={handleChange} error={errors.gstin} placeholder="e.g., 22AAAAA0000A1Z5"/>
            </div>
          )}

          <div className="mt-4">
            <TextArea label="Billing Notes" id="internalNotes" name="internalNotes" value={formData.internalNotes || ''} onChange={handleChange} rows={2} placeholder="e.g., pays in cash, prefers UPI, no invoice needed..."/>
          </div>

          <div className="mt-5 pt-4 border-t border-border-base dark:border-border-muted">
            <h4 className="text-sm font-bold text-text-heading dark:text-slate-200 mb-1">Advance / Token Payment</h4>
            <p className="text-xs text-text-muted mb-3">Money taken before starting work. This auto-fills the advance on their next invoice.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Advance Amount"
                id="advanceAmount"
                name="advanceAmount"
                type="number"
                min="0"
                step="0.01"
                value={(formData.advanceAmount ?? 0).toString()}
                onChange={handleChange}
                placeholder="0"
              />
              <Select
                label="Advance Payment Mode"
                value={formData.advancePaymentMode || ''}
                onChange={(v) => setFormData(prev => ({ ...prev, advancePaymentMode: (v || undefined) as PaymentMode | undefined }))}
                placeholder="Not set"
                options={[{ value: '', label: 'Not set' }, ...paymentModes.map(pm => ({ value: pm, label: pm }))]}
              />
              <Input
                label="Advance Received On"
                id="advanceReceivedDate"
                name="advanceReceivedDate"
                type="date"
                value={formData.advanceReceivedDate || ''}
                onChange={handleChange}
              />
              <Input
                label="Advance Notes"
                id="advanceNotes"
                name="advanceNotes"
                value={formData.advanceNotes || ''}
                onChange={handleChange}
                placeholder="e.g., 30% token for logo project"
              />
            </div>
          </div>
        </div>

        {/* ---- Services & Pricing (agreed deal scope) ---- */}
        <div className="pt-2 mt-2 border-t border-border-base dark:border-border-muted">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-text-heading dark:text-slate-200 uppercase tracking-wide">Services &amp; Pricing</h3>
            <Button type="button" variant="secondary" size="sm" onClick={addAgreedService}>+ Add Service</Button>
          </div>
          <p className="text-xs text-text-muted mb-3">The deal agreed at onboarding. Mark each service as one-time or recurring.</p>

          {formData.agreedServices.length === 0 ? (
            <p className="text-sm text-text-muted py-3 text-center border border-dashed border-border-base dark:border-border-muted rounded-lg">
              No services added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {formData.agreedServices.map((sv) => (
                <div key={sv.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end p-3 rounded-lg border border-border-base dark:border-border-muted bg-slate-50/60 dark:bg-slate-800/30">
                  <div className="md:col-span-5">
                    <Input label="Service" value={sv.name} onChange={(e) => updateAgreedService(sv.id, { name: e.target.value })} placeholder="e.g., Social Media Management" />
                  </div>
                  <div className="md:col-span-3">
                    <Input label="Cost" type="number" min="0" step="0.01" value={(sv.cost ?? 0).toString()} onChange={(e) => updateAgreedService(sv.id, { cost: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="md:col-span-3">
                    <Select
                      label="Billing"
                      value={sv.billingType}
                      onChange={(v) => updateAgreedService(sv.id, { billingType: v as ServiceBillingType })}
                      options={serviceBillingTypes.map(bt => ({ value: bt, label: bt }))}
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAgreedService(sv.id)} className="text-red-600 hover:text-red-700">✕</Button>
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-x-8 gap-y-1 justify-end pt-2 text-sm">
                <span className="text-text-muted">Total Agreed: <strong className="text-text-heading dark:text-slate-100">₹{getTotalAgreedValue(formData.agreedServices).toLocaleString('en-IN')}</strong></span>
                <span className="text-text-muted" title="Monthly equivalent — annual ÷ 12, quarterly ÷ 3. Each service still bills at its own cycle.">Recurring ≈ <strong className="text-emerald-600 dark:text-emerald-400">₹{Math.round(getMonthlyRecurringValue(formData.agreedServices)).toLocaleString('en-IN')}</strong>/mo</span>
              </div>
            </div>
          )}
        </div>

        <DynamicFormFields
            module="Clients"
            customFields={customFields}
            values={formData.customFieldValues}
            onChange={handleCustomFieldChange}
            // errors={errors.customFieldValues} // Add later if needed
        />
      </form>
    </Modal>
  );
};
