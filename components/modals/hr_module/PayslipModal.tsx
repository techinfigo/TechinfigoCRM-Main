

import React from 'react';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import { PayrollRecord, TeamMember, AppSettings } from '../../../types';
import { safeFormatDate, safeFormatCurrency } from '@/utils';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payrollRecord: PayrollRecord;
  member: TeamMember;
  appSettings: AppSettings;
}

export const PayslipModal: React.FC<PayslipModalProps> = ({ isOpen, onClose, payrollRecord, member, appSettings }) => {

  if (!isOpen) return null;

  const handlePrint = () => {
    // This is a simplified print. For production, a dedicated PDF generation library would be better.
    const printContents = document.getElementById('payslip-content')?.innerHTML;
    const originalContents = document.body.innerHTML;
    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Reload to restore React app state
    }
  };
  
  const formatCurrency = (amount: number) => {
    return safeFormatCurrency(amount, appSettings.defaultCurrency || 'INR');
  };
  
  const earnings = [
      { name: 'Basic Salary', amount: payrollRecord.baseSalary },
      { name: 'Bonuses & Incentives', amount: payrollRecord.bonuses }
  ];

  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);

  const deductions = [
      { name: 'Professional Tax', amount: 200 },
      { name: 'Provident Fund (PF)', amount: payrollRecord.deductions * 0.6 || 1800 },
      { name: 'Other Deductions', amount: payrollRecord.deductions * 0.4 || 0 }
  ];
  
  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payslip for ${new Date(payrollRecord.monthYear + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}`}
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handlePrint}>Download / Print</Button>
        </>
      }
    >
        <div id="payslip-content" className="p-4 bg-white text-gray-800 font-sans text-sm">
            <header className="text-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold text-premium-accent">{appSettings.agencyName}</h2>
                <p className="text-xs text-text-muted">Payslip for the month of {new Date(payrollRecord.monthYear + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </header>

            <section className="grid grid-cols-2 gap-4 mb-6 text-xs">
                <div>
                    <h3 className="font-semibold mb-1">Employee Details</h3>
                    <p><strong>Name:</strong> {member.name}</p>
                    <p><strong>Designation:</strong> {member.jobTitle || 'N/A'}</p>
                    <p><strong>Department:</strong> {member.department || 'N/A'}</p>
                    <p><strong>Date of Joining:</strong> {safeFormatDate(member.dateJoined)}</p>
                </div>
                <div className="text-right">
                    <p><strong>Payslip #:</strong> {payrollRecord.id}</p>
                    <p><strong>Payable Days:</strong> {payrollRecord.attendanceDays || 'N/A'}</p>
                </div>
            </section>
            
            <section className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-800 mb-2">Earnings</h3>
                    <table className="w-full text-xs">
                        <tbody>
                            {earnings.map(item => (
                                <tr key={item.name}>
                                    <td className="py-1">{item.name}</td>
                                    <td className="py-1 text-right">{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-green-300">
                             <tr>
                                <td className="py-1 font-bold">Total Earnings</td>
                                <td className="py-1 text-right font-bold">{formatCurrency(totalEarnings)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                 <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <h3 className="font-semibold text-red-800 mb-2">Deductions</h3>
                     <table className="w-full text-xs">
                        <tbody>
                            {deductions.map(item => (
                                <tr key={item.name}>
                                    <td className="py-1">{item.name}</td>
                                    <td className="py-1 text-right">{formatCurrency(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                         <tfoot className="border-t-2 border-red-300">
                             <tr>
                                <td className="py-1 font-bold">Total Deductions</td>
                                <td className="py-1 text-right font-bold">{formatCurrency(totalDeductions)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>

            <footer className="text-center mt-6 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-semibold">Net Salary Payable</p>
                <p className="text-2xl font-bold text-premium-accent">{formatCurrency(payrollRecord.netSalary)}</p>
                <p className="text-xs text-text-muted mt-1">This is a computer-generated payslip and does not require a signature.</p>
            </footer>
        </div>
    </Modal>
  );
};
