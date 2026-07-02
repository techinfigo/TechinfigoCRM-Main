import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { EmailMessage, EmailAttachment, EmailTemplate } from '../../types'; 
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import LoadingSpinner from '../LoadingSpinner';
import { Card } from '../common/Card'; // Added Card import


interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void; 
  onSaveEmail: (emailData: Partial<EmailMessage>, action: 'send' | 'draft') => Promise<boolean>;
  initialEmail?: Partial<EmailMessage>; 
  currentUserName: string;
  currentUserEmail: string;
  ai: GoogleGenAI | null;
  onSetDirty: (isDirty: boolean) => void; 
  emailTemplates: EmailTemplate[];
}

const ATTACHMENT_MAX_SIZE_MB = 5;
const ATTACHMENT_MAX_SIZE_BYTES = ATTACHMENT_MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];


interface LocalIconProps {
  className?: string;
}

const BoldIcon: React.FC<LocalIconProps> = () => ( <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6 4.75A1.25 1.25 0 017.25 3.5h3.355c1.92 0 3.395 1.443 3.395 3.25a3.17 3.17 0 01-1.42 2.655 3.17 3.17 0 011.83 2.72c0 2.022-1.636 3.625-3.805 3.625H7.25A1.25 1.25 0 016 14.25V4.75zm1.5.75v3.25h2.5c1.07 0 1.85-.756 1.85-1.625C11.85 6.256 11.07 5.5 10 5.5h-2.5zm0 4.75v3.25h2.8c1.24 0 2.2-.953 2.2-2.125s-.96-2.125-2.2-2.125h-2.8z" /></svg> );
const ItalicIcon: React.FC<LocalIconProps> = () => ( <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.75 4.25a.75.75 0 01.75-.75h4a.75.75 0 010 1.5h-1.349l-2.237 8.948H9.25a.75.75 0 010 1.5h-4a.75.75 0 010-1.5h1.349l2.237-8.948H7.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg> );
const LinkIcon: React.FC<LocalIconProps> = () => ( <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" /><path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 005.656 5.656l3-3a4 4 0 00-.225-5.865z" /></svg> );
const ListBulletIcon: React.FC<LocalIconProps> = () => ( <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 15.25z" clipRule="evenodd" /></svg> );
const PaperClipIcon: React.FC<LocalIconProps> = () => ( <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.53 9.514l3.453-3.552a.75.75 0 011.06 1.06l-3.453 3.552a1.125 1.125 0 001.592 1.591l3.455-3.553a3 3 0 000-4.242z" clipRule="evenodd" /></svg> );
const XMarkIcon: React.FC<LocalIconProps> = () => ( <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg> );
const SparklesIcon: React.FC<LocalIconProps> = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.423 3.595c-.736.771.256 1.991.984 1.991H6.9l-1.296 4.401c-.16.546.435.946.945.626L10 15.11l2.371 2.754c.484.563 1.377.206 1.486-.459l.526-3.23L15.013 18c.554.01.98-.426.98-.979l.003-3.712 2.768-.23c.63-.053.923-.83.486-1.309l-3.423-3.595-4.753-.39-1.83-4.401z" clipRule="evenodd" /></svg>;
const LoadingSpinnerIcon: React.FC<LocalIconProps> = () => (<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>);


export const EmailComposeModal: React.FC<EmailComposeModalProps> = ({
  isOpen, onClose, onSaveEmail, initialEmail, currentUserName, currentUserEmail, ai, onSetDirty, emailTemplates
}) => {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const initialFormStateRef = useRef<Partial<EmailMessage> & { attachmentsCount: number } | null>(null);

  // State for AI features (previously missing)
  const [showAiDraftPanel, setShowAiDraftPanel] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);


  const SENDER_EMAIL = currentUserEmail; 

  useEffect(() => {
    if (isOpen) {
      const currentInitial = {
        recipientEmail: initialEmail?.recipientEmail || '',
        cc: initialEmail?.cc || [],
        bcc: initialEmail?.bcc || [],
        subject: initialEmail?.subject || '',
        body: initialEmail?.body || '',
        attachmentsCount: 0 
      };
      setTo(currentInitial.recipientEmail);
      setCc(currentInitial.cc.join(', '));
      setBcc(currentInitial.bcc.join(', '));
      setSubject(currentInitial.subject);
      setBody(currentInitial.body);
      setAttachments([]); 
      initialFormStateRef.current = currentInitial;
      onSetDirty(false); 

      setIsProcessing(false);
      setError(null);
      setSuccessMessage(null);
      setShowAiDraftPanel(false);
      setAiPrompt('');
      setIsAiGenerating(false);
      setAiError(null);
    }
  }, [isOpen, initialEmail, onSetDirty]);
  
  useEffect(() => {
    if (!isOpen) return; 
    
    const currentFormState = {
      recipientEmail: to,
      cc: cc.split(',').map(s => s.trim()).filter(Boolean),
      bcc: bcc.split(',').map(s => s.trim()).filter(Boolean),
      subject: subject,
      body: body,
      attachmentsCount: attachments.length
    };

    let isDirty = false;
    if (initialFormStateRef.current) {
        if (JSON.stringify(currentFormState) !== JSON.stringify(initialFormStateRef.current)) {
            isDirty = true;
        }
    } else if (to || cc || bcc || subject || body || attachments.length > 0) {
      isDirty = true;
    }
    onSetDirty(isDirty);

  }, [to, cc, bcc, subject, body, attachments, isOpen, onSetDirty]);


  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setter(e.target.value);
    setError(null); 
  };
  
  const handleBodyChange = (e: React.FormEvent<HTMLDivElement>) => {
    setBody(e.currentTarget.innerHTML);
    setError(null);
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleLink = () => {
    const url = prompt("Enter the URL:");
    if (url) {
      handleFormat('createLink', url);
    }
  };


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files;
    if (files) {
      const newFiles: File[] = [];
      let currentTotalSize = attachments.reduce((sum, f) => sum + f.size, 0);
      let individualFileError = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          setError(`File type not allowed: ${file.name} (${file.type}). Allowed: PDF, JPG, PNG, DOC, DOCX.`);
          individualFileError = true;
          continue;
        }
        if (file.size > ATTACHMENT_MAX_SIZE_BYTES) {
          setError(`File too large: ${file.name} (Max ${ATTACHMENT_MAX_SIZE_MB}MB).`);
          individualFileError = true;
          continue;
        }
        if (currentTotalSize + file.size > ATTACHMENT_MAX_SIZE_MB * 2) { 
          setError(`Total attachment size exceeds limit (Max ${ATTACHMENT_MAX_SIZE_MB * 2}MB).`);
          break; 
        }
        newFiles.push(file);
        currentTotalSize += file.size;
      }
      if (!individualFileError && newFiles.length > 0) {
         setAttachments(prev => [...prev, ...newFiles]);
      }
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };
  
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processEmail = async (action: 'send' | 'draft') => {
    setError(null);
    setSuccessMessage(null);

    if (action === 'send') {
        if (!to.trim() || !/\S+@\S+\.\S+/.test(to.trim())) {
          setError("A valid recipient email is required for sending.");
          return;
        }
        if (!subject.trim()) {
          setError("Subject is required for sending.");
          return;
        }
        if (!body.trim()) {
          setError("Message body cannot be empty for sending.");
          return;
        }
    } else { 
        if (!subject.trim() && !body.trim() && !to.trim() && attachments.length === 0) {
            setError("Cannot save an empty draft. Please add a recipient, subject, body, or attachment.");
            return;
        }
    }

    setIsProcessing(true);
    const emailData: Partial<EmailMessage> & { attachmentsFromFiles?: File[] } = {
      id: initialEmail?.id, 
      senderEmail: SENDER_EMAIL,
      recipientEmail: to.trim(),
      cc: cc.split(',').map(s => s.trim()).filter(s => s && /\S+@\S+\.\S+/.test(s)),
      bcc: bcc.split(',').map(s => s.trim()).filter(s => s && /\S+@\S+\.\S+/.test(s)),
      subject: subject.trim(),
      body: body,
      attachmentsFromFiles: attachments, 
      timestamp: new Date().toISOString(),
      folder: action === 'send' ? 'sent' : 'drafts',
      isRead: action === 'send' ? true : undefined,
    };

    const success = await onSaveEmail(emailData, action);
    setIsProcessing(false);
    if (success) {
      setSuccessMessage(`Email successfully ${action === 'send' ? 'sent' : 'saved as draft'}!`);
      onClose(); 
    } else {
      setError(`Failed to ${action} email. Please try again.`);
    }
  };

  const handleAiAction = async (aiTask: 'draft_new' | 'improve_existing') => {
    if (!ai) {
      setAiError("AI service is not available. Check API key.");
      return;
    }
    if (!aiPrompt.trim() && aiTask === 'draft_new') {
      setAiError("Please enter a prompt for the AI to draft an email.");
      return;
    }
    if (!body.trim() && aiTask === 'improve_existing') {
      setAiError("There is no existing email body to improve.");
      return;
    }

    setIsAiGenerating(true);
    setAiError(null);

    const systemInstruction = "You are an expert marketing assistant helping to draft professional and persuasive emails. Respond concisely and focus on email content only.";
    let contentForAi = '';

    if (aiTask === 'draft_new') {
      contentForAi = `Draft an email based on the following prompt: "${aiPrompt}". Client/Recipient: ${to || '[Recipient Name]'}. My name is ${currentUserName}.`;
    } else { // improve_existing
      contentForAi = `Improve the following email body for clarity, tone, and persuasiveness. My name is ${currentUserName}. Email body to improve: --- ${body} ---`;
    }
    
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: contentForAi,
        config: { systemInstruction }
      });
      setBody(response.text); 
      setSuccessMessage("AI has updated the email body.");
    } catch (e: any) {
      console.error("Error with AI generation:", e);
      setAiError(`AI generation failed: ${e.message || "Unknown error"}`);
    } finally {
      setIsAiGenerating(false);
    }
  };


  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={initialEmail?.id ? "Edit Draft" : "Compose New Email"} 
        size="4xl"
        footer={
            <div className="flex justify-between w-full items-center">
                <Button variant="ghost" onClick={() => setShowAiDraftPanel(!showAiDraftPanel)} leftIcon={<SparklesIcon />} size="sm" disabled={!ai}>
                    {showAiDraftPanel ? 'Hide AI Tools' : 'AI Email Tools'}
                </Button>
                <div className="space-x-2">
                    <Button variant="secondary" onClick={() => processEmail('draft')} disabled={isProcessing}>
                        {isProcessing ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button variant="primary" onClick={() => processEmail('send')} disabled={isProcessing}>
                        {isProcessing ? 'Sending...' : 'Send Email'}
                    </Button>
                </div>
            </div>
        }
    >
      <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
        {error && <p className="text-sm text-red-600 bg-red-100 dark:bg-red-700/20 p-2 rounded-md border border-red-300 dark:border-red-500">{error}</p>}
        {successMessage && <p className="text-sm text-green-600 bg-green-100 dark:bg-green-700/20 p-2 rounded-md border border-green-300 dark:border-green-500">{successMessage}</p>}
        
        <Input label="From" id="from" name="from" value={`${currentUserName} <${SENDER_EMAIL}>`} readOnly disabled containerClassName="text-sm" className="!bg-slate-100 dark:!bg-slate-700"/>
        <Input label="To" id="to" name="to" type="email" placeholder="recipient@example.com" value={to} onChange={handleInputChange(setTo)} containerClassName="text-sm"/>
        <Input label="CC" id="cc" name="cc" type="text" placeholder="cc@example.com (comma-separated)" value={cc} onChange={handleInputChange(setCc)} containerClassName="text-sm"/>
        <Input label="BCC" id="bcc" name="bcc" type="text" placeholder="bcc@example.com (comma-separated)" value={bcc} onChange={handleInputChange(setBcc)} containerClassName="text-sm"/>
        <Input label="Subject" id="subject" name="subject" placeholder="Email Subject" value={subject} onChange={handleInputChange(setSubject)} containerClassName="text-sm"/>

        {/* Editor Wrapper */}
        <div className="rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-bg-base dark:focus-within:ring-offset-bg-muted focus-within:ring-premium-accent transition-all">
          {/* Toolbar */}
          <div className="p-2 bg-slate-100 dark:bg-slate-700 border-b border-slate-300 dark:border-slate-600 flex items-center space-x-2">
              <Button variant="ghost" size="xs" className="p-1" title="Bold" onClick={() => handleFormat('bold')}><BoldIcon/></Button>
              <Button variant="ghost" size="xs" className="p-1" title="Italic" onClick={() => handleFormat('italic')}><ItalicIcon/></Button>
              <Button variant="ghost" size="xs" className="p-1" title="Insert Link" onClick={handleLink}><LinkIcon/></Button>
              <Button variant="ghost" size="xs" className="p-1" title="Bulleted List" onClick={() => handleFormat('insertUnorderedList')}><ListBulletIcon/></Button>
              <Button type="button" variant="ghost" size="xs" className="p-1" onClick={() => fileInputRef.current?.click()} title="Attach Files"><PaperClipIcon/></Button>
              <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </div>
          {/* Text Area */}
          <div
            ref={editorRef}
            contentEditable="true"
            onInput={handleBodyChange}
            dangerouslySetInnerHTML={{ __html: body }}
            className="flex-grow p-3 focus:outline-none min-h-[250px] !text-sm prose prose-sm dark:prose-invert max-w-none"
            role="textbox"
            aria-multiline="true"
            aria-label="Email body"
          />
        </div>


        {attachments.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-text-muted dark:text-text-muted mb-1">Attachments ({attachments.length}):</h4>
            <ul className="space-y-1">
              {attachments.map((file, index) => (
                <li key={index} className="flex items-center justify-between text-xs p-1.5 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
                  <span className="truncate" title={file.name}>{file.name} ({formatFileSize(file.size)})</span>
                  <Button variant="ghost" size="xs" onClick={() => handleRemoveAttachment(index)} className="p-0.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-700/20"><XMarkIcon/></Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Drafting Panel */}
        {showAiDraftPanel && ai && (
            <Card title="AI Email Assistant" icon={<SparklesIcon/>} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 mt-4">
                <div className="space-y-3">
                    <TextArea 
                        label="AI Prompt / Instructions"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={2}
                        placeholder="e.g., Write a follow-up email asking about the proposal we sent last week."
                        className="!text-sm"
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleAiAction('draft_new')} 
                            disabled={isAiGenerating}
                            leftIcon={isAiGenerating ? <LoadingSpinnerIcon /> : undefined}
                        >
                            {isAiGenerating ? 'Drafting...' : 'Draft New Email with AI'}
                        </Button>
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAiAction('improve_existing')} 
                            disabled={isAiGenerating || !body.trim()}
                            leftIcon={isAiGenerating ? <LoadingSpinnerIcon /> : undefined}
                        >
                            {isAiGenerating ? 'Improving...' : 'Improve Existing Body'}
                        </Button>
                    </div>
                    {aiError && <p className="text-xs text-red-600">{aiError}</p>}
                </div>
            </Card>
        )}
      </form>
    </Modal>
  );
};
