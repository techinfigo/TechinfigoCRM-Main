
import React, { useState, useEffect, useMemo } from 'react';
import { Proposal, Client, Lead, ProposalStatus, proposalStatuses } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, Loader2 } from 'lucide-react';

// Icons
const SparklesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.423 3.595c-.736.771.256 1.991.984 1.991H6.9l-1.296 4.401c-.16.546.435.946.945.626L10 15.11l2.371 2.754c.484.563 1.377.206 1.486-.459l.526-3.23L15.013 18c.554.01.98-.426.98-.979l.003-3.712 2.768-.23c.63-.053.923-.83.486-1.309l-3.423-3.595-4.753-.39-1.83-4.401z" clipRule="evenodd" /></svg>;

interface ProposalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (proposal: Omit<Proposal, 'id' | 'clientName' | 'proposalNumber' | 'version'> & { id?: string }) => void;
  proposal: Proposal | null;
  clients: Client[];
  leads: Lead[];
  /** When creating a proposal from a Lead (or Client) detail view, preselect that record. */
  prefillClientId?: string;
  getNextProposalNumber: () => string;
  ai: GoogleGenAI | null;
}

interface ProposalFormData {
  clientId: string;
  status: ProposalStatus;
  validUntilDate: string;
  title: string;
  content: string;
  estimatedBudget: string;
  timeline: string;
}

