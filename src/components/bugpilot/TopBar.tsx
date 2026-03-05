import { useAppStore } from '@/store/app-store';
import { useLocation, Link } from 'react-router-dom';
import { Search, Bell, ChevronDown, CheckCircle2, AlertTriangle, Zap, Plug, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mockNotifications, mockUser } from '@/data/mock-data';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const routeTitles: Record<string, string> = {
  '/incidents': 'Incidents',
  '/topology': 'Service Topology',
  '/fixes': 'Fix Approvals',
  '/readiness': 'Readiness & Gaps',
  '/reports': 'Reports',
  '/integrations': 'Integrations',
  '/settings': 'Settings',
};

const NotifIcons = {
  incident_declared: AlertTriangle,
  fix_approval_needed: Zap,
  investigation_complete: CheckCircle2,
  connector_error: Plug,
  postmortem_overdue: AlertTriangle,
};

const NotifColors = {
  incident_declared: 'text-severity-p0',
  fix_approval_needed: 'text-amber-400',
  investigation_complete: 'text-emerald-400',
  connector_error: 'text-severity-p0',
  postmortem_overdue: 'text-amber-400',
};

export function TopBar() {
  const { setCommandPaletteOpen, toggleMobileSidebar } = useAppStore();
  const location = useLocation();
  const title = Object.entries(routeTitles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'BugPilot';
  const [notifications, setNotifications] = useState(mockNotifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const dismissNotif = (id: string) => {
    setNotifications(ns => ns.filter(n => n.id !== id));
  };

  return (
    <header className="h-12 border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-4 md:px-5">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-[13px] font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 h-7 px-2.5 rounded-md bg-secondary/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/20 transition-colors"
        >
          <Search className="h-3 w-3" />
          <span className="text-[11px]">Search...</span>
          <kbd className="text-[9px] font-mono bg-muted px-1 py-0.5 rounded border border-border ml-2">⌘K</kbd>
        </button>

        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 relative text-muted-foreground hover:text-foreground">
              <Bell className="h-3.5 w-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-severity-p0 text-[8px] font-bold text-white flex items-center justify-center ring-2 ring-background">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 border-border bg-background shadow-xl" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {notifications.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-xs">No notifications</div>
              )}
              {notifications.map(notif => {
                const Icon = NotifIcons[notif.type];
                const color = NotifColors[notif.type];
                return (
                  <div key={notif.id}
                    className={cn('flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors', !notif.read && 'bg-secondary/10')}>
                    <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', color)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground leading-tight">{notif.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{notif.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground/50">
                          {format(new Date(notif.created_at), 'h:mm a')}
                        </span>
                        {notif.incident_id && (
                          <Link
                            to={`/incidents/${notif.incident_id}`}
                            className="text-[10px] text-primary hover:underline"
                            onClick={() => setNotifOpen(false)}
                          >
                            View incident →
                          </Link>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => dismissNotif(notif.id)}
                      className="text-muted-foreground/30 hover:text-muted-foreground transition-colors mt-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {!notif.read && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Profile */}
        <Popover open={profileOpen} onOpenChange={setProfileOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 h-7 pl-1 pr-1.5 rounded-md hover:bg-secondary/50 transition-colors">
              <div className="h-5 w-5 rounded-full gradient-brand flex items-center justify-center">
                <span className="text-[9px] font-bold text-primary-foreground">
                  {mockUser.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2 border-border bg-background shadow-xl" align="end">
            <div className="px-2 py-2 border-b border-border mb-1">
              <p className="text-xs font-semibold text-foreground">{mockUser.name}</p>
              <p className="text-[11px] text-muted-foreground">{mockUser.email}</p>
              <span className="text-[9px] font-bold text-primary uppercase tracking-wider">{mockUser.role}</span>
            </div>
            {[
              { label: 'Settings', to: '/settings' },
              { label: 'API Keys', to: '/settings' },
              { label: 'Audit Log', to: '/settings/audit' },
            ].map(item => (
              <Link key={item.label} to={item.to}
                className="block px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors"
                onClick={() => setProfileOpen(false)}>
                {item.label}
              </Link>
            ))}
            <div className="border-t border-border mt-1 pt-1">
              <button className="w-full text-left px-2 py-1.5 text-xs text-severity-p0 hover:bg-severity-p0/5 rounded-md transition-colors">
                Sign Out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
