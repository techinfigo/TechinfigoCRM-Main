
import React, { useState, useRef, useMemo } from 'react';
import { TeamMember, RoleDefinition, LeaveRequest, Project, DailyAttendanceRecord, AttendanceEntry, PerformanceReview } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import Chart from 'chart.js/auto';

// Define Tab Types
type EmployeeDetailTab = 'Profile' | 'Attendance' | 'Payroll' | 'Performance' | 'Documents';

// Define Uploaded Document Type
interface UploadedHRDocument {
  id: string;
  name: string;
  type: string; // MIME type
  displayType: string; // Simplified for display (PDF, JPEG)
  size?: number;
  uploadDate: string; // YYYY-MM-DD
  file?: File; // Store the actual file object for potential download
}

interface CalculatedPayrollData {
    baseSalary: number;
    totalDaysInMonth: number;
    workingDays: number; // Assumed fixed or calculated
    daysPresent: number;
    daysAbsentUnpaid: number;
    netPayableSalary: number;
}

interface EmployeeDetailViewProps {
  employee: TeamMember;
  onEditRequest: (employee: TeamMember) => void;
  roleDefinitions: RoleDefinition[];
  leaveRequests: LeaveRequest[];
  projects: Project[];
  dailyAttendanceRecords: DailyAttendanceRecord[]; 
  performanceReviews?: PerformanceReview[]; // Optional for now
  onOpenPerformanceReviewModal?: (employee: TeamMember, review?: PerformanceReview) => void; // Optional
}

const safeDateFormat = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Invalid Date';
        return date.toLocaleDateString();
    } catch (e) {
        return 'Invalid Date';
    }
};

// Icons
const UserIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12.5a7.5 7.5 0 00-6.353 3.635A8.004 8.004 0 0010 18a8.004 8.004 0 006.353-1.865A7.5 7.5 0 0010 12.5z" clipRule="evenodd" /></svg>;
const CalendarDaysIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c0-.69.56-1.25 1.25-1.25h10.5c.69 0 1.25-.56 1.25-1.25v6.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-6.5z" clipRule="evenodd" /><path d="M9.44 11.53a.75.75 0 10-1.06-1.06l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72z" /><path d="M13.59 9.47a.75.75 0 00-1.06-1.06l-3.25 3.25a.75.75 0 001.06 1.06l3.25-3.25z" /></svg>;
const CurrencyRupeeIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M10.06 5.895a.75.75 0 00-1.062.014l-3.75 4.061a.75.75 0 00.53 1.28h2.472v.531A2.53 2.53 0 0010.75 14h.5a.75.75 0 000-1.5h-.5a1.03 1.03 0 01-1.03-1.031v-.531h.97a.75.75 0 00.53-1.28l-3.75-4.061a.75.75 0 00-.638-.289zM10.75 3.5a.75.75 0 00-1.5 0v1.25h1.5V3.5z" /><path fillRule="evenodd" d="M7.25 1A5.75 5.75 0 001.5 6.75v6.5A5.75 5.75 0 007.25 19h5.5A5.75 5.75 0 0018.5 13.25v-6.5A5.75 5.75 0 0012.75 1h-5.5zM6.293 3.22a4.25 4.25 0 017.414 0H6.293zM4.5 6.75a4.25 4.25 0 014.087-4.244.75.75 0 00.326 1.456A2.75 2.75 0 004.5 6.75v6.5A2.75 2.75 0 007.25 16h5.5A2.75 2.75 0 0015.5 13.25v-6.5a2.75 2.75 0 00-3.413-2.706.75.75 0 00.326-1.456A4.25 4.25 0 0115.5 6.75v6.5a4.25 4.25 0 01-4.25 4.25h-5.5A4.25 4.25 0 013 13.25v-6.5c0-.35.043-.69.125-1.018A4.232 4.232 0 014.5 6.75z" clipRule="evenodd" /></svg>;
const StarIconSvg: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.423 3.595c-.736.771.256 1.991.984 1.991H6.9l-1.296 4.401c-.16.546.435.946.945.626L10 15.11l2.371 2.754c.484.563 1.377.206 1.486-.459l.526-3.23L15.013 18c.554.01.98-.426.98-.979l.003-3.712 2.768-.23c.63-.053.923-.83.486-1.309l-3.423-3.595-4.753-.39-1.83-4.401z" clipRule="evenodd" /></svg>;
const DocumentTextIcon: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm5.75 2.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" /></svg>;
const EditIconSmall: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M9.25 13.75a.75.75 0 001.5 0V4.793l2.97 2.97a.75.75 0 001.06-1.06l-4.25-4.25a.75.75 0 00-1.06 0L5.22 6.703a.75.75 0 001.06 1.06L9.25 4.793V13.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-4 h-4"}><path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" /><path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" /></svg>;
const FileIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 text-slate-500 dark:text-slate-400"}><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 8.5a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" /></svg>;
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className || "w-4 h-4"}><path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5zM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498-.075l-.275-5.5A.75.75 0 0 1 6.05 6zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711z" clipRule="evenodd" /></svg>;
const PlusIcon: React.FC<{className?: string}> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;

