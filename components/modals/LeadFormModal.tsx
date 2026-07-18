import React, { useState, useEffect, useRef } from 'react';
import { Lead, LeadStatus, leadStatuses, OnboardingInterestLevel, onboardingInterestLevels, CustomField, TeamMember, LeadType, leadTypes } from '../../types';
import { Select } from '../common/Select';
import { SidePanel } from '../common/SidePanel';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { DynamicFormFields } from '@/components/forms/DynamicFormFields';
import { DatePicker } from '../common/DatePicker';


interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Lead) => void;
  lead: Lead | null;
  teamMembers: TeamMember[];
  onSetDirty: (isDirty: boolean) => void;
  customFields: CustomField[];
}

interface LeadFormData {
  // Lead type decides which qualification fields to show
  leadType: LeadType;
  // Vitals
  name: string;
  companyName: string;
  email: string;
  phone?: string;
  website?: string;
  instagramHandle?: string;

  // D2C Qualification
  revenueBand?: string;
  adStatus?: 'Active' | 'Inactive';
  techStack?: string; // Comma-sep string for input

  // Outreach
  outreachAngle?: string;
  offerSent?: string;

  // Agency Insights
  primaryGoal?: string;
  keyCompetitors?: string;
  marketingChannels?: string; // Comma-sep string
  targetAudience?: string;
  brandTone?: string;
  trackingHealth?: 'Verified' | 'Issues Detected' | 'Not Installed' | 'Unknown';
  adLibraryLink?: string;

  // Meta
  source?: string;
  status: LeadStatus;
  assignedToUserId?: string;
  tags?: string;

  // Legacy/Other
  notes?: string;
  lastContactedDate?: string;
  nextFollowUpDateTime?: string;
  customFieldValues: { [key: string]: any };
}

const leadSources = [
  "Inbound (Website)", "Instagram DM", "LinkedIn Outreach", "Cold Email", "Referral", "Ads", "Other"
];

const revenueBands = [
    "<$10k/mo", "$10k - $50k/mo", "$50k - $100k/mo", "$100k+/mo"
];

const initialFormData: LeadFormData = {
  leadType: 'D2C',
  name: '',
  companyName: '',
  email: '',
  phone: '',
  website: '',
  instagramHandle: '',
  revenueBand: '',
  adStatus: 'Inactive',
  techStack: '',
  outreachAngle: '',
  offerSent: '',
  primaryGoal: '',
  keyCompetitors: '',
  marketingChannels: '',
  targetAudience: '',
  brandTone: '',
  trackingHealth: 'Unknown',
  adLibraryLink: '',
  source: '',
  status: 'New Lead',
  assignedToUserId: '',
  tags: '',
  notes: '',
  lastContactedDate: '',
  nextFollowUpDateTime: '',
  customFieldValues: {},
};

// Convert UTC ISO string to "YYYY-MM-DDTHH:mm" for datetime-local input
const toLocalISOString = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
    return localISOTime;
};

