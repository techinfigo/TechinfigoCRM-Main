
import React, { useState, useMemo, useRef, useEffect, DragEvent } from 'react';
import { Project, Client, TeamMember, FeatureKey, PermissionAction, ProjectStatus, Task, ProjectHealth, ProjectPriority } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../common/Pagination';
import { EmptyStatePlaceholder } from '../partials/EmptyStatePlaceholder';
import { List, LayoutGrid, BarChart3, Plus, Search, RotateCcw, FolderKanban, Edit2, Trash2 } from 'lucide-react';
import { ProjectsReportsTab } from '@/components/projects/ProjectsReportsTab';
import { ProjectsKanbanBoard } from '@/components/projects/ProjectsKanbanBoard';
import * as projectsSelectors from '@/selectors/projectsSelectors';
import { InlineErrorBanner } from '@/components/common/InlineErrorBanner';
import { DateRangePicker, DateRange } from '../common/DateRangePicker';
import { isDateInRange } from '@/utils';

type ProjectViewTab = 'List' | 'Board' | 'Reports';

interface ProjectsViewProps {
  projects: Project[];
  clients: Client[];
  teamMembers: TeamMember[];
  currentUser: TeamMember;
  onOpenProjectFormModal: (project?: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onViewProjectDetail: (project: Project) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onUpdateProject: (project: Project) => void;
  onBatchUpdateProjects: (projects: Project[]) => void;
  title?: string;
  isEmbedded?: boolean;
  clientId?: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, clients, teamMembers, currentUser, onOpenProjectFormModal, onDeleteProject, onViewProjectDetail, hasPermission, onUpdateProject, onBatchUpdateProjects, title = "Project Management", isEmbedded = false, clientId }) => {
  const [activeTab, setActiveTab] = useState<ProjectViewTab>('Board');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };
  
  const filteredProjects = useMemo(() => {
    return projectsSelectors.filterProjects({
        projects,
        filters: {
            searchTerm,
            clientId: isEmbedded ? clientId : undefined,
        }
    }).filter(project => isDateInRange(project.dueDate, dateRange));
  }, [projects, searchTerm, isEmbedded, clientId, dateRange]);

  const { paginatedData, ...paginationProps } = usePagination({ data: filteredProjects, initialEntriesPerPage: 10 });
  
  const isFiltered = searchTerm.trim() !== '' || (isEmbedded && clientId);

  const renderContent = () => {
    if (!Array.isArray(projects)) {
      return (
          <div className="p-4 flex-grow flex items-center justify-center">
              <InlineErrorBanner 
                  title="Could Not Load Projects"
                  message="There was a critical issue loading the project data. Please try again."
                  onRetry={handleRefresh}
              />
          </div>
      );
    }
    
    if (projects.length === 0 && !isFiltered) {
        return (
            <div className="p-4 flex-grow flex items-center justify-center">
                <InlineErrorBanner 
                    title="No Projects Created"
                    message="Your workspace doesn't have any projects yet. Create your first project to get started."
                    onRetry={handleRefresh}
                />
            </div>
        );
    }

    if (filteredProjects.length === 0) {
      return (
        <div className="p-4 flex-grow flex items-center justify-center">
          <EmptyStatePlaceholder
            icon={<FolderKanban size={48} />}
            title="No Projects Found"
            message="No projects match the current filters. Try adjusting your search."
            actionButton={hasPermission('projects', 'canCreate') ? <Button onClick={() => onOpenProjectFormModal()}>Create Project</Button> : undefined}
          />
        </div>
      );
    }

    switch (activeTab) {
      case 'List':
        return (
          <>
            <div className="overflow-x-auto rounded-lg border border-border-base dark:border-border-muted">
              <table className="min-w-full divide-y divide-border-base dark:divide-border-muted">
                <thead className="bg-slate-50 dark:bg-slate-800/40">
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-text-muted">Project</th>
                    <th className="p-3 text-left text-xs font-semibold text-text-muted">Client</th>
                    <th className="p-3 text-left text-xs font-semibold text-text-muted">Status</th>
                    <th className="p-3 text-left text-xs font-semibold text-text-muted">Due Date</th>
                    <th className="p-3 text-right text-xs font-semibold text-text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-bg-base dark:bg-bg-base divide-y divide-border-base dark:divide-border-muted">
                  {paginatedData.map(project => (
                    <tr key={project.id} className="hover:bg-highlight-accent dark:hover:bg-slate-800/60 cursor-pointer" onClick={() => onViewProjectDetail(project)}>
                      <td className="p-3 font-medium text-text-heading dark:text-text-heading">{project.name}</td>
                      <td className="p-3 text-text-muted">{project.clientName}</td>
                      <td className="p-3 text-text-muted">{project.status}</td>
                      <td className="p-3 text-text-muted">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" className="p-1.5" onClick={(e) => { e.stopPropagation(); onOpenProjectFormModal(project);}}><Edit2 size={16}/></Button>
                        {hasPermission('projects', 'canDelete') && <Button variant="ghost" size="sm" className="p-1.5 text-status-negative" onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id);}}><Trash2 size={16}/></Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t border-border-base dark:border-border-muted flex-shrink-0 flex items-center justify-end">
              <Pagination {...paginationProps} />
            </div>
          </>
        );
      case 'Board':
        return <ProjectsKanbanBoard projects={filteredProjects} teamMembers={teamMembers} onUpdateProject={onUpdateProject} onViewProjectDetail={onViewProjectDetail} />;
      case 'Reports':
        return <div className="p-4"><ProjectsReportsTab projects={filteredProjects} teamMembers={teamMembers} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Card 
        className="flex-grow flex flex-col"
        contentClassName="flex-grow flex flex-col"
        title={!isEmbedded ? title : undefined}
        actions={!isEmbedded ? (
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" isLoading={isRefreshing} onClick={handleRefresh} leftIcon={<RotateCcw size={16}/>}>Refresh</Button>
                {hasPermission('projects', 'canCreate') && (
                    <Button variant="primary" size="sm" onClick={() => onOpenProjectFormModal()} leftIcon={<Plus size={16}/>}>
                        New Project
                    </Button>
                )}
            </div>
        ) : undefined}
      >
        <div className="p-3 border-y border-border-base dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20 flex-shrink-0 mb-4">
             <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="flex-grow">
                    <Input
                      type="search"
                      placeholder="Search by name, client, tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      leftIcon={<Search className="w-4 h-4" />}
                      containerClassName="w-full"
                    />
                </div>
                <DateRangePicker onApply={setDateRange} initialRange={dateRange || undefined} />
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-border-base dark:border-slate-700">
                  <Button variant={activeTab === 'Board' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('Board')} leftIcon={<LayoutGrid size={16} />}>Board</Button>
                  <Button variant={activeTab === 'List' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('List')} leftIcon={<List size={16} />}>List</Button>
                  <Button variant={activeTab === 'Reports' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('Reports')} leftIcon={<BarChart3 size={16} />}>Reports</Button>
                </div>
            </div>
        </div>
        
        <div className={`flex-grow flex flex-col overflow-y-auto ${activeTab === 'Board' ? 'overflow-hidden' : ''}`}>
           {renderContent()}
        </div>
      </Card>
    </div>
  );
};
