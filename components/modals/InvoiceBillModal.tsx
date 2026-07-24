import React, { useState } from 'react';
import { Invoice, Client, AppSettings, ServiceItem } from '../../types';
import { Button } from '../common/Button';
import { safeFormatDate } from '@/utils';
import { Printer, Download } from 'lucide-react';

interface InvoiceBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  client?: Client | null;
  appSettings: AppSettings;
}

/* Brand palette taken from the official Techinfigo invoice template */
const INK = '#0C2B2B';
const GOLD = '#F5B335';
const CREAM = '#FAF7F2';

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n: number): string => {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
};

const threeDigits = (n: number): string => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return (h ? ones[h] + ' Hundred' : '') + (h && rest ? ' ' : '') + (rest ? twoDigits(rest) : '');
};

/** Indian-format amount in words (Crore / Lakh / Thousand / Hundred). */
export const amountInWordsINR = (amount: number): string => {
  const num = Math.round(amount);
  if (num === 0) return 'Rupees Zero Only';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;
  const parts: string[] = [];
  if (crore) parts.push(threeDigits(crore) + ' Crore');
  if (lakh) parts.push(threeDigits(lakh) + ' Lakh');
  if (thousand) parts.push(threeDigits(thousand) + ' Thousand');
  if (remainder) parts.push(threeDigits(remainder));
  return 'Rupees ' + parts.join(' ') + ' Only';
};

/* Bare numbers with Indian digit grouping, e.g. 2,55,085 or 22,957.65 */
const inr = (n: number): string =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const inrWhole = (n: number): string =>
  Math.round(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const PinIcon = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill={GOLD}><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" /></svg>
);
const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill={GOLD}><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" /></svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill={GOLD}><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2z" /></svg>
);
const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill={GOLD}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.7 1 1.3 2.4 1.7 4h-3.4C10.7 6.4 11.3 5 12 4zM4.3 14a8 8 0 0 1 0-4h3.4a17 17 0 0 0 0 4H4.3zm.8 2h3a15.7 15.7 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.4-3.6A15.7 15.7 0 0 0 8.1 8zM12 20c-.7-1-1.3-2.4-1.7-4h3.4c-.4 1.6-1 3-1.7 4zm2.1-6H9.9a15 15 0 0 1 0-4h4.2a15 15 0 0 1 0 4zm.8 5.6a15.7 15.7 0 0 0 1.4-3.6h3a8 8 0 0 1-4.4 3.6zm1.7-5.6a17 17 0 0 0 0-4h3.4a8 8 0 0 1 0 4h-3.4z" /></svg>
);

const TechinfigoLogoSvg = ({ className }: { className?: string }) => (
  // Rendered as HTML rather than SVG <text>: html2canvas drops text nodes that are
  // styled via a class inside <defs><style>, which is why the wordmark vanished.
  <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <svg viewBox="0 0 50 50" width="40" height="40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M25,8 A17,17 0 1,1 24.99,8 Z"
        stroke="#ffffff"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="88,17"
        transform="rotate(100 25 25)"
      />
      <rect x="23" y="3" width="4" height="15" fill="#ffffff" rx="2" />
    </svg>
    <div style={{ lineHeight: 1 }}>
      <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontWeight: 800, fontSize: 30, letterSpacing: -0.5 }}>
        <span style={{ color: '#ffffff' }}>TECH</span><span style={{ color: GOLD }}>INFIGO</span>
      </div>
      <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 7, letterSpacing: 3.2, color: 'rgba(255,255,255,0.85)', marginTop: 3, textAlign: 'center' }}>
        WE DEVELOP SOLUTIONS
      </div>
    </div>
  </div>
);

const ContactRow: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
    <span style={{ flexShrink: 0, display: 'inline-flex' }}>{icon}</span>
    <span>{children}</span>
  </div>
);

