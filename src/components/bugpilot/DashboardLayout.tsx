import { Outlet } from 'react-router-dom';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

export function DashboardLayout() {
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop SideNav */}
      <div className="hidden md:block">
        <SideNav />
      </div>

      {/* Mobile SideNav overlay backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile SideNav */}
      <div className={cn(
        'fixed top-0 left-0 h-screen z-50 transition-transform duration-200 ease-out md:hidden',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <SideNav onMobileClose={() => setMobileSidebarOpen(false)} />
      </div>

      <CommandPalette />

      {/* Main content area */}
      <div className={cn(
        'transition-all duration-200 ease-out',
        sidebarCollapsed ? 'md:ml-14' : 'md:ml-52',
        'ml-0'
      )}>
        <TopBar />
        <main className="p-4 md:p-5 xl:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
