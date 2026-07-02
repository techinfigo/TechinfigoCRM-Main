
import React, { useMemo } from 'react';
import { Card } from '../../common/Card';
import { ActivityLogItem, TeamMember, MarketingAuditRequest, Client } from '../../../types';

interface AdminDashboardViewProps {
  dataCounts: {
    teamMembers: number; // Total Users
    projects: number;
  };
  activityHistory: ActivityLogItem[];
  teamMembers: TeamMember[];
  marketingAudits: MarketingAuditRequest[];
  clients: Client[];
}

const StatCard: React.FC<{ title: string; value: number | string; bgColorClass?: string, icon?: React.ReactNode, description?: string }> =
    ({ title, value, bgColorClass="bg-slate-50 dark:bg-slate-700/50", icon, description }) => (
  <Card className={`${bgColorClass} shadow-lg hover:shadow-xl dark:hover:shadow-slate-700/70 transition-shadow`} contentClassName="text-center p-5">
    {icon && <div className="text-3xl text-slate-500 dark:text-slate-400 mb-2 mx-auto w-fit">{icon}</div>}
    <p className="text-4xl font-bold text-slate-700 dark:text-slate-100">{value}</p>
    <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">{title}</p>
    {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>}
  </Card>
);


export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  dataCounts, activityHistory, teamMembers, marketingAudits, clients
}) => {
  const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326C1.38 14.544 1.503 13.712 1.838 13.018A6.985 6.985 0 013 12.5a6.985 6.985 0 011-2.482 1.036 1.036 0 00-.733-1.63C2.112 8.281 1.085 9.074.8 10.022A7.003 7.003 0 000 12.5a7.003 7.003 0 00.8 2.478.998.998 0 001.65-.036A6.985 6.985 0 013 12.5c0-1.26.368-2.439.996-3.461a1 1 0 00-1.44-1.23C1.619 8.951 1 10.082 1 11.318a7.982 7.982 0 001.49 4.008zM19.199 10.022C18.914 9.074 17.887 8.28 16.742 8.384a1.036 1.036 0 00-.733 1.63A6.985 6.985 0 0117 12.5a6.985 6.985 0 01-1.004 3.461 1 1 0 001.44 1.23c.895-1.12.96-2.428.96-3.873a7.982 7.982 0 00-1.49-4.009zM14 8a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
  const ProjectsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path d="M3.505 2.365A4.5 4.5 0 017.75 1.5h4.5a4.5 4.5 0 014.245.865L16.5 2.5H15a1 1 0 00-1-1H6a1 1 0 00-1 1H3.5l.005-.135zM3 4.5a.5.5 0 01.5-.5H11a.5.5 0 010 1H3.5a.5.5 0 01-.5-.5zM3 6.5a.5.5 0 01.5-.5h8a.5.5 0 010 1H3.5a.5.5 0 01-.5-.5zM3 8.5a.5.5 0 01.5-.5h5a.5.5 0 010 1H3.5a.5.5 0 01-.5-.5zM3 14a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" /></svg>;
  const ReportsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M12.55 3.098a.75.75 0 01.459.92l-1.28 4.078a.75.75 0 01-1.428-.448l1.28-4.078a.75.75 0 01.97-.472zM15.25 10a.75.75 0 01.75-.75h.01a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.01a.75.75 0 01-.75-.75V10zM17.5 6.5a.75.75 0 00-.75.75v.01a.75.75 0 00.75.75h.008a.75.75 0 00.75-.75V7.25a.75.75 0 00-.75-.75H17.5zM2 5.75A.75.75 0 012.75 5h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 5.75zM2.5 9A.75.75 0 002 9.75v4.5A.75.75 0 002.75 15h14.5a.75.75 0 00.75-.75v-4.5a.75.75 0 00-.75-.75H2.5zM17 14.25H3V9.75h14v4.5zM6.902 11.03a.75.75 0 01.459.92L6.08 16.028a.75.75 0 01-1.428-.448l1.28-4.078a.75.75 0 01.97-.472z" clipRule="evenodd" /></svg>;
  const AuditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8"><path d="M10 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5M7.75 11.415c-.895.242-1.764.73-2.498 1.387A3.5 3.5 0 003 15.57V15.75c0 .759.303 1.456.844 1.983a4.5 4.5 0 015.312 0 3.499 3.499 0 005.312 0A3.5 3.5 0 0017 15.75v-.18a3.5 3.5 0 00-2.252-2.768 3.5 3.5 0 00-2.498-1.387 3.5 3.5 0 00-4.5 0z" /></svg>;

  const completedMarketingAudits = useMemo(() => {
    return marketingAudits.filter(audit => audit.status === 'Completed' && audit.lastGeneratedDate);
  }, [marketingAudits]);

  const latestActivities = useMemo(() => {
    return [...activityHistory]
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [activityHistory]);

  const latestReports = useMemo(() => {
    return [...completedMarketingAudits]
      .sort((a,b) => new Date(b.lastGeneratedDate!).getTime() - new Date(a.lastGeneratedDate!).getTime())
      .slice(0, 3);
  }, [completedMarketingAudits]);

  const formatTimestampForDisplay = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };


  return (
    <div className="space-y-6">
      <Card title="Admin Dashboard: Quick Stats" className="bg-white dark:bg-slate-800" headerClassName="bg-slate-50 dark:bg-slate-700/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard title="Total Users" value={dataCounts.teamMembers} icon={<UsersIcon />} description="(Team Members)" />
          <StatCard title="Total Projects" value={dataCounts.projects} icon={<ProjectsIcon />} />
          <StatCard title="Completed Audits" value={completedMarketingAudits.length} icon={<AuditIcon />} description="Marketing Audits" />
          <StatCard title="Reports Generated" value={completedMarketingAudits.length} icon={<ReportsIcon />} description="(Marketing Audits)" />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Latest User Activities" className="bg-white dark:bg-slate-800">
          {latestActivities.length > 0 ? (
            <ul className="space-y-2.5 text-xs max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {latestActivities.map(log => (
                <li key={log.id} className="p-2 bg-slate-50 dark:bg-slate-700/60 rounded-md border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{log.userName}</span>
                    <span className="text-slate-400 dark:text-slate-500">{formatTimestampForDisplay(log.timestamp)}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {log.actionType.replace(/_/g, ' ').toLowerCase()} {log.entityType.toLowerCase()} <span className="font-medium text-slate-600 dark:text-slate-300">"{log.entityName || log.entityId}"</span>.
                  </p>
                  {log.details && <p className="text-slate-400 dark:text-slate-500 text-xxs mt-0.5 italic">Details: {log.details}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600 dark:text-slate-300 text-sm text-center py-4">No user activity recorded yet.</p>
          )}
        </Card>

        <Card title="Latest Generated Reports" className="bg-white dark:bg-slate-800">
          {latestReports.length > 0 ? (
             <ul className="space-y-2.5 text-xs max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {latestReports.map(report => {
                const clientName = clients.find(c => c.id === report.clientId)?.name || report.clientName || 'N/A';
                return (
                  <li key={report.id} className="p-2 bg-slate-50 dark:bg-slate-700/60 rounded-md border border-slate-200 dark:border-slate-600">
                    <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate" title={`Marketing Audit for ${clientName}`}>Marketing Audit for {clientName}</span>
                         <span className="text-slate-400 dark:text-slate-500 shrink-0 ml-2">{new Date(report.lastGeneratedDate!).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xxs mt-0.5">Website: {report.websiteUrl}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
             <p className="text-slate-600 dark:text-slate-300 text-sm text-center py-4">No reports generated yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
};