export const ProposalFormModal: React.FC<ProposalFormModalProps> = ({ isOpen, onClose, onSave, proposal, clients, leads, prefillClientId, getNextProposalNumber, ai }) => {
  const [formData, setFormData] = useState<ProposalFormData>({
    clientId: '',
    status: 'Draft',
    validUntilDate: '',
    title: '',
    content: '',
    estimatedBudget: '',
    timeline: '',
  });
  
  const [isGenerating, setIsGenerating] = useState(false);

  // A real, previously-saved proposal always has an id. Callers that only want to
  // preselect a record pass `prefillClientId` instead of a stub proposal object,
  // so this stays false and the form behaves as "create new".
  const isEditing = !!proposal?.id;

  // Leads and Clients both live in the proposal's `clientId` field, so offer both.
  const recipientOptions = useMemo(() => {
    const clientOpts = clients.map(c => ({
      id: c.id,
      label: `${c.name}${c.companyName ? ` (${c.companyName})` : ''}`,
      group: 'Clients' as const,
    }));
    const leadOpts = leads.map(l => ({
      id: l.id,
      label: `${l.name}${l.companyName ? ` (${l.companyName})` : ''}`,
      group: 'Leads' as const,
    }));
    return { clientOpts, leadOpts };
  }, [clients, leads]);

  useEffect(() => {
    if (isOpen) {
      const defaultValidUntil = new Date();
      defaultValidUntil.setDate(defaultValidUntil.getDate() + 14); // 2 weeks default validity
      const defaultValidUntilStr = defaultValidUntil.toISOString().split('T')[0];

      if (isEditing && proposal) {
        setFormData({
            clientId: proposal.clientId,
            status: proposal.status || 'Draft',
            validUntilDate: proposal.validUntilDate || defaultValidUntilStr,
            title: proposal.title || proposal.subject || '',
            content: proposal.message || proposal.content || '', // Handle legacy message field mapping
            estimatedBudget: proposal.estimatedBudget || '',
            timeline: proposal.timeline || '',
        });
      } else {
        // New proposal. Preselect the lead/client we were opened from, if any.
        const preselected =
          prefillClientId ||
          proposal?.clientId ||
          (clients.length > 0 ? clients[0].id : '');

        setFormData({
            clientId: preselected,
            status: 'Draft',
            validUntilDate: defaultValidUntilStr,
            title: '',
            content: '',
            estimatedBudget: '',
            timeline: '',
        });
      }
    }
  }, [isOpen, proposal, clients, isEditing, prefillClientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateAI = async () => {
    if (!ai) {
        alert("AI Service not available.");
        return;
    }
    if (!formData.title) {
        alert("Please enter a Proposal Title first to give context to the AI.");
        return;
    }

    const clientName =
        clients.find(c => c.id === formData.clientId)?.name ||
        leads.find(l => l.id === formData.clientId)?.name ||
        "the client";
    setIsGenerating(true);

    try {
        const prompt = `Write a professional marketing proposal for a client named "${clientName}".
        Project Title: "${formData.title}".
        ${formData.estimatedBudget ? `Budget: ${formData.estimatedBudget}.` : ''}
        ${formData.timeline ? `Timeline: ${formData.timeline}.` : ''}
        
        Structure the proposal with:
        1. Executive Summary
        2. Scope of Work
        3. Deliverables
        4. Terms & Conditions
        
        Keep it concise, persuasive, and professional. Use Markdown formatting.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const generatedText = response.text;
        setFormData(prev => ({ ...prev, content: generatedText }));
    } catch (error) {
        console.error("AI Generation failed", error);
        alert("Failed to generate content. Please try again.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
        alert("Please select a client.");
        return;
    }
    if (!formData.title) {
        alert("Please enter a proposal title.");
        return;
    }

    const saveData: Omit<Proposal, 'id' | 'clientName' | 'proposalNumber' | 'version'> & { id?: string } = {
        id: proposal?.id,
        clientId: formData.clientId,
        status: formData.status,
        validUntilDate: formData.validUntilDate,
        title: formData.title,
        content: formData.content, // Maps to message/content in parent logic
        message: formData.content, // Ensure backward compatibility if types use message
        estimatedBudget: formData.estimatedBudget,
        timeline: formData.timeline,
        generatedDate: proposal?.generatedDate || new Date().toISOString(),
        lastUpdatedDate: new Date().toISOString(),
      };
      onSave(saveData);
  };
  
  const selectBaseClass = "w-full p-2.5 bg-bg-base dark:bg-bg-muted border border-border-base dark:border-border-muted rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-premium-accent dark:focus:ring-premium-accent focus:border-premium-accent dark:focus:border-premium-accent text-sm text-text-base dark:text-text-base";
  const labelClass = "block text-sm font-medium text-text-muted dark:text-text-muted mb-1";

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={isEditing && proposal ? `Edit Proposal: ${proposal.proposalNumber}` : "Create New Proposal"}
        size="4xl"
        footer={
            <div className="flex justify-end gap-2 w-full">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button type="button" variant="primary" onClick={handleSubmit}>Save Proposal</Button>
            </div>
        }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Row 1: Client & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="clientId" className={labelClass}>Client/Lead *</label>
                <select
                    id="clientId"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                    className={selectBaseClass}
                    required
                    disabled={isEditing} // Lock the recipient only when editing a saved proposal
                >
                    <option value="" disabled>Select a Client or Lead</option>
                    {recipientOptions.clientOpts.length > 0 && (
                        <optgroup label="Clients">
                            {recipientOptions.clientOpts.map(o => (
                                <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                        </optgroup>
                    )}
                    {recipientOptions.leadOpts.length > 0 && (
                        <optgroup label="Leads">
                            {recipientOptions.leadOpts.map(o => (
                                <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                        </optgroup>
                    )}
                </select>
            </div>
            <div>
                <label htmlFor="status" className={labelClass}>Status</label>
                <select 
                    id="status" 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    className={selectBaseClass}
                >
                    {proposalStatuses.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Row 2: Title & Validity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
                <Input 
                    label="Proposal Title *" 
                    id="title" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    placeholder="e.g., SEO Strategy Q4 2024" 
                    required 
                />
            </div>
            <div>
                <Input 
                    label="Valid Until" 
                    id="validUntilDate" 
                    name="validUntilDate" 
                    type="date" 
                    value={formData.validUntilDate} 
                    onChange={handleChange} 
                />
            </div>
        </div>

        {/* Row 3: Budget & Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input 
                label="Estimated Budget" 
                id="estimatedBudget" 
                name="estimatedBudget" 
                value={formData.estimatedBudget} 
                onChange={handleChange} 
                placeholder="e.g., ₹1,50,000" 
            />
             <Input 
                label="Timeline" 
                id="timeline" 
                name="timeline" 
                value={formData.timeline} 
                onChange={handleChange} 
                placeholder="e.g., 3 Months" 
            />
        </div>

        {/* Content Section with AI */}
        <div>
            <div className="flex justify-between items-end mb-2">
                <label htmlFor="content" className={labelClass}>Proposal Content (Markdown Supported)</label>
                {ai && (
                    <Button 
                        type="button" 
                        variant="secondary" 
                        size="xs" 
                        onClick={handleGenerateAI} 
                        disabled={isGenerating || !formData.title}
                        className="!py-1 !px-2 text-xs"
                        leftIcon={isGenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3 text-purple-500"/>}
                    >
                        {isGenerating ? 'Drafting...' : 'Auto-Draft with AI'}
                    </Button>
                )}
            </div>
            <TextArea 
                id="content" 
                name="content" 
                value={formData.content} 
                onChange={handleChange} 
                rows={12} 
                placeholder="## Executive Summary&#10;&#10;Enter proposal details here..." 
                className="font-mono text-sm"
            />
        </div>
      </form>
    </Modal>
  );
};
