'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, ArrowRight, Package, Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { formatCents, MAX_PER_ORDER } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function CartDrawer() {
  const t = useTranslations('cart');
  const { items, removeItem, updateQuantity, itemCount, total, isOpen, setIsOpen } = useCart();
  const { get } = useSiteSettings();

  // Shipping estimates from settings (fall back to legacy hard-coded values).
  const shippingBusinessCents = Number(get('shipping_business_cents', '50000')) || 50000;
  const shippingResidentialCents = Number(get('shipping_residential_cents', '70000')) || 70000;
  const freeShippingThresholdCents = Number(get('free_shipping_threshold_cents', '0')) || 0;

  const [hasCheckoutAddress, setHasCheckoutAddress] = useState(false);
  const [checkoutShippingRate, setCheckoutShippingRate] = useState<number | null>(null);
  const [checkoutShippingType, setCheckoutShippingType] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && isOpen) {
      const state = localStorage.getItem('jdm_checkout_state');
      const city = localStorage.getItem('jdm_checkout_city');
      const rateStr = localStorage.getItem('jdm_checkout_shipping_rate');
      const type = localStorage.getItem('jdm_checkout_shipping_type');

      if (state && city && rateStr) {
        setHasCheckoutAddress(true);
        setCheckoutShippingRate(Number(rateStr));
        setCheckoutShippingType(type);
      } else {
        setHasCheckoutAddress(false);
        setCheckoutShippingRate(null);
        setCheckoutShippingType(null);
      }
    }
  }, [isOpen]);

  const qualifiesForFreeShipping = freeShippingThresholdCents > 0 && total >= freeShippingThresholdCents;
  const estimatedShipping = qualifiesForFreeShipping
    ? 0
    : hasCheckoutAddress && checkoutShippingRate !== null
      ? checkoutShippingRate
      : null;
  const estimatedTotal = total + (estimatedShipping ?? 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-l border-border bg-card p-0 sm:max-w-[400px]"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
            <ShoppingCart className="size-5 text-[#DC2626]" />
            {t('title')}
            {itemCount > 0 && (
              <Badge className="ml-1 bg-[#DC2626] text-xs text-white">
                {itemCount}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {items.length === 0 ? (
            /* ── Empty state ── */
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <Package className="size-8 text-muted-foreground/30" />
              </div>
              <div>
                <p className="font-heading text-base font-semibold text-foreground">
                  {t('empty')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('emptyDescription')}
                </p>
              </div>
              <SheetClose
                render={
                  <Link
                    href="/engines"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg bg-[#DC2626] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#ef4444]'
                    )}
                  />
                }
              >
                {t('shopNow')}
                <ArrowRight className="size-4" />
              </SheetClose>
            </div>
          ) : (
            /* ── Cart items ── */
            <div className="flex flex-1 flex-col overflow-y-auto">
              <ul className="divide-y divide-border">
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.li
                      key={item.productId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex gap-3 p-4"
                    >
                      {/* Image */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full rounded-md object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                'none';
                            }}
                          />
                        ) : (
                          <Package className="size-6 text-muted-foreground/30" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.sku}
                        </p>
                        <p className="mt-1 text-sm font-bold text-[#DC2626]">
                          {formatCents(item.price_cents)}
                        </p>

                        {/* Quantity controls — only show stepper when the per-item cap allows >1 */}
                        {(() => {
                          const cap = Math.max(1, item.maxPerOrder ?? MAX_PER_ORDER);
                          if (cap <= 1) {
                            return (
                              <p className="mt-2 text-xs text-muted-foreground">
                                Qty: {item.quantity}
                              </p>
                            );
                          }
                          return (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-md border border-border bg-card">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                aria-label="Decrease quantity"
                                className="flex h-7 w-7 items-center justify-center rounded-l-md text-muted-foreground transition-colors hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
                              >
                                <Minus className="size-3" />
                              </button>
                              <span className="min-w-[2ch] px-2 text-center text-sm font-semibold text-foreground tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= cap}
                                aria-label="Increase quantity"
                                className="flex h-7 w-7 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:bg-[#DC2626]/10 hover:text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                <Plus className="size-3" />
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.productId)}
                        aria-label={t('removeItem', { title: item.title })}
                        className="ml-2 self-start rounded p-1.5 text-muted-foreground/40 transition-colors hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>

              {/* Order summary */}
              <div className="mt-auto border-t border-border p-4">
                <div className="space-y-2 text-sm">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{t('subtotal')}</span>
                    <span className="font-medium text-foreground">
                      {formatCents(total)}
                    </span>
                  </div>

                  {/* Shipping */}
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{t('shipping')}</span>
                    <span className="font-medium text-foreground">
                      {qualifiesForFreeShipping ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                      ) : estimatedShipping !== null ? (
                        formatCents(estimatedShipping)
                      ) : (
                        <span className="text-xs text-muted-foreground/60">
                          {t('calculatedAtCheckout')}
                        </span>
                      )}
                    </span>
                  </div>

                  <Separator className="bg-border" />

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {t('total')}
                    </span>
                    <span className="text-lg font-bold text-[#DC2626]">
                      {formatCents(estimatedTotal)}
                    </span>
                  </div>

                  {qualifiesForFreeShipping && (
                    <p className="text-xs font-medium text-green-400">
                      {t('freeShippingThreshold', { threshold: formatCents(freeShippingThresholdCents) })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer — only shown when cart has items */}
        {items.length > 0 && (
          <SheetFooter className="border-t border-border p-4">
            <div className="flex w-full flex-col gap-3">
              <Link
                href="/checkout"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#DC2626] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#ef4444]"
                onClick={() => setIsOpen(false)}
              >
                {t('checkout')}
                <ArrowRight className="size-4" />
              </Link>
              <SheetClose
                render={
                  <Link
                    href="/cart"
                    className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                  />
                }
              >
                {t('viewCart')}
              </SheetClose>
              <SheetClose
                render={
                  <button className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground" />
                }
              >
                {t('continueShopping')}
              </SheetClose>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
