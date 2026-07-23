
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Invoice, Client, ServiceItem, InvoiceStatus, DiscountType, AppSettings, RecurrenceFrequency, recurrenceFrequencies } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Select, SelectOption } from '../common/Select';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<Invoice, 'id' | 'clientName'> & { id?: string; invoiceNumber?: string; clientName?: string }) => void;
  invoice: Invoice | null;
  clients: Client[];
  getNextInvoiceNumber: () => string;
  appSettings: AppSettings;
  onSetDirty: (isDirty: boolean) => void;
}

interface InvoiceFormData {
  clientId: string;
  issueDate: string;
  dueDate: string;
  items: ServiceItem[];
  status: InvoiceStatus;
  notes?: string;
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number;
  paymentInstructions?: string;
  paymentTerms?: string; // Added paymentTerms
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  recurrenceEndDate?: string;
  currency: string;
}

interface InvoiceFormErrors {
  clientId?: string;
  issueDate?: string;
  dueDate?: string;
  status?: string;
  notes?: string;
  discountType?: string;
  discountValue?: string;
  taxRate?: string;
  paymentInstructions?: string;
  paymentTerms?: string; // Added paymentTerms error
  items?: (string | undefined)[]; 
  recurrenceFrequency?: string;
  recurrenceEndDate?: string;
}

const discountTypes: DiscountType[] = ['None', 'Percentage', 'Fixed'];
const invoiceStatuses: InvoiceStatus[] = ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'];

// A clear, empty state for initialization.
const emptyFormData: InvoiceFormData = {
  clientId: '',
  issueDate: '',
  dueDate: '',
  items: [],
  status: 'Draft',
  notes: '',
  discountType: 'None',
  discountValue: 0,
  taxRate: 18,
  paymentInstructions: '',
  paymentTerms: '',
  isRecurring: false,
  recurrenceFrequency: 'Monthly',
  recurrenceEndDate: '',
  currency: 'INR',
};


