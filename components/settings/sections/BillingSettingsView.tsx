
import React, { useState, useRef } from 'react';
import { SettingsSectionCard } from '../SettingsSectionCard';
import { Button } from '../../common/Button';
import { Input, TextArea } from '../../common/Input';
import { ToggleSwitch } from '../../common/ToggleSwitch';
import { Card } from '../../common/Card';

// --- ICONS (self-contained for modularity) ---
const BanknotesIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10.833 2.1a1.5 1.5 0 00-1.666 0l-7.5 4.167A1.5 1.5 0 001 7.833v4.334A1.5 1.5 0 002.5 13.5v.5a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5v-.5a1.5 1.5 0 001.5-1.333V7.833A1.5 1.5 0 0018.5 6.267l-7.5-4.167zM10 4.167l6 3.333H4l6-3.333zM3 9.167v3.166A1.5 1.5 0 002.5 14h.01a1.48 1.48 0 00.323.041L5 13.333V9.167H3zm14 0v4.166l-2.167.75A1.5 1.5 0 0015 14.5v-1h.5a1.5 1.5 0 000-3H15v-.5a1.5 1.5 0 00-.5-1.333V9.167h2zm-4 .333a.5.5 0 01.5.5v1a.5.5 0 01-.5.5h-5a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h5z" /></svg>;
const DocumentTextIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zM10 12.5a.75.75 0 01-.75-.75V7.523l3.248 3.248a.75.75 0 010 1.06l-2.121 2.121a.75.75 0 01-1.061 0zM9.25 7.5a.75.75 0 010-1.5h.5a.75.75 0 01.75.75v.017l-2.25 2.25V7.5z" clipRule="evenodd" /></svg>;
const ArrowDownTrayIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const PencilIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path d="M11.354 1.646a.5.5 0 0 1 .708 0l2.292 2.292a.5.5 0 0 1 0 .708L5.061 13.939a.5.5 0 0 1-.353.146H2.5a.5.5 0 0 1-.5-.5V11.293a.5.5 0 0 1 .146-.353L11.354 1.646ZM12.5 2.5 4.207 10.793V13h2.207L13.5 4.707 12.5 3.707V2.5Z" /><path d="m10.854 3.146 2.292 2.292-8.5 8.5H2.5v-2.292l8.5-8.5Z" /></svg>;
const AtSymbolIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14Zm0-2A5 5 0 1 1 8 3a5 5 0 0 1 0 10Z" /><path d="M8 13A5 5 0 1 0 8 3a5 5 0 0 0 0 10Zm0-2.5A2.5 2.5 0 1 0 8 5.5a2.5 2.5 0 0 0 0 5Z" /><path d="M10.5 8A2.5 2.5 0 1 1 5.5 8a.75.75 0 0 1 0-1.5 4 4 0 1 0 5.418-3.418.75.75 0 1 1-1.042.046A2.5 2.5 0 0 1 10.5 8Z" /></svg>;

