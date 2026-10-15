import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Project, Client, TeamMember, ProjectStatus, projectStatuses, ProjectPriority, projectPriorities, ProjectHealth, projectHealths, BillingModel, billingModels, CustomField, ClientPlanItem, AgreedService } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { DynamicFormFields } from '@/components/forms/DynamicFormFields';
import { ChevronDown, ListChecks } from 'lucide-react';
import {
  PROJECT_TEMPLATES,
  TemplateKey,
  addDays,
  billingForService,
  buildSocialPlans,
  buildTemplateWork,
  templateByKey,
  templateForService,
} from '@/components/projects/projectTemplates';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  project: Project | null;
  clients: Client[];
  teamMembers: TeamMember[];
  onSetDirty: (isDirty: boolean) => void;
  customFields: CustomField[];
  /** Opened from a client's page: that client is picked. */
  prefillClientId?: string;
  /** Default project manager / task owner (the signed-in user). */
  currentUserId?: string;
  /** Social media template can drop post/reel placeholders into the client Calendar. */
  onAddClientPlans?: (items: ClientPlanItem[]) => void;
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

const todayDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const initialFormData: ProjectFormData = {
  name: '',
  clientId: '',
  projectCode: '',
  type: 'Custom',
  description: '',
  status: 'In Progress',
  priority: 'Medium',
  health: 'On Track',
  managerId: '',
  teamIds: [],
  startDate: todayDay(),
  dueDate: '',
  budgetPlanned: '',
  billingModel: 'Fixed',
  tags: '',
  customFieldValues: {},
};

