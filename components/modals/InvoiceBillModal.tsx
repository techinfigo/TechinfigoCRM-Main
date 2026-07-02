
import React, { useState, useEffect } from 'react';
import { Invoice, Client, AppSettings, ServiceItem } from '../../types';
import { Button } from '../common/Button';
import { safeFormatDate, safeFormatCurrency } from '@/utils';
import { Printer, X, Download } from 'lucide-react';

interface InvoiceBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  client?: Client | null; 
  appSettings: AppSettings;
}

// Techinfigo SVG Logo - For fallback
const TechinfigoLogoSvg = ({ className, textFillPrimary = "#ffffff", textFillSecondary = "#ffffff", iconStroke = "#ffffff" }: { className?: string, textFillPrimary?: string, textFillSecondary?: string, iconStroke?: string }) => (
  <svg 
    viewBox="0 0 432 100"
    xmlns="http://www.w3.org/2000/svg" 
    className={className || "h-12 w-auto"} 
    aria-labelledby="techinfigoLogoTitleInvoice"
  >
    <title id="techinfigoLogoTitleInvoice">Techinfigo Logo</title>
    <defs>
      <style>
        {`
          .techinfigo-text-invoice { font-family: 'Roboto', Arial, sans-serif; font-weight: bold; }
          .tagline-text-invoice { font-family: 'Roboto', Arial, sans-serif; font-size: 10px; }
        `}
      </style>
    </defs>
    <g transform="translate(0, 5)">
      <g id="power-icon-invoice" transform="scale(1.7) translate(0, 0)">
        <path 
          d="M25,8 A17,17 0 1,1 24.99,8 Z"
          stroke={iconStroke} 
          strokeWidth="3.5" 
          fill="none" 
          strokeLinecap="round"
          strokeDasharray="88,17" 
          transform="rotate(100 25 25)"
        />
        <rect x="23" y="3" width="4" height="15" fill={iconStroke} rx="2" /> 
        <circle cx="25" cy="7" r="2.5" fill="#FFFFFF" stroke={iconStroke} strokeWidth="1" /> 
        <circle cx="25" cy="14" r="2.5" fill="#FFFFFF" stroke={iconStroke} strokeWidth="1" /> 
      </g>

      <text x="95" y="55" className="techinfigo-text-invoice" fontSize="40">
        <tspan fill={textFillPrimary}>TECH</tspan><tspan fill={textFillSecondary}>INFIGO</tspan> 
      </text>
    </g>
  </svg>
);

const getBillingCycleText = (quantity: number): string => {
    if (quantity === 1) return "Monthly"; 
    if (quantity === 0) return "Fixed"; 
    return "Project"; 
};

// Helper function to convert number to words (Simplified version)
const convertNumberToWords = (amount: number): string => {
    // In a production app, use a library like 'number-to-words' or write a full recursiver parser.
    // This is a placeholder visual representation.
    const integerPart = Math.floor(amount);
    return `${integerPart} ONLY`; 
};

