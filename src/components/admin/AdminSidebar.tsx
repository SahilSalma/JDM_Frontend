'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  FileText,
  MessageSquare,
  Mail,
  Settings,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { key: 'orders', href: '/admin/orders', icon: ShoppingCart },
  { key: 'customers', href: '/admin/customers', icon: Users },
  { key: 'products', href: '/admin/products', icon: Package },
  { key: 'inventory', href: '/admin/inventory', icon: Warehouse },
  { key: 'blog', href: '/admin/blog', icon: FileText },
  { key: 'reviews', href: '/admin/reviews', icon: MessageSquare },
  { key: 'email', href: '/admin/emails', icon: Mail },
  { key: 'settings', href: '/admin/settings', icon: Settings },
  { key: 'account', href: '/admin/account', icon: User },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminSidebar({ collapsed, onToggleCollapse }: AdminSidebarProps) {
  const t = useTranslations('admin');
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-56',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border shrink-0 justify-center overflow-hidden">
        <Link href="/admin/dashboard" className="flex items-center min-w-0 justify-center w-full h-full">
          {collapsed ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded bg-[#DC2626] text-white font-bold text-sm shadow-sm hover:scale-105 transition-transform">
              JDM
            </div>
          ) : (
            <div className="relative h-16 w-full flex items-center justify-center">
              <img
                src="/logo/finallogo-blacklettering-transparent.png"
                alt="JDM Tokyo Motorsports"
                className="h-16 w-auto object-contain dark:hidden"
              />
              <img
                src="/logo/finallogo-whitelettering-transparent.png"
                alt="JDM Tokyo Motorsports"
                className="hidden h-16 w-auto object-contain dark:block"
              />
            </div>
          )}
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? t(item.key) : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-[#DC2626] text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center',
              )}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed && <span className="truncate">{t(item.key)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-border p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="w-full text-muted-foreground hover:text-foreground hover:bg-muted"
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
          <span className="sr-only">
            {collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          </span>
        </Button>
      </div>
    </aside>
  );
}

// Sidebar content for mobile Sheet
export function AdminSidebarContent({ onClose }: { onClose?: () => void }) {
  const t = useTranslations('admin');
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded bg-[#DC2626] text-white font-bold text-sm">
            JDM
          </div>
          <span className="font-heading text-sm font-bold text-foreground">
            {t('sidebar.logo')}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-[#DC2626] text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
