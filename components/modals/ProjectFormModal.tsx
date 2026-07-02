
import React, { useState, useEffect, useRef } from 'react';
import { Project, Client, TeamMember, ProjectStatus, projectStatuses, ProjectPriority, projectPriorities, ProjectHealth, projectHealths, BillingModel, billingModels, CustomField } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { DynamicFormFields } from '@/components/forms/DynamicFormFields';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  project: Project | null;
  clients: Client[];
  teamMembers: TeamMember[];
  onSetDirty: (isDirty: boolean) => void;
  customFields: CustomField[];
}

interface ProjectFormData {
  name: string;
  clientId: string;
  projectCode: string;
  type: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  health: ProjectHealth;
  managerId: string;
  teamIds: string[];
  startDate: string;
  dueDate?: string;
  budgetPlanned?: string; 
  billingModel: BillingModel;
  tags?: string;
  customFieldValues: { [key: string]: any };
}

type ProjectTemplate = 'SEO' | 'Ads' | 'Website' | 'Creative Shoot' | 'Custom';

const initialFormData: ProjectFormData = {
  name: '',
  clientId: '',
  projectCode: '',
  type: 'Custom',
  description: '',
  status: 'Backlog',
  priority: 'Medium',
  health: 'On Track',
  managerId: '',
  teamIds: [],
  startDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  budgetPlanned: '',
  billingModel: 'Fixed',
  tags: '',
  customFieldValues: {},
};

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ isOpen, onClose, onSave, project, clients, teamMembers, onSetDirty, customFields }) => {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});
  const initialFormStateRef = useRef<ProjectFormData | null>(null);

  useEffect(() => {
    if (isOpen) {
        let currentInitialState: ProjectFormData;
        if (project) {
          currentInitialState = {
            name: project.name,
            clientId: project.clientId,
            projectCode: project.projectCode,
            type: project.type,
            description: project.description || '',
            status: project.status,
            priority: project.priority,
            health: project.health,
            managerId: project.managerId,
            teamIds: project.teamIds || [],
            startDate: (project.startDate ?? '').split('T')[0],
            dueDate: (project.dueDate ?? '').split('T')[0],
            budgetPlanned: (project.budget?.planned ?? '').toString(),
            billingModel: project.billingModel,
            tags: (project.tags || []).join(', '),
            customFieldValues: project.customFieldValues || {},
          };
        } else {
          currentInitialState = {
            ...initialFormData,
            clientId: clients.length > 0 ? clients[0].id : '',
            startDate: new Date().toISOString().split('T')[0],
            projectCode: `PROJ-${Math.floor(Date.now() / 10000)}`,
            customFieldValues: customFields
              .filter(cf => cf.modules.includes('Projects'))
              .reduce((acc, field) => {
                  acc[field.id] = field.defaultValue ?? '';
                  if (field.type === 'Checkbox' && field.defaultValue === undefined) { acc[field.id] = false; }
                  return acc;
              }, {} as { [key: string]: any }),
          };
        }
        setFormData(currentInitialState);
        initialFormStateRef.current = JSON.parse(JSON.stringify(currentInitialState));
        onSetDirty(false);
        setErrors({});
    }
  }, [project, isOpen, clients, customFields, onSetDirty]);

  const handleTemplateChange = (template: ProjectTemplate) => {
      setFormData(prev => ({
          ...prev,
          type: template,
          description: template === 'SEO' ? 'Standard SEO optimization project for 3 months.' : 
                       template === 'Website' ? 'Complete website design and development project.' : 
                       prev.description
      }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setFormData(prev => ({ ...prev, teamIds: selectedValues }));
  };
  
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Project name is required.";
    if (!formData.clientId) newErrors.clientId = "Client is required.";
    if (!formData.managerId) newErrors.managerId = "A project manager must be assigned.";
    if (formData.dueDate && new Date(formData.dueDate) < new Date(formData.startDate)) {
      newErrors.dueDate = "Due date cannot be before start date.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const projectToSave: Project = {
      ...(project || { 
        id: '', createdAt: new Date().toISOString(), dateAdded: new Date().toISOString(), 
        clientName: clients.find(c => c.id === formData.clientId)?.name || '',
        tasks: [], milestones: [] 
      }),
      ...formData,
      teamIds: formData.teamIds,
      assignedMemberIds: formData.teamIds, // For backward compatibility
      budget: {
          planned: parseFloat(formData.budgetPlanned || '0'),
          actual: project?.budget?.actual || 0,
          currency: 'INR'
      },
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      updatedAt: new Date().toISOString(),
    };
    onSave(projectToSave);
  };
  
  const selectBaseClass = "w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-secondary-accent dark:focus:ring-secondary-accent focus:border-secondary-accent dark:focus:border-secondary-accent text-slate-900 dark:text-slate-100";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project ? 'Edit Project' : 'Create New Project'} size="4xl" overrideZIndex="z-[1050]"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">{project ? 'Save Changes' : 'Create Project'}</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label htmlFor="template" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start from a Template</label>
            <select id="template" onChange={e => handleTemplateChange(e.target.value as ProjectTemplate)} className={selectBaseClass}>
                <option value="Custom">Custom Project</option>
                <option value="SEO">SEO Template</option>
                <option value="Ads">Ads Campaign Template</option>
                <option value="Website">Website Development Template</option>
                <option value="Creative Shoot">Creative Shoot Template</option>
            </select>
        </div>
        <Input label="Project Name *" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Project Code" name="projectCode" value={formData.projectCode} onChange={handleChange} />
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Client *</label>
              <select name="clientId" value={formData.clientId} onChange={handleChange} className={`${selectBaseClass}`} required>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
        </div>
        <TextArea label="Description" name="description" value={formData.description || ''} onChange={handleChange} rows={3} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label><select name="status" value={formData.status} onChange={handleChange} className={selectBaseClass}>{projectStatuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label><select name="priority" value={formData.priority} onChange={handleChange} className={selectBaseClass}>{projectPriorities.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Health</label><select name="health" value={formData.health} onChange={handleChange} className={selectBaseClass}>{projectHealths.map(h => <option key={h} value={h}>{h}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Start Date *" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required/>
            <Input label="Due Date" name="dueDate" type="date" value={formData.dueDate || ''} onChange={handleChange} error={errors.dueDate}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Planned Budget (INR)" name="budgetPlanned" type="number" value={formData.budgetPlanned || ''} onChange={handleChange} />
            <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Billing Model</label><select name="billingModel" value={formData.billingModel} onChange={handleChange} className={selectBaseClass}>{billingModels.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
        </div>
         <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project Manager *</label>
            <select name="managerId" value={formData.managerId} onChange={handleChange} className={`${selectBaseClass} ${errors.managerId ? 'border-red-500' : ''}`} required>
                <option value="">Select a Manager</option>
                {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
            </select>
             {errors.managerId && <p className="mt-1 text-xs text-red-600">{errors.managerId}</p>}
        </div>
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Team Members</label>
            <select multiple name="teamIds" value={formData.teamIds} onChange={handleMultiSelectChange} className={`${selectBaseClass} h-32`}>
                {teamMembers.map(tm => <option key={tm.id} value={tm.id}>{tm.name}</option>)}
            </select>
             <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Hold Ctrl (or Cmd on Mac) to select multiple members.</p>
        </div>
        <Input label="Tags (comma-separated)" name="tags" value={formData.tags || ''} onChange={handleChange} />
        <DynamicFormFields module="Projects" customFields={customFields} values={formData.customFieldValues} onChange={() => {}}/>
      </form>
    </Modal>
  );
};
