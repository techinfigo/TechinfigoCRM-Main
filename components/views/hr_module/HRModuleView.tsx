
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TeamMembersListPage } from './TeamMembersListPage';
import { LeavesView } from '../LeavesView'; 
import { TeamMember, FeatureKey, PermissionAction, RoleDefinition, LeaveRequest, LeaveRequestStatus, DailyAttendanceRecord, AppSettings, HRStatus, AttendanceEntry, AttendanceStatus, PerformanceReview, attendanceStatuses, PayrollRecord, HRDocument } from '../../../types'; 
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { Input, TextArea } from '../../common/Input';
import { Modal } from '../../common/Modal';
import { GoogleGenAI } from "@google/genai"; 
import { HRDashboardContent } from '../../hr_module/HRDashboardContent';
import Chart from 'chart.js/auto';
import { PayrollView } from '../../hr_module/PayrollView';
import { PerformanceView } from '../../hr_module/PerformanceView';
import { OnboardingView } from '../../hr_module/OnboardingView';
import { ExitManagementView } from '../../hr_module/ExitManagementView';
import { AttendanceView } from '../../hr_module/AttendanceView';
import { DocumentManagementView } from '../../hr_module/DocumentManagementView';
import { MessageSquare } from 'lucide-react';

interface HRModuleViewProps {
  teamMembers: TeamMember[];
  onOpenTeamMemberHRFormModal: (member?: TeamMember | null) => void;
  onDeleteTeamMemberHR: (memberId: string) => void;
  onOpenTeamMemberHRDetailModal: (member: TeamMember) => void; 
  
  leaveRequests: LeaveRequest[];
  currentUser: TeamMember; 
  onOpenLeaveRequestModal: (leaveRequest?: LeaveRequest) => void;
  onUpdateLeaveStatus: (requestId: string, status: LeaveRequestStatus, adminNotes?: string) => void;
  onCancelLeaveRequest: (requestId: string) => void;
  dailyAttendanceRecords: DailyAttendanceRecord[];
  onSaveAttendance: (record: DailyAttendanceRecord) => void; 
  onOpenMarkAttendanceModal: () => void;

  performanceReviews: PerformanceReview[]; 
  onOpenPerformanceReviewModal: (employee: TeamMember, review?: PerformanceReview) => void; 

  onOpenApproveLeavesModal: () => void;
  onOpenUploadHRDocumentModal: (defaults?: {employeeId?: string}) => void;
  onOpenScheduleExitInterviewModal: () => void;
  
  hrDocuments: HRDocument[];
  onSaveHRDocument: (docData: Omit<HRDocument, 'id' | 'uploadedByUserId' | 'uploadedByUserName'>) => void;

  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  roleDefinitions: RoleDefinition[];
  appSettings: AppSettings; 
  ai: GoogleGenAI | null; 
  payrollRecords: PayrollRecord[];
  onOpenOnboardingChecklistModal: (member: TeamMember) => void;
  onOpenExitChecklistModal: (member: TeamMember) => void;
  onOpenPayslipModal: (payrollRecord: PayrollRecord, member: TeamMember) => void;
  onOpenProcessSalaryModal: (payrollRecord: PayrollRecord, member: TeamMember) => void;
  onRunBulkPayroll: (monthYear: string) => void;
}

type HRModuleTab = 
  | 'hr_dashboard' 
  | 'team_members' 
  | 'attendance' 
  | 'leaves' 
  | 'payroll' 
  | 'performance' 
  | 'onboarding' 
  | 'exit_management' 
  | 'ai_hr_assistant' 
  | 'documents';