const TERMS: string[] = [
  'This invoice is system generated and does not require a physical signature.',
  'Services are provided on a best-effort basis and results may vary based on market conditions, platform policies, and client inputs.',
  'Fees once paid are non-refundable.',
  'Any third-party costs (ad spend, tools, software, taxes) are not included unless mentioned separately.',
  'Payment must be made within the due date mentioned on the invoice.',
  'Late payments may result in pause or discontinuation of services.',
  'The client is requested to verify that the payment details, GST information, and bank account name mentioned on this invoice match the registered company name before making payment.',
  'All disputes, if any, shall be subject to AGRA jurisdiction only.',
];

const thStyle: React.CSSProperties = {
  border: `1px solid ${INK}`,
  padding: '8px 10px',
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  border: `1px solid ${INK}`,
  padding: '8px 10px',
  fontSize: 11.5,
  color: '#1f2937',
};

const totalLabelStyle: React.CSSProperties = {
  border: `1px solid ${INK}`,
  padding: '6px 10px',
  fontSize: 11.5,
  color: '#111',            // explicit: never inherit the app's dark-mode light text
  background: '#ffffff',
};

const totalValueStyle: React.CSSProperties = {
  ...totalLabelStyle,
  textAlign: 'right',
  fontWeight: 600,
};

