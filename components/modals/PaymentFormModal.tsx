
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Invoice, Payment, PaymentMethod, AppSettings, calculateInvoiceGrandTotal } from '../../types';

export interface PaymentFormData {
  invoiceId: string;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (paymentData: PaymentFormData) => void;
  invoices: Invoice[];
  appSettings: AppSettings;
  onSetDirty: (isDirty: boolean) => void;
  prefillInvoiceId?: string;
  payment?: Payment | null; // Added for editing
}

const paymentMethods: PaymentMethod[] = ['Bank Transfer', 'Credit Card', 'Cash', 'Other'];

const initialFormData: PaymentFormData = {
  invoiceId: '',
  amount: '',
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: 'Bank Transfer',
  notes: '',
};

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  isOpen, onClose, onSave, invoices, appSettings, onSetDirty, prefillInvoiceId, payment
}) => {
  const [formData, setFormData] = useState<PaymentFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});
  const initialFormStateRef = useRef<PaymentFormData | null>(null);

  const payableInvoices = invoices.filter(inv => inv.status === 'Sent' || inv.status === 'Overdue' || inv.status === 'Paid');

  useEffect(() => {
    if (isOpen) {
      let initialState: PaymentFormData;
      
      if (payment) { // Editing existing payment
        initialState = {
          invoiceId: payment.invoiceId,
          amount: (payment.amount ?? '').toString(),
          paymentDate: (payment.paymentDate ?? '').split('T')[0],
          paymentMethod: payment.paymentMethod ?? 'Bank Transfer',
          notes: payment.notes ?? '',
        };
      } else { // Creating new payment
        initialState = {
          invoiceId: prefillInvoiceId ?? (payableInvoices.length > 0 ? payableInvoices[0].id : ''),
          amount: '',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Bank Transfer',
          notes: '',
        };
      }
      
      setFormData(initialState);
      initialFormStateRef.current = JSON.parse(JSON.stringify(initialState));
      onSetDirty(false);
      setErrors({});
    }
  }, [isOpen, payment, invoices, prefillInvoiceId, onSetDirty]);


  useEffect(() => {
    if (!isOpen) return;
    if (JSON.stringify(formData) !== JSON.stringify(initialFormStateRef.current)) {
      onSetDirty(true);
    } else {
      onSetDirty(false);
    }
  }, [formData, isOpen, onSetDirty]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof PaymentFormData]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};
    if (!formData.invoiceId) newErrors.invoiceId = "Invoice selection is required.";
    if (!formData.paymentDate) newErrors.paymentDate = "Payment date is required.";
    if (!formData.amount.trim()) {
        newErrors.amount = "Amount is required.";
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
        newErrors.amount = "Amount must be a positive number.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(formData);
    onSetDirty(false);
  };
  
  const selectBaseClass = "w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-text-base dark:text-text-base";

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currencyCode }).format(amount);
  };
  
  const selectedInvoice = invoices.find(inv => inv.id === formData.invoiceId);
  const displayCurrency = selectedInvoice?.currency || appSettings.defaultCurrency || 'INR';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">
            Save Payment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="invoiceId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Invoice *</label>
          <select 
            id="invoiceId" 
            name="invoiceId" 
            value={formData.invoiceId} 
            onChange={handleChange} 
            className={`${selectBaseClass} ${errors.invoiceId ? 'border-red-500' : ''}`}
            required
          >
            <option value="" disabled>Select an invoice</option>
            {payableInvoices.map(inv => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} - {inv.clientName} ({formatCurrency(calculateInvoiceGrandTotal(inv), inv.currency || appSettings.defaultCurrency || 'INR')}) - {inv.status}
              </option>
            ))}
          </select>
          {errors.invoiceId && <p className="mt-1 text-xs text-red-600">{errors.invoiceId}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label={`Amount (${displayCurrency}) *`}
            id="amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            error={errors.amount}
            min="0.01"
            step="0.01"
            required
          />
          <Input 
            label="Payment Date *"
            id="paymentDate"
            name="paymentDate"
            type="date"
            value={formData.paymentDate}
            onChange={handleChange}
            error={errors.paymentDate}
            required
          />
        </div>
        
        <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Method *</label>
            <select
                id="paymentMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className={selectBaseClass}
                required
            >
                {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                ))}
            </select>
        </div>

        <TextArea 
            label="Notes (Optional)"
            id="notes"
            name="notes"
            value={formData.notes || ''}
            onChange={handleChange}
            rows={2}
            placeholder="e.g., Transaction ID, part payment details..."
        />
      </form>
    </Modal>
  );
};
