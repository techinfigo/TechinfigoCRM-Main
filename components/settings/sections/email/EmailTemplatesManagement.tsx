

import React, { useState } from 'react';
import { EmailTemplate } from '../../../../types';
import { Card } from '../../../common/Card';
import { Button } from '../../../common/Button';
import { Input, TextArea } from '../../../common/Input';
import { Modal } from '../../../common/Modal';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path d="M11.354 1.646a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708L5.061 13.939a.5.5 0 0 1-.353.146H2.5a.5.5 0 0 1-.5-.5V11.293a.5.5 0 0 1 .146-.353L11.354 1.646ZM12.5 2.5 4.207 10.793V13h2.207L13.5 4.707 12.5 3.707V2.5Z" /><path d="m10.854 3.146 2.292 2.292-8.5 8.5H2.5v-2.292l8.5-8.5Z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5zM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498-.075l-.275-5.5A.75.75 0 0 1 6.05 6zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711z" clipRule="evenodd" /></svg>;


const emptyTemplate: Omit<EmailTemplate, 'id'> = { name: '', subject: '', body: '' };

const TemplateEditor: React.FC<{ 
    template: EmailTemplate | Omit<EmailTemplate, 'id'>; 
    onSave: (template: EmailTemplate | Omit<EmailTemplate, 'id'>) => void; 
    onCancel: () => void;
}> = ({ template, onSave, onCancel }) => {
    const [formData, setFormData] = useState(template);

    const handleSave = () => {
        if (formData.name.trim() && formData.subject.trim()) {
            onSave(formData);
        } else {
            alert('Template Name and Subject are required.');
        }
    };

    return (
        <Card title={'id' in template ? 'Edit Template' : 'Create New Template'} className="bg-bg-base dark:bg-bg-muted mt-4">
            <div className="space-y-4">
                <Input label="Template Name *" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} placeholder="e.g., Welcome Email" />
                <Input label="Subject *" value={formData.subject} onChange={e => setFormData(p => ({...p, subject: e.target.value}))} placeholder="Welcome to {{client_name}}!" />
                <TextArea label="Body (HTML allowed, use {{variable}} for placeholders)" value={formData.body} onChange={e => setFormData(p => ({...p, body: e.target.value}))} rows={8} />
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave}>Save Template</Button>
                </div>
            </div>
        </Card>
    );
};

interface EmailTemplatesManagementProps {
  templates: EmailTemplate[];
  onSaveTemplates: (templates: EmailTemplate[]) => void;
}

export const EmailTemplatesManagement: React.FC<EmailTemplatesManagementProps> = ({ templates, onSaveTemplates }) => {
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSave = (templateToSave: EmailTemplate | Omit<EmailTemplate, 'id'>) => {
    let updatedTemplates: EmailTemplate[];
    if ('id' in templateToSave && templateToSave.id) {
      // Editing existing
      updatedTemplates = templates.map(t => t.id === templateToSave.id ? templateToSave as EmailTemplate : t);
    } else {
      // Creating new
      updatedTemplates = [...templates, { ...templateToSave, id: `et-${Date.now()}` }];
    }
    onSaveTemplates(updatedTemplates);
    setEditingTemplate(null);
    setIsCreating(false);
  };

  const handleDelete = (templateId: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      onSaveTemplates(updatedTemplates);
    }
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsCreating(false);
  };

  if (editingTemplate || isCreating) {
    return (
      <TemplateEditor 
        template={editingTemplate || emptyTemplate}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Card title="Email Templates" actions={<Button onClick={() => setIsCreating(true)} leftIcon={<PlusIcon/>}>Create Template</Button>}>
      <div className="space-y-2">
        {templates.map(template => (
          <div key={template.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
            <div>
              <p className="font-semibold text-text-base dark:text-text-base">{template.name}</p>
              <p className="text-xs text-text-muted dark:text-slate-400">Subject: {template.subject}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" onClick={() => setEditingTemplate(template)}><EditIcon /></Button>
              <Button variant="ghost" size="xs" onClick={() => handleDelete(template.id)} className="text-status-negative"><TrashIcon /></Button>
            </div>
          </div>
        ))}
        {templates.length === 0 && <p className="text-center text-text-muted dark:text-text-muted py-4">No templates created yet.</p>}
      </div>
    </Card>
  );
};