export const EmployeeDetailView: React.FC<EmployeeDetailViewProps> = ({ 
    employee, onEditRequest, roleDefinitions, leaveRequests, projects, dailyAttendanceRecords,
    performanceReviews = [], onOpenPerformanceReviewModal 
}) => {
  const [activeTab, setActiveTab] = useState<EmployeeDetailTab>('Profile');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedHRDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Payroll Tab State
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [calculatedPayrollData, setCalculatedPayrollData] = useState<CalculatedPayrollData | null>(null);


  const appRoleName = employee.roleId 
    ? (roleDefinitions.find(r => r.id === employee.roleId)?.name || employee.role) 
    : employee.role;

  const tabItems = [
    { id: 'Profile', label: 'Profile', icon: <UserIcon /> },
    { id: 'Attendance', label: 'Attendance', icon: <CalendarDaysIcon /> },
    { id: 'Payroll', label: 'Payroll', icon: <CurrencyRupeeIcon /> },
    { id: 'Performance', label: 'Performance', icon: <StarIconSvg /> },
    { id: 'Documents', label: 'Documents', icon: <DocumentTextIcon /> },
  ];

  const detailItem = (label: string, value: React.ReactNode | undefined | null, className?: string) => (
    <div className={`py-1.5 ${className || ''}`}>
        <dt className="text-xs font-medium text-text-muted dark:text-slate-400">{label}</dt>
        <dd className="text-sm text-text-base dark:text-slate-200">{value === undefined || value === null ? 'N/A' : value}</dd>
    </div>
  );
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const displayType = file.type.split('/')[1]?.toUpperCase() || 'File';
      const newDocument: UploadedHRDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        type: file.type,
        displayType,
        size: file.size,
        uploadDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        file: file, 
      };
      setUploadedDocuments(prev => [...prev, newDocument]);

      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (window.confirm("Are you sure you want to delete this document? This action cannot be undone from this view.")) {
      setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId));
    }
  };

  const handleDownloadDocument = (doc: UploadedHRDocument) => {
    if (doc.file) {
      const url = URL.createObjectURL(doc.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert(`Conceptual: Download for ${doc.name}. Actual file data not available for pre-loaded/dummy documents.`);
    }
  };

  const handleCalculatePayroll = () => {
    if (!selectedPayrollMonth) {
        alert("Please select a payroll month.");
        return;
    }

    const baseSalary = employee.monthlySalary || 50000; // Default if not set
    const [year, month] = selectedPayrollMonth.split('-').map(Number);
    const totalDaysInMonth = new Date(year, month, 0).getDate(); // month is 1-indexed from input, 0-indexed for Date
    const workingDays = 22; // Fixed for simplicity

    const employeeAttendanceForMonth = dailyAttendanceRecords
      .filter(record => record.date.startsWith(selectedPayrollMonth))
      .flatMap(record => record.entries)
      .filter(entry => entry.memberId === employee.id);

    let daysPresent = 0;
    employeeAttendanceForMonth.forEach(entry => {
        if (entry.status === 'Present' || entry.status === 'Late' || entry.status === 'Half-Day') {
            daysPresent += 1; // Simplified: Half-Day counts as a full present day for this calc
        }
    });
    
    const daysAbsentUnpaid = Math.max(0, workingDays - daysPresent);
    const netPayableSalary = workingDays > 0 ? (daysPresent / workingDays) * baseSalary : 0;
    
    setCalculatedPayrollData({
        baseSalary,
        totalDaysInMonth,
        workingDays,
        daysPresent,
        daysAbsentUnpaid,
        netPayableSalary: parseFloat(netPayableSalary.toFixed(2)),
    });
  };

  const employeePerformanceReviews = useMemo(() => {
    return (performanceReviews || []).filter(review => review.employeeId === employee.id)
      .sort((a,b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());
  }, [performanceReviews, employee.id]);


  const renderTabContent = () => {
    switch (activeTab) {
      case 'Profile':
        return (
          <Card title="Personal & Employment Information" className="bg-transparent shadow-none border-0 p-0">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {detailItem("Full Name", employee.name)}
              {detailItem("Email Address", employee.email)}
              {detailItem("Phone Number", employee.phoneNumber)}
              {detailItem("Job Title", employee.jobTitle)}
              {detailItem("Department", employee.department)}
              {detailItem("Joining Date", safeDateFormat(employee.dateJoined))}
              {detailItem("HR Status", employee.hrStatus)}
              {detailItem("App Access Role", appRoleName)}
              {employee.hrNotes && detailItem("HR Notes", employee.hrNotes, "sm:col-span-2 whitespace-pre-wrap")}
            </dl>
            <div className="mt-6">
                <Button variant="primary" onClick={() => onEditRequest(employee)} leftIcon={<EditIconSmall/>}>
                    Edit HR Details
                </Button>
            </div>
          </Card>
        );
      case 'Attendance':
        return <Card title="Attendance Records" className="bg-transparent shadow-none border-0 p-0"><p className="text-text-muted dark:text-slate-400">Attendance tracking coming soon. Integration with Attendance tab planned.</p></Card>;
      case 'Payroll':
        return (
            <Card title="Payroll Information" className="bg-transparent shadow-none border-0 p-0">
                 <div className="mb-4 flex flex-col sm:flex-row gap-3 items-end">
                    <Input
                        label="Select Payroll Month"
                        type="month"
                        value={selectedPayrollMonth}
                        onChange={(e) => { setSelectedPayrollMonth(e.target.value); setCalculatedPayrollData(null);}}
                        containerClassName="max-w-xs"
                    />
                    <Button onClick={handleCalculatePayroll} variant="primary" size="md">Calculate Payroll</Button>
                 </div>

                {calculatedPayrollData ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted space-y-2 text-sm">
                        <h4 className="font-semibold text-text-base dark:text-text-base">Payroll for {new Date(selectedPayrollMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}:</h4>
                        {detailItem("Base Monthly Salary:", `₹${calculatedPayrollData.baseSalary.toLocaleString()}`)}
                        {detailItem("Total Days in Month:", calculatedPayrollData.totalDaysInMonth)}
                        {detailItem("Assumed Working Days:", calculatedPayrollData.workingDays)}
                        {detailItem("Days Present (Payable):", calculatedPayrollData.daysPresent)}
                        {detailItem("Days Absent (Unpaid):", calculatedPayrollData.daysAbsentUnpaid)}
                        <div className="pt-2 mt-2 border-t border-border-muted dark:border-slate-600">
                            {detailItem("Net Payable Salary:", <strong className="text-lg text-green-600 dark:text-green-400">₹{calculatedPayrollData.netPayableSalary.toLocaleString()}</strong>)}
                        </div>
                    </div>
                ) : (
                    <p className="text-text-muted dark:text-slate-400">Select a month and click "Calculate Payroll" to view details.</p>
                )}
                <Button variant="outline" size="xs" className="mt-3" onClick={() => alert('Conceptual: Download Full Payslip PDF')}>Download Full Payslip (PDF)</Button>
            </Card>
        );
      case 'Performance':
        return (
            <Card title="Performance Reviews" className="bg-transparent shadow-none border-0 p-0"
                actions={onOpenPerformanceReviewModal && (
                    <Button variant="primary" size="sm" onClick={() => onOpenPerformanceReviewModal(employee)} leftIcon={<PlusIcon/>}>
                        Add New Review
                    </Button>
                )}
            >
                {employeePerformanceReviews.length > 0 ? (
                    <ul className="space-y-3">
                        {employeePerformanceReviews.map(review => (
                            <li key={review.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-border-base dark:border-border-muted">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-semibold text-text-base dark:text-text-base">Review Date: {safeDateFormat(review.reviewDate)}</h4>
                                    {onOpenPerformanceReviewModal && (
                                        <Button variant="ghost" size="xs" onClick={() => onOpenPerformanceReviewModal(employee, review)} className="p-1"><EditIconSmall/></Button>
                                    )}
                                </div>
                                <p className="text-xs text-text-muted dark:text-slate-400">Reviewer: {review.reviewerName}</p>
                                <p className="text-xs mt-1"><strong>Goals:</strong> {review.goalsAchieved}</p>
                                <p className="text-xs mt-1"><strong>Feedback:</strong> {review.managerFeedback.substring(0,100)}...</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-text-muted dark:text-slate-400 text-center py-4">No performance reviews recorded yet.</p>
                )}
            </Card>
        );
      case 'Documents':
        return (
          <Card title="Employee Documents" className="bg-transparent shadow-none border-0 p-0">
            <div className="mb-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                aria-hidden="true"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<UploadIcon />}
              >
                Upload New Document
              </Button>
            </div>
            {uploadedDocuments.length === 0 ? (
              <p className="text-text-muted dark:text-slate-400">No documents uploaded for this employee yet.</p>
            ) : (
              <ul className="space-y-2">
                {uploadedDocuments.map(doc => (
                  <li key={doc.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-700/30 rounded-md border border-border-base dark:border-border-muted">
                    <div className="flex items-center min-w-0">
                      <FileIcon className="w-5 h-5 text-premium-accent dark:text-premium-accent-dark mr-2 shrink-0"/>
                      <div className="min-w-0 ml-2">
                        <p className="text-sm font-medium text-text-base dark:text-text-base truncate" title={doc.name}>{doc.name}</p>
                        <p className="text-xs text-text-muted dark:text-slate-400">
                          Type: {doc.displayType} | Uploaded: {doc.uploadDate}
                          {doc.size && ` | Size: ${formatFileSize(doc.size)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0 ml-2">
                      <Button variant="ghost" size="xs" title="Download Document" className="p-1" onClick={() => handleDownloadDocument(doc)}><DownloadIcon/></Button>
                      <Button variant="ghost" size="xs" title="Delete Document" className="p-1 text-status-negative" onClick={() => handleDeleteDocument(doc.id)}><TrashIcon /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-border-base dark:border-slate-700 sticky top-0 bg-bg-base dark:bg-slate-800 z-10 px-2 sm:px-4 flex-shrink-0">
        <nav className="-mb-px flex space-x-2 sm:space-x-3 overflow-x-auto" aria-label="Tabs">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as EmployeeDetailTab)}
              className={`whitespace-nowrap py-3 px-1.5 sm:px-2.5 border-b-2 text-xs sm:text-sm font-medium flex items-center rounded-t-md
                ${activeTab === tab.id
                  ? 'border-premium-accent text-premium-accent dark:border-premium-accent-dark dark:text-premium-accent-dark bg-premium-accent-light/20 dark:bg-premium-accent-dark/10'
                  : 'border-transparent text-text-muted hover:text-text-base hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
                }`}
            >
              {React.cloneElement(tab.icon, { className: `w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 ${activeTab === tab.id ? 'text-premium-accent dark:text-premium-accent-dark' : 'text-text-muted dark:text-slate-400 group-hover:text-text-base'}` })}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        {renderTabContent()}
      </div>
    </div>
  );
};
