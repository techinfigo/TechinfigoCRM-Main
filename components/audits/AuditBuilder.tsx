import React, { useState, useEffect } from 'react';
import { ScoreInput } from './ScoreInput';
import { CheckboxGroup } from './CheckboxGroup';
import { AuditSectionAccordion } from './AuditSectionAccordion';
import { TextArea, Input } from '../common/Input';
import { Button } from '../common/Button';
import { Save, Send, ArrowLeft, Sparkles, Sliders, Briefcase, ShoppingBag, Terminal, Globe, Instagram, Tag, Activity, DollarSign, Info, ExternalLink } from 'lucide-react';
import { Audit, AuditEntity, D2CAuditData, D2CAuditSection, B2BAuditData, B2BAuditSection, Lead, Client } from '../../types';

interface AuditBuilderProps {
  onBack: () => void;
  onSave: (audit: Audit) => void;
  initialData?: Partial<Audit>;
  leads?: Lead[];
  clients?: Client[];
  isPopup?: boolean;
  saveRef?: React.MutableRefObject<(() => void) | null>;
}

type SectionKey = 'website' | 'funnel' | 'ads' | 'brand' | 'retention' | 'tech' | 'summary';
type B2BSectionKey = 'leadGen' | 'salesFunnel' | 'adsOutbound' | 'offerPositioning' | 'crmFollowUp' | 'techStack' | 'summary';

const initialSectionState: D2CAuditSection = {
  scores: {},
  issues: '',
  recommendations: '',
  checklist: [],
};

const initialB2BSectionState: B2BAuditSection = {
  scores: {},
  issues: '',
  recommendations: '',
  checklist: [],
};

