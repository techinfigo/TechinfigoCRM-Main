
import React, { useState, useEffect, useRef } from 'react';
import { Client, CustomField } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
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
  customFieldValues: {},
};

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSave, client, onSetDirty, customFields }) => {
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});

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
     if (formData.website && !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(formData.website)) {
        newErrors.website = t('validation.invalid', { field: t('clients.form.website') });
    }
    if (formData.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(formData.gstin)) {
        newErrors.gstin = t('validation.invalid', { field: t('clients.form.gstin') });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
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
      gstin: formData.gstin?.trim() || undefined,
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
        <Input label={t('clients.form.gstin')} id="gstin" name="gstin" value={formData.gstin || ''} onChange={handleChange} error={errors.gstin} placeholder="e.g., 22AAAAA0000A1Z5"/>
        <Input label={t('clients.form.tags')} id="tags" name="tags" placeholder="e.g., key_account, local, b2c" value={formData.tags || ''} onChange={handleChange} />
        <TextArea label={t('clients.form.address')} id="address" name="address" value={formData.address || ''} onChange={handleChange} rows={2} />
        <TextArea label={t('clients.form.notes')} id="clientNotes" name="clientNotes" value={formData.clientNotes || ''} onChange={handleChange} rows={3} placeholder="Internal notes about the client, preferences, history..."/>
      
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