export const InvoiceBillModal: React.FC<InvoiceBillModalProps> = ({ isOpen, onClose, invoice, client, appSettings }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const currency = invoice.currency || appSettings.defaultCurrency || 'INR';

  const formatCurrency = (amount: number) => {
    return safeFormatCurrency(amount, currency);
  };

  const subTotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  let discountAmount = 0;
  if (invoice.discountType === 'Percentage' && invoice.discountValue) {
    discountAmount = subTotal * (invoice.discountValue / 100);
  } else if (invoice.discountType === 'Fixed' && invoice.discountValue) {
    discountAmount = invoice.discountValue;
  }
  const totalAfterDiscount = subTotal - discountAmount;
  
  const totalTaxRate = invoice.taxRate !== undefined ? invoice.taxRate / 100 : 0;
  const cgstRate = totalTaxRate / 2;
  const sgstRate = totalTaxRate / 2;
  const cgstAmount = totalAfterDiscount * cgstRate;
  const sgstAmount = totalAfterDiscount * sgstRate;
  const totalGstAmount = cgstAmount + sgstAmount;

  const grandTotal = totalAfterDiscount + totalGstAmount;

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
            html2canvas: { scale: 2, useCORS: true, logging: false },
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
  
  const clientName = client?.name || invoice.clientName || 'N/A';
  const clientCompanyName = client?.companyName || '';
  const clientAddress = client?.address || 'Address Not Provided';
  const clientEmail = client?.email || 'Email Not Provided';
  const clientGstin = client?.gstin || '';

  const agencyAddress = "123 Digital Avenue, Marketing City, MC 12345";
  const agencyEmail = "contact@techinfigo.com";
  const agencyPhone = "(555) 012-3456";
  const agencyGstin = appSettings.agencyGstin || "";
  
  const termsAndConditions = invoice.notes || "Payment is due within the specified timeframe. Thank you for your business.";

  return (
    <div 
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[1100] flex items-center justify-center p-0 sm:p-4 print-container-wrapper"
      onClick={onClose} 
      aria-modal="true"
      role="dialog"
    >
      <style>
        {`
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
              padding: 0 !important;
              background-color: white !important;
              color: black !important;
              box-shadow: none !important;
            }

            #invoice-pdf-content * {
              visibility: visible;
              color: black !important;
              background-color: transparent !important;
              box-shadow: none !important;
              border-color: #ccc !important;
            }
            
            /* Override specific elements for print clarity */
            #invoice-pdf-content .text-white {
                color: black !important;
            }
            #invoice-pdf-content .bg-\[\#001d21\] {
                background-color: transparent !important;
                border-bottom: 2px solid black;
            }
            #invoice-pdf-content .bg-slate-100 {
                background-color: transparent !important;
                border: 1px solid #ddd;
            }
            #invoice-pdf-content .bg-slate-50 {
                background-color: transparent !important;
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
        className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 shadow-2xl w-full max-w-[210mm] h-full sm:h-auto sm:max-h-[95vh] sm:rounded-lg flex flex-col overflow-hidden invoice-content transform transition-all"
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
                leftIcon={<Printer className="w-4 h-4"/>} 
                size="sm"
            >
                Print
            </Button>
            <Button 
                variant="primary" 
                onClick={handleDownloadPDF} 
                leftIcon={isDownloading ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/> : <Download className="w-4 h-4"/>} 
                size="sm"
                disabled={isDownloading}
            >
                {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        {/* Invoice Content - Scrollable Area */}
        <div className="flex-1 overflow-y-auto bg-white text-slate-900 font-sans">
            <div id="invoice-pdf-content" className="min-h-[297mm] flex flex-col relative bg-white text-slate-900 w-full" style={{ width: '210mm', margin: '0 auto' }}>
                
                {/* 1. Header Bar */}
                <div className="bg-[#001d21] text-white px-12 py-10 mb-8 print:bg-white print:text-black print:border-b-2 print:border-black print:px-0">
                    <div className="flex justify-between items-start">
                         <div className="flex flex-col gap-2">
                             {/* Logo */}
                             {appSettings.agencyLogoUrl ? 
                                 <img src={appSettings.agencyLogoUrl} alt={appSettings.agencyName} className="h-16 w-auto object-contain bg-white/10 rounded p-1 print:bg-transparent print:p-0" />
                                 : <TechinfigoLogoSvg className="h-14 w-auto" iconStroke="currentColor" textFillPrimary="currentColor" textFillSecondary="currentColor" />
                             }
                             {/* Agency Info */}
                             <div className="mt-2 text-white/80 text-sm leading-relaxed print:text-black">
                                 <p className="font-bold text-white print:text-black">{appSettings.agencyName}</p>
                                 <p>{agencyAddress}</p>
                                 <p>{agencyEmail} | {agencyPhone}</p>
                                 {agencyGstin && <p>GSTIN: {agencyGstin}</p>}
                             </div>
                         </div>
                         <div className="text-right">
                             <h1 className="text-4xl font-light tracking-wide text-white/90 print:text-black">TAX INVOICE</h1>
                         </div>
                    </div>
                </div>

                {/* 2. Info Strip */}
                <div className="flex justify-between items-center bg-slate-100 border-l-4 border-[#001d21] p-4 mb-8 mx-12 print:border-black print:bg-transparent print:border">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider print:text-black">Invoice No</p>
                        <p className="text-lg font-bold text-slate-800 print:text-black">#{invoice.invoiceNumber}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider print:text-black">Date Issued</p>
                        <p className="text-lg font-bold text-slate-800 print:text-black">{safeFormatDate(invoice.issueDate)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider print:text-black">Due Date</p>
                        <p className="text-lg font-bold text-slate-800 print:text-black">{safeFormatDate(invoice.dueDate)}</p>
                    </div>
                </div>

                {/* 3. Address Grid */}
                <div className="mb-10 px-12">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2 print:text-black print:border-black">Bill To</h3>
                    <div className="text-slate-800 print:text-black">
                        <p className="text-xl font-bold mb-1">{clientName}</p>
                        {clientCompanyName && <p className="font-medium text-slate-700 print:text-black">{clientCompanyName}</p>}
                        <p className="text-sm text-slate-600 mt-1 whitespace-pre-line max-w-sm print:text-black">{clientAddress}</p>
                        <p className="text-sm text-slate-600 mt-1 print:text-black">{clientEmail}</p>
                        {clientGstin && <p className="text-sm font-medium text-slate-700 mt-2 print:text-black">GSTIN: {clientGstin}</p>}
                    </div>
                </div>

                {/* 4. Items Table */}
                <div className="mb-6 px-12">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[#001d21] text-white print:bg-transparent print:text-black print:border-b-2 print:border-black">
                                <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider rounded-tl-sm rounded-bl-sm print:px-0">Description</th>
                                <th className="py-3 px-4 text-center text-xs font-bold uppercase tracking-wider w-20 print:px-0">SAC/HSN</th>
                                <th className="py-3 px-4 text-center text-xs font-bold uppercase tracking-wider w-24 print:px-0">Type</th>
                                <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider w-28 print:px-0">Rate</th>
                                <th className="py-3 px-4 text-right text-xs font-bold uppercase tracking-wider w-32 rounded-tr-sm rounded-br-sm print:px-0">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {invoice.items.map((item: ServiceItem, index) => (
                                <tr key={item.id} className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} print:bg-transparent border-b border-slate-100 print:border-slate-300`}>
                                    <td className="py-3 px-4 text-slate-700 font-medium print:text-black print:px-0">{item.description}</td>
                                    <td className="py-3 px-4 text-center text-slate-500 text-xs print:text-black print:px-0">9983</td>
                                    <td className="py-3 px-4 text-center text-slate-500 text-xs uppercase print:text-black print:px-0">{getBillingCycleText(item.quantity)}</td>
                                    <td className="py-3 px-4 text-right text-slate-600 print:text-black print:px-0">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-3 px-4 text-right text-slate-800 font-bold print:text-black print:px-0">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 5. Totals & Payment Details Layout */}
                <div className="flex flex-col sm:flex-row gap-12 mb-8 px-12">
                    
                    {/* Left: Payment Info */}
                    <div className="flex-1">
                        <div className="bg-slate-50 border border-slate-200 p-5 rounded-lg h-full print:bg-transparent print:border-black">
                            <h4 className="text-sm font-bold text-[#001d21] uppercase tracking-wider mb-3 print:text-black">Payment Details</h4>
                            <div className="text-xs text-slate-600 space-y-1.5 print:text-black">
                                <p><span className="font-semibold text-slate-800 w-24 inline-block print:text-black">Bank:</span> ICICI Bank</p>
                                <p><span className="font-semibold text-slate-800 w-24 inline-block print:text-black">Account Name:</span> Techinfigo</p>
                                <p><span className="font-semibold text-slate-800 w-24 inline-block print:text-black">Account No:</span> 628705014243</p>
                                <p><span className="font-semibold text-slate-800 w-24 inline-block print:text-black">IFSC Code:</span> ICIC0006287</p>
                                <p className="pt-2 mt-2 border-t border-slate-200 print:border-black"><span className="font-semibold text-slate-800 w-24 inline-block print:text-black">UPI ID:</span> pay@techinfigo</p>
                            </div>
                            {invoice.paymentInstructions && (
                                <div className="mt-4 pt-2 border-t border-slate-200 print:border-black">
                                    <p className="text-xs text-slate-500 italic print:text-black">{invoice.paymentInstructions}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Calculations */}
                    <div className="w-full sm:w-5/12">
                         <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-600 print:text-black">
                                <span>Subtotal</span>
                                <span className="font-medium">{formatCurrency(subTotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-green-600 print:text-black">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {invoice.taxRate !== undefined && invoice.taxRate > 0 && (
                                <>
                                    <div className="flex justify-between text-slate-500 text-xs print:text-black">
                                        <span>CGST ({(invoice.taxRate / 2)}%)</span>
                                        <span>{formatCurrency(cgstAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500 text-xs print:text-black">
                                        <span>SGST ({(invoice.taxRate / 2)}%)</span>
                                        <span>{formatCurrency(sgstAmount)}</span>
                                    </div>
                                </>
                            )}
                            <div className="my-2 border-b border-slate-300 print:border-black"></div>
                            <div className="flex justify-between items-center py-2 bg-[#001d21] text-white px-3 rounded-md shadow-sm print:bg-transparent print:text-black print:border print:border-black">
                                <span className="font-light uppercase tracking-wider text-xs">Grand Total</span>
                                <span className="text-xl font-bold">{formatCurrency(grandTotal)}</span>
                            </div>
                            <div className="text-right text-xs text-slate-500 italic mt-1 print:text-black">
                                Amount Chargeable (in words): <span className="font-medium">{convertNumberToWords(grandTotal)} {currency}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 6. Footer Terms & Signature */}
                <div className="mt-auto px-12 pb-8">
                    <div className="flex justify-between items-end">
                        <div className="max-w-md">
                            <div className="border-t-2 border-slate-100 pt-4 print:border-black">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 print:text-black">Terms & Conditions</h4>
                                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line print:text-black">
                                    {termsAndConditions}
                                </p>
                            </div>
                        </div>
                        <div className="text-center">
                             <div className="h-12 w-32 border-b border-slate-400 mb-2">
                                {/* Digital Signature Placeholder */}
                             </div>
                             <p className="text-xs font-bold text-slate-700 uppercase print:text-black">Authorized Signatory</p>
                             <p className="text-[10px] text-slate-500 print:text-black">For {appSettings.agencyName}</p>
                        </div>
                    </div>

                    <div className="mt-8 text-center text-xs text-slate-400 print:text-black border-t border-slate-100 pt-4 print:border-t-0">
                        <p>Thank you for your business!</p>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};
