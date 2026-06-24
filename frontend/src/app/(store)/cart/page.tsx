'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, buttonVariants } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { SHIPPING_RATES, SHIPPING_TYPE_LABELS, formatCents } from '@/lib/constants';
import type { ShippingType } from '@/lib/constants';
import { api } from '@/lib/api';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

export default function CartPage() {
  const t = useTranslations('cart');
  const { items, removeItem, clearCart, total } = useCart();
  const { get } = useSiteSettings();
  const [shippingType, setShippingType] = useState<ShippingType>('no_forklift');
  const [rates, setRates] = useState<Record<ShippingType, number>>({ ...SHIPPING_RATES });

  // Address and shipping info from localStorage
  const [hasCheckoutAddress, setHasCheckoutAddress] = useState(false);
  const [checkoutShippingRate, setCheckoutShippingRate] = useState<number | null>(null);
  const [checkoutShippingType, setCheckoutShippingType] = useState<string | null>(null);

  // Fetch default rates from API (using location if known)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = localStorage.getItem('jdm_checkout_state');
      const city = localStorage.getItem('jdm_checkout_city');
      const params: Record<string, string> = {};
      if (state) params.state = state;
      if (city) params.city = city;

      api
        .get<{ success: boolean; data: { forklift: number; no_forklift: number; liftgate: number; residential_delivery: number } }>('/shipping/rates', params)
        .then((res) => {
          if (res.data) setRates(res.data);
        })
        .catch(() => { });
    }
  }, []);

  // Check localStorage for address and shipping info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const state = localStorage.getItem('jdm_checkout_state');
      const city = localStorage.getItem('jdm_checkout_city');
      const rateStr = localStorage.getItem('jdm_checkout_shipping_rate');
      const type = localStorage.getItem('jdm_checkout_shipping_type');

      if (state && city && rateStr) {
        setHasCheckoutAddress(true);
        setCheckoutShippingRate(Number(rateStr));
        setCheckoutShippingType(type);
        if (type && (type === 'forklift' || type === 'no_forklift' || type === 'liftgate' || type === 'residential_delivery')) {
          setShippingType(type as ShippingType);
        }
      } else {
        setHasCheckoutAddress(false);
        setCheckoutShippingRate(null);
        setCheckoutShippingType(null);
      }
    }
  }, []);

  const handleShippingTypeChange = (type: ShippingType) => {
    setShippingType(type);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jdm_checkout_shipping_type', type);
      const nextRate = rates[type];
      localStorage.setItem('jdm_checkout_shipping_rate', nextRate.toString());
    }
  };

  // Shipping estimates from settings (fall back to legacy hard-coded values).
  const shippingBusinessCents = Number(get('shipping_business_cents', '50000')) || 50000;
  const shippingResidentialCents = Number(get('shipping_residential_cents', '70000')) || 70000;
  const freeShippingThresholdCents = Number(get('free_shipping_threshold_cents', '0')) || 0;

  const qualifiesForFreeShipping = freeShippingThresholdCents > 0 && total >= freeShippingThresholdCents;
  const isShippingCostKnown = qualifiesForFreeShipping || hasCheckoutAddress;
  const shippingCost = qualifiesForFreeShipping
    ? 0
    : isShippingCostKnown
      ? rates[shippingType]
      : 0;
  const grandTotal = total + shippingCost;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-none flex-col items-center justify-center gap-6 px-4 py-16 text-center xl:px-24 2xl:px-48">
        <div className="flex size-24 items-center justify-center rounded-full bg-card border border-border shadow-sm">
          <ShoppingBag className="size-12 text-muted-foreground/30" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">{t('empty')}</h1>
          <p className="mt-2 text-muted-foreground">{t('emptyDescription')}</p>
        </div>
        <Link
          href="/engines"
          className={buttonVariants({ className: 'bg-[#DC2626] text-white hover:bg-[#ef4444]' })}
        >
          {t('shopNow')}
          <ArrowRight className="ml-2 size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-none px-4 py-8 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
      <h1 className="mb-8 font-heading text-3xl font-bold uppercase tracking-wide text-foreground">
        {t('title')}
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              {t('items', { count: items.length })}
            </h2>
            <button
              onClick={clearCart}
              className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-[#DC2626] flex items-center gap-1"
            >
              <Trash2 className="size-4" />
              {t('clearCart')}
            </button>
          </div>
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li
                  key={item.productId}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-4 rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  {/* Image */}
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full rounded-md object-cover"
                      />
                    ) : (
                      <Package className="size-8 text-muted-foreground/30" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <Link
                        href={`/products/${item.slug}`}
                        className="font-heading text-base font-semibold text-foreground transition-colors hover:text-[#DC2626]"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground/60">{item.sku}</p>
                    </div>
                    <p className="font-heading text-lg font-bold text-[#DC2626]">
                      {formatCents(item.price_cents)}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.productId)}
                    aria-label={t('removeItem', { title: item.title })}
                    className="self-start rounded p-2 text-muted-foreground/40 transition-colors hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* Clear cart */}
          {/* <button
            onClick={clearCart}
            className="mt-4 text-sm text-muted-foreground/40 transition-colors hover:text-[#DC2626]"
          >
            {t('clearCart')}
          </button> */}
        </div>

        {/* Order summary */}
        <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 shadow-sm h-fit">
          <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
            {t('subtotal')}
          </h2>

          {/* Shipping type */}
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {t('shippingEstimate')}
            </p>

            <p className="mb-2 text-xs text-muted-foreground/60">
              {hasCheckoutAddress ? 'Rates calculated for your location' : t('shippingToBeCalculated')}
            </p>
            <RadioGroup
              value={shippingType}
              onValueChange={(v) => handleShippingTypeChange(v as ShippingType)}
              className="space-y-2"
            >
              {(['forklift', 'no_forklift', 'liftgate', 'residential_delivery'] as const).map((type) => (
                <div key={type} className="flex items-center justify-between rounded border border-border bg-muted px-4 py-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value={type} id={type} className="border-border text-[#DC2626]" />
                    <Label htmlFor={type} className="cursor-pointer text-sm text-foreground/80">
                      {SHIPPING_TYPE_LABELS[type]}
                    </Label>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {hasCheckoutAddress ? formatCents(rates[type]) : t('toBeCalculated')}
                  </span>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator className="bg-border" />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t('subtotal')}</span>
              <span className="font-medium text-foreground">{formatCents(total)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t('shipping')}</span>
              <span className="font-medium text-foreground">
                {qualifiesForFreeShipping ? (
                  <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                ) : isShippingCostKnown ? (
                  formatCents(shippingCost)
                ) : (
                  <span className="text-xs text-muted-foreground/60">{t('toBeCalculated')}</span>
                )}
              </span>
            </div>
            <Separator className="bg-border" />
            <div className="flex items-center justify-between text-base">
              <span className="font-semibold text-foreground">{t('total')}</span>
              <span className="font-heading text-xl font-bold text-[#DC2626]">
                {formatCents(grandTotal)}
              </span>
            </div>
          </div>

          {/* Checkout */}
          <Link
            href="/checkout"
            className={buttonVariants({ size: 'lg', className: 'w-full bg-[#DC2626] text-white hover:bg-[#ef4444]' })}
          >
            {t('checkout')}
            <ArrowRight className="ml-2 size-4" />
          </Link>

          <Link
            href="/engines"
            className="text-center text-sm text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            {t('continueShopping')}
          </Link>
        </div>
      </div>
    </div>
  );
}
