import React from 'react';
import { Project, Client, TeamMember, FeatureKey, PermissionAction } from '../../../types'; 
import { Button } from '../../common/Button'; 
import { Card } from '../../common/Card';
import { ProjectsView } from '../ProjectsView'; // Re-use the existing ProjectsView component

interface AdminProjectManagementViewProps {
  projects: Project[];
  clients: Client[];
  teamMembers: TeamMember[];
  currentUser: TeamMember;
  onAddProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onViewProjectDetail: (project: Project) => void;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onUpdateProject: (project: Project) => void;
  onBatchUpdateProjects: (projects: Project[]) => void;
}

export const AdminProjectManagementView: React.FC<AdminProjectManagementViewProps> = (props) => {
  return (
    <Card title="Project & Task Manager Overview" className="bg-transparent shadow-none p-0 border-0">
        <p className="text-sm text-slate-600 mb-4 px-1">
            This section provides an administrative overview of all projects and their tasks. 
            Admins can add, edit, or delete projects directly. For detailed task management, click on a project name to navigate to its detail page.
            Advanced features like a dedicated deadline/reminder system or sophisticated file attachment management are conceptual and would require further development.
        </p>
        <ProjectsView 
            projects={props.projects}
            clients={props.clients}
            teamMembers={props.teamMembers}
            currentUser={props.currentUser}
            onOpenProjectFormModal={(project) => project ? props.onEditProject(project) : props.onAddProject()}
            onDeleteProject={props.onDeleteProject}
            onViewProjectDetail={props.onViewProjectDetail}
            hasPermission={props.hasPermission}
            onUpdateProject={props.onUpdateProject}
            onBatchUpdateProjects={props.onBatchUpdateProjects}
        />
    </Card>
  );
};