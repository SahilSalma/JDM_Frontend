'use client';

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { SHIPPING_RATES, type ShippingType } from '@/lib/constants';

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

interface ShippingRates {
  forklift: number;
  no_forklift: number;
  liftgate: number;
  residential_delivery: number;
}

interface UseCheckoutReturn {
  shippingAddress: ShippingAddress | null;
  setShippingAddress: (address: ShippingAddress) => void;
  shippingType: ShippingType;
  setShippingType: (type: ShippingType) => void;
  shippingRate: number;
  allRates: ShippingRates;
  isLoadingRates: boolean;
  freeShippingThreshold: number;
  isFreeShipping: boolean;
  effectiveShippingRate: number;
  discountThreshold: number;
  discountPercentage: number;
  discountAmount: number;
  grandTotal: number;
  error: string | null;
  clearError: () => void;
}

export function useCheckout(subtotal = 0, stateCode?: string, city?: string): UseCheckoutReturn {
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [shippingType, setShippingType] = useState<ShippingType>('no_forklift');
  const [error, setError] = useState<string | null>(null);
  const [allRates, setAllRates] = useState<ShippingRates>({ ...SHIPPING_RATES });
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);
  const [discountThreshold, setDiscountThreshold] = useState(0);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // Fetch free shipping & discount thresholds from public settings
  useEffect(() => {
    api
      .get<{ success: boolean; data: Record<string, string> }>('/admin/settings/public')
      .then((res) => {
        const freeVal = parseInt(res.data?.free_shipping_threshold_cents || '0', 10);
        setFreeShippingThreshold(isNaN(freeVal) ? 0 : freeVal);

        const discVal = parseInt(res.data?.discount_threshold_cents || '0', 10);
        setDiscountThreshold(isNaN(discVal) ? 0 : discVal);

        const pctVal = parseInt(res.data?.discount_percentage || '0', 10);
        setDiscountPercentage(isNaN(pctVal) ? 0 : pctVal);
      })
      .catch(() => {});
  }, []);

  // Fetch shipping rates based on state and city
  const effectiveState = stateCode || shippingAddress?.state;
  const effectiveCity = city || shippingAddress?.city;
  useEffect(() => {
    setIsLoadingRates(true);
    const params: Record<string, string> = {};
    if (effectiveState) params.state = effectiveState;
    if (effectiveCity) params.city = effectiveCity;

    api
      .get<{ success: boolean; data: ShippingRates }>('/shipping/rates', params)
      .then((res) => {
        if (res.data) {
          setAllRates(res.data);
        }
      })
      .catch(() => {
        // Keep fallback rates
      })
      .finally(() => setIsLoadingRates(false));
  }, [effectiveState, effectiveCity]);

  const shippingRate = allRates[shippingType] ?? SHIPPING_RATES[shippingType];
  const isFreeShipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;
  const effectiveShippingRate = isFreeShipping ? 0 : shippingRate;

  // Sync shipping info to localStorage for other components (like CartDrawer) to read
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (effectiveState && effectiveCity) {
        localStorage.setItem('jdm_checkout_state', effectiveState);
        localStorage.setItem('jdm_checkout_city', effectiveCity);
        localStorage.setItem('jdm_checkout_shipping_type', shippingType);
        localStorage.setItem('jdm_checkout_shipping_rate', shippingRate.toString());
      } else {
        localStorage.removeItem('jdm_checkout_state');
        localStorage.removeItem('jdm_checkout_city');
        localStorage.removeItem('jdm_checkout_shipping_type');
        localStorage.removeItem('jdm_checkout_shipping_rate');
      }
    }
  }, [effectiveState, effectiveCity, shippingType, shippingRate]);

  // Calculate discount
  const isDiscountEligible = discountThreshold > 0 && subtotal >= discountThreshold;
  const discountAmount = isDiscountEligible ? Math.round((subtotal * discountPercentage) / 100) : 0;
  const grandTotal = subtotal + effectiveShippingRate - discountAmount;

  const clearError = useCallback(() => setError(null), []);

  return {
    shippingAddress,
    setShippingAddress,
    shippingType,
    setShippingType,
    shippingRate,
    allRates,
    isLoadingRates,
    freeShippingThreshold,
    isFreeShipping,
    effectiveShippingRate,
    discountThreshold,
    discountPercentage,
    discountAmount,
    grandTotal,
    error,
    clearError,
  };
}
