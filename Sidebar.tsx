







import React from 'react';
import { View, TeamMember, AppSettings, FeatureKey, PermissionAction } from '../types';
import { Button } from './common/Button';
import {
    LayoutDashboard,
    MessageSquare,
    Users, // for Leads
    Briefcase, // for Clients
    HeartHandshake, // for HR Module
    Banknote, // for Finance
    Calendar,
    Wrench, // for Tools
    Settings,
    LogOut,
    UserCircle2,
    FolderKanban,
    ClipboardCheck,
    BookOpen // for SOPs
} from 'lucide-react';

interface NavItemProps {
  viewName: View;
  currentView: View;
  setView: (view: View) => void;
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>; // Should be a Lucide icon element
  label: string;
  isCollapsed: boolean;
  badge?: number;
  hasPermission: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ viewName, currentView, setView, icon, label, isCollapsed, badge, hasPermission }) => {
  if (!hasPermission) return null;

  const isActive = currentView === viewName;

  const n = Number(badge ?? 0);
  const showBadge = (viewName === 'COMMUNICATION' || viewName === 'LEADS') && Number.isFinite(n) && n > 0;
  const badgeLabel = n > 99 ? "99+" : String(n);

  return (
    <li title={isCollapsed ? label : undefined} className="list-none">
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); setView(viewName); }}
        className={`flex items-center p-3 rounded-lg text-sm font-medium transition-colors duration-200 group relative border-l-[3px]
          ${isActive 
            ? 'border-secondary-accent bg-secondary-accent/10 text-secondary-accent' 
            : 'border-transparent text-slate-300 hover:bg-white/10'}
          ${isCollapsed ? 'justify-center' : ''}
        `}
        aria-current={isActive ? 'page' : undefined}
      >
        {React.cloneElement(icon, {
          className: `h-5 w-5 shrink-0 transition-transform ${isCollapsed ? '' : 'mr-3'}`,
          strokeWidth: isActive ? 2.5 : 2
        })}
        {!isCollapsed && <span className="flex-1 whitespace-nowrap">{label}</span>}
        {!isCollapsed && showBadge && (
          <span 
            className="nav-badge ml-auto inline-flex min-w-[20px] h-5 items-center justify-center rounded-full bg-secondary-accent text-secondary-accent-text text-xs px-1.5 font-bold" 
            data-badge={badgeLabel}
          >
            {badgeLabel}
          </span>
        )}
      </a>
    </li>
  );
};

const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return '?';
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
    return (parts[0][0]?.toUpperCase() || '') + (parts[parts.length - 1][0]?.toUpperCase() || '');
};

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  appSettings: AppSettings;
  onLogout: () => void;
  currentUser: TeamMember;
  hasPermission: (featureKey: FeatureKey, action: PermissionAction) => boolean;
  onOpenAdminPanel: () => void;
  isSidebarOpen: boolean; // For mobile overlay
  setIsSidebarOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  badges?: {
    commUnread?: number;
    leadsUnread?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, setCurrentView, appSettings, onLogout, currentUser, 
    hasPermission, onOpenAdminPanel, isSidebarOpen, setIsSidebarOpen, 
    isCollapsed, badges
}) => {
  const navItems = [
    { view: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard />, feature: 'dashboard', permission: 'canView' },
    { view: 'COMMUNICATION', label: 'Communication', icon: <MessageSquare />, feature: 'communication', permission: 'canView', badge: badges?.commUnread },
    { view: 'LEADS', label: 'Leads', icon: <Users />, feature: 'leads', permission: 'canView', badge: badges?.leadsUnread },
    { view: 'CLIENTS', label: 'Clients', icon: <Briefcase />, feature: 'clients', permission: 'canView' },
    { view: 'PROJECTS', label: 'Projects', icon: <FolderKanban />, feature: 'projects', permission: 'canView' },
    { view: 'MY_TASKS', label: 'My Tasks', icon: <ClipboardCheck />, feature: 'myTasks', permission: 'canView' },
    { view: 'HR_MODULE', label: 'HR Module', icon: <HeartHandshake />, feature: 'hrModule', permission: 'canViewHRModule' },
    { view: 'FINANCE', label: 'Finance', icon: <Banknote />, feature: 'finance', permission: 'canView' },
    { view: 'CALENDAR', label: 'Calendar', icon: <Calendar />, feature: 'calendar', permission: 'canView' },
    { view: 'SOP_LIBRARY', label: 'SOP Library', icon: <BookOpen />, feature: 'tools', permission: 'canView' }, // Using 'tools' permission for now as SOPs are generic tools
    { view: 'TOOLS', label: 'Tools', icon: <Wrench />, feature: 'tools', permission: 'canView' },
    { view: 'ADMIN_PANEL', label: 'Settings', icon: <Settings />, feature: 'adminPanel', permission: 'canView' },
  ];

  const handleSetView = (view: View) => {
    if (view === 'ADMIN_PANEL') {
        onOpenAdminPanel();
    } else {
        setCurrentView(view);
    }
    // Close mobile sidebar on navigation
    setIsSidebarOpen(false);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        onClick={() => setIsSidebarOpen(false)}
        className={`fixed inset-0 bg-black/40 z-30 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />
      <aside 
        className={`fixed lg:relative inset-y-0 left-0 bg-premium-accent text-white flex flex-col shadow-lg print:hidden z-40 transition-all duration-300 ease-in-out 
        ${isCollapsed ? 'w-20' : 'w-64'} 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* The top-level logo is now in TopNavbar.tsx, this just provides space. */}
        <div className="h-16 shrink-0" />
        
        <nav className="flex-1 overflow-y-auto px-3">
          <ul className="space-y-1">
            {navItems.map(item => (
                <NavItem 
                    key={item.view}
                    viewName={item.view as View} 
                    currentView={currentView} 
                    setView={handleSetView} 
                    icon={item.icon} 
                    label={item.label}
                    isCollapsed={isCollapsed}
                    badge={item.badge}
                    hasPermission={hasPermission(item.feature as FeatureKey, item.permission as PermissionAction)}
                />
            ))}
          </ul>
        </nav>
        
        <div className="p-3 border-t border-white/10 mt-auto">
          <div 
            onClick={() => setCurrentView('USER_PROFILE')}
            title={isCollapsed ? `${currentUser.name}\n${currentUser.role}` : undefined}
            className={`p-2 text-sm flex items-center rounded-lg bg-white/5 shadow-sm transition-all duration-200 ease-in-out cursor-pointer hover:bg-white/10 ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className={`h-9 w-9 rounded-full bg-secondary-accent text-secondary-accent-text flex items-center justify-center font-semibold text-sm overflow-hidden shrink-0 ${!isCollapsed && 'mr-2.5'}`}>
              {currentUser.profilePictureUrl ? (
                <img src={currentUser.profilePictureUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                getInitials(currentUser.name)
              )}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                  <p className="font-medium text-white truncate" title={currentUser.name}>{currentUser.name}</p>
                  <p className="text-xs text-slate-400 truncate" title={currentUser.role || 'N/A'}>{currentUser.role || 'N/A'}</p>
              </div>
            )}
          </div>
          <Button
            onClick={onLogout}
            variant="ghost"
            className={`w-full !p-0 mt-2 !text-slate-300 hover:!bg-white/10`}
            title="Logout"
          >
            <div className={`flex items-center w-full px-3 py-2 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                <LogOut className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span className="ml-3">Logout</span>}
            </div>
          </Button>
        </div>
      </aside>
    </>
  );
};
