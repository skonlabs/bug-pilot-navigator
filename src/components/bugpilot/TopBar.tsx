import { useAppStore } from '@/store/app-store';
import { useLocation, Link } from 'react-router-dom';
import { Search, Bell, ChevronDown, CheckCircle2, AlertTriangle, Zap, Plug, X, Menu, LogOut, User, Key, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { mockNotifications, mockUser, mockIncidents } from '@/data/mock-data';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const routeTitles: Record<string, { title: string; parent?: string }> = {
  '/': { title: 'Dashboard' },
  '/incidents': { title: 'Incidents' },
  '/topology': { title: 'Topology', parent: 'Observe' },
  '/fixes': { title: 'Fix Approvals' },
  '/readiness': { title: 'Readiness', parent: 'Observe' },
  '/reports': { title: 'Reports', parent: 'Observe' },
  '/integrations': { title: 'Integrations', parent: 'Configure' },
  '/settings': { title: 'Settings', parent: 'Configure' },
  '/getting-started': { title: 'Getting Started' },
};

type NotifType = 'incident_declared' | 'fix_approval_needed' | 'investigation_complete' | 'connector_error' | 'postmortem_overdue';

const notifConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  incident_declared: { icon: AlertTriangle, color: 'text-severity-p0', bg: 'bg-severity-p0/10' },
  fix_approval_needed: { icon: Zap, color: 'text-severity-p1', bg: 'bg-severity-p1/10' },
  investigation_complete: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
  connector_error: { icon: Plug, color: 'text-warning', bg: 'bg-warning/10' },
  postmortem_overdue: { icon: FileText, color: 'text-warning', bg: 'bg-warning/10' },
};

const activeP0Count = mockIncidents.filter(
  i => i.severity === 'P0' && ['investigating', 'detected', 'identified', 'mitigating'].includes(i.status)
).length;

export function TopBar() {
  const { setCommandPaletteOpen, toggleMobileSidebar } = useAppStore();
  const location = useLocation();
  const routeInfo = Object.entries(routeTitles).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] || { title: 'BugPilot' };

  const [notifications, setNotifications] = useState(mockNotifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  const dismissNotif = (id: string) => setNotifications(ns => ns.filter(n => n.id !== id));

  const initials = mockUser.name.split(' ').map((n: string) => n[0]).join('');

  return (
    <header className={cn(
      'h-12 border-b border-border sticky top-0 z-20 flex items-center justify-between px-4 md:px-5',
      'bg-background/80 backdrop-blur-xl',
      activeP0Count > 0 && 'border-t-2 border-t-severity-p0'
    )}>
      {/* Left: mobile menu + title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors shrink-0"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          {routeInfo.parent && (
            <>
              <span className="text-[12px] text-muted-foreground hidden sm:block">{routeInfo.parent}</span>
              <span className="text-muted-foreground/40 hidden sm:block text-[12px]">/</span>
            </>
          )}
          <h1 className="text-[13px] font-semibold text-foreground truncate">{routeInfo.title}</h1>
        </div>
        {/* P0 active badge */}
        {activeP0Count > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 h-5 rounded bg-severity-p0/10 border border-severity-p0/20">
            <span className="h-1.5 w-1.5 rounded-full bg-severity-p0 animate-pulse" />
            <span className="text-[10px] font-bold text-severity-p0 uppercase tracking-wider">{activeP0Count} P0 Active</span>
          </div>
        )}
      </div>

      {/* Right: search + actions */}
      <div className="flex items-center gap-1">
        {/* Search / Command palette */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 h-7 px-2.5 rounded-md bg-secondary/60 border border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary/80 transition-all"
        >
          <Search className="h-3 w-3" />
          <span className="text-[11px]">Quick search</span>
          <div className="flex items-center gap-0.5 ml-1">
            <kbd className="text-[9px] font-mono bg-muted/80 px-1 py-0.5 rounded border border-border/50">⌘</kbd>
            <kbd className="text-[9px] font-mono bg-muted/80 px-1 py-0.5 rounded border border-border/50">K</kbd>
          </div>
        </button>

        {/* Mobile search icon only */}
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-3.5 w-3.5" />
        </Button>

        {/* Notifications */}
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 relative text-muted-foreground hover:text-foreground">
              <Bell className="h-3.5 w-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground flex items-center justify-center ring-2 ring-background">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 border-border bg-popover shadow-2xl shadow-black/50" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="h-4 px-1.5 rounded-full bg-primary/15 border border-primary/20 text-[10px] font-bold text-primary flex items-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto scrollbar-thin divide-y divide-border/50">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-6 w-6 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">All caught up!</p>
                </div>
              ) : notifications.map(notif => {
                const cfg = notifConfig[notif.type as NotifType] || notifConfig.incident_declared;
                const Icon = cfg.icon;
                return (
                  <div key={notif.id} className={cn(
                    'flex items-start gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors group',
                    !notif.read && 'bg-primary/[0.03]'
                  )}>
                    <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
                      <Icon className={cn('h-3.5 w-3.5', cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">{notif.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{notif.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground/50 font-mono">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                        {notif.incident_id && (
                          <Link
                            to={`/incidents/${notif.incident_id}`}
                            className="text-[10px] text-primary hover:underline font-medium"
                            onClick={() => setNotifOpen(false)}
                          >
                            View →
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!notif.read && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      <button
                        onClick={() => dismissNotif(notif.id)}
                        className="text-muted-foreground/20 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* User Profile */}
        <Popover open={profileOpen} onOpenChange={setProfileOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 h-7 pl-1 pr-1.5 rounded-md hover:bg-secondary/60 transition-colors group">
              <div className="h-6 w-6 rounded-full gradient-brand flex items-center justify-center ring-1 ring-primary/20">
                <span className="text-[9px] font-bold text-white">{initials}</span>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0 border-border bg-popover shadow-2xl shadow-black/50" align="end">
            {/* User header */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full gradient-brand flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{mockUser.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{mockUser.email}</p>
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{mockUser.role}</span>
                </div>
              </div>
            </div>
            {/* Menu items */}
            <div className="p-1">
              {[
                { label: 'Profile & Settings', to: '/settings', icon: User },
                { label: 'API Keys', to: '/settings', icon: Key },
                { label: 'Audit Log', to: '/settings/audit', icon: FileText },
              ].map(item => (
                <Link key={item.label} to={item.to}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-md transition-colors"
                  onClick={() => setProfileOpen(false)}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-border p-1">
              <button className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-destructive hover:bg-destructive/[0.08] rounded-md transition-colors">
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
