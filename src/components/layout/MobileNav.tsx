'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, ShoppingCart, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

interface MobileNavProps {}

export default function MobileNav({}: MobileNavProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const { itemCount, setIsOpen } = useCart();

  const tabs = [
    {
      key: 'home',
      href: '/',
      icon: Home,
      label: t('home'),
      action: undefined as (() => void) | undefined,
    },
    {
      key: 'cart',
      href: undefined,
      icon: ShoppingCart,
      label: t('cart'),
      action: () => setIsOpen(true),
    },
    {
      key: 'contact',
      href: '/contact',
      icon: Phone,
      label: t('contact'),
      action: undefined,
    },
  ] as const;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Mobile bottom navigation"
    >
      {/* Blurred background */}
      <div className="border-t border-border bg-background/90 backdrop-blur-md">
        <div className="flex items-stretch">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.href ? pathname === tab.href : false;

            const content = (
              <div className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5">
                <div className="relative">
                  <Icon
                    className={cn(
                      'size-5 transition-colors',
                      isActive ? 'text-[#DC2626]' : 'text-muted-foreground'
                    )}
                  />
                  {/* Cart badge */}
                  {tab.key === 'cart' && itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[9px] font-bold text-white"
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </motion.span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium transition-colors',
                    isActive ? 'text-[#DC2626]' : 'text-muted-foreground/60'
                  )}
                >
                  {tab.label}
                </span>
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[#DC2626]"
                  />
                )}
              </div>
            );

            if (tab.action) {
              return (
                <button
                  key={tab.key}
                  onClick={tab.action}
                  aria-label={tab.label}
                  className="flex flex-1 items-stretch focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/50 active:bg-accent"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={tab.key}
                href={tab.href ?? '/'}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-1 items-stretch focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/50 active:bg-white/5"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
