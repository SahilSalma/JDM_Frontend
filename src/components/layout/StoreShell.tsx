'use client';

import { useState, useCallback, type ReactNode, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import SearchBar from '@/components/layout/SearchBar';
import CartDrawer from '@/components/layout/CartDrawer';
import { CartProvider } from '@/hooks/useCart';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface StoreShellProps {
  children: ReactNode;
}

export default function StoreShell({ children }: StoreShellProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <CartProvider>
      <Suspense fallback={<div className="h-16 bg-background border-b border-border/10" />}>
        <Header />
      </Suspense>
      <SearchBar isOpen={searchOpen} onClose={closeSearch} />
      <CartDrawer />

      {/* Padded to clear fixed header + announcement bar; extra pb on mobile for MobileNav */}
      <main className={cn(
        "flex-1 pb-[4.5rem] md:pb-0",
        isHome
          ? "pt-[calc(var(--announcement-height,36px)+64px)]"
          : "pt-[calc(var(--announcement-height,36px)+108px)]"
      )}>
        {children}
      </main>

      <Footer />

      {/* Mobile bottom navigation */}
      <MobileNav />
    </CartProvider>
  );
}
