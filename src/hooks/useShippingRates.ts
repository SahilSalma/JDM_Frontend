'use client';

import { useMemo } from 'react';
import { SHIPPING_RATES, type ShippingType, formatCents } from '@/lib/constants';

interface UseShippingRatesReturn {
  rate: number;
  formattedRate: string;
  isLoading: boolean;
}

export function useShippingRates(type: ShippingType = 'no_forklift'): UseShippingRatesReturn {
  const rate = SHIPPING_RATES[type];

  const formattedRate = useMemo(() => formatCents(rate), [rate]);

  return {
    rate,
    formattedRate,
    isLoading: false,
  };
}

export function useAllShippingRates(): {
  rates: typeof SHIPPING_RATES;
  formatted: Record<ShippingType, string>;
} {
  const formatted = useMemo(
    () => ({
      forklift: formatCents(SHIPPING_RATES.forklift),
      no_forklift: formatCents(SHIPPING_RATES.no_forklift),
      liftgate: formatCents(SHIPPING_RATES.liftgate),
      residential_delivery: formatCents(SHIPPING_RATES.residential_delivery),
    }),
    [],
  );

  return { rates: SHIPPING_RATES, formatted };
}