// Icons
const UserGroupIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 shrink-0"}><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326C1.38 14.544 1.503 13.712 1.838 13.018A6.985 6.985 0 013 12.5a6.985 6.985 0 011-2.482 1.036 1.036 0 00-.733-1.63C2.112 8.281 1.085 9.074.8 10.022A7.003 7.003 0 000 12.5a7.003 7.003 0 00.8 2.478.998.998 0 001.65-.036A6.985 6.985 0 013 12.5c0-1.26.368-2.439.996-3.461a1 1 0 00-1.44-1.23C1.619 8.951 1 10.082 1 11.318a7.982 7.982 0 001.49 4.008zM19.199 10.022C18.914 9.074 17.887 8.28 16.742 8.384a1.036 1.036 0 00-.733 1.63A6.985 6.985 0 0117 12.5a6.985 6.985 0 01-1.004 3.461 1 1 0 001.44 1.23c.895-1.12.96-2.428.96-3.873a7.982 7.982 0 00-1.49-4.009zM14 8a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const CalendarDaysIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 shrink-0"}><path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c0-.69.56-1.25 1.25-1.25h10.5c.69 0 1.25-.56 1.25-1.25v6.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-6.5z" clipRule="evenodd" /><path d="M9.44 11.53a.75.75 0 10-1.06-1.06l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72z" /><path d="M13.59 9.47a.75.75 0 00-1.06-1.06l-3.25 3.25a.75.75 0 001.06 1.06l3.25-3.25z" /></svg>;
const PalmTreeIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-5 h-5 shrink-0"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.75-1.75M12 18.75V21m-4.773-4.227-1.624 1.624M5.25 12H3m4.227-4.773L5.636 5.636M15.75 5.25l1.591-1.591M12 9l-1.25.75M12 9v3.75m0 0l-1.25.75M12 12.75l1.25.75M12 12.75V9m1.25-.75L12 9m0 0V4.5m6.75 6H12m0 0V4.5m-6.75 6H12m0 0V4.5" /></svg>;
const HomeIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 shrink-0"}><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 10.5V18a1 1 0 01-1 1h-2.5a1 1 0 01-1-1v-3.5a1 1 0 00-1-1h-2a1 1 0 00-1 1V17a1 1 0 01-1 1H4a1 1 0 01-1-1v-7.5a1 1 0 01.293-.707l7-7z" clipRule="evenodd" /></svg>;
const CurrencyRupeeIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 shrink-0"}><path d="M10.06 5.895a.75.75 0 00-1.062.014l-3.75 4.061a.75.75 0 00.53 1.28h2.472v.531A2.53 2.53 0 0010.75 14h.5a.75.75 0 000-1.5h-.5a1.03 1.03 0 01-1.03-1.031v-.531h.97a.75.75 0 00.53-1.28l-3.75-4.061a.75.75 0 00-.638-.289zM10.75 3.5a.75.75 0 00-1.5 0v1.25h1.5V3.5z" /><path fillRule="evenodd" d="M7.25 1A5.75 5.75 0 001.5 6.75v6.5A5.75 5.75 0 007.25 19h5.5A5.75 5.75 0 0018.5 13.25v-6.5A5.75 5.75 0 0012.75 1h-5.5zM6.293 3.22a4.25 4.25 0 017.414 0H6.293zM4.5 6.75a4.25 4.25 0 014.087-4.244.75.75 0 00.326 1.456A2.75 2.75 0 004.5 6.75v6.5A2.75 2.75 0 007.25 16h5.5A2.75 2.75 0 0015.5 13.25v-6.5a2.75 2.75 0 00-3.413-2.706.75.75 0 00.326-1.456A4.25 4.25 0 0115.5 6.75v6.5a4.25 4.25 0 01-4.25 4.25h-5.5A4.25 4.25 0 013 13.25v-6.5c0-.35.043-.69.125-1.018A4.232 4.232 0 014.5 6.75z" clipRule="evenodd" /></svg>;
const StarIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 shrink-0"}><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.423 3.595c-.736.771.256 1.991.984 1.991H6.9l-1.296 4.401c-.16.546.435.946.945.626L10 15.11l2.371 2.754c.484.563 1.377.206 1.486-.459l.526-3.23L15.013 18c.554.01.98-.426.98-.979l.003-3.712 2.768-.23c.63-.053.923-.83.486-1.309l-3.423-3.595-4.753-.39-1.83-4.401z" clipRule="evenodd" /></svg>;
const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 shrink-0"}><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm5.75 2.75a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" /></svg>;

const UserPlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 shrink-0"}>
    <path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 18a9.953 9.953 0 01-5.385-1.572zM16.25 5.75a.75.75 0 00-1.5 0v2h-2a.75.75 0 000 1.5h2v2a.75.75 0 001.5 0v-2h2a.75.75 0 000-1.5h-2v-2z" />
  </svg>
);

const UserMinusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5 shrink-0"}>
         <path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 018 18a9.953 9.953 0 01-5.385-1.572zM13 7.75a.75.75 0 000 1.5h4a.75.75 0 000-1.5h-4z" />
    </svg>
);

export const HRModuleView: React.FC<HRModuleViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HRModuleTab>('hr_dashboard');
  
  const hasHRViewPermission = props.hasPermission('hrModule', 'canViewHRModule');
  const isHRAdmin = props.hasPermission('hrModule', 'canManageHRMembers');

  const renderContent = () => {
      if (!hasHRViewPermission) {
          return <div className="text-center py-12 text-text-muted">You do not have permission to view the HR Module.</div>;
      }

      switch (activeTab) {
          case 'hr_dashboard':
              return <HRDashboardContent 
                          teamMembers={props.teamMembers} 
                          leaveRequests={props.leaveRequests} 
                          dailyAttendanceRecords={props.dailyAttendanceRecords} 
                          onOpenTeamMemberHRFormModal={props.onOpenTeamMemberHRFormModal} 
                          onOpenMarkAttendanceModal={props.onOpenMarkAttendanceModal} 
                          onOpenApproveLeavesModal={props.onOpenApproveLeavesModal} 
                          onOpenUploadHRDocumentModal={props.onOpenUploadHRDocumentModal} 
                          onOpenScheduleExitInterviewModal={props.onOpenScheduleExitInterviewModal} 
                      />;
          case 'team_members':
              return <TeamMembersListPage 
                          teamMembers={props.teamMembers} 
                          onOpenTeamMemberHRFormModal={props.onOpenTeamMemberHRFormModal} 
                          onDeleteTeamMemberHR={props.onDeleteTeamMemberHR} 
                          onOpenTeamMemberHRDetailPanel={props.onOpenTeamMemberHRDetailModal}
                          hasPermission={props.hasPermission}
                          roleDefinitions={props.roleDefinitions}
                      />;
          case 'attendance':
              return <AttendanceView teamMembers={props.teamMembers} dailyAttendanceRecords={props.dailyAttendanceRecords} onOpenMarkAttendanceModal={props.onOpenMarkAttendanceModal} onSaveAttendance={props.onSaveAttendance} />;
          case 'leaves':
              return <LeavesView 
                          leaveRequests={props.leaveRequests} 
                          currentUser={props.currentUser} 
                          teamMembers={props.teamMembers}
                          onOpenLeaveRequestModal={props.onOpenLeaveRequestModal} 
                          onUpdateLeaveStatus={props.onUpdateLeaveStatus} 
                          onCancelLeaveRequest={props.onCancelLeaveRequest}
                          hasPermission={props.hasPermission}
                      />;
          case 'payroll':
              return <PayrollView teamMembers={props.teamMembers} payrollRecords={props.payrollRecords} onOpenPayslipModal={props.onOpenPayslipModal} onOpenProcessSalaryModal={props.onOpenProcessSalaryModal} onRunBulkPayroll={props.onRunBulkPayroll} appSettings={props.appSettings} />;
          case 'performance':
              return <PerformanceView teamMembers={props.teamMembers} performanceReviews={props.performanceReviews} onOpenPerformanceReviewModal={props.onOpenPerformanceReviewModal} />;
          case 'onboarding':
              return <OnboardingView teamMembers={props.teamMembers} onOpenTeamMemberHRFormModal={props.onOpenTeamMemberHRFormModal} onOpenOnboardingChecklistModal={props.onOpenOnboardingChecklistModal} />;
          case 'exit_management':
              return <ExitManagementView teamMembers={props.teamMembers} onOpenExitChecklistModal={props.onOpenExitChecklistModal} onOpenScheduleExitInterviewModal={props.onOpenScheduleExitInterviewModal} />;
          case 'documents':
              return <DocumentManagementView hrDocuments={props.hrDocuments} teamMembers={props.teamMembers} onSaveHRDocument={props.onSaveHRDocument} onOpenUploadHRDocumentModal={props.onOpenUploadHRDocumentModal} />;
          case 'ai_hr_assistant':
               return (
                  <Card title="AI HR Assistant" className="bg-transparent shadow-none border-0 p-0">
                      <div className="flex flex-col items-center justify-center p-12 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-indigo-100 dark:border-slate-700 min-h-[400px]">
                          <div className="p-4 bg-white dark:bg-slate-700 rounded-full shadow-lg mb-4">
                              <MessageSquare className="w-8 h-8 text-indigo-500" />
                          </div>
                          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Ask HR Anything</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-center max-w-md mb-6">
                              Need help with policies, drafting emails, or analyzing employee sentiment? 
                              Your AI assistant is here to help.
                          </p>
                          <div className="w-full max-w-lg">
                              <div className="relative">
                                  <input 
                                      type="text" 
                                      placeholder="e.g., Draft an offer letter for a Senior React Developer..." 
                                      className="w-full p-4 pr-12 rounded-xl border-2 border-indigo-100 dark:border-slate-600 focus:border-indigo-500 focus:ring-0 shadow-sm bg-white dark:bg-slate-800"
                                  />
                                  <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                  </button>
                              </div>
                          </div>
                      </div>
                  </Card>
              );
          default:
              return null;
      }
  };

  const TabButton: React.FC<{ id: HRModuleTab; label: string; icon: React.ReactNode }> = ({ id, label, icon }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap
        ${activeTab === id 
            ? 'bg-secondary-accent/10 text-secondary-accent' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
    >
        <span className={`shrink-0 ${activeTab === id ? 'text-secondary-accent' : 'text-gray-400 dark:text-gray-500'}`}>{icon}</span>
        <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col space-y-6">
       {/* Nav Header Card */}
       <div className="bg-white dark:bg-slate-800 border border-border-base dark:border-slate-700 rounded-xl px-2 py-2 shadow-sm">
           <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1">
                <TabButton id="hr_dashboard" label="Overview" icon={<HomeIcon />} />
                <TabButton id="team_members" label="Employees" icon={<UserGroupIcon />} />
                <TabButton id="attendance" label="Attendance" icon={<CalendarDaysIcon />} />
                <TabButton id="leaves" label="Leaves" icon={<PalmTreeIcon />} />
                {isHRAdmin && (
                    <>
                        <TabButton id="payroll" label="Payroll" icon={<CurrencyRupeeIcon />} />
                        <TabButton id="performance" label="Performance" icon={<StarIcon />} />
                        <TabButton id="onboarding" label="Onboarding" icon={<UserPlusIcon />} />
                        <TabButton id="exit_management" label="Offboarding" icon={<UserMinusIcon />} />
                        <TabButton id="documents" label="Documents" icon={<DocumentTextIcon />} />
                        <TabButton id="ai_hr_assistant" label="AI Assistant" icon={<MessageSquare className="w-5 h-5 shrink-0" />} />
                    </>
                )}
           </div>
       </div>

       {/* Main Content Container */}
       <div className="animate-in fade-in duration-300">
            {renderContent()}
       </div>
    </div>
  );
};
