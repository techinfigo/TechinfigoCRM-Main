
import React from 'react';
import { CustomField, CustomFieldType, CustomFieldModule } from '../../types';
import { Input, TextArea } from '../common/Input';
import { Checkbox } from '../common/Checkbox';

interface DynamicFormFieldsProps {
  module: CustomFieldModule;
  customFields: CustomField[];
  values: { [key: string]: any };
  onChange: (fieldId: string, value: any) => void;
  errors?: { [key: string]: string };
}

export const DynamicFormFields: React.FC<DynamicFormFieldsProps> = ({
  module,
  customFields,
  values,
  onChange,
  errors = {},
}) => {
  const fieldsForModule = customFields.filter(field => field.modules.includes(module) && field.status === 'Active');

  if (fieldsForModule.length === 0) {
    return null;
  }

  return (
    <div className="pt-4 mt-4 border-t border-border-base dark:border-border-muted">
      <h4 className="text-md font-semibold text-text-base dark:text-text-base mb-3">Custom Fields</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldsForModule.map(field => {
          const fieldId = field.id;
          const error = errors[fieldId];
          const commonProps = {
            label: `${field.label}${field.isRequired ? ' *' : ''}`,
            id: fieldId,
            name: fieldId,
            value: values[fieldId] ?? '',
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
              const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
              onChange(fieldId, value);
            },
            error: error,
            required: field.isRequired,
          };

          switch (field.type) {
            case 'Text':
            case 'Number':
            case 'URL':
            case 'Email':
              return <Input key={fieldId} {...commonProps} type={field.type.toLowerCase() as 'text' | 'number' | 'url' | 'email'} />;
            
            case 'Date':
              return <Input key={fieldId} {...commonProps} type="date" />;

            case 'Dropdown':
            case 'Multi-select': // Multi-select renders as a dropdown for now. A more complex component could be used.
              return (
                <div key={fieldId}>
                  <label htmlFor={fieldId} className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1">{commonProps.label}</label>
                  <select
                    {...commonProps}
                    value={values[fieldId] ?? (field.defaultValue || '')} // Ensure default value is handled
                    className={`block w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-premium-accent ${error ? 'border-status-negative' : ''}`}
                  >
                    <option value="">-- Select an option --</option>
                    {field.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {error && <p className="mt-1.5 text-xs text-status-negative">{error}</p>}
                </div>
              );

            case 'Checkbox':
              return (
                <div key={fieldId} className="flex items-center pt-5">
                   <Checkbox
                        id={fieldId}
                        name={fieldId}
                        checked={!!values[fieldId]}
                        onChange={(e) => onChange(fieldId, e.target.checked)}
                        label={commonProps.label}
                    />
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};