const clientLabel = (c?: Client) => (c ? c.companyName || c.name : '');
const niceDay = (day: string) => new Date(`${day}T00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  project,
  clients,
  teamMembers,
  onSetDirty,
  customFields,
  prefillClientId,
  currentUserId,
  onAddClientPlans,
}) => {
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectFormData, string>>>({});
  const [template, setTemplate] = useState<TemplateKey>('Custom');
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [dueTouched, setDueTouched] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [addPlans, setAddPlans] = useState(true);
  const initialFormStateRef = useRef<ProjectFormData | null>(null);
  const isNew = !project;

  const client = clients.find((c) => c.id === formData.clientId);
  const services: AgreedService[] = client?.agreedServices || [];

  /** Fill name, dates, billing, budget and description from a template (+ optional agreed service). */
  const applyTemplate = (key: TemplateKey, base: ProjectFormData, svc?: AgreedService, opts?: { keepName?: boolean; keepDue?: boolean }): ProjectFormData => {
    const t = templateByKey(key);
    const c = clients.find((x) => x.id === base.clientId);
    const what = svc?.name || (key === 'Custom' ? '' : t.type);
    return {
      ...base,
      type: t.type,
      name: opts?.keepName ? base.name : [clientLabel(c), what].filter(Boolean).join(' – '),
      dueDate: opts?.keepDue ? base.dueDate : t.days ? addDays(base.startDate, t.days) : base.dueDate,
      billingModel: billingForService(svc) || (key === 'Custom' ? base.billingModel : t.billing),
      budgetPlanned: svc ? String(svc.cost || '') : base.budgetPlanned,
      description: t.description || base.description,
    };
  };

  useEffect(() => {
    if (!isOpen) return;
    let state: ProjectFormData;
    if (project) {
      state = {
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
      setTemplate('Custom');
    } else {
      const clientId = (prefillClientId && clients.some((c) => c.id === prefillClientId) ? prefillClientId : clients[0]?.id) || '';
      const manager = (currentUserId && teamMembers.some((m) => m.id === currentUserId) ? currentUserId : teamMembers[0]?.id) || '';
      state = {
        ...initialFormData,
        clientId,
        managerId: manager,
        teamIds: manager ? [manager] : [],
        startDate: todayDay(),
        projectCode: `PROJ-${Math.floor(Date.now() / 10000)}`,
        customFieldValues: customFields
          .filter((cf) => cf.modules.includes('Projects'))
          .reduce((acc, field) => {
            acc[field.id] = field.defaultValue ?? '';
            if (field.type === 'Checkbox' && field.defaultValue === undefined) acc[field.id] = false;
            return acc;
          }, {} as { [key: string]: any }),
      };
      // From a client page: start with their first agreed service, if any.
      const svc = clients.find((c) => c.id === clientId)?.agreedServices?.[0];
      const key = templateForService(svc);
      if (prefillClientId && svc) {
        state = applyTemplate(key, state, svc);
        setServiceId(svc.id);
      } else {
        setServiceId(null);
      }
      setTemplate(prefillClientId && svc ? key : 'Custom');
    }
    setNameTouched(false);
    setDueTouched(false);
    setShowMore(false);
    setAddPlans(true);
    setFormData(state);
    initialFormStateRef.current = JSON.parse(JSON.stringify(state));
    onSetDirty(false);
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, isOpen]);

  const pickTemplate = (key: TemplateKey) => {
    setTemplate(key);
    setServiceId(null);
    setFormData((prev) => applyTemplate(key, prev, undefined, { keepName: nameTouched, keepDue: dueTouched }));
  };

  const pickService = (svc: AgreedService) => {
    const key = templateForService(svc);
    setTemplate(key);
    setServiceId(svc.id);
    setFormData((prev) => applyTemplate(key, prev, svc, { keepName: nameTouched, keepDue: dueTouched }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'name') setNameTouched(true);
    if (name === 'dueDate') setDueTouched(true);
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (isNew && name === 'clientId') {
        // New client picked: rename (unless typed) and forget the old client's service.
        setServiceId(null);
        return applyTemplate(template, next, undefined, { keepName: nameTouched, keepDue: true });
      }
      if (isNew && name === 'startDate' && !dueTouched && templateByKey(template).days) {
        next.dueDate = addDays(value, templateByKey(template).days);
      }
      return next;
    });
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValues = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
    setFormData((prev) => ({ ...prev, teamIds: selectedValues }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProjectFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required.';
    if (!formData.clientId) newErrors.clientId = 'Client is required.';
    if (!formData.managerId) newErrors.managerId = 'A project manager must be assigned.';
    if (formData.dueDate && new Date(formData.dueDate) < new Date(formData.startDate)) {
      newErrors.dueDate = 'Due date cannot be before start date.';
    }
    setErrors(newErrors);
    if (newErrors.managerId) setShowMore(true);
    return Object.keys(newErrors).length === 0;
  };

  const tpl = templateByKey(template);
  const willCreate = isNew && tpl.steps.length > 0;
  const preview = useMemo(
    () => (willCreate ? tpl.steps.map((s) => ({ title: s.title, day: addDays(formData.startDate || todayDay(), s.day) })) : []),
    [willCreate, tpl, formData.startDate],
  );
  const socialPlans = isNew && template === 'Social' && formData.clientId ? buildSocialPlans(formData.clientId, formData.startDate || todayDay()) : [];
  const postCount = socialPlans.filter((p) => p.kind === 'Post').length;
  const reelCount = socialPlans.length - postCount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const id = project?.id || `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const owner = teamMembers.find((m) => m.id === formData.managerId);
    const work = willCreate
      ? buildTemplateWork(tpl, { projectId: id, projectName: formData.name.trim(), startDay: formData.startDate, assigneeId: owner?.id, assigneeName: owner?.name })
      : null;
    const projectToSave: Project = {
      ...(project || {
        id,
        createdAt: new Date().toISOString(),
        dateAdded: new Date().toISOString(),
        tasks: [],
        milestones: [],
        connectors: {},
      }),
      ...formData,
      id,
      name: formData.name.trim(),
      clientName: clients.find((c) => c.id === formData.clientId)?.name || project?.clientName || '',
      teamIds: formData.teamIds,
      assignedMemberIds: formData.teamIds, // For backward compatibility
      budget: {
        planned: parseFloat(formData.budgetPlanned || '0'),
        actual: project?.budget?.actual || 0,
        currency: 'INR',
      },
      tags: formData.tags ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
      updatedAt: new Date().toISOString(),
      ...(work ? { tasks: work.tasks, milestones: work.milestones } : {}),
    };
    if (socialPlans.length && addPlans && onAddClientPlans) onAddClientPlans(socialPlans);
    onSave(projectToSave);
  };

  const selectBaseClass =
    'w-full p-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-secondary-accent dark:focus:ring-secondary-accent focus:border-secondary-accent dark:focus:border-secondary-accent text-slate-900 dark:text-slate-100';
  const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';
  const chip = (on: boolean) =>
    `flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold text-left transition-colors ${
      on
        ? 'border-secondary-accent bg-amber-50 text-slate-900 dark:bg-amber-400/15 dark:text-amber-200 ring-1 ring-secondary-accent'
        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-400'
    }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={project ? 'Edit Project' : client && prefillClientId ? `New project for ${clientLabel(client)}` : 'Create New Project'}
      size="3xl"
      overrideZIndex="z-[1050]"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">
            {project ? 'Save Changes' : 'Create Project'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isNew && (
          <div>
            <p className={labelClass}>What are we doing?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROJECT_TEMPLATES.map((t) => (
                <button key={t.key} type="button" onClick={() => pickTemplate(t.key)} className={chip(template === t.key)}>
                  <span className="text-base">{t.emoji}</span>
                  <span className="leading-tight">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="clientId" className={labelClass}>
              Client *
            </label>
            <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} className={`${selectBaseClass} ${errors.clientId ? 'border-red-500' : ''}`} required>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {clientLabel(c)}
                  {c.companyName && c.name !== c.companyName ? ` (${c.name})` : ''}
                </option>
              ))}
            </select>
            {errors.clientId && <p className="mt-1 text-xs text-red-600">{errors.clientId}</p>}
          </div>
          <Input label="Project Name *" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
        </div>

        {isNew && services.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">From {clientLabel(client)}'s agreed services (fills price and billing):</p>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pickService(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    serviceId === s.id
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-amber-400 dark:text-slate-900 dark:border-amber-400'
                      : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {s.name} · ₹{Number(s.cost || 0).toLocaleString('en-IN')}
                  {s.billingType === 'One-Time' ? '' : `/${s.billingType === 'Monthly' ? 'month' : s.billingType.toLowerCase()}`}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input label="Start Date *" name="startDate" type="date" value={formData.startDate} onChange={handleChange} required />
          <Input label="Due Date" name="dueDate" type="date" value={formData.dueDate || ''} onChange={handleChange} error={errors.dueDate} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Price / Budget (₹)" name="budgetPlanned" type="number" value={formData.budgetPlanned || ''} onChange={handleChange} />
          <div>
            <label className={labelClass}>Billing</label>
            <select name="billingModel" value={formData.billingModel} onChange={handleChange} className={selectBaseClass}>
              {billingModels.map((b) => (
                <option key={b} value={b}>
                  {b === 'Fixed' ? 'Fixed (one-time)' : b === 'Retainer' ? 'Retainer (monthly)' : b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {willCreate && (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-900/20 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              <ListChecks className="w-4 h-4" /> Will create {preview.length} tasks{tpl.milestones.length ? ` and ${tpl.milestones.length} milestones` : ''}
            </p>
            <ul className="mt-2 space-y-1 max-h-44 overflow-y-auto pr-1">
              {preview.map((p, i) => (
                <li key={i} className="flex gap-3 text-xs text-slate-700 dark:text-slate-300">
                  <span className="w-14 shrink-0 font-semibold text-slate-500 dark:text-slate-400">{niceDay(p.day)}</span>
                  <span>{p.title}</span>
                </li>
              ))}
            </ul>
            {socialPlans.length > 0 && onAddClientPlans && (
              <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <input type="checkbox" className="mt-0.5" checked={addPlans} onChange={(e) => setAddPlans(e.target.checked)} />
                Also add {postCount} posts + {reelCount} reels (Mon/Wed/Fri posts, Saturday reels) to {clientLabel(client)}'s Calendar as ideas
              </label>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowMore((s) => !s)}
          className="flex items-center gap-1 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          {showMore ? 'Fewer options' : 'More options (description, status, team, tags…)'}
        </button>

        {showMore && (
          <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <TextArea label="Description" name="description" value={formData.description || ''} onChange={handleChange} rows={3} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className={selectBaseClass}>
                  {projectStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} className={selectBaseClass}>
                  {projectPriorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Health</label>
                <select name="health" value={formData.health} onChange={handleChange} className={selectBaseClass}>
                  {projectHealths.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Project Manager *</label>
                <select name="managerId" value={formData.managerId} onChange={handleChange} className={`${selectBaseClass} ${errors.managerId ? 'border-red-500' : ''}`} required>
                  <option value="">Select a Manager</option>
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name}
                    </option>
                  ))}
                </select>
                {errors.managerId && <p className="mt-1 text-xs text-red-600">{errors.managerId}</p>}
              </div>
              <Input label="Project Code" name="projectCode" value={formData.projectCode} onChange={handleChange} />
            </div>
            <div>
              <label className={labelClass}>Team Members</label>
              <select multiple name="teamIds" value={formData.teamIds} onChange={handleMultiSelectChange} className={`${selectBaseClass} h-28`}>
                {teamMembers.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Hold Ctrl (or Cmd on Mac) to select multiple members.</p>
            </div>
            <Input label="Tags (comma-separated)" name="tags" value={formData.tags || ''} onChange={handleChange} />
            <DynamicFormFields module="Projects" customFields={customFields} values={formData.customFieldValues} onChange={() => {}} />
          </div>
        )}
      </form>
    </Modal>
  );
};
