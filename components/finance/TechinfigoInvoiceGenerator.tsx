
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../common/Button';
import { Plus, Trash2, Printer, Download, Save } from 'lucide-react';
import { formatIndianNumber, indianNumberToWords } from '@/utils';

interface InvoiceItem {
  id: string;
  description: string;
  charges: number;
  duration: string;
}

export const TechinfigoInvoiceGenerator: React.FC = () => {
  // --- STATE ---
  const [invoiceNo, setInvoiceNo] = useState('1035');
  const [invoiceDate, setInvoiceDate] = useState('20 Dec 2025');
  const [dueDate, setDueDate] = useState('30 Dec 2025');
  
  const [fromDetails, setFromDetails] = useState({
    name: 'TECHINFIGO',
    address: 'Office no. 03, II Floor, Block no.25, Cloth Market, Sanjay Place, Agra U.P 282002',
    email: 'info@techinfigo.com',
    phone: '+91 955 733 8487',
    gstin: '09FKTPS0699D1ZB'
  });

  const [toDetails, setToDetails] = useState({
    name: 'Strukture Soft LLP',
    address: '34A Devpuri Road, Agra UP 282001'
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      description: 'Web Application Development – Buildrmate',
      charges: 255085,
      duration: '1 Time'
    }
  ]);

  const [cgstPercent, setCgstPercent] = useState(9);
  const [sgstPercent, setSgstPercent] = useState(9);
  const [terms, setTerms] = useState('1. Payment should be made by Cheque/Draft/NEFT/RTGS in favor of TECHINFIGO.\n2. Goods once sold will not be taken back.\n3. Subject to Agra Jurisdiction.');

  const [bankDetails, setBankDetails] = useState({
    accountName: 'TECHINFIGO',
    accountNo: '628705014243',
    bankName: 'ICICI Bank',
    ifsc: 'ICIC0006287'
  });

  // --- CALCULATIONS ---
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + item.charges, 0);
  }, [items]);

  const cgstAmount = useMemo(() => (subtotal * cgstPercent) / 100, [subtotal, cgstPercent]);
  const sgstAmount = useMemo(() => (subtotal * sgstPercent) / 100, [subtotal, sgstPercent]);
  const grandTotal = useMemo(() => subtotal + cgstAmount + sgstAmount, [subtotal, cgstAmount, sgstAmount]);

  const amountInWords = useMemo(() => indianNumberToWords(grandTotal), [grandTotal]);

  // --- HANDLERS ---
  const addItem = () => {
    setItems([...items, { id: Date.now().toString(), description: '', charges: 0, duration: '1 Time' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white">
      {/* TOOLBAR - HIDDEN ON PRINT */}
      <div className="max-w-[1000px] mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden">
        <h1 className="text-xl font-bold text-slate-800">Invoice Designer</h1>
        <div className="flex gap-3">
          <Button variant="outline" leftIcon={<Printer className="w-4 h-4" />} onClick={handlePrint}>Print / Export PDF</Button>
          <Button variant="primary" leftIcon={<Save className="w-4 h-4" />} onClick={() => alert('Invoice saved locally!')}>Save Draft</Button>
        </div>
      </div>

      {/* INVOICE CANVAS */}
      <div id="invoice-capture" className="max-w-[1000px] mx-auto bg-white shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:w-full">
        <style>
          {`
            @media print {
              body * { visibility: hidden; }
              #invoice-capture, #invoice-capture * { visibility: visible; }
              #invoice-capture {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
              }
              .print-hidden { display: none !important; }
              input, textarea { border: none !important; padding: 0 !important; background: transparent !important; }
              input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
            }
            .invoice-input { 
              background: transparent; 
              border: 1px solid transparent; 
              width: 100%; 
              padding: 2px 4px;
              transition: all 0.2s;
            }
            .invoice-input:hover { border-color: #f0c040; background: rgba(240, 192, 64, 0.05); }
            .invoice-input:focus { border-color: #f0c040; outline: none; background: rgba(240, 192, 64, 0.1); }
          `}
        </style>

        {/* 1. HEADER */}
        <div className="bg-[#1a3a2a] p-10 flex justify-between items-start border-b-[6px] border-[#f0c040]">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-[#f0c040] text-4xl leading-none font-bold">⊙</span>
              <h2 className="text-[#f0c040] text-3xl font-black tracking-tighter">TECHINFIGO</h2>
            </div>
            <p className="text-[#f0c040] text-[10px] font-bold tracking-[0.2em] mt-1 ml-9">WE DEVELOP SOLUTIONS</p>
          </div>
          
          <div className="flex flex-col items-end">
             <h1 className="text-[#f0c040] text-5xl font-black tracking-tight mb-4">INVOICE</h1>
             <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right">
                <span className="text-white/60 text-xs font-bold uppercase">Invoice No:</span>
                <input className="invoice-input text-white text-xs font-bold w-24 text-right" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                
                <span className="text-white/60 text-xs font-bold uppercase">Date:</span>
                <input className="invoice-input text-white text-xs font-bold w-24 text-right" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                
                <span className="text-white/60 text-xs font-bold uppercase">Due Date:</span>
                <input className="invoice-input text-white text-xs font-bold w-24 text-right" value={dueDate} onChange={e => setDueDate(e.target.value)} />
             </div>
          </div>
        </div>

        {/* 2. PARTY SECTION */}
        <div className="px-10 py-8 grid grid-cols-2 gap-12">
          {/* FROM */}
          <div className="flex flex-col gap-2">
            <h3 className="text-[#1a3a2a] font-black text-sm border-b-2 border-[#f0c040] pb-1 w-fit mb-2">FROM</h3>
            <input className="invoice-input font-bold text-lg text-slate-800" value={fromDetails.name} onChange={e => setFromDetails({...fromDetails, name: e.target.value})} />
            <textarea 
              className="invoice-input text-xs text-slate-600 leading-relaxed resize-none h-16" 
              value={fromDetails.address} 
              onChange={e => setFromDetails({...fromDetails, address: e.target.value})}
            />
            <div className="flex flex-col gap-0.5 mt-2">
                <input className="invoice-input text-xs text-slate-500 font-medium" value={fromDetails.email} onChange={e => setFromDetails({...fromDetails, email: e.target.value})} />
                <input className="invoice-input text-xs text-slate-500 font-medium" value={fromDetails.phone} onChange={e => setFromDetails({...fromDetails, phone: e.target.value})} />
                <div className="flex items-center gap-1 mt-1">
                   <span className="text-[10px] font-bold text-slate-400">GSTIN:</span>
                   <input className="invoice-input text-xs font-bold text-slate-700" value={fromDetails.gstin} onChange={e => setFromDetails({...fromDetails, gstin: e.target.value})} />
                </div>
            </div>
          </div>

          {/* TO */}
          <div className="flex flex-col gap-2">
            <h3 className="text-[#1a3a2a] font-black text-sm border-b-2 border-[#f0c040] pb-1 w-fit mb-2">TO</h3>
            <input className="invoice-input font-bold text-lg text-slate-800" value={toDetails.name} onChange={e => setToDetails({...toDetails, name: e.target.value})} />
            <textarea 
              className="invoice-input text-xs text-slate-600 leading-relaxed resize-none h-16" 
              value={toDetails.address} 
              onChange={e => setToDetails({...toDetails, address: e.target.value})}
            />
          </div>
        </div>

        {/* GOLD BAR SEPARATOR */}
        <div className="h-1.5 bg-[#f0c040] mx-10 mb-8" />

        {/* 3. ITEMS TABLE */}
        <div className="px-10 pb-4">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#f0c040]">
                <th className="py-2 px-3 text-[#1a3a2a] font-black text-[10px] uppercase text-left w-12 border border-[#f0c040]">#</th>
                <th className="py-2 px-3 text-[#1a3a2a] font-black text-[10px] uppercase text-left border border-[#f0c040]">Description</th>
                <th className="py-2 px-3 text-[#1a3a2a] font-black text-[10px] uppercase text-right w-32 border border-[#f0c040]">Charges (₹)</th>
                <th className="py-2 px-3 text-[#1a3a2a] font-black text-[10px] uppercase text-center w-32 border border-[#f0c040]">Duration</th>
                <th className="py-2 px-3 text-[#1a3a2a] font-black text-[10px] uppercase text-right w-32 border border-[#f0c040]">Amount (₹)</th>
                <th className="py-2 px-1 text-center w-10 border border-[#f0c040] print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-2 px-3 border border-slate-200 text-xs font-bold text-slate-400">{idx + 1}</td>
                  <td className="py-1 px-1 border border-slate-200">
                    <input 
                      className="invoice-input text-xs font-semibold text-slate-700" 
                      value={item.description} 
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                    />
                  </td>
                  <td className="py-1 px-1 border border-slate-200">
                    <input 
                      type="number" 
                      className="invoice-input text-xs font-bold text-slate-700 text-right" 
                      value={item.charges} 
                      onChange={e => updateItem(item.id, 'charges', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-1 px-1 border border-slate-200">
                    <input 
                      className="invoice-input text-xs font-medium text-slate-500 text-center uppercase" 
                      value={item.duration} 
                      onChange={e => updateItem(item.id, 'duration', e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-3 border border-slate-200 text-xs font-bold text-slate-800 text-right">
                    {formatIndianNumber(item.charges)}
                  </td>
                  <td className="py-1 px-1 border border-slate-200 text-center print:hidden">
                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button onClick={addItem} className="mt-4 flex items-center gap-1.5 text-[#1a3a2a] font-bold text-xs uppercase hover:underline print:hidden">
            <Plus className="w-3.5 h-3.5" /> Add New Item
          </button>
        </div>

        {/* 4. TOTALS & FOOTER GRID */}
        <div className="px-10 py-10 grid grid-cols-2 gap-16 border-t border-slate-100 mt-4">
           {/* Left: T&C */}
           <div className="flex flex-col gap-3">
              <h4 className="text-[#1a3a2a] font-black text-xs uppercase opacity-40">Terms & Conditions</h4>
              <textarea 
                className="invoice-input text-[10px] text-slate-500 leading-relaxed font-medium min-h-[100px] resize-none" 
                value={terms} 
                onChange={e => setTerms(e.target.value)}
              />
           </div>

           {/* Right: Totals */}
           <div className="flex flex-col">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs px-2">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">Subtotal:</span>
                  <span className="font-bold text-slate-700">₹ {formatIndianNumber(subtotal)}</span>
                </div>
                
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CGST</span>
                    <div className="flex items-center">
                      <input type="number" className="invoice-input w-8 text-[10px] font-black text-[#1a3a2a] p-0 text-center" value={cgstPercent} onChange={e => setCgstPercent(parseFloat(e.target.value) || 0)} />
                      <span className="text-[10px] font-black text-[#1a3a2a]">%:</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700">₹ {formatIndianNumber(cgstAmount)}</span>
                </div>

                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SGST</span>
                    <div className="flex items-center">
                      <input type="number" className="invoice-input w-8 text-[10px] font-black text-[#1a3a2a] p-0 text-center" value={sgstPercent} onChange={e => setSgstPercent(parseFloat(e.target.value) || 0)} />
                      <span className="text-[10px] font-black text-[#1a3a2a]">%:</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700">₹ {formatIndianNumber(sgstAmount)}</span>
                </div>
              </div>

              {/* GRAND TOTAL BAR */}
              <div className="bg-[#1a3a2a] p-4 flex flex-col items-center justify-center rounded-sm">
                 <span className="text-[#f0c040] text-[10px] font-black uppercase tracking-[0.3em] mb-1">Grand Total</span>
                 <h2 className="text-[#f0c040] text-3xl font-black">₹ {formatIndianNumber(grandTotal)}</h2>
              </div>
              
              <div className="mt-3 px-2 text-right">
                <p className="text-[10px] font-bold text-slate-400 italic">
                  ({amountInWords})
                </p>
              </div>
           </div>
        </div>

        {/* 5. PAYMENT DETAILS & SIGNATORY */}
        <div className="px-10 pb-12 grid grid-cols-2 gap-16 items-end">
           {/* Payment Details Box */}
           <div className="bg-[#fff9e6] border-2 border-[#f0c040] p-6 rounded-md">
              <h4 className="text-[#1a3a2a] font-black text-xs uppercase tracking-wider mb-4 border-b border-[#f0c040]/30 pb-2">Payment Details</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-[#1a3a2a]/40 uppercase">Account Name</span>
                  <input className="invoice-input text-xs font-black text-[#1a3a2a]" value={bankDetails.accountName} onChange={e => setBankDetails({...bankDetails, accountName: e.target.value})} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-[#1a3a2a]/40 uppercase">Account No</span>
                  <input className="invoice-input text-xs font-black text-[#1a3a2a]" value={bankDetails.accountNo} onChange={e => setBankDetails({...bankDetails, accountNo: e.target.value})} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-[#1a3a2a]/40 uppercase">Bank Name</span>
                  <input className="invoice-input text-xs font-black text-[#1a3a2a]" value={bankDetails.bankName} onChange={e => setBankDetails({...bankDetails, bankName: e.target.value})} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-[#1a3a2a]/40 uppercase">IFSC Code</span>
                  <input className="invoice-input text-xs font-black text-[#1a3a2a]" value={bankDetails.ifsc} onChange={e => setBankDetails({...bankDetails, ifsc: e.target.value})} />
                </div>
              </div>
           </div>

           {/* Signatory */}
           <div className="flex flex-col items-center self-center pt-8">
              <div className="w-48 h-12 border-b-2 border-slate-200 mb-3 grayscale opacity-30 select-none pointer-events-none flex items-center justify-center">
                 <span className="text-[10px] uppercase font-bold text-slate-300">Digital Signature</span>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black text-[#1a3a2a] uppercase tracking-wider">Authorized Signatory</p>
                 <p className="text-[9px] font-bold text-slate-400 mt-0.5">For {fromDetails.name}</p>
              </div>
           </div>
        </div>
        
        {/* FOOTER STRIP */}
        <div className="bg-[#1a3a2a] h-2 w-full"></div>
      </div>
      
      {/* PRINT TIPS - SCREEN ONLY */}
      <div className="max-w-[1000px] mx-auto mt-6 p-4 bg-sky-50 border border-sky-100 rounded-lg flex items-start gap-4 print:hidden">
        <div className="p-2 bg-sky-500 rounded-full text-white">
           <Download className="w-4 h-4" />
        </div>
        <div>
           <h4 className="text-sm font-bold text-sky-900">Print Tip:</h4>
           <p className="text-xs text-sky-800 leading-relaxed mt-1">
             To get the best result when exporting to PDF, select <strong>"Save as PDF"</strong> as the destination in the print dialog. Ensure <strong>"Background Graphics"</strong> is checked in the options to see the dark green colors correctly.
           </p>
        </div>
      </div>
    </div>
  );
};
