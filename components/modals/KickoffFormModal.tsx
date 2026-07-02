
import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { OnboardingKickoffData, Client, PlatformCredential } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Card } from '../common/Card';

// Icon Props Interface
interface IconProps {
  className?: string;
}

// Icons
const BriefcaseIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M3.5 4.5A2.5 2.5 0 016 2h8a2.5 2.5 0 012.5 2.5v1A2.5 2.5 0 0114 8H6a2.5 2.5 0 01-2.5-2.5v-1z" /><path fillRule="evenodd" d="M2 9.5A2.5 2.5 0 014.5 7h11A2.5 2.5 0 0118 9.5V14a2.5 2.5 0 01-2.5 2.5H13v-2.5A2.5 2.5 0 0010.5 11h-1A2.5 2.5 0 007 13.5V16.5H4.5A2.5 2.5 0 012 14V9.5zM11.5 12a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>;
const LockClosedIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>;
const DocumentChartBarIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M12.5 2.75a2.25 2.25 0 00-2.25-2.25H6.5A2.25 2.25 0 004.25 2.75v14.5A2.25 2.25 0 006.5 19.5h8.25a2.25 2.25 0 002.25-2.25V8.539a2.25 2.25 0 00-.659-1.591l-4.84-4.84a2.25 2.25 0 00-1.591-.659H12.5zM6.25 13.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75zm0-2.5a.75.75 0 01.75-.75H10a.75.75 0 010 1.5H7a.75.75 0 01-.75-.75zm.75-3.25a.75.75 0 000 1.5h1.5a.75.75 0 000-1.5h-1.5z" clipRule="evenodd" /></svg>;
const ExclamationTriangleIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 text-amber-500 dark:text-amber-400"}><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>;
const TrashIconMini: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6h1a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Zm2 2h8v8H4V5Zm2 1a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V7a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V7a1 1 0 0 1 1-1Z" /></svg>;
const EditIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path d="M11.354 1.646a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708L5.061 13.939a.5.5 0 0 1-.353.146H2.5a.5.5 0 0 1-.5-.5V11.293a.5.5 0 0 1 .146-.353L11.354 1.646ZM12.5 2.5 4.207 10.793V13h2.207L13.5 4.707 12.5 3.707V2.5Z" /><path d="m10.854 3.146 2.292 2.292-8.5 8.5H2.5v-2.292l8.5-8.5Z" /></svg>;
const PlusIcon: React.FC<IconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;


interface KickoffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kickoffData: OnboardingKickoffData) => void;
  existingData: OnboardingKickoffData | null;
  clientId: string;
  clients: Client[];
  onSetDirty: (isDirty: boolean) => void;
}

interface KickoffFormData {
  businessName: string;
  industry?: string;
  targetAudience?: string;
  keyProductsServices?: string;
  uniqueSellingPoints?: string;
  currentMarketingChannels: string[];
  accessCredentials: PlatformCredential[];
  projectGoals?: string;
  preferredCommunication?: string;
  brandGuidelinesUrl?: string;
  existingAssetsUrl?: string;
  isSubmitted: boolean;
}

const initialPlatformCredential: Omit<PlatformCredential, 'id'> = { platformName: '', loginUrl: '', username: '', email: '', notes: '' };

const initialFormData: KickoffFormData = {
  businessName: '',
  industry: '',
  targetAudience: '',
  keyProductsServices: '',
  uniqueSellingPoints: '',
  currentMarketingChannels: [],
  accessCredentials: [{...initialPlatformCredential, id: Date.now().toString()}],
  projectGoals: '',
  preferredCommunication: '',
  brandGuidelinesUrl: '',
  existingAssetsUrl: '',
  isSubmitted: false,
};

const marketingChannelOptions = ['Social Media', 'SEO', 'PPC Ads', 'Email Marketing', 'Content Marketing', 'Offline Ads', 'Referrals', 'Other'];
const communicationOptions = ['Email', 'Phone Calls', 'Scheduled Meetings (Zoom/Meet)', 'Slack/Teams', 'Project Management Tool'];

