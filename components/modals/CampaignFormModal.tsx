


import React, { useState, useEffect, useRef } from 'react';
import { Campaign, Client, CampaignPlatform, CampaignStatus, campaignPlatforms, campaignStatuses, AppSettings, CampaignInsightsStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Card } from '../common/Card';

interface CampaignFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Omit<Campaign, 'id' | 'clientName' | 'dateAdded' | 'lastUpdated'> & {id?: string}) => void;
  campaign: Campaign | null;
  clients: Client[];
  appSettings: AppSettings;
  onGenerateInsights: (campaignId: string) => Promise<void>;
  onSetDirty: (isDirty: boolean) => void;
  prefillClientId?: string;
}

interface CampaignFormData {
  clientId: string;
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  startDate?: string;
  endDate?: string;
  totalBudget?: string;
  allocatedSpend?: string;
  actualSpend?: string;
  campaignGoals?: string;
  targetROAS?: string;
  notes?: string;
}

const initialFormData: CampaignFormData = {
  clientId: '',
  name: '',
  platform: 'GoogleAds',
  status: 'Planning',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  totalBudget: '',
  allocatedSpend: '',
  actualSpend: '',
  campaignGoals: '',
  targetROAS: '',
  notes: '',
};

interface CampaignFormErrors {
  clientId?: string;
  name?: string;
  platform?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  totalBudget?: string;
  allocatedSpend?: string;
  actualSpend?: string;
  targetROAS?: string;
}