export const InvoiceBillModal: React.FC<InvoiceBillModalProps> = ({ isOpen, onClose, invoice, client, appSettings }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const settingsAny = appSettings as any;

  const agencyName = appSettings.agencyName || 'TECHINFIGO';
  const agencyAddress = settingsAny.agencyAddress || 'Office no. 03, II Floor, Block no.25, Cloth Market, Sanjay Place, Agra, U.P 282002';
  const agencyEmail = settingsAny.agencyEmail || 'info@techinfigo.com';
  const agencyPhone = settingsAny.agencyPhone || '+91 955 733 8487';
  const agencyWebsite = settingsAny.agencyWebsite || 'https://techinfigo.com';
  const agencyGstin = appSettings.agencyGstin || '09FKTPS0699D1ZB';

  const bankAccountName = settingsAny.bankAccountName || 'TECHINFIGO';
  const bankName = settingsAny.bankName || 'ICICI Bank';
  const bankAccountNo = settingsAny.bankAccountNo || '628705014243';
  const bankIfsc = settingsAny.bankIfsc || 'ICIC0006287';

  const clientName = client?.name || invoice.clientName || 'N/A';
  const clientCompanyName = client?.companyName || clientName;
  const clientAddress = client?.address;
  const clientEmail = client?.email;
  const clientPhone = client?.phone;
  const clientWebsite = client?.website;
  const clientGstin = client?.gstin;

  const subTotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  let discountAmount = 0;
  if (invoice.discountType === 'Percentage' && invoice.discountValue) {
    discountAmount = subTotal * (invoice.discountValue / 100);
  } else if (invoice.discountType === 'Fixed' && invoice.discountValue) {
    discountAmount = invoice.discountValue;
  }
  const afterDiscount = subTotal - discountAmount;

  const taxRate = invoice.taxRate || 0;
  const halfRate = taxRate / 2;
  const taxTotal = afterDiscount * (taxRate / 100);
  const cgstAmount = taxTotal / 2;
  const sgstAmount = taxTotal / 2;
  const grandTotal = afterDiscount + taxTotal;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('invoice-pdf-content');
    if (!element) return;

    setIsDownloading(true);

    // Use window.html2pdf to access the library loaded via script tag
    // @ts-ignore
    const html2pdfLib = window.html2pdf;

    if (typeof html2pdfLib !== 'undefined') {
      const opt = {
        margin: [0, 0, 0, 0], // Top, Right, Bottom, Left
        filename: `Invoice_${invoice.invoiceNumber.replace(/[^a-z0-9]/gi, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, logging: false, windowWidth: 794, backgroundColor: '#ffffff' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
        await html2pdfLib().set(opt).from(element).save();
      } catch (error) {
        console.error("PDF Generation failed", error);
        alert("Failed to generate PDF. Please try the 'Print' button and select 'Save as PDF' as the destination.");
      } finally {
        setIsDownloading(false);
      }
    } else {
      console.error("html2pdf library not found on window");
      alert("PDF generator library not loaded. Please use the 'Print' button and select 'Save as PDF'.");
      setIsDownloading(false);
    }
  };

  const paddingRowsNeeded = Math.max(0, 3 - invoice.items.length);

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[1100] flex items-center justify-center p-0 sm:p-4 print-container-wrapper"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <style>
        {`
          #invoice-pdf-content, #invoice-pdf-content * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          @media print {
            body {
              visibility: hidden;
              background: white !important;
            }

            .print-container-wrapper {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: white !important;
              z-index: 99999;
              padding: 0;
              margin: 0;
              display: block !important;
              overflow: visible !important;
            }

            #invoice-pdf-content {
              visibility: visible;
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              box-shadow: none !important;
            }

            #invoice-pdf-content * {
              visibility: visible;
            }

            .print-hidden {
              display: none !important;
            }

            @page {
              size: A4;
              margin: 0;
            }
          }
        `}
      </style>

      <div
        className="bg-white text-slate-900 shadow-2xl w-full max-w-[210mm] h-full sm:h-auto sm:max-h-[95vh] sm:rounded-lg flex flex-col overflow-hidden invoice-content transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Actions Header - Screen Only */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-zinc-900 print-hidden shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Invoice Preview</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} size="sm">Close</Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
              size="sm"
            >
              Print
            </Button>
            <Button
              variant="primary"
              onClick={handleDownloadPDF}
              leftIcon={isDownloading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Download className="w-4 h-4" />}
              size="sm"
              disabled={isDownloading}
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Invoice Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto font-sans" style={{ background: CREAM }}>
          <div
            id="invoice-pdf-content"
            style={{ width: '210mm', minHeight: '296mm', margin: '0 auto', background: CREAM, color: '#111', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* 1. Top gold bar */}
            <div style={{ height: 10, background: GOLD, flexShrink: 0 }} />

            {/* 2. Dark teal header panel */}
            <div style={{ background: INK, color: '#fff', padding: '28px 40px 24px', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
                {appSettings.agencyLogoUrl
                  ? <img src={appSettings.agencyLogoUrl} alt={agencyName} style={{ height: 56, objectFit: 'contain' }} />
                  : <TechinfigoLogoSvg className="h-14 w-auto" />
                }
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: 1, lineHeight: 1 }}>INVOICE</div>
                <div style={{ fontSize: 11.5, minWidth: 200 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span>Invoice No:</span><span style={{ fontWeight: 700 }}>{invoice.invoiceNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 4 }}>
                    <span>Invoice Date:</span><span style={{ fontWeight: 700 }}>{safeFormatDate(invoice.issueDate)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 4 }}>
                    <span>Due Date:</span><span style={{ fontWeight: 700 }}>{safeFormatDate(invoice.dueDate)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex' }}>
                <div style={{ flex: 1, paddingRight: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>From</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{agencyName}</div>
                  <ContactRow icon={<PinIcon />}>{agencyAddress}</ContactRow>
                  <ContactRow icon={<MailIcon />}>{agencyEmail}</ContactRow>
                  <ContactRow icon={<PhoneIcon />}>{agencyPhone}</ContactRow>
                  <ContactRow icon={<GlobeIcon />}>{agencyWebsite}</ContactRow>
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8 }}>GSTIN.: {agencyGstin}</div>
                </div>
                <div style={{ width: 1, background: GOLD, margin: '0 24px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>To</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{clientCompanyName}</div>
                  {clientAddress && <ContactRow icon={<PinIcon />}>{clientAddress}</ContactRow>}
                  {clientEmail && <ContactRow icon={<MailIcon />}>{clientEmail}</ContactRow>}
                  {clientPhone && <ContactRow icon={<PhoneIcon />}>{clientPhone}</ContactRow>}
                  {clientWebsite && <ContactRow icon={<GlobeIcon />}>{clientWebsite}</ContactRow>}
                  {clientGstin && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8 }}>GSTIN.: {clientGstin}</div>}
                </div>
              </div>
            </div>

            {/* 3. Line items table */}
            <div style={{ padding: '24px 40px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: GOLD, color: INK }}>
                    <th style={{ ...thStyle, width: 58, textAlign: 'center', whiteSpace: 'nowrap' }}>S No.</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Description</th>
                    <th style={{ ...thStyle, width: 100, textAlign: 'right' }}>Charges</th>
                    <th style={{ ...thStyle, width: 90, textAlign: 'center' }}>Duration</th>
                    <th style={{ ...thStyle, width: 110, textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: ServiceItem, index) => (
                    <tr key={item.id}>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{index + 1}</td>
                      <td style={{ ...tdStyle, textAlign: 'left' }}>{item.description}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{inr(item.unitPrice)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity === 1 ? '1 Time' : `${item.quantity} x`}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{inr(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                  {Array.from({ length: paddingRowsNeeded }).map((_, i) => (
                    <tr key={`pad-${i}`}>
                      <td style={tdStyle}>&nbsp;</td>
                      <td style={tdStyle}>&nbsp;</td>
                      <td style={tdStyle}>&nbsp;</td>
                      <td style={tdStyle}>&nbsp;</td>
                      <td style={tdStyle}>&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Terms & totals */}
            <div style={{ display: 'flex', padding: '24px 40px 0', gap: 32 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 8 }}>Terms &amp; Conditions</div>
                <ul style={{ fontSize: 10, color: '#444', lineHeight: 1.6, margin: 0, paddingLeft: 18, listStyleType: 'disc', listStylePosition: 'outside' }}>
                  {TERMS.map((term, i) => <li key={i}>{term}</li>)}
                </ul>
              </div>

              <div style={{ width: 290, flexShrink: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={totalLabelStyle}>Subtotal</td>
                      <td style={totalValueStyle}>{inr(subTotal)}</td>
                    </tr>
                    {discountAmount > 0 && (
                      <tr>
                        <td style={totalLabelStyle}>Discount</td>
                        <td style={totalValueStyle}>-{inr(discountAmount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td style={totalLabelStyle}>CGST @ {halfRate}%</td>
                      <td style={totalValueStyle}>{inr(cgstAmount)}</td>
                    </tr>
                    <tr>
                      <td style={totalLabelStyle}>SGST @ {halfRate}%</td>
                      <td style={totalValueStyle}>{inr(sgstAmount)}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ background: INK, color: '#fff', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>TOTAL</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{inrWhole(grandTotal)}</div>
                    <div style={{ fontSize: 8, opacity: 0.85, marginTop: 2 }}>{amountInWordsINR(grandTotal)}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 36 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: INK }}>For {agencyName}</div>
                  <div style={{ height: 48 }} />
                  <div style={{ fontSize: 10, color: '#666' }}>Authorized Signatory</div>
                  <div style={{ fontSize: 10, color: '#666' }}>(Signature)</div>
                </div>
              </div>
            </div>

            {/* 5. Payment details box */}
            <div style={{ margin: '24px 40px', background: CREAM, border: `1.5px dashed ${GOLD}`, padding: '14px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 10 }}>Payment Details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 6, columnGap: 16, fontSize: 11.5, color: '#333' }}>
                <div>Account Name: <span style={{ fontWeight: 700, color: INK }}>{bankAccountName}</span></div>
                <div>Account No.: <span style={{ fontWeight: 700, color: INK }}>{bankAccountNo}</span></div>
                <div>Bank Name: <span style={{ fontWeight: 700, color: INK }}>{bankName}</span></div>
                <div>IFSC Code: <span style={{ fontWeight: 700, color: INK }}>{bankIfsc}</span></div>
              </div>
            </div>

            {/* 6. Bottom gold bar */}
            <div style={{ height: 14, background: GOLD, marginTop: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