export const AuditBuilder: React.FC<AuditBuilderProps> = ({ onBack, onSave, initialData, leads = [], clients = [], isPopup = false, saveRef }) => {
  const matchingEntity = React.useMemo(() => {
    if (!initialData) return null;
    if (initialData.entityType === 'Lead' && leads) {
      return leads.find(l => l.id === initialData.entityId);
    }
    if (initialData.entityType === 'Client' && clients) {
      return clients.find(c => c.id === initialData.entityId);
    }
    return null;
  }, [initialData, leads, clients]);

  const [meta, setMeta] = useState({
    title: initialData?.title || (initialData?.entityName ? `${initialData.entityName} - Brand Growth Audit` : ''),
    entityName: initialData?.entityName || '',
    entityType: initialData?.entityType || 'Client' as AuditEntity,
  });

  const [brandAuditType, setBrandAuditType] = useState<'D2C' | 'B2B_Other'>(initialData?.brandAuditType || 'D2C');

  // D2C State
  const [sections, setSections] = useState<Record<SectionKey, D2CAuditSection>>({
    website: { ...initialSectionState, scores: { pageSpeed: 0, firstFold: 0, trust: 0, productPage: 0, checkout: 0 } },
    funnel: { ...initialSectionState, scores: { awareness: 0, consideration: 0, conversion: 0 } },
    ads: { ...initialSectionState, scores: { quality: 0, hook: 0, messaging: 0, offer: 0 } },
    brand: { ...initialSectionState, scores: { offerStrength: 0, pricing: 0, positioning: 0 } },
    retention: { ...initialSectionState, scores: { email: 0, whatsapp: 0, repeat: 0 } },
    tech: { ...initialSectionState, scores: { pixel: 0, ga4: 0, events: 0, utm: 0 } },
    summary: { ...initialSectionState, scores: { overall: 0 }, issues: '', recommendations: '' },
  });

  // B2B State
  const [b2bSections, setB2bSections] = useState<Record<B2BSectionKey, B2BAuditSection>>({
    leadGen: { ...initialB2BSectionState, scores: { seoRank: 0, ctaClarity: 0, leadMagnet: 0, contentValue: 0 } },
    salesFunnel: { ...initialB2BSectionState, scores: { emailSequence: 0, retargeting: 0, bookingUX: 0 } },
    adsOutbound: { ...initialB2BSectionState, scores: { linkedinQuality: 0, paidSearch: 0, outboundCopy: 0 } },
    offerPositioning: { ...initialB2BSectionState, scores: { offerValue: 0, caseStudies: 0, pricingStructure: 0 } },
    crmFollowUp: { ...initialB2BSectionState, scores: { responseTime: 0, automations: 0, pipelineMgmt: 0 } },
    techStack: { ...initialB2BSectionState, scores: { dataIntents: 0, formGA4: 0, scoringSetup: 0 } },
    summary: { ...initialB2BSectionState, scores: { overall: 0 }, issues: '', recommendations: '' },
  });

  const [openSection, setOpenSection] = useState<string | null>('website');

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSaveAudit;
    }
  });

  useEffect(() => {
    if (initialData) {
      setMeta({
        title: initialData.title || (initialData.entityName ? `${initialData.entityName} - Brand Growth Audit` : ''),
        entityName: initialData.entityName || '',
        entityType: initialData.entityType || 'Client',
      });

      if (initialData.brandAuditType) {
        setBrandAuditType(initialData.brandAuditType);
        setOpenSection(initialData.brandAuditType === 'D2C' ? 'website' : 'leadGen');
      } else if (matchingEntity) {
        // Auto-detect brand category
        const lead = matchingEntity as Lead;
        const isD2C = 
          !!lead.instagramHandle || 
          !!lead.revenueBand || 
          !!lead.adStatus || 
          !!lead.techStack?.some(t => ['shopify', 'klaviyo', 'magento', 'woocommerce'].includes(t.toLowerCase())) ||
          !!lead.tags?.some(tag => ['d2c', 'ecom', 'shopify', 'brand'].includes(tag.toLowerCase()));
        
        const detectedType = isD2C ? 'D2C' : 'B2B_Other';
        setBrandAuditType(detectedType);
        setOpenSection(detectedType === 'D2C' ? 'website' : 'leadGen');
      }

      if (initialData.d2cAuditData) {
        setSections(initialData.d2cAuditData);
      }
      if (initialData.b2bAuditData) {
        setB2bSections(initialData.b2bAuditData);
      }
    }
  }, [initialData, matchingEntity]);

  // Handler for D2C changes
  const handleSectionChange = (section: SectionKey, field: keyof D2CAuditSection, value: any) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleScoreChange = (section: SectionKey, key: string, value: number) => {
    setSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        scores: { ...prev[section].scores, [key]: value }
      }
    }));
  };

  // Handler for B2B changes
  const handleB2BSectionChange = (section: B2BSectionKey, field: keyof B2BAuditSection, value: any) => {
    setB2bSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleB2BScoreChange = (section: B2BSectionKey, key: string, value: number) => {
    setB2bSections(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        scores: { ...prev[section].scores, [key]: value }
      }
    }));
  };

  const calculateSectionScore = (section: SectionKey) => {
    const scores = sections[section].scores || {};
    const scoreValues = Object.values(scores) as number[];
    if (scoreValues.length === 0) return 0;
    return scoreValues.reduce((a, b) => a + b, 0);
  };

  const calculateB2BSectionScore = (section: B2BSectionKey) => {
    const scores = b2bSections[section].scores || {};
    const scoreValues = Object.values(scores) as number[];
    if (scoreValues.length === 0) return 0;
    return scoreValues.reduce((a, b) => a + b, 0);
  };

  const handleSaveAudit = () => {
    if (!meta.title || !meta.entityName) {
        alert("Please fill in the Audit Title and Client Name.");
        return;
    }

    const totalScore = brandAuditType === 'D2C' ? (
        calculateSectionScore('website') +
        calculateSectionScore('funnel') +
        calculateSectionScore('ads') +
        calculateSectionScore('brand') +
        calculateSectionScore('retention') +
        calculateSectionScore('tech')
    ) : (
        calculateB2BSectionScore('leadGen') +
        calculateB2BSectionScore('salesFunnel') +
        calculateB2BSectionScore('adsOutbound') +
        calculateB2BSectionScore('offerPositioning') +
        calculateB2BSectionScore('crmFollowUp') +
        calculateB2BSectionScore('techStack')
    );
    
    const maxTotal = brandAuditType === 'D2C' ? 220 : 190; 
    const calculatedOverall = Math.round((totalScore / maxTotal) * 100);

    const manualOverall = brandAuditType === 'D2C' ? sections.summary.scores.overall : b2bSections.summary.scores.overall;

    const finalAudit: Audit = {
        id: initialData?.id || `audit-${Date.now()}`,
        title: meta.title,
        entityName: meta.entityName,
        entityType: meta.entityType,
        entityId: initialData?.entityId || `temp-${Date.now()}`,
        status: 'Draft',
        score: manualOverall > 0 ? manualOverall : calculatedOverall,
        dateCreated: new Date().toISOString(),
        brandAuditType,
        notes: brandAuditType === 'D2C' ? sections.summary.issues : b2bSections.summary.issues
    };

    if (brandAuditType === 'D2C') {
      finalAudit.d2cAuditData = sections;
    } else {
      finalAudit.b2bAuditData = b2bSections;
    }

    onSave(finalAudit);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4">
      {/* Sticky Header */}
      {!isPopup && (
        <div className="sticky top-0 z-20 bg-bg-canvas/90 dark:bg-zinc-900/90 backdrop-blur-md py-4 border-b border-slate-200 dark:border-slate-700 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />} size="sm">Back</Button>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                      {brandAuditType === 'D2C' ? 'D2C Brand Growth Audit' : 'B2B & Other Brand Audit'}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">Analyzing performance metrics for {meta.entityName || 'Client'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleSaveAudit} leftIcon={<Save className="w-4 h-4"/>}>Save Draft</Button>
                  <Button variant="primary" onClick={handleSaveAudit} leftIcon={<Send className="w-4 h-4"/>}>Submit Audit</Button>
              </div>
          </div>
        </div>
      )}

      {/* Active Lead / Client Profile Dossier */}
      {matchingEntity && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/30">
                  {initialData?.entityType === 'Lead' ? 'Active Lead Profile' : 'Client Profile'}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {matchingEntity.id}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                {matchingEntity.name}
                {matchingEntity.companyName && <span className="text-slate-400 dark:text-slate-500 font-normal">({matchingEntity.companyName})</span>}
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs">
              {matchingEntity.website && (
                <a 
                  href={matchingEntity.website.startsWith('http') ? matchingEntity.website : `https://${matchingEntity.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 font-medium transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  Website
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}
              
              {initialData?.entityType === 'Lead' && (matchingEntity as Lead).instagramHandle && (
                <a 
                  href={`https://instagram.com/${(matchingEntity as Lead).instagramHandle?.replace('@', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 font-medium transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5 text-rose-500" />
                  {(matchingEntity as Lead).instagramHandle}
                </a>
              )}

              {initialData?.entityType === 'Lead' && (matchingEntity as Lead).revenueBand && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-900/30 font-semibold">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  {(matchingEntity as Lead).revenueBand} Monthly Rev
                </span>
              )}

              {initialData?.entityType === 'Lead' && (matchingEntity as Lead).adStatus && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                  (matchingEntity as Lead).adStatus === 'Active' 
                    ? 'bg-green-50 dark:bg-green-950/25 text-green-600 dark:text-green-400 border-green-100 dark:border-green-905/30' 
                    : 'bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                }`}>
                  <Activity className="w-3.5 h-3.5" />
                  Ads: {(matchingEntity as Lead).adStatus}
                </span>
              )}
            </div>
          </div>

          {(matchingEntity.tags && matchingEntity.tags.length > 0 || (initialData?.entityType === 'Lead' && (matchingEntity as Lead).techStack && (matchingEntity as Lead).techStack!.length > 0) || matchingEntity.notes) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-4 border-t border-slate-100 dark:border-slate-700/60">
              {initialData?.entityType === 'Lead' && (matchingEntity as Lead).techStack && (matchingEntity as Lead).techStack!.length > 0 && (
                <div className="space-y-1">
                  <span className="text-slate-400 dark:text-slate-500 font-medium block">Detected Tech Stack:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(matchingEntity as Lead).techStack?.map(tech => (
                      <span key={tech} className="px-2 py-0.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-100/40 dark:border-indigo-900/20 font-medium">{tech}</span>
                    ))}
                  </div>
                </div>
              )}
              {matchingEntity.tags && matchingEntity.tags.length > 0 && (
                <div className="space-y-1">
                  <span className="text-slate-400 dark:text-slate-500 font-medium block">Identified Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {matchingEntity.tags?.map(tag => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-650 font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {matchingEntity.notes && (
                <div className="md:col-span-1 space-y-1">
                  <span className="text-slate-400 dark:text-slate-500 font-medium block">Captured Context Notes:</span>
                  <p className="text-slate-600 dark:text-slate-350 italic line-clamp-2 leading-relaxed">{matchingEntity.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Brand Template Selector */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
         <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">1. Choose Brand Framework</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setBrandAuditType('D2C');
                setOpenSection('website');
              }}
              className={`flex items-start gap-4 p-4 rounded-xl border text-left transition ${brandAuditType === 'D2C' ? 'border-secondary-accent bg-secondary-accent/5 dark:bg-secondary-accent/11 ring-2 ring-secondary-accent/20' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
            >
              <div className={`p-2.5 rounded-lg border shrink-0 ${brandAuditType === 'D2C' ? 'bg-secondary-accent/10 border-secondary-accent text-secondary-accent' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500'}`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">D2C Brand Growth Template</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Specific metrics covering E-Commerce Stores, Cart Optimization, Ad Creatives hook ratios, Pixel events, and Customer Retention (LTV).</p>
              </div>
            </button>

            <button
              onClick={() => {
                setBrandAuditType('B2B_Other');
                setOpenSection('leadGen');
              }}
              className={`flex items-start gap-4 p-4 rounded-xl border text-left transition ${brandAuditType === 'B2B_Other' ? 'border-secondary-accent bg-secondary-accent/5 dark:bg-secondary-accent/11 ring-2 ring-secondary-accent/20' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
            >
              <div className={`p-2.5 rounded-lg border shrink-0 ${brandAuditType === 'B2B_Other' ? 'bg-secondary-accent/10 border-secondary-accent text-secondary-accent' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700'}`}>
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">B2B, SaaS & Service Template (Other)</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Engineered for lead generation agencies, high-ticket services, and consultants. Focuses on LinkedIn, outbound chains, followups speed, and tech stacks.</p>
              </div>
            </button>
         </div>
      </div>

      {/* Metadata Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
         <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">2. Audit Information</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input 
                label="Audit Title" 
                value={meta.title} 
                onChange={e => setMeta(p => ({...p, title: e.target.value}))} 
                placeholder="e.g. Q3 Growth Audit"
            />
            <Input 
                label="Client / Brand Name" 
                value={meta.entityName} 
                onChange={e => setMeta(p => ({...p, entityName: e.target.value}))} 
                placeholder="e.g. Nike"
            />
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Audit Category</label>
                <select 
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-premium-accent focus:border-transparent outline-none"
                    value={meta.entityType}
                    onChange={e => setMeta(p => ({...p, entityType: e.target.value as AuditEntity}))}
                >
                    <option value="Lead">Lead Audit</option>
                    <option value="Client">Client Audit</option>
                </select>
            </div>
        </div>
      </div>

      {/* D2C CONDITIONAL ACCORDIONS */}
      {brandAuditType === 'D2C' && (
        <div className="space-y-6">
          {/* 1. WEBSITE & CRO AUDIT */}
          <AuditSectionAccordion 
              title="1. Website & CRO Audit" 
              score={calculateSectionScore('website')} 
              maxScore={50} 
              isOpen={openSection === 'website'}
              onToggle={() => setOpenSection(openSection === 'website' ? null : 'website')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="Page Speed Score" value={sections.website.scores.pageSpeed || 0} onChange={v => handleScoreChange('website', 'pageSpeed', v)} />
                      <ScoreInput label="First Fold Score" value={sections.website.scores.firstFold || 0} onChange={v => handleScoreChange('website', 'firstFold', v)} />
                      <ScoreInput label="Trust Elements Score" value={sections.website.scores.trust || 0} onChange={v => handleScoreChange('website', 'trust', v)} />
                      <ScoreInput label="Product Page Score" value={sections.website.scores.productPage || 0} onChange={v => handleScoreChange('website', 'productPage', v)} />
                      <ScoreInput label="Checkout UX Score" value={sections.website.scores.checkout || 0} onChange={v => handleScoreChange('website', 'checkout', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Critical Issues Identified"
                          options={['Missing trust badges', 'Weak first fold headline', 'Poor product images', 'No urgency/USP clarity', 'Checkout missing COD/UPI']}
                          selected={sections.website.checklist}
                          onChange={v => handleSectionChange('website', 'checklist', v)}
                      />
                      <TextArea label="Detailed Analysis" value={sections.website.issues} onChange={e => handleSectionChange('website', 'issues', e.target.value)} rows={3} placeholder="Describe specific issues found..." />
                      <TextArea label="Strategic Recommendations" value={sections.website.recommendations} onChange={e => handleSectionChange('website', 'recommendations', e.target.value)} rows={3} placeholder="Actionable steps to improve score..." />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 2. FUNNEL & JOURNEY AUDIT */}
          <AuditSectionAccordion 
              title="2. Funnel & Journey Audit" 
              score={calculateSectionScore('funnel')} 
              maxScore={30} 
              isOpen={openSection === 'funnel'}
              onToggle={() => setOpenSection(openSection === 'funnel' ? null : 'funnel')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="Awareness" value={sections.funnel.scores.awareness || 0} onChange={v => handleScoreChange('funnel', 'awareness', v)} />
                      <ScoreInput label="Consideration" value={sections.funnel.scores.consideration || 0} onChange={v => handleScoreChange('funnel', 'consideration', v)} />
                      <ScoreInput label="Conversion" value={sections.funnel.scores.conversion || 0} onChange={v => handleScoreChange('funnel', 'conversion', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Funnel Gaps"
                          options={['No TOF/MOF/BOF structure', 'No retargeting ads', 'Weak landing page alignment', 'Broken CTA journey']}
                          selected={sections.funnel.checklist}
                          onChange={v => handleSectionChange('funnel', 'checklist', v)}
                      />
                      <TextArea label="Funnel Breakpoints" value={sections.funnel.issues} onChange={e => handleSectionChange('funnel', 'issues', e.target.value)} rows={3} />
                      <TextArea label="Recommended Fixes" value={sections.funnel.recommendations} onChange={e => handleSectionChange('funnel', 'recommendations', e.target.value)} rows={3} />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 3. ADS & CREATIVE AUDIT */}
          <AuditSectionAccordion 
              title="3. Ads & Creative Audit" 
              score={calculateSectionScore('ads')} 
              maxScore={40} 
              isOpen={openSection === 'ads'}
              onToggle={() => setOpenSection(openSection === 'ads' ? null : 'ads')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="Creative Quality" value={sections.ads.scores.quality || 0} onChange={v => handleScoreChange('ads', 'quality', v)} />
                      <ScoreInput label="Hook Strength" value={sections.ads.scores.hook || 0} onChange={v => handleScoreChange('ads', 'hook', v)} />
                      <ScoreInput label="Messaging Clarity" value={sections.ads.scores.messaging || 0} onChange={v => handleScoreChange('ads', 'messaging', v)} />
                      <ScoreInput label="Offer Clarity" value={sections.ads.scores.offer || 0} onChange={v => handleScoreChange('ads', 'offer', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Creative Weaknesses"
                          options={['No UGC ads', 'No testimonials', 'Weak hooks', 'Not enough variants', 'Overused creatives']}
                          selected={sections.ads.checklist}
                          onChange={v => handleSectionChange('ads', 'checklist', v)}
                      />
                      <TextArea label="Creative Issues" value={sections.ads.issues} onChange={e => handleSectionChange('ads', 'issues', e.target.value)} rows={3} />
                      <TextArea label="Creative Recommendations" value={sections.ads.recommendations} onChange={e => handleSectionChange('ads', 'recommendations', e.target.value)} rows={3} />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 4. BRAND POSITIONING */}
          <AuditSectionAccordion 
              title="4. Brand & Offer" 
              score={calculateSectionScore('brand')} 
              maxScore={30} 
              isOpen={openSection === 'brand'}
              onToggle={() => setOpenSection(openSection === 'brand' ? null : 'brand')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="Offer Strength" value={sections.brand.scores.offerStrength || 0} onChange={v => handleScoreChange('brand', 'offerStrength', v)} />
                      <ScoreInput label="Pricing Strategy" value={sections.brand.scores.pricing || 0} onChange={v => handleScoreChange('brand', 'pricing', v)} />
                      <ScoreInput label="Brand Positioning" value={sections.brand.scores.positioning || 0} onChange={v => handleScoreChange('brand', 'positioning', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Offer Gaps"
                          options={['No social proof', 'No bundles', 'No urgency or scarcity', 'Value not communicated clearly']}
                          selected={sections.brand.checklist}
                          onChange={v => handleSectionChange('brand', 'checklist', v)}
                      />
                      <TextArea label="Offer Analysis" value={sections.brand.issues} onChange={e => handleSectionChange('brand', 'issues', e.target.value)} rows={3} />
                      <TextArea label="Positioning Improvements" value={sections.brand.recommendations} onChange={e => handleSectionChange('brand', 'recommendations', e.target.value)} rows={3} />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 5. RETENTION */}
          <AuditSectionAccordion 
              title="5. Retention & LTV" 
              score={calculateSectionScore('retention')} 
              maxScore={30} 
              isOpen={openSection === 'retention'}
              onToggle={() => setOpenSection(openSection === 'retention' ? null : 'retention')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="Email Marketing" value={sections.retention.scores.email || 0} onChange={v => handleScoreChange('retention', 'email', v)} />
                      <ScoreInput label="WhatsApp / SMS" value={sections.retention.scores.whatsapp || 0} onChange={v => handleScoreChange('retention', 'whatsapp', v)} />
                      <ScoreInput label="Repeat Rate" value={sections.retention.scores.repeat || 0} onChange={v => handleScoreChange('retention', 'repeat', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Missing Flows"
                          options={['No Welcome Series', 'No Post-Purchase Flow', 'No Cart Recovery Flow', 'No Winback Flow', 'No Loyalty Program']}
                          selected={sections.retention.checklist}
                          onChange={v => handleSectionChange('retention', 'checklist', v)}
                      />
                      <TextArea label="Retention Gaps" value={sections.retention.issues} onChange={e => handleSectionChange('retention', 'issues', e.target.value)} rows={3} />
                      <TextArea label="Recommended Flows" value={sections.retention.recommendations} onChange={e => handleSectionChange('retention', 'recommendations', e.target.value)} rows={3} />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 6. TECH */}
          <AuditSectionAccordion 
              title="6. Tech & Tracking" 
              score={calculateSectionScore('tech')} 
              maxScore={40} 
              isOpen={openSection === 'tech'}
              onToggle={() => setOpenSection(openSection === 'tech' ? null : 'tech')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="Pixel Setup" value={sections.tech.scores.pixel || 0} onChange={v => handleScoreChange('tech', 'pixel', v)} />
                      <ScoreInput label="GA4 Config" value={sections.tech.scores.ga4 || 0} onChange={v => handleScoreChange('tech', 'ga4', v)} />
                      <ScoreInput label="Event Match Quality" value={sections.tech.scores.events || 0} onChange={v => handleScoreChange('tech', 'events', v)} />
                      <ScoreInput label="UTM Strategy" value={sections.tech.scores.utm || 0} onChange={v => handleScoreChange('tech', 'utm', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Tracking Errors"
                          options={['Missing add_to_cart', 'Missing initiate_checkout', 'Wrong purchase value', 'No event deduplication', 'No GA4 events']}
                          selected={sections.tech.checklist}
                          onChange={v => handleSectionChange('tech', 'checklist', v)}
                      />
                      <TextArea label="Tracking Issues" value={sections.tech.issues} onChange={e => handleSectionChange('tech', 'issues', e.target.value)} rows={3} />
                      <TextArea label="Fix Recommendations" value={sections.tech.recommendations} onChange={e => handleSectionChange('tech', 'recommendations', e.target.value)} rows={3} />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 7. D2C FINAL SUMMARY */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="md:w-1/3 bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Overall Audit Score</h3>
                      <div className="flex items-center justify-center gap-2 mb-4">
                          <input 
                              type="number" 
                              min="0" 
                              max="100" 
                              value={sections.summary.scores.overall} 
                              onChange={e => handleScoreChange('summary', 'overall', parseInt(e.target.value) || 0)}
                              className="text-5xl font-black bg-transparent text-center w-24 focus:outline-none text-slate-800 dark:text-white border-b-2 border-slate-200 focus:border-premium-accent"
                          />
                          <span className="text-2xl font-bold text-slate-400">/ 100</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Leaving this score at 0 will automatically compute it based on section inputs: <b className="text-secondary-accent">{Math.round((( calculateSectionScore('website') + calculateSectionScore('funnel') + calculateSectionScore('ads') + calculateSectionScore('brand') + calculateSectionScore('retention') + calculateSectionScore('tech') ) / 220 ) * 100)}%</b>
                      </p>
                  </div>
                  <div className="md:w-2/3 space-y-5">
                      <div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              D2C Summary & Key Findings
                          </h4>
                          <TextArea value={sections.summary.issues} onChange={e => handleSectionChange('summary', 'issues', e.target.value)} rows={4} placeholder="Summarize the 3-5 most critical problems preventing E-Commerce growth..." className="bg-white dark:bg-slate-900" />
                      </div>
                      <div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <Send className="w-4 h-4 text-green-500" />
                              Strategic Recommended Roadmap
                          </h4>
                          <TextArea value={sections.summary.recommendations} onChange={e => handleSectionChange('summary', 'recommendations', e.target.value)} rows={4} placeholder="List the top priority actions to take immediately (CRO fixes, active flows, ad structure)..." className="bg-white dark:bg-slate-900" />
                      </div>
                  </div>
              </div>
          </div>
        </div>
      )}

      {/* OTHER / B2B CONDITIONAL ACCORDIONS */}
      {brandAuditType === 'B2B_Other' && (
        <div className="space-y-6">
          {/* 1. LEAD GENERATION & WEBSITE SEO */}
          <AuditSectionAccordion 
              title="1. Lead Generation & Website SEO" 
              score={calculateB2BSectionScore('leadGen')} 
              maxScore={40} 
              isOpen={openSection === 'leadGen'}
              onToggle={() => setOpenSection(openSection === 'leadGen' ? null : 'leadGen')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="SEO & Authority Rank" value={b2bSections.leadGen.scores.seoRank || 0} onChange={v => handleB2BScoreChange('leadGen', 'seoRank', v)} />
                      <ScoreInput label="CTA / Contact Clarity" value={b2bSections.leadGen.scores.ctaClarity || 0} onChange={v => handleB2BScoreChange('leadGen', 'ctaClarity', v)} />
                      <ScoreInput label="Lead Magnet Magnetism" value={b2bSections.leadGen.scores.leadMagnet || 0} onChange={v => handleB2BScoreChange('leadGen', 'leadMagnet', v)} />
                      <ScoreInput label="Case Study / Info Value" value={b2bSections.leadGen.scores.contentValue || 0} onChange={v => handleB2BScoreChange('leadGen', 'contentValue', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Critical Funnel/SEO Gaps"
                          options={['Weak SEO keywords search presence', 'No clear landing page CTA buttons', 'No option for secondary lead magnet', 'Website is slow / not mobile responsive', 'Missing active blog / value resource panel']}
                          selected={b2bSections.leadGen.checklist}
                          onChange={v => handleB2BSectionChange('leadGen', 'checklist', v)}
                      />
                      <TextArea label="Detailed Analysis" value={b2bSections.leadGen.issues} onChange={e => handleB2BSectionChange('leadGen', 'issues', e.target.value)} rows={3} placeholder="Describe specific B2B UI/SEO blockages..." />
                      <TextArea label="Strategic Recommendations" value={b2bSections.leadGen.recommendations} onChange={e => handleB2BSectionChange('leadGen', 'recommendations', e.target.value)} rows={3} placeholder="Actionable ways to increase organic conversions..." />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 2. SALES FUNNEL & NURTURE */}
          <AuditSectionAccordion 
              title="2. Sales Funnel & Nurture Strategy" 
              score={calculateB2BSectionScore('salesFunnel')} 
              maxScore={30} 
              isOpen={openSection === 'salesFunnel'}
              onToggle={() => setOpenSection(openSection === 'salesFunnel' ? null : 'salesFunnel')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="Email Campaign Sequences" value={b2bSections.salesFunnel.scores.emailSequence || 0} onChange={v => handleB2BScoreChange('salesFunnel', 'emailSequence', v)} />
                      <ScoreInput label="Lead Retargeting Setup" value={b2bSections.salesFunnel.scores.retargeting || 0} onChange={v => handleB2BScoreChange('salesFunnel', 'retargeting', v)} />
                      <ScoreInput label="Demo/Booking UX Efficiency" value={b2bSections.salesFunnel.scores.bookingUX || 0} onChange={v => handleB2BScoreChange('salesFunnel', 'bookingUX', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Friction Points"
                          options={['No email sequences setup for new leads', 'No active conversions retargeting', 'Too many fields in enquiry/booking form', 'No automated calendar sync calendar', 'Zero case-studies sent post-booking']}
                          selected={b2bSections.salesFunnel.checklist}
                          onChange={v => handleB2BSectionChange('salesFunnel', 'checklist', v)}
                      />
                      <TextArea label="Friction Gaps Analysis" value={b2bSections.salesFunnel.issues} onChange={e => handleB2BSectionChange('salesFunnel', 'issues', e.target.value)} rows={3} />
                      <TextArea label="Actionable Optimization Fixes" value={b2bSections.salesFunnel.recommendations} onChange={e => handleB2BSectionChange('salesFunnel', 'recommendations', e.target.value)} rows={3} />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 3. ADS & OUTBOUND CHANNELS */}
          <AuditSectionAccordion 
              title="3. Ads, Search & Outbound Outreach" 
              score={calculateB2BSectionScore('adsOutbound')} 
              maxScore={30} 
              isOpen={openSection === 'adsOutbound'}
              onToggle={() => setOpenSection(openSection === 'adsOutbound' ? null : 'adsOutbound')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="LinkedIn Content Quality" value={b2bSections.adsOutbound.scores.linkedinQuality || 0} onChange={v => handleB2BScoreChange('adsOutbound', 'linkedinQuality', v)} />
                      <ScoreInput label="Paid Search / Intent Quality" value={b2bSections.adsOutbound.scores.paidSearch || 0} onChange={v => handleB2BScoreChange('adsOutbound', 'paidSearch', v)} />
                      <ScoreInput label="Outbound Template Scripts" value={b2bSections.adsOutbound.scores.outboundCopy || 0} onChange={v => handleB2BScoreChange('adsOutbound', 'outboundCopy', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Acquisition Challenges"
                          options={['LinkedIn accounts look like boring resumes', 'Meta or Google search ads lack custom landing pages', 'Cold outbound campaigns lack personalization', 'No introductory VSL video presentation', 'Weak prospect lists build criteria']}
                          selected={b2bSections.adsOutbound.checklist}
                          onChange={v => handleB2BSectionChange('adsOutbound', 'checklist', v)}
                      />
                      <TextArea label="Outbound/Ads Friction" value={b2bSections.adsOutbound.issues} onChange={e => handleB2BSectionChange('adsOutbound', 'issues', e.target.value)} rows={3} />
                      <TextArea label="Channels Optimization Steps" value={b2bSections.adsOutbound.recommendations} onChange={e => handleB2BSectionChange('adsOutbound', 'recommendations', e.target.value)} rows={3} />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 4. OFFER & CONSULTATIVE FIT */}
          <AuditSectionAccordion 
              title="4. Value Offer & Positioning Clarity" 
              score={calculateB2BSectionScore('offerPositioning')} 
              maxScore={30} 
              isOpen={openSection === 'offerPositioning'}
              onToggle={() => setOpenSection(openSection === 'offerPositioning' ? null : 'offerPositioning')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="Offer No-Brainer Value" value={b2bSections.offerPositioning.scores.offerValue || 0} onChange={v => handleB2BScoreChange('offerPositioning', 'offerValue', v)} />
                      <ScoreInput label="Social Proof & Case Studies" value={b2bSections.offerPositioning.scores.caseStudies || 0} onChange={v => handleB2BScoreChange('offerPositioning', 'caseStudies', v)} />
                      <ScoreInput label="Pricing Model Structure" value={b2bSections.offerPositioning.scores.pricingStructure || 0} onChange={v => handleB2BScoreChange('offerPositioning', 'pricingStructure', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Offer Position Errors"
                          options={['No prominent high-quality case studies', 'Brand positioning sounds like generic "commodity"', 'Lack of solid risk-reversal guarantee', 'Unclear tier packaging choices', 'Pricing doesn\'t reflect value magnitude']}
                          selected={b2bSections.offerPositioning.checklist}
                          onChange={v => handleB2BSectionChange('offerPositioning', 'checklist', v)}
                      />
                      <TextArea label="Offer Structure Gaps" value={b2bSections.offerPositioning.issues} onChange={e => handleB2BSectionChange('offerPositioning', 'issues', e.target.value)} rows={3} />
                      <TextArea label="Value Positioning Fixes" value={b2bSections.offerPositioning.recommendations} onChange={e => handleB2BSectionChange('offerPositioning', 'recommendations', e.target.value)} rows={3} />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 5. CRM & SPEED TO CONTACT */}
          <AuditSectionAccordion 
              title="5. CRM, Responders & Pipelines" 
              score={calculateB2BSectionScore('crmFollowUp')} 
              maxScore={30} 
              isOpen={openSection === 'crmFollowUp'}
              onToggle={() => setOpenSection(openSection === 'crmFollowUp' ? null : 'crmFollowUp')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="Lead Response SLA Speed" value={b2bSections.crmFollowUp.scores.responseTime || 0} onChange={v => handleB2BScoreChange('crmFollowUp', 'responseTime', v)} />
                      <ScoreInput label="Automated Action Triggers" value={b2bSections.crmFollowUp.scores.automations || 0} onChange={v => handleB2BScoreChange('crmFollowUp', 'automations', v)} />
                      <ScoreInput label="Sales Pipeline Stages" value={b2bSections.crmFollowUp.scores.pipelineMgmt || 0} onChange={v => handleB2BScoreChange('crmFollowUp', 'pipelineMgmt', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="CRM Flow Gaps"
                          options={['Manual lead follow-up speeds are too slow', 'No automated text/email responders configured', 'Pipeline deals lack strict category stages', 'No system to resurrect stale opportunities', 'Important deal values are missing from layout']}
                          selected={b2bSections.crmFollowUp.checklist}
                          onChange={v => handleB2BSectionChange('crmFollowUp', 'checklist', v)}
                      />
                      <TextArea label="CRM Process Failures" value={b2bSections.crmFollowUp.issues} onChange={e => handleB2BSectionChange('crmFollowUp', 'issues', e.target.value)} rows={3} />
                      <TextArea label="Automation Fix Action" value={b2bSections.crmFollowUp.recommendations} onChange={e => handleB2BSectionChange('crmFollowUp', 'recommendations', e.target.value)} rows={3} />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 6. B2B TECH STACK & TRACKING */}
          <AuditSectionAccordion 
              title="6. B2B Tech Stack & GA4 Event Tracking" 
              score={calculateB2BSectionScore('techStack')} 
              maxScore={30} 
              isOpen={openSection === 'techStack'}
              onToggle={() => setOpenSection(openSection === 'techStack' ? null : 'techStack')}
          >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-5 space-y-4 border-r border-slate-100 dark:border-slate-700 pr-6">
                      <ScoreInput label="De-anonymization IQ" value={b2bSections.techStack.scores.dataIntents || 0} onChange={v => handleB2BScoreChange('techStack', 'dataIntents', v)} />
                      <ScoreInput label="Form GA4 Conversions" value={b2bSections.techStack.scores.formGA4 || 0} onChange={v => handleB2BScoreChange('techStack', 'formGA4', v)} />
                      <ScoreInput label="Marketing Scoring Rules" value={b2bSections.techStack.scores.scoringSetup || 0} onChange={v => handleB2BScoreChange('techStack', 'scoringSetup', v)} />
                  </div>
                  <div className="lg:col-span-7 space-y-6">
                      <CheckboxGroup 
                          title="Stack Mistakes"
                          options={['No reverse-IP visitor intelligence tools', 'Form submits not firing clean custom GA4 event', 'Pixel tracking missing on booking confirm panel', 'Lacks clean attribution routing headers', 'No lead enrichment data (Revenue, Tech)']}
                          selected={b2bSections.techStack.checklist}
                          onChange={v => handleB2BSectionChange('techStack', 'checklist', v)}
                      />
                      <TextArea label="Stack Gaps Analysis" value={b2bSections.techStack.issues} onChange={e => handleB2BSectionChange('techStack', 'issues', e.target.value)} rows={3} />
                      <TextArea label="Tools & Integrations Actions" value={b2bSections.techStack.recommendations} onChange={e => handleB2BSectionChange('techStack', 'recommendations', e.target.value)} rows={3} />
                  </div>
              </div>
          </AuditSectionAccordion>

          {/* 7. B2B FINAL SUMMARY */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-indigo-500 to-purple-500"></div>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="md:w-1/3 bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Overall Audit Score</h3>
                      <div className="flex items-center justify-center gap-2 mb-4">
                          <input 
                              type="number" 
                              min="0" 
                              max="100" 
                              value={b2bSections.summary.scores.overall} 
                              onChange={e => handleB2BScoreChange('summary', 'overall', parseInt(e.target.value) || 0)}
                              className="text-5xl font-black bg-transparent text-center w-24 focus:outline-none text-slate-800 dark:text-white border-b-2 border-slate-200 focus:border-premium-accent"
                          />
                          <span className="text-2xl font-bold text-slate-400">/ 100</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Leaving this score at 0 will automatically compute it based on section inputs: <b className="text-indigo-500">{Math.round((( calculateB2BSectionScore('leadGen') + calculateB2BSectionScore('salesFunnel') + calculateB2BSectionScore('adsOutbound') + calculateB2BSectionScore('offerPositioning') + calculateB2BSectionScore('crmFollowUp') + calculateB2BSectionScore('techStack') ) / 190 ) * 100)}%</b>
                      </p>
                  </div>
                  <div className="md:w-2/3 space-y-5">
                      <div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-teal-500" />
                              B2B/Other Summary & Core Findings
                          </h4>
                          <TextArea value={b2bSections.summary.issues} onChange={e => handleB2BSectionChange('summary', 'issues', e.target.value)} rows={4} placeholder="Summarize the core bottlenecks in lead generation, speed-to-contact, or outbound messaging..." className="bg-white dark:bg-slate-900" />
                      </div>
                      <div>
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide mb-2 flex items-center gap-2">
                              <Send className="w-4 h-4 text-indigo-500" />
                              Consultative Outbound Roadmap Recommendations
                          </h4>
                          <TextArea value={b2bSections.summary.recommendations} onChange={e => handleB2BSectionChange('summary', 'recommendations', e.target.value)} rows={4} placeholder="List out concrete execution steps (LinkedIn playbook, email copy rewrite, CRM responders config)..." className="bg-white dark:bg-slate-900" />
                      </div>
                  </div>
              </div>
          </div>
        </div>
      )}

    </div>
  );
};
