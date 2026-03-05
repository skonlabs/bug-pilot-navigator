import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, BarChart3, ChevronLeft, ChevronRight, Globe,
  LayoutDashboard, Link2, Gauge, Settings, Shield, Bug
} from 'lucide-react';

const navItems = [
  { path: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { path: '/topology', label: 'Topology', icon: Globe },
  { path: '/fixes', label: 'Fixes', icon: Shield },
  { path: '/readiness', label: 'Readiness', icon: Gauge },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/integrations', label: 'Integrations', icon: Link2 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function SideNav() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-30 transition-all duration-200',
      sidebarCollapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border shrink-0">
        <Bug className="h-6 w-6 text-primary shrink-0" />
        {!sidebarCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground tracking-tight">BugPilot</span>
            <span className="text-[10px] text-muted-foreground truncate">Acme Corp</span>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                sidebarCollapsed && 'justify-center px-0'
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {isActive && item.path === '/incidents' && !sidebarCollapsed && (
                <span className="ml-auto text-xs bg-severity-p0/20 text-severity-p0 px-1.5 py-0.5 rounded font-mono">2</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="h-10 flex items-center justify-center border-t border-sidebar-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
