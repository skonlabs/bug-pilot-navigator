import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <SideNav />
      <CommandPalette />
      <div className={cn(
        'transition-all duration-200 ease-out',
        sidebarCollapsed ? 'ml-14' : 'ml-52'
      )}>
        <TopBar />
        <main className="p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
