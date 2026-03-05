import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, ChevronLeft, ChevronRight, Globe,
  Link2, Gauge, Settings, Shield, Bug, HelpCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navSections = [
  {
    label: 'Investigate',
    items: [
      { path: '/incidents', label: 'Incidents', icon: AlertTriangle, badge: 2 },
      { path: '/fixes', label: 'Fix Approvals', icon: Shield, badge: 3 },
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
      sidebarCollapsed ? 'w-14' : 'w-52'
    )}>
      {/* Logo */}
      <div className="h-12 flex items-center gap-2.5 px-3.5 shrink-0 border-b border-sidebar-border">
        <div className="h-6 w-6 rounded-md gradient-brand flex items-center justify-center shrink-0">
          <Bug className="h-3 w-3 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <span className="text-[13px] font-bold text-foreground tracking-tight">BugPilot</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto scrollbar-thin space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            {!sidebarCollapsed && (
              <p className="text-[10px] font-medium text-muted-foreground/30 uppercase tracking-[0.14em] px-2 mb-1.5">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/incidents' && location.pathname.startsWith(item.path)) ||
                  (item.path === '/incidents' && location.pathname.startsWith('/incidents'));

                const button = (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'w-full flex items-center gap-2.5 h-8 rounded-md text-[13px] font-medium transition-all duration-150',
                      sidebarCollapsed ? 'justify-center px-0' : 'px-2.5',
                      isActive
                        ? 'bg-primary/8 text-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className={cn('h-[15px] w-[15px] shrink-0', isActive ? 'text-primary' : '')} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                          <span className={cn(
                            'min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1',
                            item.path === '/incidents'
                              ? 'bg-destructive/15 text-destructive'
                              : 'bg-primary/10 text-primary'
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
                      <TooltipContent side="right" className="text-xs">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                }
                return <div key={item.path}>{button}</div>;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        {!sidebarCollapsed && (
          <button className="w-full flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[13px] text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <HelpCircle className="h-[15px] w-[15px]" />
            <span>Help & Docs</span>
          </button>
        )}
        <button onClick={toggleSidebar}
          className={cn(
            'w-full flex items-center h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors',
            sidebarCollapsed ? 'justify-center' : 'px-2.5 gap-2.5'
          )}>
          {sidebarCollapsed ? <ChevronRight className="h-[15px] w-[15px]" /> : (<><ChevronLeft className="h-[15px] w-[15px]" /><span className="text-[13px]">Collapse</span></>)}
        </button>
      </div>
    </aside>
  );
}
