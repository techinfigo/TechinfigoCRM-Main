import React from 'react';
import { LayoutDashboard, Users, ClipboardCheck, Plus, Menu } from 'lucide-react';
import type { View } from '../types';

/**
 * Bottom tab bar for phones (hidden on large screens, where the sidebar is
 * always visible). The four things used most on the go, plus "Menu" for the rest.
 */
export const MobileBottomNav: React.FC<{
  currentView: View;
  setCurrentView: (v: View) => void;
  onOpenMenu: () => void;
  onQuickAdd: () => void;
  leadsBadge?: number;
}> = ({ currentView, setCurrentView, onOpenMenu, onQuickAdd, leadsBadge }) => {
  const items: { view: View; label: string; Icon: React.ElementType; badge?: number }[] = [
    { view: 'DASHBOARD', label: 'Home', Icon: LayoutDashboard },
    { view: 'LEADS', label: 'Leads', Icon: Users, badge: leadsBadge },
    { view: 'MY_TASKS', label: 'Tasks', Icon: ClipboardCheck },
  ];
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-premium-accent text-white border-t border-white/10 print:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ view, label, Icon, badge }, idx) => {
          const active = currentView === view || (view === 'LEADS' && currentView === 'LEAD_DETAIL') || (view === 'CLIENTS' && currentView === 'CLIENT_DETAIL');
          return (
            <React.Fragment key={view}>
            {idx === 2 && (
              <li>
                <button type="button" onClick={onQuickAdd} aria-label="Quick add lead" className="w-full h-16 flex items-center justify-center">
                  <span className="w-12 h-12 -mt-5 rounded-full bg-secondary-accent text-secondary-accent-text flex items-center justify-center shadow-lg ring-4 ring-premium-accent">
                    <Plus className="w-6 h-6" />
                  </span>
                </button>
              </li>
            )}
            <li>
              <button
                type="button"
                onClick={() => setCurrentView(view)}
                className={`relative w-full h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? 'text-secondary-accent' : 'text-white/70'}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="w-5 h-5" />
                {label}
                {badge ? (
                  <span className="absolute top-2 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary-accent text-secondary-accent-text text-[10px] font-bold flex items-center justify-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                ) : null}
              </button>
            </li>
            </React.Fragment>
          );
        })}
        <li>
          <button type="button" onClick={onOpenMenu} className="w-full h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-white/70">
            <Menu className="w-5 h-5" />
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
};
