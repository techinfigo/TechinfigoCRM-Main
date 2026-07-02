
import React, { useState, useEffect, useRef } from 'react';
import { Expense, Project, ExpenseCategory, expenseCategories, AppSettings } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Select } from '../common/Select';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  expense: Expense | null;
  projects: Project[]; // To link expense to a project
  appSettings: AppSettings; // Added to potentially use currency settings
  onSetDirty: (isDirty: boolean) => void;
}

interface ExpenseFormData {
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: string; // Stored as string for input, converted to number on save
  projectId?: string;
  vendor?: string;
  receiptUrl?: string;
  currency: string;
}

const initialFormData: ExpenseFormData = {
  date: new Date().toISOString().split('T')[0],
  category: 'Other',
  description: '',
  amount: '',
  projectId: '',
  vendor: '',
  receiptUrl: '',
  currency: 'INR',
};

interface ExpenseFormErrors {
  date?: string;
  category?: string;
  description?: string;
  amount?: string;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ isOpen, onClose, onSave, expense, projects, appSettings, onSetDirty }) => {
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [errors, setErrors] = useState<ExpenseFormErrors>({});
  const initialFormStateRef = useRef<ExpenseFormData | null>(null);


  useEffect(() => {
    if (isOpen) {
        // Define a safe, unified initial state for both new and existing expenses
        const initialState: ExpenseFormData = {
          date: (expense?.date ?? new Date().toISOString()).split('T')[0],
          category: expense?.category ?? 'Other',
          description: expense?.description ?? '',
          amount: (expense?.amount ?? '').toString(),
          projectId: expense?.projectId ?? '',
          vendor: expense?.vendor ?? '',
          receiptUrl: expense?.receiptUrl ?? '',
          currency: expense?.currency || appSettings.defaultCurrency || 'INR',
        };
        
        setFormData(initialState);
        initialFormStateRef.current = JSON.parse(JSON.stringify(initialState));
        onSetDirty(false);
        setErrors({});
    }
  }, [expense, isOpen, appSettings.defaultCurrency, onSetDirty]);

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
    if (errors[name as keyof ExpenseFormErrors]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: ExpenseFormErrors = {};
    if (!formData.date) newErrors.date = "Date is required.";
    if (!formData.category) newErrors.category = "Category is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
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
    
    const expenseToSave: Expense = {
      id: expense?.id || '', // ID will be set by App.tsx for new expenses
      ...formData,
      amount: parseFloat(formData.amount),
      projectId: formData.projectId === '' ? undefined : formData.projectId,
    };
    onSave(expenseToSave);
    onSetDirty(false);
  };

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('crm_custom_expense_categories');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.from(new Set([...expenseCategories, ...parsed]));
    } catch (e) {
      return [...expenseCategories];
    }
  });

  const categoryOptions = categories.map(cat => ({ value: cat, label: cat }));

  const currencyOptions = [
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

  const projectOptions = [
    { value: '', label: 'None' },
    ...projects.map(p => ({ value: p.id, label: p.name })),
  ];

  const handleCategoryChange = (val: string) => {
    setFormData(prev => ({ ...prev, category: val as ExpenseCategory }));
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: undefined }));
    }
  };

  const handleCurrencyChange = (val: string) => {
    setFormData(prev => ({ ...prev, currency: val }));
  };

  const handleProjectChange = (val: string) => {
    setFormData(prev => ({ ...prev, projectId: val }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? 'Edit Expense' : 'Add New Expense'}
      size="3xl" 
      overrideZIndex="z-[1050]"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">
            {expense ? 'Save Changes' : 'Add Expense'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Date *" id="date" name="date" type="date" value={formData.date} onChange={handleChange} error={errors.date} required />
            <Select 
              label="Category *" 
              options={categoryOptions} 
              value={formData.category} 
              onChange={handleCategoryChange} 
              error={errors.category}
            />
        </div>
        
        <TextArea label="Description *" id="description" name="description" value={formData.description} onChange={handleChange} error={errors.description} rows={3} required />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 [&_input::-webkit-outer-spin-button]:appearance-none [&_input::-webkit-inner-spin-button]:appearance-none [&_input]:[-moz-appearance:textfield]">
            <Select 
              label="Currency" 
              options={currencyOptions} 
              value={formData.currency} 
              onChange={handleCurrencyChange}
              direction="up"
            />
            <Input label={`Amount * (${formData.currency})`} id="amount" name="amount" type="number" placeholder="0.00" value={formData.amount} onChange={handleChange} error={errors.amount} min="0.01" step="0.01" required />
            <Select 
              label="Link to Project (Optional)" 
              options={projectOptions} 
              value={formData.projectId || ''} 
              onChange={handleProjectChange}
              searchable={projects.length > 5}
              searchPlaceholder="Search projects..."
              direction="up"
            />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Vendor (Optional)" id="vendor" name="vendor" value={formData.vendor || ''} onChange={handleChange} placeholder="e.g., Amazon, Google Ads" />
            <Input label="Receipt URL (Optional, Conceptual)" id="receiptUrl" name="receiptUrl" type="url" value={formData.receiptUrl || ''} onChange={handleChange} placeholder="https://link.to/receipt.pdf" />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Receipt URL is conceptual. Actual file uploads would require backend storage.</p>
      </form>
    </Modal>
  );
};
