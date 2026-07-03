
import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input, TextArea } from '../common/Input';
import { Invoice, Client, AppSettings, calculateInvoiceGrandTotal } from '../../types';
import { Checkbox } from '../common/Checkbox';

interface SendInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (invoiceId: string, emailData: { subject: string, body: string }) => void;
  invoice: Invoice | null;
  client: Client | null;
  appSettings: AppSettings;
}

export const SendInvoiceModal: React.FC<SendInvoiceModalProps> = ({ isOpen, onClose, onSend, invoice, client, appSettings }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachPdf, setAttachPdf] = useState(true);

  useEffect(() => {
    if (invoice && client) {
      const currency = invoice.currency || appSettings.defaultCurrency || 'INR';
      const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
      const lineItems = invoice.items
        .map((item) => `- ${item.description} (x${item.quantity}): ${formatCurrency(item.quantity * item.unitPrice)}`)
        .join('\n');
      const grandTotal = formatCurrency(calculateInvoiceGrandTotal(invoice));

      setSubject(`Invoice ${invoice.invoiceNumber} from ${appSettings.agencyName}`);
      setBody(`Hi ${client.name},\n\nPlease find your invoice summary below.\n\nInvoice: ${invoice.invoiceNumber}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\n${lineItems}\n\nTotal Due: ${grandTotal}\n\nThank you for your business!\n\nBest regards,\nThe ${appSettings.agencyName} Team`);
    }
  }, [invoice, client, appSettings, isOpen]);

  if (!invoice || !client) return null;

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      alert("Subject and body cannot be empty.");
      return;
    }
    onSend(invoice.id, { subject, body });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Send Invoice to ${client.name}`}
      size="2xl"
      overrideZIndex="z-[1052]"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSend}>Send</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="To" id="to_email" value={client.email} readOnly disabled />
        <Input label="Subject" id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <TextArea label="Email Body" id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
        <Checkbox
          label="Attach Invoice as PDF (Conceptual)"
          id="attach_pdf"
          checked={attachPdf}
          onChange={(e) => setAttachPdf(e.target.checked)}
        />
      </div>
    </Modal>
  );
};