export const InvoiceFormModal: React.FC<InvoiceFormModalProps> = ({ isOpen, onClose, onSave, invoice, clients, getNextInvoiceNumber, appSettings, onSetDirty }) => {
  const [formData, setFormData] = useState<InvoiceFormData>(emptyFormData);
  const [errors, setErrors] = useState<InvoiceFormErrors>({});
  const [formSummaryErrors, setFormSummaryErrors] = useState<string[]>([]);
  const summaryRef = useRef<HTMLDivElement>(null);

  const clientOptions = useMemo<SelectOption[]>(() => {
    return clients.map(c => ({
      value: c.id,
      label: c.name,
      secondaryLabel: c.companyName || 'Individual'
    }));
  }, [clients]);

  const statusOptions = useMemo<SelectOption[]>(() => {
    return invoiceStatuses.map(s => ({
      value: s,
      label: s
    }));
  }, []);

  const currencyOptions = useMemo<SelectOption[]>(() => {
    return [
      { value: 'INR', label: 'INR (₹)' },
      { value: 'USD', label: 'USD ($)' },
      { value: 'EUR', label: 'EUR (€)' },
      { value: 'GBP', label: 'GBP (£)' },
      { value: 'CAD', label: 'CAD (CA$)' },
      { value: 'AUD', label: 'AUD (A$)' },
      { value: 'AED', label: 'AED (AED)' },
      { value: 'SGD', label: 'SGD (S$)' },
      { value: 'JPY', label: 'JPY (¥)' },
      { value: 'CNY', label: 'CNY (CN¥)' },
    ];
  }, []);

  const discountTypeOptions = useMemo<SelectOption[]>(() => {
    return discountTypes.map(s => ({
      value: s,
      label: s
    }));
  }, []);

  const frequencyOptions = useMemo<SelectOption[]>(() => {
    return recurrenceFrequencies.map(freq => ({
      value: freq,
      label: freq
    }));
  }, []);

  const handleCustomSelectChange = (name: string, value: string) => {
    onSetDirty(true);
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'discountType' && value === 'None') {
        updated.discountValue = 0;
      }
      return updated;
    });

    if (errors[name as keyof InvoiceFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const suggestedInvoiceNumber = useMemo(() => {
    if (!invoice) return getNextInvoiceNumber();
    return invoice.invoiceNumber;
  }, [invoice, getNextInvoiceNumber, isOpen]);

  useEffect(() => {
    if (isOpen) {
        const defaultItem = (): ServiceItem => ({ 
            id: `item-new-${Date.now()}-${Math.random()}`, 
            description: '', 
            quantity: 1, 
            unitPrice: 0 
        });

        // This is the most robust way to initialize.
        // It guarantees all fields exist and have a default value.
        const getInitialState = (): InvoiceFormData => {
            if (invoice) {
                // Editing an existing invoice
                return {
                    clientId: invoice.clientId ?? (clients.length > 0 ? clients[0].id : ''),
                    issueDate: (invoice.issueDate ?? '').split('T')[0],
                    dueDate: (invoice.dueDate ?? '').split('T')[0],
                    items: (invoice.items && invoice.items.length > 0)
                        ? invoice.items.map(item => ({...item})) // Shallow copy to avoid mutation
                        : [defaultItem()],
                    status: invoice.status ?? 'Draft',
                    notes: invoice.notes ?? '',
                    discountType: invoice.discountType ?? 'None',
                    discountValue: invoice.discountValue ?? 0,
                    taxRate: invoice.taxRate ?? 18,
                    paymentInstructions: invoice.paymentInstructions ?? '',
                    paymentTerms: invoice.paymentTerms ?? `Payment due within ${appSettings.defaultPaymentTerms || 7} days of invoice date.`,
                    isRecurring: invoice.isRecurring ?? false,
                    recurrenceFrequency: invoice.recurrenceFrequency ?? 'Monthly',
                    recurrenceEndDate: (invoice.recurrenceEndDate ?? '').split('T')[0],
                    currency: invoice.currency || appSettings.defaultCurrency || 'INR',
                };
            } else {
                // Creating a new invoice
                const today = new Date().toISOString().split('T')[0];
                const defaultDueDate = new Date(Date.now() + (appSettings.defaultPaymentTerms || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                
                return {
                    clientId: clients.length > 0 ? clients[0].id : '',
                    issueDate: today,
                    dueDate: defaultDueDate,
                    items: [defaultItem()],
                    status: 'Draft',
                    notes: '',
                    discountType: 'None',
                    discountValue: 0,
                    taxRate: 18, // Default GST
                    paymentInstructions: 'Bank Transfer / UPI',
                    paymentTerms: `Payment due within ${appSettings.defaultPaymentTerms || 7} days of invoice date.`,
                    isRecurring: false,
                    recurrenceFrequency: 'Monthly',
                    recurrenceEndDate: '',
                    currency: appSettings.defaultCurrency || 'INR',
                };
            }
        };
        
        const initialState = getInitialState();
        
        setFormData(initialState);
        onSetDirty(false);
        setErrors({});
    }
  }, [invoice, clients, isOpen, appSettings.defaultPaymentTerms, appSettings.defaultCurrency, onSetDirty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onSetDirty(true);
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    if (type === 'checkbox') {
        processedValue = (e.target as HTMLInputElement).checked;
        if (name === 'isRecurring' && !processedValue) { // If unchecking isRecurring
            setFormData(prev => ({ ...prev, recurrenceFrequency: 'Monthly', recurrenceEndDate: '' }));
        }
    } else if (name === 'discountValue' || name === 'taxRate') {
        processedValue = value === '' ? 0 : parseFloat(value);
    } else if (name === 'discountType' && value === 'None') {
      setFormData(prev => ({ ...prev, discountType: 'None', discountValue: 0 }));
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    if (errors[name as keyof InvoiceFormErrors]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleItemChange = (index: number, field: keyof ServiceItem, value: string | number) => {
    onSetDirty(true);
    const newItems = [...formData.items];
    // @ts-ignore
    newItems[index][field] = field === 'quantity' || field === 'unitPrice' ? Math.max(0, Number(value)) : value; 
    setFormData(prev => ({ ...prev, items: newItems }));

    if (errors.items && errors.items[index] !== undefined) {
      const updatedErrorItems = [...(errors.items || [])];
      if (index < updatedErrorItems.length) {
        updatedErrorItems[index] = undefined;
      }
      setErrors(prev => ({
        ...prev, 
        items: updatedErrorItems.every(e => e === undefined) ? undefined : updatedErrorItems 
      }));
    }
  };

  const addItem = () => {
    onSetDirty(true);
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now().toString(), description: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    onSetDirty(true);
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
    if (errors.items && errors.items.length > index) {
        const updatedErrorItems = [...errors.items];
        updatedErrorItems.splice(index, 1);
        setErrors(prev => ({
            ...prev,
            items: updatedErrorItems.length > 0 && updatedErrorItems.some(e => e !== undefined) ? updatedErrorItems : undefined
        }));
    }
  };

  const { subTotal, discountAmount, taxAmount, grandTotal } = useMemo(() => {
    const currentSubTotal = (formData.items || []).reduce((sum, item) => sum + ((item.quantity ?? 0) * (item.unitPrice ?? 0)), 0);
    let currentDiscountAmount = 0;
    if (formData.discountType === 'Percentage' && formData.discountValue) {
      currentDiscountAmount = currentSubTotal * (formData.discountValue / 100);
    } else if (formData.discountType === 'Fixed' && formData.discountValue) {
      currentDiscountAmount = formData.discountValue;
    }
    currentDiscountAmount = Math.min(currentDiscountAmount, currentSubTotal); 

    const totalAfterDiscount = Math.max(0, currentSubTotal - currentDiscountAmount);
    
    let currentTaxAmount = 0;
    if (formData.taxRate) {
      currentTaxAmount = totalAfterDiscount * (formData.taxRate / 100);
    }
    const currentGrandTotal = totalAfterDiscount + currentTaxAmount;
    
    return { subTotal: currentSubTotal, discountAmount: currentDiscountAmount, taxAmount: currentTaxAmount, grandTotal: currentGrandTotal };
  }, [formData.items, formData.discountType, formData.discountValue, formData.taxRate]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: formData.currency }).format(amount);
  };

  const validate = (): boolean => {
    const newErrorsLocal: InvoiceFormErrors = {};
    if (!formData.clientId) newErrorsLocal.clientId = "Client is required.";
    if (!formData.issueDate) newErrorsLocal.issueDate = "Issue date is required.";
    if (!formData.dueDate) newErrorsLocal.dueDate = "Due date is required.";
    if (new Date(formData.dueDate) < new Date(formData.issueDate)) newErrorsLocal.dueDate = "Due date cannot be before issue date.";
    if (!formData.paymentTerms?.trim()) newErrorsLocal.paymentTerms = "Payment terms are required.";
    
    if (formData.discountType === 'Percentage' && (formData.discountValue || 0) > 100) newErrorsLocal.discountValue = "Percentage discount cannot exceed 100%.";
    if ((formData.discountValue || 0) < 0) newErrorsLocal.discountValue = "Discount value cannot be negative."; 
    if ((formData.taxRate || 0) < 0) newErrorsLocal.taxRate = "Tax rate cannot be negative."; 

    if (formData.isRecurring) {
        if (!formData.recurrenceFrequency) newErrorsLocal.recurrenceFrequency = "Recurrence frequency is required.";
        if (formData.recurrenceEndDate && new Date(formData.recurrenceEndDate) < new Date(formData.issueDate)) {
            newErrorsLocal.recurrenceEndDate = "Recurrence end date cannot be before issue date.";
        }
    }


    const itemErrors: (string | undefined)[] = (formData.items || []).map((item, index) => {
        let currentItemErrorMessages: string[] = [];
        if (!item.description.trim()) currentItemErrorMessages.push(`Description is required.`);
        if ((item.quantity ?? 0) <= 0) currentItemErrorMessages.push(`Hours / Duration must be positive.`);
        if ((item.unitPrice ?? 0) < 0) currentItemErrorMessages.push(`Charges cannot be negative.`);
        
        if (currentItemErrorMessages.length > 0) {
            return `Item ${index + 1}: ${currentItemErrorMessages.join(' ')}`;
        }
        return undefined;
    });

    if (itemErrors.some(e => e !== undefined)) {
        newErrorsLocal.items = itemErrors;
    }

    setErrors(newErrorsLocal);

    const hasTopLevelErrors = Object.keys(newErrorsLocal)
        .filter(key => key !== 'items')
        .some(key => newErrorsLocal[key as keyof Omit<InvoiceFormErrors, 'items'>] !== undefined);

    const hasItemErrors = newErrorsLocal.items?.some(itemError => itemError !== undefined) || false;

    return !hasTopLevelErrors && !hasItemErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      // Surface why the save was blocked. Without this the Save button appears
      // to do nothing, because the failing field is often scrolled out of view.
      const problems: string[] = [];
      if (!formData.clientId) problems.push('Select a client.');
      if (!formData.issueDate) problems.push('Enter an issue date.');
      if (!formData.dueDate) problems.push('Enter a due date.');
      else if (formData.issueDate && new Date(formData.dueDate) < new Date(formData.issueDate)) problems.push('Due date cannot be before the issue date.');
      if (!formData.paymentTerms?.trim()) problems.push('Enter payment terms.');
      (formData.items || []).forEach((item, i) => {
        if (!item.description.trim()) problems.push(`Line item ${i + 1}: enter a description.`);
        if ((item.quantity ?? 0) <= 0) problems.push(`Line item ${i + 1}: duration must be greater than 0.`);
        if ((item.unitPrice ?? 0) < 0) problems.push(`Line item ${i + 1}: charges cannot be negative.`);
      });
      setFormSummaryErrors(problems.length ? problems : ['Please review the highlighted fields above.']);
      summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setFormSummaryErrors([]);

    const saveData: Omit<Invoice, 'id' | 'clientName'> & { id?: string; invoiceNumber?: string; clientName?: string } = {
        ...formData,
        id: invoice?.id, 
        invoiceNumber: invoice ? invoice.invoiceNumber : getNextInvoiceNumber(),
        clientName: clients.find(c => c.id === formData.clientId)?.name,
        discountValue: Number(formData.discountValue) || 0,
        taxRate: Number(formData.taxRate) || 0, 
        recurrenceEndDate: formData.isRecurring && formData.recurrenceEndDate ? formData.recurrenceEndDate : undefined,
    };
    onSave(saveData);
    onSetDirty(false); 
  };
  
  const selectBaseClass = "w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-secondary-accent dark:focus:ring-secondary-accent focus:border-secondary-accent dark:focus:border-secondary-accent text-slate-900 dark:text-slate-100 text-sm";


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={invoice ? `Edit Invoice #${invoice.invoiceNumber}` : `Create New Invoice (Est. #${suggestedInvoiceNumber})`}
      size="4xl" 
      overrideZIndex="z-[1050]"
      footer={
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="text-slate-700 dark:text-slate-300 flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1">
            <span className="text-sm">Subtotal: {formatCurrency(subTotal)}</span>
            {formData.discountValue && formData.discountType !== 'None' ? <span className="text-sm">Discount: -{formatCurrency(discountAmount)}</span> : ''}
            {formData.taxRate !== undefined && formData.taxRate > 0 ? <span className="text-sm">Tax ({formData.taxRate}%): +{formatCurrency(taxAmount)}</span> : ''}
            <strong className="text-lg">Total: {formatCurrency(grandTotal)}</strong>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit} type="submit">
              {invoice ? 'Save Changes' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div ref={summaryRef}>
          {formSummaryErrors.length > 0 && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 text-sm" role="alert">
              <p className="font-semibold mb-1">Can't save this invoice yet:</p>
              <ul className="list-disc pl-5 space-y-0.5">
                {formSummaryErrors.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
                label="Client *"
                options={clientOptions}
                value={formData.clientId}
                onChange={(val) => handleCustomSelectChange('clientId', val)}
                error={errors.clientId}
                placeholder={clients.length === 0 ? "Please add a client first" : "Select a client"}
                disabled={clients.length === 0}
                searchable={clients.length > 5}
                searchPlaceholder="Search clients..."
            />
            <Select
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(val) => handleCustomSelectChange('status', val)}
                placeholder="Select status"
            />
            <Select
                label="Currency"
                options={currencyOptions}
                value={formData.currency}
                onChange={(val) => handleCustomSelectChange('currency', val)}
                placeholder="Select currency"
                searchable={true}
                searchPlaceholder="Search currency..."
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Issue Date *" id="issueDate" name="issueDate" type="date" value={formData.issueDate} onChange={handleInputChange} error={errors.issueDate} required/>
            <Input label="Due Date *" id="dueDate" name="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} error={errors.dueDate} required/>
            <Input label="Payment Terms *" id="paymentTerms" name="paymentTerms" value={formData.paymentTerms || ''} onChange={handleInputChange} error={errors.paymentTerms} placeholder="e.g., Due within 7 days" required/>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 pb-2 mb-1">Invoice Items</h4>
          
          {/* Table Header for Desktop */}
          <div className="hidden md:grid grid-cols-12 gap-x-2 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="col-span-5">Service / Description</div>
            <div className="col-span-2">Hours / Duration</div>
            <div className="col-span-2">Charges</div>
            <div className="col-span-2 text-right">Total Price</div>
            <div className="col-span-1"></div>
          </div>

          {(formData.items || []).map((item, index) => {
            const itemError = Array.isArray(errors.items) && errors.items[index] ? errors.items[index] : undefined;
            return (
                <div key={item.id} className="grid grid-cols-12 gap-x-2 gap-y-1 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md items-start border border-slate-200 dark:border-slate-600">
                  <div className="col-span-12 md:col-span-5">
                    <span className="block md:hidden text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Service / Description</span>
                    <Input placeholder="Service (e.g. SEO Retainer - Oct)" aria-label="Item Description" name={`item_desc_${index}`} value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} error={itemError ? " " : undefined} />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <span className="block md:hidden text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Hours / Duration</span>
                    <Input type="number" placeholder="e.g., Hours" aria-label="Item Units" name={`item_qty_${index}`} value={(item.quantity ?? 1).toString()} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} min="0" error={itemError ? ' ' : undefined} containerClassName="mt-0" />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <span className="block md:hidden text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Charges ({formData.currency})</span>
                    <Input type="number" placeholder="Charges" aria-label="Item Charges" name={`item_price_${index}`} value={(item.unitPrice ?? 0).toString()} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} min="0" step="0.01" error={itemError ? ' ' : undefined} containerClassName="mt-0" />
                  </div>
                  <div className="col-span-4 md:col-span-2 text-right text-slate-700 dark:text-slate-200 self-center pt-2.5">
                    <span className="block md:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Total</span>
                    <span className="font-semibold">{formatCurrency((item.quantity ?? 0) * (item.unitPrice ?? 0))}</span>
                  </div>
                  <div className="col-span-12 md:col-span-1 flex justify-end items-center pt-1 md:pt-2"> {formData.items.length > 1 && ( <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1" aria-label="Remove item"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" /></svg> </Button> )} </div>
                  {itemError && (<div className="col-span-12 text-xs text-red-600 dark:text-red-400 -mt-2 mb-1 px-1">{itemError}</div> )}
                </div>
            );
          })}
          <Button type="button" variant="secondary" size="sm" onClick={addItem} className="mt-2">Add Item</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Select
                label="Discount Type"
                options={discountTypeOptions}
                value={formData.discountType || 'None'}
                onChange={(val) => handleCustomSelectChange('discountType', val)}
                placeholder="Select discount type"
            />
            <Input label={`Value ${formData.discountType === 'Percentage' ? '(%)' : formData.discountType === 'Fixed' ? `(${formData.currency})` : ''}`} id="discountValue" name="discountValue" type="number" value={(formData.discountValue ?? 0).toString()} onChange={handleInputChange} min="0" step="0.01" disabled={formData.discountType === 'None'} error={errors.discountValue}/>
            <Input label="Total Tax Rate (%)" id="taxRate" name="taxRate" type="number" value={(formData.taxRate ?? 0).toString()} onChange={handleInputChange} min="0" step="0.01" error={errors.taxRate}/>
        </div>

        {/* Recurring Invoice Section */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Recurring Invoice Setup</h4>
            <div className="flex items-center space-x-3 mb-3">
                <input 
                    type="checkbox" 
                    id="isRecurring" 
                    name="isRecurring" 
                    checked={!!formData.isRecurring} 
                    onChange={handleInputChange} 
                    className="h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-slate-700 dark:text-slate-300">Make this invoice recurring?</label>
            </div>
            {formData.isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
                    <Select
                        label="Frequency *"
                        options={frequencyOptions}
                        value={formData.recurrenceFrequency || 'Monthly'}
                        onChange={(val) => handleCustomSelectChange('recurrenceFrequency', val)}
                        placeholder="Select frequency"
                        error={errors.recurrenceFrequency}
                        labelClassName="!text-xs !mb-0.5 !font-medium"
                    />
                    <Input 
                        label="End Date (Optional)" 
                        id="recurrenceEndDate" 
                        name="recurrenceEndDate" 
                        type="date" 
                        value={formData.recurrenceEndDate || ''} 
                        onChange={handleInputChange} 
                        error={errors.recurrenceEndDate || undefined} 
                        className="!text-xs !py-2" 
                        labelClassName="!text-xs !mb-0.5" 
                    />
                </div>
            )}
        </div>

        <TextArea label="Payment Instructions" id="paymentInstructions" name="paymentInstructions" value={formData.paymentInstructions || ''} onChange={handleInputChange} rows={2} placeholder="e.g., Bank details, UPI ID" />
        <TextArea label="Notes / Terms" id="notes" name="notes" value={formData.notes || ''} onChange={handleInputChange} rows={2} placeholder="e.g., Thank you for your business!" />
      </form>
    </Modal>
  );
};