export const KickoffFormModal: React.FC<KickoffFormModalProps> = ({ isOpen, onClose, onSave, existingData, clientId, clients, onSetDirty }) => {
  const [formData, setFormData] = useState<KickoffFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof KickoffFormData, string>>>({});
  const initialFormStateRef = useRef<KickoffFormData | null>(null);

  const client = clients.find(c => c.id === clientId);

  useEffect(() => {
    if (isOpen) {
        let currentInitialState: KickoffFormData;
        if (existingData) {
          currentInitialState = {
            businessName: existingData.businessName || client?.companyName || client?.name || '',
            industry: existingData.industry || client?.industry || '',
            targetAudience: existingData.targetAudience || '',
            keyProductsServices: existingData.keyProductsServices || '',
            uniqueSellingPoints: existingData.uniqueSellingPoints || '',
            currentMarketingChannels: existingData.currentMarketingChannels || [],
            accessCredentials: existingData.accessCredentials.length > 0 ? existingData.accessCredentials.map(c => ({...c})) : [{...initialPlatformCredential, id: Date.now().toString()}],
            projectGoals: existingData.projectGoals || '',
            preferredCommunication: existingData.preferredCommunication || '',
            brandGuidelinesUrl: existingData.brandGuidelinesUrl || '',
            existingAssetsUrl: existingData.existingAssetsUrl || '',
            isSubmitted: existingData.isSubmitted || false,
          };
        } else {
          currentInitialState = {
            ...initialFormData,
            businessName: client?.companyName || client?.name || '',
            industry: client?.industry || '',
            accessCredentials: [{...initialPlatformCredential, id: Date.now().toString()}],
          };
        }
        setFormData(currentInitialState);
        initialFormStateRef.current = JSON.parse(JSON.stringify(currentInitialState)); // Deep copy
        onSetDirty(false);
        setErrors({});
    }
  }, [existingData, isOpen, client, clientId, onSetDirty]);

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
    if (errors[name as keyof KickoffFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleChannelChange = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      currentMarketingChannels: prev.currentMarketingChannels.includes(channel)
        ? prev.currentMarketingChannels.filter(c => c !== channel)
        : [...prev.currentMarketingChannels, channel]
    }));
  };
  
  const handleCredentialChange = (index: number, field: keyof Omit<PlatformCredential, 'id'>, value: string) => {
    const newCredentials = [...formData.accessCredentials];
    // @ts-ignore
    newCredentials[index][field] = value;
    setFormData(prev => ({ ...prev, accessCredentials: newCredentials }));
  };

  const addCredentialField = () => {
    setFormData(prev => ({ ...prev, accessCredentials: [...prev.accessCredentials, {...initialPlatformCredential, id: Date.now().toString()}] }));
  };

  const removeCredentialField = (index: number) => {
    if (formData.accessCredentials.length <= 1) return; // Keep at least one
    setFormData(prev => ({ ...prev, accessCredentials: prev.accessCredentials.filter((_, i) => i !== index) }));
  };
  
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof KickoffFormData, string>> = {};
    if (!formData.businessName.trim()) newErrors.businessName = "Business name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = (markAsSubmitted: boolean) => {
    if (!validate() && markAsSubmitted) { // Only validate fully if marking as submitted
        alert("Please fill in all required fields before submitting.");
        return;
    }
    
    const dataToSave: OnboardingKickoffData = {
      id: existingData?.id || '', // Will be set if new by App.tsx
      clientId: clientId,
      submissionDate: (markAsSubmitted && !existingData?.submissionDate) ? new Date().toISOString() : existingData?.submissionDate,
      isSubmitted: markAsSubmitted,
      ...formData,
    };
    onSave(dataToSave);
    onSetDirty(false);
  };
  
  const cardBaseClass = "bg-bg-muted dark:bg-slate-800/40 shadow-md rounded-lg border border-border-base dark:border-border-muted";
  const cardContentClass = "p-4 md:p-5";
  const labelClassSmall = "!text-xs !font-normal !text-text-muted dark:!text-text-muted !mb-0.5";
  const inputClassSmall = "!text-sm !py-1.5";


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Client Kickoff Form: ${client?.name || 'New Client'}`}
      size="4xl"
      footer={
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-700/20 p-2 rounded-md border border-amber-200 dark:border-amber-600">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1.5 shrink-0" />
            <span>CRITICAL: Do NOT store passwords here, even in notes. Use your agency's secure password manager.</span>
          </div>
          <div className="flex gap-2 shrink-0 mt-2 sm:mt-0">
            <Button variant="secondary" onClick={() => handleFormSubmit(false)} className="!text-sm">Save as Draft</Button>
            <Button variant="primary" onClick={() => handleFormSubmit(true)} type="button" className="!text-sm">
              {formData.isSubmitted ? 'Update Submitted Form' : 'Save and Mark as Submitted'}
            </Button>
          </div>
        </div>
      }
    >
      <form className="space-y-6">
        <Card title="Business Details" icon={<BriefcaseIcon/>} className={cardBaseClass} contentClassName={cardContentClass}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Official Business Name *" name="businessName" value={formData.businessName} onChange={handleChange} error={errors.businessName} required />
            <Input label="Industry" name="industry" value={formData.industry || ''} onChange={handleChange} placeholder="e.g., E-commerce, SaaS, Local Service"/>
            <TextArea label="Target Audience" name="targetAudience" value={formData.targetAudience || ''} onChange={handleChange} rows={3} placeholder="Describe their ideal customer demographics, psychographics, needs, and pain points."/>
            <TextArea label="Key Products/Services" name="keyProductsServices" value={formData.keyProductsServices || ''} onChange={handleChange} rows={3} placeholder="List the main products or services offered by the client."/>
            <TextArea label="Unique Selling Points (USPs)" name="uniqueSellingPoints" value={formData.uniqueSellingPoints || ''} onChange={handleChange} rows={3} placeholder="What makes the client's offerings stand out from competitors?"/>
            <div>
              <label className="block text-sm font-medium text-text-base dark:text-text-base mb-1.5">Current Marketing Channels</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 p-3 bg-bg-base dark:bg-slate-700/30 rounded-md border border-border-muted dark:border-slate-600">
                {marketingChannelOptions.map(channel => (
                  <label key={channel} className="flex items-center space-x-2 text-sm text-text-base dark:text-text-base cursor-pointer hover:text-premium-accent dark:hover:text-premium-accent-dark">
                    <input type="checkbox" className="form-checkbox h-4 w-4 text-premium-accent border-border-base dark:border-border-muted rounded focus:ring-premium-accent dark:focus:ring-premium-accent-dark" checked={formData.currentMarketingChannels.includes(channel)} onChange={() => handleChannelChange(channel)} />
                    <span>{channel}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Platform Access & Credentials" icon={<LockClosedIcon/>} className={cardBaseClass} contentClassName={cardContentClass}>
          <div className="p-3 mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-md flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Security Best Practice:</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                CRITICAL: Do NOT store passwords here, even in the notes. Use your agency's secure password manager (e.g., 1Password, Bitwarden) to handle all sensitive credentials. 
                Use the notes field for status updates (e.g., 'Access requested') or non-sensitive details.
              </p>
            </div>
          </div>
          {formData.accessCredentials.map((cred, index) => (
            <div key={cred.id || index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 border border-border-base dark:border-border-muted p-3 rounded-md mb-3 relative bg-bg-base dark:bg-slate-700/50">
               {formData.accessCredentials.length > 1 && (
                <Button 
                    variant="ghost" 
                    size="xs" 
                    onClick={() => removeCredentialField(index)} 
                    className="absolute top-1.5 right-1.5 p-1 text-status-negative hover:bg-red-100 dark:hover:bg-status-negative/20"
                    aria-label="Remove credential field"
                >
                    <TrashIconMini className="w-4 h-4" />
                </Button>
              )}
              <Input label="Platform Name" value={cred.platformName} onChange={e => handleCredentialChange(index, 'platformName', e.target.value)} placeholder="e.g., Website CMS, Analytics" labelClassName={labelClassSmall} className={inputClassSmall}/>
              <Input label="Login URL" value={cred.loginUrl || ''} onChange={e => handleCredentialChange(index, 'loginUrl', e.target.value)} placeholder="https://example.com/admin" labelClassName={labelClassSmall} className={inputClassSmall}/>
              <Input label="Username/Email" value={cred.username || cred.email || ''} onChange={e => handleCredentialChange(index, cred.email ? 'email' : 'username', e.target.value)} placeholder="user@example.com" labelClassName={labelClassSmall} className={inputClassSmall}/>
              {/* Password field removed for security */}
              <TextArea label="Notes (Status, 2FA Info)" value={cred.notes || ''} onChange={e => handleCredentialChange(index, 'notes', e.target.value)} rows={1} placeholder="e.g., Access Requested; Share via secure vault; 2FA via SMS" className={`${inputClassSmall} md:col-span-3`} labelClassName={labelClassSmall} />
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={addCredentialField} className="mt-2">Add Another Platform</Button>
        </Card>

        <Card title="Project & Communication Preferences" icon={<DocumentChartBarIcon/>} className={cardBaseClass} contentClassName={cardContentClass}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextArea label="Main Project Goals/KPIs" name="projectGoals" value={formData.projectGoals || ''} onChange={handleChange} rows={4} placeholder="What are the specific, measurable, achievable, relevant, and time-bound (SMART) goals for this engagement?"/>
            <div>
                <label htmlFor="preferredCommunication" className="block text-sm font-medium text-text-base dark:text-text-base mb-1.5">Preferred Communication Method</label>
                <select name="preferredCommunication" value={formData.preferredCommunication} onChange={handleChange} className="w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm">
                    <option value="" className="bg-bg-base dark:bg-bg-muted">Select preferred method</option>
                    {communicationOptions.map(opt => <option key={opt} value={opt} className="bg-bg-base dark:bg-bg-muted">{opt}</option>)}
                </select>
            </div>
            <Input label="Brand Guidelines URL (Optional)" name="brandGuidelinesUrl" value={formData.brandGuidelinesUrl || ''} onChange={handleChange} placeholder="Link to brand assets/style guide (e.g., Google Drive, Dropbox)"/>
            <Input label="Existing Digital Assets URL (Optional)" name="existingAssetsUrl" value={formData.existingAssetsUrl || ''} onChange={handleChange} placeholder="Link to Drive/Dropbox with logos, images, content etc."/>
          </div>
        </Card>
      </form>
    </Modal>
  );
};