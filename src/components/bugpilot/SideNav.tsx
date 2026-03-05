import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, ChevronLeft, ChevronRight, Globe,
  Link2, Gauge, Settings, Shield, Zap, HelpCircle, Activity
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { mockIncidents, mockConnectors } from '@/data/mock-data';

const activeIncidentCount = mockIncidents.filter(
  i => ['investigating', 'detected', 'identified', 'mitigating'].includes(i.status)
).length;

const connectorErrorCount = mockConnectors.filter(c => c.status === 'error').length;
const systemHealthOk = connectorErrorCount === 0 && activeIncidentCount === 0;

const navSections = [
  {
    label: 'Respond',
    items: [
      { path: '/incidents', label: 'Incidents', icon: AlertTriangle, badge: activeIncidentCount || undefined, badgeVariant: 'danger' as const },
      { path: '/fixes', label: 'Fix Approvals', icon: Shield, badge: 3, badgeVariant: 'primary' as const },
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
      { path: '/integrations', label: 'Integrations', icon: Link2, badge: connectorErrorCount > 0 ? connectorErrorCount : undefined, badgeVariant: 'warning' as const },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function SideNav({ onMobileClose }: { onMobileClose?: () => void } = {}) {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen flex flex-col z-30 transition-all duration-200 ease-out',
      'bg-sidebar border-r border-sidebar-border',
      sidebarCollapsed ? 'w-14' : 'w-52'
    )}>
      {/* Logo Header */}
      <div className={cn(
        'h-12 flex items-center shrink-0 border-b border-sidebar-border',
        sidebarCollapsed ? 'px-0 justify-center' : 'px-4 gap-3'
      )}>
        {/* Logo mark */}
        <div className="relative h-7 w-7 rounded-lg gradient-brand flex items-center justify-center shrink-0 shadow-lg">
          <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          {/* System health dot */}
          <span className={cn(
            'absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-sidebar-background',
            systemHealthOk ? 'bg-success' : 'bg-destructive animate-pulse'
          )} />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col -space-y-0.5">
            <span className="text-[13px] font-bold text-sidebar-accent-foreground tracking-tight leading-none">BugPilot</span>
            <span className="text-[9px] text-sidebar-foreground font-medium uppercase tracking-widest leading-none">Navigator</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto scrollbar-thin">
        {navSections.map((section, sectionIdx) => (
          <div key={section.label} className={cn(sectionIdx > 0 && 'mt-5')}>
            {!sidebarCollapsed && (
              <p className="text-[9px] font-bold text-sidebar-foreground/50 uppercase tracking-[0.18em] px-2.5 mb-1">
                {section.label}
              </p>
            )}
            {sidebarCollapsed && sectionIdx > 0 && (
              <div className="h-px bg-sidebar-border mx-2 mb-2 mt-1" />
            )}
            <div className="space-y-px">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/incidents' && location.pathname.startsWith(item.path)) ||
                  (item.path === '/incidents' && location.pathname.startsWith('/incidents'));

                const inner = (
                  <button
                    onClick={() => { navigate(item.path); onMobileClose?.(); }}
                    className={cn(
                      'group relative w-full flex items-center gap-2.5 h-8 rounded-md text-[12.5px] font-medium transition-all duration-150',
                      sidebarCollapsed ? 'justify-center px-0' : 'px-2.5',
                      isActive
                        ? 'bg-sidebar-primary/[0.12] text-sidebar-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    {/* Active left bar */}
                    {isActive && !sidebarCollapsed && (
                      <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-sidebar-primary" />
                    )}
                    <item.icon className={cn(
                      'shrink-0 transition-colors',
                      sidebarCollapsed ? 'h-4 w-4' : 'h-[14px] w-[14px]',
                      isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
                    )} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={cn(
                            'min-w-[18px] h-4 rounded px-1 text-[9px] font-bold flex items-center justify-center tabular-nums',
                          item.badgeVariant === 'danger' ? 'bg-severity-p0/15 text-severity-p0 border border-severity-p0/20' :
                            item.badgeVariant === 'warning' ? 'bg-severity-p1/15 text-severity-p1 border border-severity-p1/20' :
                            'bg-primary/[0.12] text-primary border border-primary/20'
                          )}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className={cn(
                        'absolute top-0.5 right-0.5 h-3 w-3 rounded-full text-[7px] font-bold flex items-center justify-center',
                        item.badgeVariant === 'danger' ? 'bg-severity-p0' :
                        item.badgeVariant === 'warning' ? 'bg-severity-p1' : 'bg-primary',
                        'text-white'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.path} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className="relative">{inner}</div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs font-medium">
                        {item.label}
                        {item.badge !== undefined && item.badge > 0 ? ` · ${item.badge} active` : ''}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return <div key={item.path}>{inner}</div>;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-sidebar-border p-2 space-y-px">
        {/* System status */}
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 px-2.5 h-7 rounded-md">
            <Activity className="h-3 w-3 text-sidebar-foreground/50" />
            <span className="text-[10px] text-sidebar-foreground/50 flex-1">System</span>
            <div className="flex items-center gap-1">
              <span className={cn(
                'h-1.5 w-1.5 rounded-full',
                systemHealthOk ? 'bg-success' : 'bg-destructive animate-pulse'
              )} />
              <span className={cn(
                'text-[10px] font-medium',
                systemHealthOk ? 'text-success' : 'text-destructive'
              )}>
                {systemHealthOk ? 'Nominal' : 'Alert'}
              </span>
            </div>
          </div>
        )}
        {/* Help */}
        {!sidebarCollapsed && (
          <button className="w-full flex items-center gap-2.5 h-8 px-2.5 rounded-md text-[12.5px] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
            <HelpCircle className="h-[14px] w-[14px]" />
            <span>Help & Docs</span>
          </button>
        )}
        {/* Collapse */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className={cn(
                'w-full flex items-center h-8 rounded-md text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
                sidebarCollapsed ? 'justify-center' : 'px-2.5 gap-2.5'
              )}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <>
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span className="text-[12.5px]">Collapse</span>
                </>
              )}
            </button>
          </TooltipTrigger>
          {sidebarCollapsed && (
            <TooltipContent side="right" className="text-xs">Expand sidebar</TooltipContent>
          )}
        </Tooltip>
      </div>
    </aside>
  );
}
