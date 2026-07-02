
import React, { useState, useEffect } from 'react';
import { Audit, AuditEntity, AuditStatusType, AuditData } from '../../types';
import { Input, TextArea } from '../common/Input';
import { Button } from '../common/Button';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { Card } from '../common/Card';

interface CreateAuditProps {
  onBack: () => void;
  onSave: (audit: Audit) => void;
  initialData?: Partial<Audit>;
}

export const CreateAudit: React.FC<CreateAuditProps> = ({ onBack, onSave, initialData }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<AuditEntity>('Lead');
  const [entityName, setEntityName] = useState('');
  const [status, setStatus] = useState<AuditStatusType>('Draft');
  const [score, setScore] = useState('');
  const [dateCreated, setDateCreated] = useState(new Date().toISOString().split('T')[0]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loomUrl, setLoomUrl] = useState('');
  const [notes, setNotes] = useState('');
  
  // New Audit Analysis Fields
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [funnelAnalysis, setFunnelAnalysis] = useState('');
  const [creativeAnalysis, setCreativeAnalysis] = useState('');
  const [websiteAnalysis, setWebsiteAnalysis] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
      if (initialData) {
          setTitle(initialData.title || '');
          setType(initialData.entityType || 'Lead');
          setEntityName(initialData.entityName || '');
          setStatus(initialData.status || 'Draft');
          setScore(initialData.score ? initialData.score.toString() : '');
          if (initialData.dateCreated) setDateCreated(initialData.dateCreated.split('T')[0]);
          setPdfUrl(initialData.pdfUrl || '');
          setLoomUrl(initialData.loomUrl || '');
          setNotes(initialData.notes || '');
          
          if (initialData.auditData) {
              setExecutiveSummary(initialData.auditData.executiveSummary || '');
              setFunnelAnalysis(initialData.auditData.funnelAnalysis || '');
              setCreativeAnalysis(initialData.auditData.creativeAnalysis || '');
              setWebsiteAnalysis(initialData.auditData.websiteAnalysis || '');
              setActionPlan(initialData.auditData.actionPlan || '');
          }
      }
  }, [initialData]);

  const handleSave = () => {
      if (!title.trim() || !entityName.trim()) {
          alert('Title and Entity Name are required.');
          return;
      }
      
      const newAudit: Audit = {
          id: initialData?.id || `audit-${Date.now()}`,
          title,
          entityType: type,
          entityId: initialData?.entityId || `temp-${Date.now()}`,
          entityName,
          status,
          score: score ? parseInt(score, 10) : undefined,
          dateCreated: new Date(dateCreated).toISOString(),
          pdfUrl,
          loomUrl,
          notes,
          auditData: {
              executiveSummary,
              funnelAnalysis,
              creativeAnalysis,
              websiteAnalysis,
              actionPlan
          }
      };
      
      onSave(newAudit);
  };
  
  const handleAiAutoFill = () => {
      if (!entityName) {
          alert("Please enter a Client/Lead name first to generate context-aware content.");
          return;
      }
      
      setIsAiLoading(true);
      
      // Simulate AI generation delay
      setTimeout(() => {
          // Generate realistic dummy data
          setExecutiveSummary(`Executive Summary for ${entityName}:\n\nThe current marketing setup shows promise but lacks optimization in key areas. We identified critical drop-off points in the user journey and opportunities to scale ad spend efficiently.`);
          setFunnelAnalysis(`Funnel Review:\n\n- Top of Funnel: Traffic is consistent but engagement is low.\n- Middle of Funnel: Retargeting ads are not properly segmented.\n- Bottom of Funnel: Checkout abandonment rate is higher than industry average (65%).`);
          setCreativeAnalysis(`Creative Review:\n\n- Visuals are on-brand but lack direct response triggers.\n- Ad copy is too generic. Suggest testing problem-agitate-solve frameworks.\n- Video ads underperform compared to static images; need faster pacing.`);
          setWebsiteAnalysis(`Website & CRO:\n\n- Mobile page speed score is 45/100 (Critical).\n- CTA buttons on product pages blend in with the background.\n- Trust signals (reviews, badges) are below the fold.`);
          setActionPlan(`1. Optimize images to improve mobile speed.\n2. Launch a retargeting campaign for cart abandoners.\n3. A/B test new ad creatives with stronger hooks.\n4. Update PDP layout to highlight value proposition.`);
          
          setScore('65');
          setStatus('In Progress');
          
          setIsAiLoading(false);
      }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Back
                </Button>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{initialData ? 'Edit Audit' : 'Create Audit'}</h1>
            </div>
            <Button 
                variant="secondary" 
                className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" 
                onClick={handleAiAutoFill}
                disabled={isAiLoading}
                leftIcon={<Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />}
            >
                {isAiLoading ? 'Generating...' : 'Auto-Fill with AI'}
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card title="Audit Analysis" className="bg-white dark:bg-slate-800">
                     <div className="space-y-4">
                        <TextArea 
                            label="Executive Summary" 
                            value={executiveSummary} 
                            onChange={e => setExecutiveSummary(e.target.value)} 
                            rows={3} 
                            placeholder="High-level overview of findings..." 
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextArea 
                                label="Funnel Analysis" 
                                value={funnelAnalysis} 
                                onChange={e => setFunnelAnalysis(e.target.value)} 
                                rows={4} 
                                placeholder="Traffic, engagement, conversion rates..." 
                            />
                             <TextArea 
                                label="Creative & Ads Analysis" 
                                value={creativeAnalysis} 
                                onChange={e => setCreativeAnalysis(e.target.value)} 
                                rows={4} 
                                placeholder="Ad copy, visuals, CTR, relevance..." 
                            />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TextArea 
                                label="Website & CRO Analysis" 
                                value={websiteAnalysis} 
                                onChange={e => setWebsiteAnalysis(e.target.value)} 
                                rows={4} 
                                placeholder="Speed, UX, Checkout flow..." 
                            />
                             <TextArea 
                                label="Action Plan" 
                                value={actionPlan} 
                                onChange={e => setActionPlan(e.target.value)} 
                                rows={4} 
                                placeholder="Step-by-step recommendations..." 
                            />
                        </div>
                     </div>
                </Card>

                <Card title="Attachments & Internal Notes" className="bg-white dark:bg-slate-800">
                    <div className="space-y-4">
                        <Input label="Audit PDF (Upload placeholder)" type="file" disabled className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-premium-accent/10 file:text-premium-accent hover:file:bg-premium-accent/20"/>
                        <Input label="Loom Video URL" value={loomUrl} onChange={e => setLoomUrl(e.target.value)} placeholder="https://www.loom.com/share/..." />
                        <TextArea label="Internal Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Key findings or internal comments..." />
                    </div>
                </Card>
            </div>

            <div className="space-y-6">
                <Card title="Metadata" className="bg-white dark:bg-slate-800">
                    <div className="space-y-4">
                        <Input label="Audit Title *" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Q3 Growth Audit" />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Audit Type</label>
                            <select 
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                                value={type}
                                onChange={e => setType(e.target.value as AuditEntity)}
                            >
                                <option value="Lead">Lead Audit</option>
                                <option value="Client">Client Audit</option>
                            </select>
                        </div>
                        <Input label="Client / Lead Name *" value={entityName} onChange={e => setEntityName(e.target.value)} placeholder="e.g., Acme Corp" />
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                            <select 
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm"
                                value={status}
                                onChange={e => setStatus(e.target.value as AuditStatusType)}
                            >
                                <option value="Draft">Draft</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Sent">Sent</option>
                            </select>
                        </div>
                        <Input label="Audit Score (0-100)" type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} placeholder="e.g., 85" />
                        <Input label="Audit Date" type="date" value={dateCreated} onChange={e => setDateCreated(e.target.value)} />
                    </div>
                </Card>

                <div className="flex flex-col gap-3 sticky top-20">
                    <Button variant="primary" size="lg" onClick={handleSave} leftIcon={<Save className="w-4 h-4"/>}>
                        Save Audit
                    </Button>
                    <Button variant="secondary" size="lg" onClick={onBack}>Cancel</Button>
                </div>
            </div>
        </div>
    </div>
  );
};
