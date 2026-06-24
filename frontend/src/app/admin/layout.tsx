'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AdminSidebar, AdminSidebarContent } from '@/components/admin/AdminSidebar';
import { useAdmin } from '@/hooks/useAdmin';
import ThemeToggle from '@/components/layout/ThemeToggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('admin');
  const { admin, isAuthenticated, isLoading, logout } = useAdmin();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace('/admin/login');
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // Render login page without chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show nothing while auth check is in progress
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:shrink-0">
        <AdminSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={(open) => setMobileOpen(open)}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden text-muted-foreground hover:text-foreground"
                    title={t('topbar.openMenu')}
                  />
                }
              >
                <Menu className="size-5" />
                <span className="sr-only">{t('topbar.openMenu')}</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-56 p-0 bg-card border-border">
                <AdminSidebarContent onClose={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <span className="font-heading text-sm font-semibold text-muted-foreground hidden sm:block">
              {t('topbar.adminPortal')}
            </span>
          </div>

          {/* Right: user info + logout */}
          <div className="flex items-center gap-3">
            {admin && (
              <span className="text-sm text-muted-foreground hidden sm:block">
                {t('topbar.welcome', { name: admin.name })}
              </span>
            )}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t('topbar.logout')}</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
