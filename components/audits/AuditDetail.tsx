import React, { useState } from 'react';
import { Audit, D2CAuditSection, D2CAuditData, B2BAuditSection, B2BAuditData } from '../../types';
import { Button } from '../common/Button';
import { ArrowLeft, Calendar, Download, ExternalLink, FileText, Video, Edit, Check, Send, BarChart3, PieChart, Info, AlertOctagon } from 'lucide-react';
import { AuditStatusBadge } from './AuditStatusBadge';
import { AuditTypeBadge } from './AuditTypeBadge';
import { ScoreBadge } from './ScoreBadge';
import { SectionCard } from './SectionCard';
import { TextArea } from '../common/Input';
import { safeFormatDate } from '@/utils';

interface AuditDetailProps {
  audit: Audit;
  onBack: () => void;
  onEdit?: (audit: Audit) => void;
  onMarkSent?: (audit: Audit) => void;
}

const ScoreProgressBar = ({ label, score, max, colorClass }: { label: string, score: number, max: number, colorClass: string }) => {
    const percentage = Math.min(100, Math.round((score / max) * 100));
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs mb-1 font-medium">
                <span className="text-slate-700 dark:text-slate-300">{label}</span>
                <span className="text-slate-900 dark:text-white">{score}/{max}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

export const AuditDetail: React.FC<AuditDetailProps> = ({ audit, onBack, onEdit, onMarkSent }) => {
  const brandAuditType = audit.brandAuditType || (audit.d2cAuditData ? 'D2C' : 'B2B_Other');
  const [activeTab, setActiveTab] = useState('Overview');

  const d2cData = audit.d2cAuditData;
  const b2bData = audit.b2bAuditData;

  const calculateSectionScore = (sectionKey: string) => {
      if (brandAuditType === 'D2C' && d2cData) {
          const section = d2cData[sectionKey as keyof D2CAuditData];
          if (!section) return 0;
          return (Object.values(section.scores) as number[]).reduce((a, b) => a + b, 0);
      } else if (brandAuditType === 'B2B_Other' && b2bData) {
          const section = b2bData[sectionKey as keyof B2BAuditData];
          if (!section) return 0;
          return (Object.values(section.scores) as number[]).reduce((a, b) => a + b, 0);
      }
      return 0;
  };

  const tabNames = brandAuditType === 'D2C' 
    ? ['Overview', 'Funnel Issues', 'Creative & Ads', 'Website & CRO', 'Action Plan']
    : ['Overview', 'Sales Funnel', 'Ads & Outbound', 'Lead Gen & SEO', 'Action Plan'];

  const renderTabContent = () => {
      // Helper to render whitespace preserved text
      const renderText = (text?: string) => (
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
              {text || "No detailed analysis provided for this section."}
          </p>
      );

      // Map tabs between D2C and B2B equivalents to reuse render cases
      switch (activeTab) {
          case 'Overview':
              return (
                <div className="space-y-6">
                    {brandAuditType === 'D2C' && d2cData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                             <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-premium-accent" /> 
                                    Score Breakdown
                                </h4>
                                <ScoreProgressBar label="Website & CRO" score={calculateSectionScore('website')} max={50} colorClass="bg-blue-500" />
                                <ScoreProgressBar label="Funnel & Journey" score={calculateSectionScore('funnel')} max={30} colorClass="bg-purple-500" />
                                <ScoreProgressBar label="Ads & Creative" score={calculateSectionScore('ads')} max={40} colorClass="bg-amber-500" />
                                <ScoreProgressBar label="Brand & Offer" score={calculateSectionScore('brand')} max={30} colorClass="bg-rose-500" />
                                <ScoreProgressBar label="Retention" score={calculateSectionScore('retention')} max={30} colorClass="bg-emerald-500" />
                                <ScoreProgressBar label="Tech & Tracking" score={calculateSectionScore('tech')} max={40} colorClass="bg-indigo-500" />
                             </div>
                             <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-border-base dark:border-border-muted flex flex-col">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-premium-accent" />
                                    Summary & Findings
                                </h4>
                                <div className="flex-grow">
                                    {renderText(audit.auditData?.executiveSummary || audit.notes || d2cData.summary.issues)}
                                </div>
                             </div>
                        </div>
                    )}

                    {brandAuditType === 'B2B_Other' && b2bData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                             <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-indigo-500" /> 
                                    Score Breakdown
                                </h4>
                                <ScoreProgressBar label="Lead Gen & Web SEO" score={calculateSectionScore('leadGen')} max={40} colorClass="bg-teal-500" />
                                <ScoreProgressBar label="Sales Funnel & Nurture" score={calculateSectionScore('salesFunnel')} max={30} colorClass="bg-indigo-500" />
                                <ScoreProgressBar label="Ads, Search & Outbound" score={calculateSectionScore('adsOutbound')} max={30} colorClass="bg-purple-500" />
                                <ScoreProgressBar label="Offer & Positioning" score={calculateSectionScore('offerPositioning')} max={30} colorClass="bg-emerald-500" />
                                <ScoreProgressBar label="CRM, Responders & Pipelines" score={calculateSectionScore('crmFollowUp')} max={30} colorClass="bg-rose-500" />
                                <ScoreProgressBar label="B2B Tech Stack" score={calculateSectionScore('techStack')} max={30} colorClass="bg-amber-500" />
                             </div>
                             <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-border-base dark:border-border-muted flex flex-col">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <PieChart className="w-4 h-4 text-indigo-500" />
                                    B2B Summary & Key Findings
                                </h4>
                                <div className="flex-grow">
                                    {renderText(audit.notes || b2bData.summary.issues)}
                                </div>
                             </div>
                        </div>
                    )}

                    {!d2cData && !b2bData && (
                         <div>
                            <h3 className="text-base font-medium text-slate-900 dark:text-white mb-2">Executive Summary</h3>
                            {renderText(audit.auditData?.executiveSummary || audit.notes)}
                        </div>
                    )}
                </div>
              );

          case 'Funnel Issues':
          case 'Sales Funnel':
               return (
                <div>
                    <h3 className="text-base font-medium text-slate-900 dark:text-white mb-2">
                      {brandAuditType === 'D2C' ? 'Funnel Analysis' : 'Sales Funnel & Nurture Strategy'}
                    </h3>
                    
                    {/* Checklists */}
                    {brandAuditType === 'D2C' && d2cData?.funnel.checklist && d2cData.funnel.checklist.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {d2cData.funnel.checklist.map(item => (
                          <span key={item} className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-100 dark:border-red-900/30">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                    {brandAuditType === 'B2B_Other' && b2bData?.salesFunnel.checklist && b2bData.salesFunnel.checklist.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {b2bData.salesFunnel.checklist.map(item => (
                          <span key={item} className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-100 dark:border-red-900/30">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {renderText(brandAuditType === 'D2C' ? d2cData?.funnel.issues : b2bData?.salesFunnel.issues)}
                    
                    {((brandAuditType === 'D2C' && d2cData?.funnel.recommendations) || (brandAuditType === 'B2B_Other' && b2bData?.salesFunnel.recommendations)) && (
                        <div className="mt-4 bg-green-50 dark:bg-green-905/10 p-4 rounded-lg border border-green-100 dark:border-green-800/30">
                            <h4 className="text-sm font-bold text-green-850 dark:text-green-300 mb-2">Recommendations</h4>
                            {renderText(brandAuditType === 'D2C' ? d2cData?.funnel.recommendations : b2bData?.salesFunnel.recommendations)}
                        </div>
                    )}
                </div>
              );

          case 'Creative & Ads':
          case 'Ads & Outbound':
               return (
                <div>
                    <h3 className="text-base font-medium text-slate-900 dark:text-white mb-2">
                      {brandAuditType === 'D2C' ? 'Creative & Ads Analysis' : 'Ads & Outbound Outreach Strategy'}
                    </h3>

                    {/* Checklists */}
                    {brandAuditType === 'D2C' && d2cData?.ads.checklist && d2cData.ads.checklist.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {d2cData.ads.checklist.map(item => (
                          <span key={item} className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-100 dark:border-red-900/30">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                    {brandAuditType === 'B2B_Other' && b2bData?.adsOutbound.checklist && b2bData.adsOutbound.checklist.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {b2bData.adsOutbound.checklist.map(item => (
                          <span key={item} className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-100 dark:border-red-900/30">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {renderText(brandAuditType === 'D2C' ? d2cData?.ads.issues : b2bData?.adsOutbound.issues)}
                    
                    {((brandAuditType === 'D2C' && d2cData?.ads.recommendations) || (brandAuditType === 'B2B_Other' && b2bData?.adsOutbound.recommendations)) && (
                        <div className="mt-4 bg-green-50 dark:bg-green-905/10 p-4 rounded-lg border border-green-100 dark:border-green-800/30">
                            <h4 className="text-sm font-bold text-green-850 dark:text-green-300 mb-2">Recommendations</h4>
                            {renderText(brandAuditType === 'D2C' ? d2cData?.ads.recommendations : b2bData?.adsOutbound.recommendations)}
                        </div>
                    )}
                </div>
              );

          case 'Website & CRO':
          case 'Lead Gen & SEO':
               return (
                <div>
                    <h3 className="text-base font-medium text-slate-900 dark:text-white mb-2">
                      {brandAuditType === 'D2C' ? 'Website & CRO Analysis' : 'Lead Generation & Website SEO Analysis'}
                    </h3>

                    {/* Checklists */}
                    {brandAuditType === 'D2C' && d2cData?.website.checklist && d2cData.website.checklist.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {d2cData.website.checklist.map(item => (
                          <span key={item} className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-100 dark:border-red-900/30">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                    {brandAuditType === 'B2B_Other' && b2bData?.leadGen.checklist && b2bData.leadGen.checklist.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {b2bData.leadGen.checklist.map(item => (
                          <span key={item} className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-100 dark:border-red-900/30">
                            <AlertOctagon className="w-3.5 h-3.5" />
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {renderText(brandAuditType === 'D2C' ? d2cData?.website.issues : b2bData?.leadGen.issues)}
                    
                    {((brandAuditType === 'D2C' && d2cData?.website.recommendations) || (brandAuditType === 'B2B_Other' && b2bData?.leadGen.recommendations)) && (
                        <div className="mt-4 bg-green-50 dark:bg-green-905/10 p-4 rounded-lg border border-green-100 dark:border-green-800/30">
                            <h4 className="text-sm font-bold text-green-850 dark:text-green-300 mb-2">Recommendations</h4>
                            {renderText(brandAuditType === 'D2C' ? d2cData?.website.recommendations : b2bData?.leadGen.recommendations)}
                        </div>
                    )}
                </div>
              );

          case 'Action Plan':
               return (
                <div>
                    <h3 className="text-base font-medium text-slate-900 dark:text-white mb-2">Action Plan</h3>
                    {renderText(audit.auditData?.actionPlan || (brandAuditType === 'D2C' ? d2cData?.summary.recommendations : b2bData?.summary.recommendations))}
                </div>
              );
          default:
              return null;
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4"/>} className="text-slate-500">Back</Button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{audit.title}</h1>
                    <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">#{audit.id.slice(-6)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 ml-1">
                    <span className="p-1 px-2.5 bg-indigo-50 dark:bg-indigo-950/25 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-full border border-indigo-100 dark:border-indigo-900/30">
                      {brandAuditType === 'D2C' ? 'D2C Brand Growth framework' : 'B2B, SaaS & Service framework'}
                    </span>
                    <AuditTypeBadge type={audit.entityType} />
                    <AuditStatusBadge status={audit.status} />
                    <span className="text-sm text-slate-500 dark:text-slate-400">For: <span className="font-semibold text-slate-700 dark:text-slate-200">{audit.entityName}</span></span>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {audit.score !== undefined && <ScoreBadge score={audit.score} className="text-lg px-4 py-2" />}
                {onEdit && (
                    <Button variant="primary" onClick={() => onEdit(audit)} leftIcon={<Edit className="w-4 h-4"/>}>Edit Audit</Button>
                )}
                {onMarkSent && audit.status !== 'Sent' && (
                     <Button variant="outline" onClick={() => onMarkSent(audit)} leftIcon={<Send className="w-4 h-4"/>}>Mark Sent</Button>
                )}
            </div>
        </div>

        {/* Middle Section: Meta & Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
                <SectionCard title="Summary info">
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Category</dt><dd className="font-medium dark:text-white">{audit.entityType}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Created At</dt><dd className="font-medium dark:text-white">{safeFormatDate(audit.dateCreated)}</dd></div>
                        <div className="flex justify-between"><dt className="text-slate-500 dark:text-slate-400">Conducted At</dt><dd className="font-medium dark:text-white">{safeFormatDate(audit.dateCreated)}</dd></div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                            <dt className="text-slate-500 dark:text-slate-400 mb-1">Tags</dt>
                            <dd className="flex flex-wrap gap-2">
                                {audit.tags?.map(tag => <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs">{tag}</span>) || <span className="text-slate-400 italic">No tags</span>}
                            </dd>
                        </div>
                    </dl>
                </SectionCard>
            </div>
            <div className="md:col-span-2">
                <SectionCard title="Resources & Walkthrough walkthrough">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center text-center gap-3 hover:border-slate-300 transition-colors">
                            <FileText className="w-8 h-8 text-red-500" />
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">Audit PDF report</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Download the full custom report</p>
                            </div>
                            <Button size="sm" variant="outline" leftIcon={<Download className="w-4 h-4"/>} disabled={!audit.pdfUrl}>View report</Button>
                        </div>
                        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center text-center gap-3 hover:border-slate-300 transition-colors">
                            <Video className="w-8 h-8 text-purple-500" />
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white">Loom Walkthrough</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Watch the direct walkthrough video</p>
                            </div>
                            <Button size="sm" variant="outline" leftIcon={<ExternalLink className="w-4 h-4"/>} disabled={!audit.loomUrl} onClick={() => window.open(audit.loomUrl, '_blank')}>Watch Loom</Button>
                        </div>
                    </div>
                </SectionCard>
            </div>
        </div>

        {/* Bottom Section: Content Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="border-b border-slate-200 dark:border-slate-700 px-6 overflow-x-auto">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabNames.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab ? 'border-premium-accent text-premium-accent' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-6 space-y-6 min-h-[200px]">
                {renderTabContent()}
                
                <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Internal Notes</h4>
                    <div className="flex gap-3">
                         <p className="text-sm text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-3 rounded w-full border border-slate-100 dark:border-slate-700">
                             {audit.notes || "No internal notes recorded."}
                         </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
