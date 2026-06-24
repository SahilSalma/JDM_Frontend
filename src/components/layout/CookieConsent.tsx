'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'jdm_cookie_consent';

type Consent = 'all' | 'essential' | null;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function applyConsent(value: 'all' | 'essential') {
  try {
    if (typeof window === 'undefined') return;
    if (window.gtag) {
      window.gtag('consent', 'update', {
        ad_storage: value === 'all' ? 'granted' : 'denied',
        ad_user_data: value === 'all' ? 'granted' : 'denied',
        ad_personalization: value === 'all' ? 'granted' : 'denied',
        analytics_storage: value === 'all' ? 'granted' : 'denied',
      });
    }
  } catch {
    /* no-op */
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Consent;
      if (!stored) {
        // Slight delay so it doesn't pop on the very first paint.
        const id = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(id);
      }
      applyConsent(stored);
    } catch {
      setVisible(true);
    }
  }, []);

  const persist = (value: 'all' | 'essential') => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
      localStorage.setItem(`${STORAGE_KEY}_at`, new Date().toISOString());
    } catch {
      /* no-op */
    }
    applyConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-border bg-card/95 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 text-[#DC2626]">
            <Cookie className="size-5" />
          </div>

          <div className="flex-1 text-sm">
            <h2 className="font-heading text-base font-bold uppercase tracking-wider text-foreground">
              We value your privacy
            </h2>
            <p className="mt-1.5 text-muted-foreground">
              We use cookies to improve your browsing experience, serve personalized ads,
              analyze site traffic, and understand where our visitors come from. By clicking
              &ldquo;Accept All&rdquo; you consent to our use of cookies.{' '}
              <Link href="/privacy" className="font-medium text-foreground underline underline-offset-2 hover:text-[#DC2626]">
                Learn more
              </Link>
              .
            </p>

            {showDetails && (
              <div className="mt-3 space-y-2 rounded-md border border-border bg-background/60 p-3 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Essential</span> — Required for the site to function (cart, checkout, login). Always on.
                </div>
                <div>
                  <span className="font-semibold text-foreground">Analytics</span> — Helps us understand how visitors interact with the site.
                </div>
                <div>
                  <span className="font-semibold text-foreground">Marketing</span> — Used to deliver relevant ads on Google and other platforms.
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setVisible(false)}
            aria-label="Close"
            className="absolute right-2 top-2 rounded p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground sm:static"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2 border-t border-border bg-background/40 p-3 sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:p-4">
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground sm:mr-auto"
          >
            {showDetails ? 'Hide details' : 'Manage preferences'}
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => persist('essential')}
            className="font-heading text-xs uppercase tracking-widest"
          >
            Essential only
          </Button>
          <Button
            size="sm"
            onClick={() => persist('all')}
            className="bg-[#DC2626] font-heading text-xs uppercase tracking-widest text-white hover:bg-[#ef4444]"
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
