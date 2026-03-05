import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, ChevronLeft, ChevronRight, Globe,
  Link2, Gauge, Settings, Shield, Bug, Home, HelpCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navSections = [
  {
    label: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: Home },
      { path: '/incidents', label: 'Incidents', icon: AlertTriangle, badge: 2 },
      { path: '/fixes', label: 'Fixes', icon: Shield, badge: 3 },
    ],
  },
  {
    label: 'Observe',
    items: [
      { path: '/topology', label: 'Topology', icon: Globe },
      { path: '/readiness', label: 'Readiness', icon: Gauge },
      { path: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Configure',
    items: [
      { path: '/integrations', label: 'Integrations', icon: Link2 },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function SideNav() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-30 transition-all duration-200 ease-out',
      sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
    )}>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 shrink-0">
        <div className="h-8 w-8 rounded-lg gradient-brand flex items-center justify-center shrink-0">
          <Bug className="h-4 w-4 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground tracking-tight leading-tight">BugPilot</span>
            <span className="text-[10px] text-muted-foreground truncate leading-tight">Acme Corp</span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto scrollbar-thin space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.1em] px-2 mb-1.5">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                
                const button = (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-2.5 h-8 rounded-md text-[13px] font-medium transition-all duration-150',
                      sidebarCollapsed ? 'justify-center px-0' : 'px-2.5',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className={cn(
                            'min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1',
                            item.path === '/incidents' 
                              ? 'bg-severity-p0/20 text-severity-p0' 
                              : 'bg-primary/15 text-primary'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.path} delayDuration={0}>
                      <TooltipTrigger asChild>{button}</TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {item.label}
                        {item.badge ? ` (${item.badge})` : ''}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return <div key={item.path}>{button}</div>;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Help + Collapse */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        {!sidebarCollapsed && (
          <button className="w-full flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13px] text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <HelpCircle className="h-4 w-4" />
            <span>Help & Docs</span>
          </button>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors',
            sidebarCollapsed ? 'justify-center' : 'px-2.5 gap-2.5'
          )}
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-[13px]">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