// Icons
const SparklesIcon = ({ className }: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.423 3.595c-.736.771.256 1.991.984 1.991H6.9l-1.296 4.401c-.16.546.435.946.945.626L10 15.11l2.371 2.754c.484.563 1.377.206 1.486-.459l.526-3.23L15.013 18c.554.01.98-.426.98-.979l.003-3.712 2.768-.23c.63-.053.923-.83.486-1.309l-3.423-3.595-4.753-.39-1.83-4.401z" clipRule="evenodd" /></svg>;
const LoadingSpinner = () => (<svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>);


export const CampaignFormModal: React.FC<CampaignFormModalProps> = ({ isOpen, onClose, onSave, campaign, clients, appSettings, onGenerateInsights, onSetDirty, prefillClientId }) => {
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
  const [errors, setErrors] = useState<CampaignFormErrors>({});
  const initialFormStateRef = useRef<CampaignFormData | null>(null);


  useEffect(() => {
    if (isOpen) {
        let currentInitialState: CampaignFormData;
        if (campaign) {
            currentInitialState = {
                clientId: campaign.clientId,
                name: campaign.name,
                platform: campaign.platform,
                status: campaign.status,
                startDate: (campaign.startDate ?? '').split('T')[0],
                endDate: (campaign.endDate ?? '').split('T')[0],
                totalBudget: (campaign.totalBudget ?? '').toString(),
                allocatedSpend: (campaign.allocatedSpend ?? '').toString(),
                actualSpend: (campaign.actualSpend ?? '').toString(),
                campaignGoals: campaign.campaignGoals || '',
                targetROAS: (campaign.targetROAS ?? '').toString(),
                notes: campaign.notes || '',
            };
        } else {
            currentInitialState = {
                ...initialFormData,
                clientId: prefillClientId || (clients.length > 0 ? clients[0].id : ''),
            };
        }
        setFormData(currentInitialState);
        initialFormStateRef.current = JSON.parse(JSON.stringify(currentInitialState));
        onSetDirty(false);
        setErrors({});
    }
  }, [campaign, isOpen, clients, onSetDirty, prefillClientId]);

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
    if (errors[name as keyof CampaignFormErrors]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: CampaignFormErrors = {};
    if (!formData.clientId) newErrors.clientId = "Client is required.";
    if (!formData.name.trim()) newErrors.name = "Campaign name is required.";
    if (formData.endDate && formData.startDate && new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = "End date cannot be before start date.";
    }
    const numericFields: (keyof CampaignFormData)[] = ['totalBudget', 'allocatedSpend', 'actualSpend', 'targetROAS'];
    numericFields.forEach(field => {
        const val = formData[field];
        if (val && (isNaN(parseFloat(val)) || parseFloat(val) < 0)) {
            newErrors[field as keyof CampaignFormErrors] = "Must be a non-negative number.";
        }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    const dataToSave: Omit<Campaign, 'id' | 'clientName' | 'dateAdded' | 'lastUpdated'> & {id?: string} = {
        id: campaign?.id,
        ...formData,
        totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : undefined,
        allocatedSpend: formData.allocatedSpend ? parseFloat(formData.allocatedSpend) : undefined,
        actualSpend: formData.actualSpend ? parseFloat(formData.actualSpend) : undefined,
        targetROAS: formData.targetROAS ? parseFloat(formData.targetROAS) : undefined,
        chartData: campaign?.chartData || {
            spendVsBudget: { budget: 0, spent: 0 },
            performanceTrend: { metricName: 'Revenue', data: [] }
        },
    };
    onSave(dataToSave);
    onSetDirty(false);
  };
  
  const selectBaseClass = "w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-text-base dark:text-text-base text-sm";
  const optionClass = "bg-bg-base dark:bg-bg-muted text-text-base dark:text-text-base";
  const labelClassSmall = "block text-xs font-medium text-text-muted dark:text-text-muted mb-1";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={campaign ? `Edit Campaign: ${campaign.name}` : 'Create New Campaign'}
      size="4xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} type="submit">
            {campaign ? 'Save Changes' : 'Create Campaign'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="clientId" className={labelClassSmall}>Client *</label>
            <select id="clientId" name="clientId" value={formData.clientId} onChange={handleChange} className={`${selectBaseClass} ${errors.clientId ? 'border-status-negative' : ''}`} disabled={clients.length === 0 || !!prefillClientId} required>
              {clients.length === 0 ? <option className={optionClass}>Please add a client first</option> : <option value="" className={optionClass}>Select a client</option>}
              {clients.map(c => <option key={c.id} value={c.id} className={optionClass}>{c.name} ({c.companyName || 'Individual'})</option>)}
            </select>
            {errors.clientId && <p className="mt-1 text-xs text-status-negative">{errors.clientId}</p>}
          </div>
          <Input label="Campaign Name *" id="name" name="name" value={formData.name} onChange={handleChange} error={errors.name} required labelClassName={labelClassSmall} className="!text-sm"/>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="platform" className={labelClassSmall}>Platform *</label>
            <select id="platform" name="platform" value={formData.platform} onChange={handleChange} className={`${selectBaseClass} ${errors.platform ? 'border-status-negative' : ''}`} required>
              {campaignPlatforms.map(p => <option key={p} value={p} className={optionClass}>{p.replace('Ads', ' Ads')}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="status" className={labelClassSmall}>Status *</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} className={`${selectBaseClass} ${errors.status ? 'border-status-negative' : ''}`} required>
              {campaignStatuses.map(s => <option key={s} value={s} className={optionClass}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Start Date" id="startDate" name="startDate" type="date" value={formData.startDate || ''} onChange={handleChange} error={errors.startDate} labelClassName={labelClassSmall} className="!text-sm"/>
          <Input label="End Date (Optional)" id="endDate" name="endDate" type="date" value={formData.endDate || ''} onChange={handleChange} error={errors.endDate} labelClassName={labelClassSmall} className="!text-sm"/>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label={`Total Budget (${appSettings.defaultCurrency})`} id="totalBudget" name="totalBudget" type="number" placeholder="e.g., 10000" value={formData.totalBudget || ''} onChange={handleChange} error={errors.totalBudget} min="0" step="0.01" labelClassName={labelClassSmall} className="!text-sm"/>
          <Input label={`Allocated Spend (${appSettings.defaultCurrency})`} id="allocatedSpend" name="allocatedSpend" type="number" placeholder="e.g., 5000" value={formData.allocatedSpend || ''} onChange={handleChange} error={errors.allocatedSpend} min="0" step="0.01" labelClassName={labelClassSmall} className="!text-sm"/>
          <Input label={`Actual Spend (${appSettings.defaultCurrency})`} id="actualSpend" name="actualSpend" type="number" placeholder="e.g., 4500" value={formData.actualSpend || ''} onChange={handleChange} error={errors.actualSpend} min="0" step="0.01" labelClassName={labelClassSmall} className="!text-sm"/>
        </div>

        <TextArea label="Campaign Goals" id="campaignGoals" name="campaignGoals" value={formData.campaignGoals || ''} onChange={handleChange} rows={3} placeholder="Describe primary objectives, KPIs..." labelClassName={labelClassSmall} className="!text-sm"/>
        <Input label="Target ROAS (e.g., 3 for 300%)" id="targetROAS" name="targetROAS" type="number" placeholder="e.g., 3" value={formData.targetROAS || ''} onChange={handleChange} error={errors.targetROAS} min="0" step="0.1" labelClassName={labelClassSmall} className="!text-sm"/>
        <TextArea label="Notes (Optional)" id="notes" name="notes" value={formData.notes || ''} onChange={handleChange} rows={2} placeholder="Internal notes, observations, etc." labelClassName={labelClassSmall} className="!text-sm"/>

        {campaign && (
            <Card title="AI Performance Insights" className="mt-5 bg-slate-50 dark:bg-slate-800/50 border border-border-base dark:border-border-muted">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-text-muted dark:text-text-muted">
                        Status: <span className={`font-medium ${
                            campaign.insightsStatus === 'Completed' ? 'text-status-positive' :
                            campaign.insightsStatus === 'Generating' ? 'text-purple-500 dark:text-purple-400' :
                            campaign.insightsStatus === 'Error' ? 'text-status-negative' :
                            'text-text-muted dark:text-text-muted'
                        }`}>
                            {campaign.insightsStatus || 'None'}
                        </span>
                    </p>
                    <Button 
                        variant="outline" 
                        size="xs"
                        onClick={() => campaign && onGenerateInsights(campaign.id)}
                        disabled={campaign.insightsStatus === 'Generating'}
                        leftIcon={campaign.insightsStatus === 'Generating' ? <LoadingSpinner /> : <SparklesIcon className="w-4 h-4"/>}
                    >
                        {campaign.insightsStatus === 'Generating' ? 'Generating...' : (campaign.aiPerformanceInsights ? 'Re-generate' : 'Generate Insights')}
                    </Button>
                </div>
                {campaign.insightsStatus === 'Error' && campaign.insightsErrorMessage && (
                    <p className="text-xs text-status-negative bg-red-50 dark:bg-status-negative/10 p-2 rounded-md border border-red-200 dark:border-status-negative/30">Error: {campaign.insightsErrorMessage}</p>
                )}
                {campaign.aiPerformanceInsights ? (
                    <TextArea 
                        value={campaign.aiPerformanceInsights} 
                        readOnly 
                        rows={8} 
                        className="mt-1 !text-xs bg-bg-base dark:bg-bg-muted border-border-base dark:border-border-muted font-mono"
                    />
                ) : campaign.insightsStatus !== 'Generating' && (
                    <p className="text-xs text-text-muted dark:text-text-muted text-center py-4">No insights generated yet.</p>
                )}
            </Card>
        )}
      </form>
    </Modal>
  );
};