export const LeadFormModal: React.FC<LeadFormModalProps> = ({ isOpen, onClose, onSave, lead, teamMembers, onSetDirty, customFields }) => {
  const [formData, setFormData] = useState<LeadFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});
  const initialFormStateRef = useRef<LeadFormData | null>(null);

  const selectableLeadStatuses = leadStatuses;

  useEffect(() => {
    if (isOpen) {
      let currentInitialState: LeadFormData;
      if (lead) {
        currentInitialState = {
          leadType: lead.leadType || 'D2C',
          name: lead.name,
          companyName: lead.companyName || '',
          email: lead.email,
          phone: lead.phone || '',
          website: lead.website || '',
          instagramHandle: lead.instagramHandle || '',

          revenueBand: lead.revenueBand || '',
          adStatus: lead.adStatus || 'Inactive',
          techStack: Array.isArray(lead.techStack) ? lead.techStack.join(', ') : '',

          outreachAngle: lead.outreachAngle || '',
          offerSent: lead.offerSent || '',

          // Agency Insights
          primaryGoal: lead.primaryGoal || '',
          keyCompetitors: lead.keyCompetitors || '',
          marketingChannels: Array.isArray(lead.marketingChannels) ? lead.marketingChannels.join(', ') : '',
          targetAudience: lead.targetAudience || '',
          brandTone: lead.brandTone || '',
          trackingHealth: lead.trackingHealth || 'Unknown',
          adLibraryLink: lead.adLibraryLink || '',

          source: lead.source || '',
          status: lead.status,
          assignedToUserId: lead.assignedToUserId || '',
          tags: Array.isArray(lead.tags) ? lead.tags.join(', ') : '',

          notes: lead.notes || '',
          lastContactedDate: (lead.lastContactedDate ?? '').split('T')[0],
          nextFollowUpDateTime: lead.nextFollowUpDateTime ? toLocalISOString(lead.nextFollowUpDateTime) : '',
          customFieldValues: lead.customFieldValues || {},
        };
      } else {
        // For new leads, default follow-up to tomorrow same time
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const offset = tomorrow.getTimezoneOffset() * 60000;
        const defaultNextFollowUpDateTime = new Date(tomorrow.getTime() - offset).toISOString().slice(0, 16);

        currentInitialState = {
          ...initialFormData,
          status: 'New Lead',
          lastContactedDate: new Date().toISOString().split('T')[0],
          nextFollowUpDateTime: defaultNextFollowUpDateTime,
          customFieldValues: customFields
              .filter(cf => cf.modules.includes('Leads'))
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
      initialFormStateRef.current = JSON.parse(JSON.stringify(currentInitialState));
      onSetDirty(false);
      setErrors({});
    }
  }, [lead, isOpen, onSetDirty, customFields]);

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
    if (errors[name as keyof LeadFormData]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // For the custom Select component, which returns the value directly.
  const handleSelectChange = (name: keyof LeadFormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
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
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof LeadFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Lead name is required.";
    // Email not strictly required for social leads in early stages, but keeping it if provided
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Email is invalid.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const leadToSave: Lead = {
      id: lead?.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      dateAdded: lead?.dateAdded || new Date().toISOString(),
      ...formData,

      // Transform arrays
      techStack: formData.techStack ? formData.techStack.split(',').map(s => s.trim()).filter(s => s) : [],
      tags: formData.tags ? formData.tags.split(',').map(s => s.trim()).filter(s => s) : [],
      marketingChannels: formData.marketingChannels ? formData.marketingChannels.split(',').map(s => s.trim()).filter(s => s) : [],

      // Dates
      lastContactedDate: formData.lastContactedDate ? new Date(formData.lastContactedDate).toISOString() : undefined,
      nextFollowUpDateTime: formData.nextFollowUpDateTime ? new Date(formData.nextFollowUpDateTime).toISOString() : undefined,

      // Preserve history
      followUpHistory: lead?.followUpHistory || [],
      emailHistory: lead?.emailHistory || [],
      manualCompletionMarkers: lead?.manualCompletionMarkers || {},

      // Defaults for fields not in this form
      hasDigitalPresence: true,
      onboardingInterest: 'Not Discussed',

      customFieldValues: formData.customFieldValues,
    };
    onSave(leadToSave);
  };

  const selectBaseClass = "w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary-accent dark:focus:ring-secondary-accent focus:border-secondary-accent dark:focus:border-secondary-accent text-sm text-text-base dark:text-text-base";
  const optionClass = "bg-bg-base dark:bg-bg-muted text-text-base dark:text-text-base";

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? 'Edit Lead' : 'Add New Lead'}
      size="2xl"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" onClick={handleSubmit}>
            {lead ? 'Save Changes' : 'Add Lead'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">

        {/* Lead Type selector — drives which qualification fields are shown */}
        <div className="bg-secondary-accent/5 dark:bg-secondary-accent/10 p-4 rounded-lg border border-secondary-accent/20">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">Lead Type</label>
          <div className="grid grid-cols-2 gap-3">
            {leadTypes.map(lt => (
              <button
                type="button"
                key={lt}
                onClick={() => handleSelectChange('leadType', lt)}
                className={`p-3 rounded-lg border text-sm font-semibold transition-all ${
                  formData.leadType === lt
                    ? 'border-secondary-accent bg-secondary-accent text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-secondary-accent'
                }`}
              >
                {lt === 'D2C' ? 'D2C / E-commerce Brand' : 'General / Service Business'}
              </button>
            ))}
          </div>
        </div>

        {/* Section 1: The Vitals */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">1. The Vitals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Contact Name *" id="name" name="name" value={formData.name} onChange={handleChange} error={errors.name} required />
            <Input label="Brand / Company Name" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} />
            <Input label="Website URL" id="website" name="website" type="url" value={formData.website} onChange={handleChange} placeholder="https://..." />
            <Input label="Instagram Handle" id="instagramHandle" name="instagramHandle" value={formData.instagramHandle} onChange={handleChange} placeholder="@brandname" />
            <Input label="Email Address" id="email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
            <Input label="Phone Number" id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} />
          </div>
        </div>

        {/* Section 2A: D2C Qualification — only for D2C leads */}
        {formData.leadType === 'D2C' && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">2. D2C Qualification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Select
                label="Est. Revenue Band"
                value={formData.revenueBand || ''}
                onChange={(v) => handleSelectChange('revenueBand', v)}
                placeholder="Unknown"
                options={[{ value: '', label: 'Unknown' }, ...revenueBands.map(rb => ({ value: rb, label: rb }))]}
             />
             <Select
                label="Ad Library Status"
                value={formData.adStatus || 'Inactive'}
                onChange={(v) => handleSelectChange('adStatus', v)}
                options={[{ value: 'Inactive', label: 'No Active Ads' }, { value: 'Active', label: 'Running Ads' }]}
             />
            <Input label="Tech Stack (comma-separated)" id="techStack" name="techStack" value={formData.techStack} onChange={handleChange} placeholder="Shopify, Klaviyo, Yotpo..." />
            <Input label="Niche / Industry" id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g., Apparel, Supplements" />
          </div>
        </div>
        )}

        {/* Section 2B: General Business Qualification — only for General leads */}
        {formData.leadType === 'General' && (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">2. Business Qualification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Select
                label="Business Size"
                value={formData.revenueBand || ''}
                onChange={(v) => handleSelectChange('revenueBand', v)}
                placeholder="Unknown"
                options={[
                  { value: '', label: 'Unknown' },
                  { value: 'Solo / Freelancer', label: 'Solo / Freelancer' },
                  { value: 'Small (2-10)', label: 'Small (2-10)' },
                  { value: 'Medium (11-50)', label: 'Medium (11-50)' },
                  { value: 'Large (50+)', label: 'Large (50+)' },
                ]}
             />
             <Select
                label="Currently Running Ads?"
                value={formData.adStatus || 'Inactive'}
                onChange={(v) => handleSelectChange('adStatus', v)}
                options={[{ value: 'Inactive', label: 'Not Running Ads' }, { value: 'Active', label: 'Running Ads' }]}
             />
            <Input label="Industry / Sector" id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="e.g., Real Estate, Clinic, SaaS, Education" />
            <Input label="Current Tools (comma-separated)" id="techStack" name="techStack" value={formData.techStack} onChange={handleChange} placeholder="e.g., HubSpot, WordPress, Zoho" />
          </div>
        </div>
        )}

        {/* Section 3: The Outreach */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
           <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">3. The Hook</h3>
           <div className="space-y-4">
              <TextArea label="Outreach Angle (The Problem)" id="outreachAngle" name="outreachAngle" value={formData.outreachAngle} onChange={handleChange} rows={2} placeholder="What problem did you spot? e.g., Broken pixel, bad creative..." />
              <Input label="Offer Sent (The Value)" id="offerSent" name="offerSent" value={formData.offerSent} onChange={handleChange} placeholder="e.g., Free Audit, Creative Mockup" />
           </div>
        </div>

        {/* Section 4: Agency Marketing Intelligence */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
           <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">4. Agency Marketing Intelligence</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Primary Goal / Core Challenge" id="primaryGoal" name="primaryGoal" value={formData.primaryGoal || ''} onChange={handleChange} placeholder="e.g., Lower CBO CPA, Scale email ROAS, SEO growth" />
              <Input label="Key Competitors" id="keyCompetitors" name="keyCompetitors" value={formData.keyCompetitors || ''} onChange={handleChange} placeholder="e.g., Glossier, Summer Fridays" />
              <Input label="Active Marketing Channels (comma-spaced)" id="marketingChannels" name="marketingChannels" value={formData.marketingChannels || ''} onChange={handleChange} placeholder="Meta, TikTok PPC, Klaviyo Flows" />
              <Input label="Target Persona / Audience" id="targetAudience" name="targetAudience" value={formData.targetAudience || ''} onChange={handleChange} placeholder="e.g. Gen Z males, self-improvement seekers" />
              <Input label="Brand Design / Copy Tone" id="brandTone" name="brandTone" value={formData.brandTone || ''} onChange={handleChange} placeholder="e.g. Minimalist premium, direct response, funny" />
              <Select
                label="Pixel & Tracking Health"
                value={formData.trackingHealth || 'Unknown'}
                onChange={(v) => handleSelectChange('trackingHealth', v)}
                options={[
                  { value: 'Unknown', label: 'Unknown' },
                  { value: 'Verified', label: 'Verified & Active' },
                  { value: 'Issues Detected', label: 'Issues (e.g. broken Deduplication)' },
                  { value: 'Not Installed', label: 'None Installed' },
                ]}
              />
              <div className="md:col-span-2">
                <Input label="Competitor / Brand Meta Ad Library URL" id="adLibraryLink" name="adLibraryLink" type="url" value={formData.adLibraryLink || ''} onChange={handleChange} placeholder="https://www.facebook.com/ads/library/..." />
              </div>
           </div>
        </div>

        {/* Section 4: Admin/Meta */}
        <div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">Internal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Select
                label="Status"
                value={formData.status}
                onChange={(v) => handleSelectChange('status', v)}
                options={selectableLeadStatuses.map(st => ({ value: st, label: st }))}
             />
             <Select
                label="Source"
                value={formData.source || ''}
                onChange={(v) => handleSelectChange('source', v)}
                placeholder="Select Source"
                options={leadSources.map(src => ({ value: src, label: src }))}
             />
             <Select
                label="Lead Owner"
                value={formData.assignedToUserId || ''}
                onChange={(v) => handleSelectChange('assignedToUserId', v)}
                placeholder="Unassigned"
                searchable
                options={[{ value: '', label: 'Unassigned' }, ...teamMembers.map(m => ({ value: m.id, label: m.name }))]}
             />
          </div>
        </div>

        <DynamicFormFields
            module="Leads"
            customFields={customFields}
            values={formData.customFieldValues}
            onChange={handleCustomFieldChange}
        />
      </form>
    </SidePanel>
  );
};
