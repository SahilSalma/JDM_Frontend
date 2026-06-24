'use client';

import { Suspense } from 'react';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import CartDrawer from '@/components/layout/CartDrawer';
import { CartProvider } from '@/hooks/useCart';

interface StoreShellProps {
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function StoreShell({ children, footer }: StoreShellProps) {
  return (
    <CartProvider>
      <Suspense fallback={<div className="h-16 bg-background border-b border-border/10" />}>
        <Header />
      </Suspense>

      {/* Main content — padded to clear fixed header (h-24 + brand row ~40px) + announcement bar (~2.5rem) */}
      <main className="min-h-screen flex-1 pb-16 pt-[calc(6rem+2.5rem+40px)] md:pb-0">
        {children}
      </main>

      {footer}

      {/* Mobile bottom navigation */}
      <MobileNav />

      {/* Overlays */}
      <CartDrawer />
    </CartProvider>
  );
}