// --- COMPONENT ---
export const BillingSettingsView: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [billingDetails, setBillingDetails] = useState({
        gstin: '27ABCDE1234F1Z5',
        pan: 'ABCDE1234F',
        address: '123 Tech Park, Silicon Valley\nBengaluru, Karnataka 560100',
        bankName: 'Innovate Bank',
        accountNumber: '123456789012',
        ifscCode: 'INNO0001234',
        upiId: 'agency@upi'
    });
    const [invoicePrefs, setInvoicePrefs] = useState({
        prefix: 'TCRM-INV-',
        dueDays: 15,
        footerNote: 'Thank you for your business! Please contact us for any queries regarding this invoice.',
        signatureUrl: null as string | null,
    });
    const [taxPrefs, setTaxPrefs] = useState({ gstEnabled: true, gstRate: 18 });
    const signatureInputRef = useRef<HTMLInputElement>(null);

    // --- HANDLERS ---
    const handleSave = (section: string) => {
        // In a real app, this would save to a backend (e.g., Firebase Firestore)
        console.log(`Saving ${section} settings...`, { billingDetails, invoicePrefs, taxPrefs });
        alert(`${section} settings saved! (Check console for data)`);
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setInvoicePrefs(prev => ({ ...prev, signatureUrl: reader.result as string }));
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file (PNG, JPG).');
        }
    };

    return (
        <div className="space-y-6">
            <SettingsSectionCard
                title="Agency Billing Details"
                description="Your business details that will appear on all generated invoices."
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="GSTIN" value={billingDetails.gstin} onChange={e => setBillingDetails(p => ({ ...p, gstin: e.target.value }))} />
                        <Input label="PAN" value={billingDetails.pan} onChange={e => setBillingDetails(p => ({ ...p, pan: e.target.value }))} />
                    </div>
                    <TextArea label="Billing Address" rows={3} value={billingDetails.address} onChange={e => setBillingDetails(p => ({ ...p, address: e.target.value }))} />
                    <Card title="Bank Details" icon={<BanknotesIcon />} className="bg-slate-50 dark:bg-slate-800/40 border-border-base">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input label="Bank Name" value={billingDetails.bankName} onChange={e => setBillingDetails(p => ({ ...p, bankName: e.target.value }))} />
                            <Input label="Account Number" value={billingDetails.accountNumber} onChange={e => setBillingDetails(p => ({ ...p, accountNumber: e.target.value }))} />
                            <Input label="IFSC Code" value={billingDetails.ifscCode} onChange={e => setBillingDetails(p => ({ ...p, ifscCode: e.target.value }))} />
                        </div>
                    </Card>
                     <Input label="UPI ID" leftIcon={<AtSymbolIcon/>} value={billingDetails.upiId} onChange={e => setBillingDetails(p => ({ ...p, upiId: e.target.value }))} />
                </div>
                <div className="mt-6 flex justify-end">
                    <Button onClick={() => handleSave('Agency Billing')}>Save Agency Details</Button>
                </div>
            </SettingsSectionCard>

            <SettingsSectionCard
                title="Invoice Preferences"
                description="Customize the appearance and default values for your invoices."
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Invoice Prefix" value={invoicePrefs.prefix} onChange={e => setInvoicePrefs(p => ({ ...p, prefix: e.target.value }))} />
                        <Input label="Default Due Days" type="number" min="0" value={invoicePrefs.dueDays} onChange={e => setInvoicePrefs(p => ({ ...p, dueDays: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <TextArea label="Invoice Footer Note" rows={2} value={invoicePrefs.footerNote} onChange={e => setInvoicePrefs(p => ({ ...p, footerNote: e.target.value }))} />
                    <div>
                        <label className="block text-sm font-medium text-text-muted dark:text-text-muted mb-1.5">Signature</label>
                        <div className="flex items-center gap-4 p-3 border border-border-muted dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/20">
                            <div className="w-40 h-16 flex items-center justify-center bg-white dark:bg-slate-700 rounded border border-dashed border-border-muted dark:border-slate-600">
                                {invoicePrefs.signatureUrl ? <img src={invoicePrefs.signatureUrl} alt="Signature" className="max-w-full max-h-full object-contain" /> : <PencilIcon />}
                            </div>
                            <input type="file" ref={signatureInputRef} onChange={handleSignatureUpload} accept="image/png, image/jpeg" className="hidden"/>
                            <Button variant="outline" size="sm" onClick={() => signatureInputRef.current?.click()}>Upload Signature</Button>
                            {invoicePrefs.signatureUrl && <Button variant="ghost" size="sm" className="text-status-negative" onClick={() => setInvoicePrefs(p => ({ ...p, signatureUrl: null }))}>Remove</Button>}
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <Button onClick={() => handleSave('Invoice Preferences')}>Save Invoice Preferences</Button>
                </div>
            </SettingsSectionCard>

             <SettingsSectionCard
                title="Tax Preferences"
                description="Configure default tax settings for all new invoices."
            >
                 <div className="space-y-4">
                    <ToggleSwitch id="gst-enabled" label="Enable GST/Tax on Invoices" checked={taxPrefs.gstEnabled} onChange={checked => setTaxPrefs(p => ({ ...p, gstEnabled: checked }))} />
                    <Input label="Default GST Rate (%)" type="number" min="0" value={taxPrefs.gstRate} onChange={e => setTaxPrefs(p => ({...p, gstRate: parseFloat(e.target.value) || 0}))} disabled={!taxPrefs.gstEnabled} className="max-w-xs" />
                 </div>
                 <div className="mt-6 flex justify-end">
                    <Button onClick={() => handleSave('Tax Preferences')}>Save Tax Settings</Button>
                </div>
            </SettingsSectionCard>

            <SettingsSectionCard
                title="Data Actions"
                description="Perform bulk actions on your invoice data."
            >
                <Button variant="secondary" leftIcon={<ArrowDownTrayIcon />} onClick={() => alert('Conceptual: Starting ZIP download of all invoices...')}>
                    Download All Invoices as ZIP
                </Button>
            </SettingsSectionCard>
        </div>
    );
};
