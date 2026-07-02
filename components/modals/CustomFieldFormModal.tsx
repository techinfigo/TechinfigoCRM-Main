

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Checkbox } from '../common/Checkbox';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { CustomField, CustomFieldModule, customFieldModules, CustomFieldType } from '../../types';

interface CustomFieldFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: CustomField) => void;
  fieldToEdit: CustomField | null;
}

const fieldTypes: CustomFieldType[] = ['Text', 'Number', 'Date', 'Dropdown', 'Checkbox', 'URL', 'Email'];

export const CustomFieldFormModal: React.FC<CustomFieldFormModalProps> = ({ isOpen, onClose, onSave, fieldToEdit }) => {
    const [label, setLabel] = useState('');
    const [type, setType] = useState<CustomFieldType>('Text');
    const [modules, setModules] = useState<Set<CustomFieldModule>>(new Set());
    const [isRequired, setIsRequired] = useState(false);
    const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
    const [options, setOptions] = useState('');
    const [defaultValue, setDefaultValue] = useState('');
    const [validation, setValidation] = useState({ min: '', max: '', regex: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (fieldToEdit) {
                setLabel(fieldToEdit.label);
                setType(fieldToEdit.type);
                setModules(new Set(fieldToEdit.modules));
                setIsRequired(fieldToEdit.isRequired);
                setStatus(fieldToEdit.status);
                setOptions(fieldToEdit.options?.join('\n') || '');
                setDefaultValue(fieldToEdit.defaultValue || '');
                setValidation({
                    min: fieldToEdit.validation?.min?.toString() || '',
                    max: fieldToEdit.validation?.max?.toString() || '',
                    regex: fieldToEdit.validation?.regex || '',
                });
            } else {
                // Reset to default for new field
                setLabel('');
                setType('Text');
                setModules(new Set());
                setIsRequired(false);
                setStatus('Active');
                setOptions('');
                setDefaultValue('');
                setValidation({ min: '', max: '', regex: '' });
            }
            setErrors({});
        }
    }, [isOpen, fieldToEdit]);

    const handleModuleToggle = (module: CustomFieldModule) => {
        setModules(prev => {
            const next = new Set(prev);
            if (next.has(module)) next.delete(module);
            else next.add(module);
            return next;
        });
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!label.trim()) newErrors.label = 'Field Label is required.';
        if (modules.size === 0) newErrors.modules = 'At least one module must be selected.';
        if (type === 'Dropdown' && !options.trim()) newErrors.options = 'Dropdown options are required for this field type.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        
        const finalValidation = {
            min: validation.min ? parseInt(validation.min, 10) : undefined,
            max: validation.max ? parseInt(validation.max, 10) : undefined,
            regex: validation.regex || undefined,
        };

        const finalField: CustomField = {
            id: fieldToEdit?.id || '', // ID will be set by parent for new fields
            label,
            type,
            modules: Array.from(modules),
            isRequired,
            status,
            defaultValue: defaultValue || undefined,
            options: type === 'Dropdown' ? options.split('\n').map(opt => opt.trim()).filter(Boolean) : undefined,
            validation: Object.values(finalValidation).some(v => v !== undefined) ? finalValidation : undefined,
        };
        
        onSave(finalField);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={fieldToEdit ? 'Edit Custom Field' : 'Add Custom Field'}
            size="2xl"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Save Field</Button>
                </>
            }
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-2">
                <Input label="Field Label *" id="label" value={label} onChange={e => setLabel(e.target.value)} error={errors.label} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">Field Type</label>
                        <select id="type" value={type} onChange={e => setType(e.target.value as CustomFieldType)} className="w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm">
                            {fieldTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">Status</label>
                        <ToggleSwitch id="status" label={status} checked={status === 'Active'} onChange={c => setStatus(c ? 'Active' : 'Inactive')} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-text-muted dark:text-text-muted mb-2">Assign to Module(s) *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-md border border-border-base dark:border-border-muted">
                        {customFieldModules.map(mod => (
                            <Checkbox key={mod} id={`mod-${mod}`} label={mod} checked={modules.has(mod)} onChange={() => handleModuleToggle(mod)} />
                        ))}
                    </div>
                     {errors.modules && <p className="mt-1 text-xs text-status-negative">{errors.modules}</p>}
                </div>

                {type === 'Dropdown' && (
                    <TextArea label="Dropdown Options *" value={options} onChange={e => setOptions(e.target.value)} error={errors.options} rows={4} description="Enter one option per line." />
                )}
                
                <Input label="Default Value (Optional)" id="defaultValue" value={defaultValue} onChange={e => setDefaultValue(e.target.value)} />

                <ToggleSwitch id="isRequired" label="This field is required" checked={isRequired} onChange={setIsRequired} />

                <div>
                    <h4 className="text-md font-semibold text-text-base dark:text-text-base mt-4 pt-4 border-t border-border-muted dark:border-slate-700">Validation Rules (Optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <Input label="Min Length/Value" type="number" value={validation.min} onChange={e => setValidation(p => ({...p, min: e.target.value}))}/>
                        <Input label="Max Length/Value" type="number" value={validation.max} onChange={e => setValidation(p => ({...p, max: e.target.value}))}/>
                        <Input label="Regex Pattern" value={validation.regex} onChange={e => setValidation(p => ({...p, regex: e.target.value}))} containerClassName="md:col-span-2"/>
                    </div>
                </div>
            </div>
        </Modal>
    );
};