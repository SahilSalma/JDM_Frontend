'use client';

import { useState, useCallback, type FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useTranslations } from 'next-intl';
import {
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Truck,
  RotateCcw,
  Package,
  CreditCard,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { useCheckout } from '@/hooks/useCheckout';
import { formatCents } from '@/lib/constants';
import type { ShippingType } from '@/lib/constants';
import { api } from '@/lib/api';
import { useTheme } from '@/components/providers/ThemeProvider';
import { City } from 'country-state-city';
import { GoogleMapsProvider } from '@/components/providers/GoogleMapsProvider';
import { AddressAutocomplete, type ParsedAddress } from '@/components/checkout/AddressAutocomplete';
import { formatInputPhone } from '@/lib/phone';

declare global {
  interface Window {
    Accept: any;
  }
}

const US_STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Indiana'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
];

const inputClass = 'border-border bg-input text-foreground placeholder:text-muted-foreground/40 focus:border-[#DC2626]';

export default function CheckoutPage() {
  const t = useTranslations('checkout');
  const tErrors = useTranslations('errors');
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { resolvedTheme } = useTheme();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
  });

  const [billingForm, setBillingForm] = useState({
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const [card, setCard] = useState({
    number: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: '',
  });

  const [cardFocus, setCardFocus] = useState(false); // flips card to back when CVV focused
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'amex' | 'discover' | 'generic'>('generic');

  const {
    shippingType,
    setShippingType,
    allRates,
    isLoadingRates,
    isFreeShipping,
    effectiveShippingRate,
    freeShippingThreshold,
    discountThreshold,
    discountPercentage,
    discountAmount,
    grandTotal,
    error,
    clearError,
  } = useCheckout(total, form.state || undefined, form.city || undefined);

  const isAddressKnown = !!(form.state && form.city);

  const citiesList = form.state
    ? Array.from(
      new Set(
        City.getCitiesOfState('US', form.state).map((c) => c.name)
      )
    ).sort((a, b) => a.localeCompare(b))
    : [];

  const billingCitiesList = billingForm.state
    ? Array.from(
      new Set(
        City.getCitiesOfState('US', billingForm.state).map((c) => c.name)
      )
    ).sort((a, b) => a.localeCompare(b))
    : [];

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detect card type based on starting digits
  const handleCardNumberChange = (value: string) => {
    const rawVal = value.replace(/\D/g, '');
    let formattedVal = '';

    // Format card number: groups of 4 digits
    for (let i = 0; i < rawVal.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) formattedVal += ' ';
      formattedVal += rawVal[i];
    }

    setCard((prev) => ({ ...prev, number: formattedVal }));

    // Regex card identification
    if (rawVal.startsWith('4')) {
      setCardType('visa');
    } else if (/^5[1-5]/.test(rawVal)) {
      setCardType('mastercard');
    } else if (/^3[47]/.test(rawVal)) {
      setCardType('amex');
    } else if (/^6(?:011|5)/.test(rawVal)) {
      setCardType('discover');
    } else {
      setCardType('generic');
    }
  };

  const handleFormChange = useCallback(
    (field: keyof typeof form, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      clearError();
      setSubmitError(null);
    },
    [clearError],
  );

  const handleStateChange = (newState: string) => {
    const stateCities = City.getCitiesOfState('US', newState)
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b));
    const defaultCity = stateCities[0] || '';
    setForm((prev) => ({ ...prev, state: newState, city: defaultCity }));
    clearError();
    setSubmitError(null);
  };

  const handleAddressSelect = useCallback(
    (parsed: ParsedAddress) => {
      const stateCities = City.getCitiesOfState('US', parsed.state).map((c) => c.name);
      const matchedCity = stateCities.find(
        (c) => c.toLowerCase() === parsed.city.toLowerCase()
      ) || stateCities[0] || parsed.city;

      setForm((prev) => ({
        ...prev,
        address: parsed.address,
        city: matchedCity,
        state: parsed.state,
        zip: parsed.zip,
      }));
      if (sameAsShipping) {
        setBillingForm({
          address: parsed.address,
          address2: form.address2,
          city: matchedCity,
          state: parsed.state,
          zip: parsed.zip,
        });
      }
      clearError();
      setSubmitError(null);
    },
    [clearError, sameAsShipping, form.address2],
  );

  const handleBillingFormChange = useCallback(
    (field: keyof typeof billingForm, value: string) => {
      setBillingForm((prev) => ({ ...prev, [field]: value }));
      clearError();
      setSubmitError(null);
    },
    [clearError],
  );

  const handleBillingStateChange = (newState: string) => {
    const stateCities = City.getCitiesOfState('US', newState)
      .map((c) => c.name)
      .sort((a, b) => a.localeCompare(b));
    const defaultCity = stateCities[0] || '';
    setBillingForm((prev) => ({ ...prev, state: newState, city: defaultCity }));
    clearError();
    setSubmitError(null);
  };

  const handleBillingAddressSelect = useCallback(
    (parsed: ParsedAddress) => {
      const stateCities = City.getCitiesOfState('US', parsed.state).map((c) => c.name);
      const matchedCity = stateCities.find(
        (c) => c.toLowerCase() === parsed.city.toLowerCase()
      ) || stateCities[0] || parsed.city;

      setBillingForm((prev) => ({
        ...prev,
        address: parsed.address,
        city: matchedCity,
        state: parsed.state,
        zip: parsed.zip,
      }));
      clearError();
      setSubmitError(null);
    },
    [clearError],
  );

  const handleSameAsShippingChange = (checked: boolean) => {
    setSameAsShipping(checked);
    if (checked) {
      setBillingForm({
        address: form.address,
        address2: form.address2,
        city: form.city,
        state: form.state,
        zip: form.zip,
      });
    }
    clearError();
    setSubmitError(null);
  };

  const tokenizeCard = (): Promise<{ descriptor: string; value: string }> => {
    return new Promise((resolve, reject) => {
      if (!window.Accept) {
        return reject(new Error('Payment library failed to load. Please refresh the page.'));
      }

      const clientKey = process.env.NEXT_PUBLIC_AUTHORIZE_NET_CLIENT_KEY;
      const apiLoginID = process.env.NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID;

      if (!clientKey || !apiLoginID) {
        // Fallback for development/testing when keys are not configured
        console.warn('Accept.js keys missing. Simulating tokenization.');
        return resolve({
          descriptor: 'COMMON.ACCEPT.INAPP.PAYMENT',
          value: 'mock_nonce_' + Math.random().toString(36).substr(2, 9),
        });
      }

      const authData = {
        clientKey: clientKey,
        apiLoginID: apiLoginID,
      };

      const cardData = {
        cardNumber: card.number.replace(/\s+/g, ''),
        cardCode: card.cvv,
        month: card.expiryMonth,
        year: card.expiryYear.slice(-2), // 2 digit year
      };

      const secureData = { authData, cardData };

      window.Accept.dispatchData(secureData, (response: any) => {
        if (response.messages.resultCode === 'Error') {
          const err = response.messages.message[0];
          reject(new Error(`${err.text} (Code: ${err.code})`));
        } else {
          resolve({
            descriptor: response.opaqueData.dataDescriptor,
            value: response.opaqueData.dataValue,
          });
        }
      });
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Local validation checks
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    const digitsOnly = form.phone.replace(/\D/g, '');
    if (digitsOnly.length < 11) {
      setSubmitError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (!card.number || !card.expiryMonth || !card.expiryYear || !card.cvv) {
      setSubmitError('Please fill out all card payment details.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Get token from Authorize.net
      const { descriptor, value } = await tokenizeCard();

      // 2. Submit payment and create order synchronously
      const res = await api.post<{ success: boolean; data: { id: string; order_number: string } }>('/checkout/confirm', {
        opaque_data_descriptor: descriptor,
        opaque_data_value: value,
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
        shipping_type: shippingType,
        customer_email: form.email,
        customer_first_name: form.firstName,
        customer_last_name: form.lastName,
        customer_phone: form.phone,
        shipping_line1: form.address,
        shipping_line2: form.address2 || undefined,
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_zip: form.zip,
        shipping_country: 'US',
        billing_line1: sameAsShipping ? form.address : billingForm.address,
        billing_line2: sameAsShipping ? (form.address2 || undefined) : (billingForm.address2 || undefined),
        billing_city: sameAsShipping ? form.city : billingForm.city,
        billing_state: sameAsShipping ? form.state : billingForm.state,
        billing_zip: sameAsShipping ? form.zip : billingForm.zip,
        billing_country: 'US',
        theme: resolvedTheme,
      });

      // 3. Complete checkout
      clearCart();
      router.push(`/order-confirmation/${res.data.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : tErrors('generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-none flex-col items-center justify-center gap-4 px-4 py-16 text-center xl:px-24 2xl:px-48">
        <Package className="size-12 text-muted-foreground/30" />
        <p className="text-lg font-medium text-muted-foreground">Your cart is empty.</p>
        <Link href="/engines" className="text-sm text-[#DC2626] hover:text-[#ef4444]">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const isSandbox = process.env.NEXT_PUBLIC_AUTHORIZE_NET_ENVIRONMENT !== 'production';
  const acceptJsUrl = isSandbox
    ? 'https://jstest.authorize.net/v1/Accept.js'
    : 'https://js.authorize.net/v1/Accept.js';

  return (
    <div className="mx-auto w-full max-w-none px-4 py-8 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
      {/* Load Accept.js securely */}
      <Script src={acceptJsUrl} strategy="afterInteractive" />

      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/cart"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
          {t('title')}
        </h1>
      </div>

      <GoogleMapsProvider>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ── Left Column: Shipping & Payment ── */}
          <div className="space-y-6 lg:col-span-7">
            {/* Contact Information */}
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-1 text-base font-semibold text-foreground">
                {t('contact.title')}
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">{t('contact.subtitle')}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('shipping.email')}</Label>
                  <Input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    placeholder="john@example.com"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('shipping.phone')}</Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 text-sm text-foreground/50 select-none">
                      <span>🇺🇸</span>
                      <span>+1</span>
                    </div>
                    <Input
                      required
                      type="tel"
                      value={form.phone.startsWith('+1') ? form.phone.slice(2).trim() : form.phone}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        const formatted = formatInputPhone(rawValue);
                        const digits = formatted.replace(/\D/g, '');
                        const savedValue = digits ? `+1 ${formatted}` : '';
                        handleFormChange('phone', savedValue);
                      }}
                      placeholder="(555) 123-4567"
                      className={`${inputClass} pl-14`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Shipping Address */}
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-foreground">
                {t('shipping.title')}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('shipping.firstName')}</Label>
                  <Input
                    required
                    value={form.firstName}
                    onChange={(e) => handleFormChange('firstName', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('shipping.lastName')}</Label>
                  <Input
                    required
                    value={form.lastName}
                    onChange={(e) => handleFormChange('lastName', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">{t('shipping.address')}</Label>
                  <AddressAutocomplete
                    value={form.address}
                    onChange={(v) => handleFormChange('address', v)}
                    onSelect={handleAddressSelect}
                    placeholder={t('shipping.addressPlaceholder')}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">{t('shipping.address2')}</Label>
                  <Input
                    value={form.address2}
                    onChange={(e) => handleFormChange('address2', e.target.value)}
                    className={inputClass}
                  />
                </div>
                {/* State Select */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('shipping.state')}</Label>
                  <Select
                    value={form.state}
                    onValueChange={(v) => v && handleStateChange(v)}
                  >
                    <SelectTrigger className="border-border bg-input text-foreground focus:border-[#DC2626] text-sm w-full">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 border-border bg-card">
                      {US_STATES.map(([abbr, name]) => (
                        <SelectItem
                          key={abbr}
                          value={abbr}
                          className="text-foreground focus:bg-[#DC2626]/20 focus:text-foreground"
                        >
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City Select */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('shipping.city')}</Label>
                  <Select
                    value={form.city}
                    onValueChange={(v) => v && handleFormChange('city', v)}
                    disabled={!form.state}
                  >
                    <SelectTrigger className="border-border bg-input text-foreground focus:border-[#DC2626] text-sm w-full">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 border-border bg-card">
                      {citiesList.map((city) => (
                        <SelectItem
                          key={city}
                          value={city}
                          className="text-foreground focus:bg-[#DC2626]/20 focus:text-foreground"
                        >
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zip Input */}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('shipping.zip')}</Label>
                  <Input
                    required
                    value={form.zip}
                    onChange={(e) => handleFormChange('zip', e.target.value)}
                    placeholder="10001"
                    className={inputClass}
                  />
                </div>
              </div>
            </section>

            {/* Billing Address */}
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="size-4 text-[#DC2626]" />
                  {t('billingAddress')}
                </h2>
              </div>
              <label className="flex cursor-pointer items-center gap-2.5 mb-4 rounded-md bg-muted/30 px-3 py-2.5 border border-border transition-colors hover:border-[#DC2626]/30">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={(e) => handleSameAsShippingChange(e.target.checked)}
                  className="size-4 accent-[#DC2626]"
                />
                <span className="text-sm font-medium text-foreground">{t('sameAsShipping')}</span>
              </label>
              {!sameAsShipping && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">{t('shipping.address')}</Label>
                    <AddressAutocomplete
                      value={billingForm.address}
                      onChange={(v) => handleBillingFormChange('address', v)}
                      onSelect={handleBillingAddressSelect}
                      placeholder={t('shipping.addressPlaceholder')}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">{t('shipping.address2')}</Label>
                    <Input
                      value={billingForm.address2}
                      onChange={(e) => handleBillingFormChange('address2', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('shipping.state')}</Label>
                    <Select
                      value={billingForm.state}
                      onValueChange={(v) => v && handleBillingStateChange(v)}
                    >
                      <SelectTrigger className="border-border bg-input text-foreground focus:border-[#DC2626] text-sm w-full">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 border-border bg-card">
                        {US_STATES.map(([abbr, name]) => (
                          <SelectItem
                            key={abbr}
                            value={abbr}
                            className="text-foreground focus:bg-[#DC2626]/20 focus:text-foreground"
                          >
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('shipping.city')}</Label>
                    <Select
                      value={billingForm.city}
                      onValueChange={(v) => v && handleBillingFormChange('city', v)}
                      disabled={!billingForm.state}
                    >
                      <SelectTrigger className="border-border bg-input text-foreground focus:border-[#DC2626] text-sm w-full">
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 border-border bg-card">
                        {billingCitiesList.map((city) => (
                          <SelectItem
                            key={city}
                            value={city}
                            className="text-foreground focus:bg-[#DC2626]/20 focus:text-foreground"
                          >
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('shipping.zip')}</Label>
                    <Input
                      required
                      value={billingForm.zip}
                      onChange={(e) => handleBillingFormChange('zip', e.target.value)}
                      placeholder="10001"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Delivery Type */}
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-foreground">
                {t('shipping.type')}
              </h2>
              {isFreeShipping && (
                <p className="mb-3 rounded-md bg-green-500/10 px-3 py-2 text-sm font-medium text-green-600 dark:text-green-400">
                  {t('shipping.freeShipping', { amount: formatCents(freeShippingThreshold) })}
                </p>
              )}
              <RadioGroup
                value={shippingType}
                onValueChange={(v) => setShippingType(v as ShippingType)}
                className="space-y-2"
              >
                {([
                  { value: 'forklift' as const, label: t('shipping.forklift'), rate: allRates.forklift },
                  { value: 'no_forklift' as const, label: t('shipping.noForklift'), rate: allRates.no_forklift },
                  { value: 'liftgate' as const, label: t('shipping.liftgate'), rate: allRates.liftgate },
                  { value: 'residential_delivery' as const, label: t('shipping.residentialDelivery'), rate: allRates.residential_delivery },
                ]).map((opt) => (
                  <label
                    key={opt.value}
                    htmlFor={`co-${opt.value}`}
                    className={`flex cursor-pointer items-center justify-between rounded-md border px-4 py-3 transition-colors ${shippingType === opt.value
                      ? 'border-[#DC2626] bg-[#DC2626]/5'
                      : 'border-border bg-muted hover:border-muted-foreground/30'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem
                        value={opt.value}
                        id={`co-${opt.value}`}
                        className="border-border text-[#DC2626]"
                      />
                      <span className="text-sm text-foreground">{opt.label}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {isLoadingRates ? '...' : isFreeShipping ? (
                        <span className="text-green-600 dark:text-green-400">Free</span>
                      ) : isAddressKnown ? (
                        formatCents(opt.rate)
                      ) : (
                        <span className="text-xs font-normal text-muted-foreground/60">{t('calculatedAtCheckout')}</span>
                      )}
                    </span>
                  </label>
                ))}
              </RadioGroup>
            </section>

            {/* Authorize.net Premium Card Payment Section */}
            <section className="rounded-lg border border-border bg-card p-5 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <CreditCard className="size-5 text-[#DC2626]" />
                  {t('payment.title')}
                </h2>
                <p className="text-xs text-muted-foreground">Secure transaction processed via Authorize.net</p>
              </div>

              {/* 3D Rotating Credit Card Mockup */}
              <div className="flex justify-center py-2 perspective-1000">
                <div
                  className={`relative w-[340px] h-[200px] transition-transform duration-700 transform-style-3d shadow-xl rounded-xl cursor-default overflow-hidden ${cardFocus ? 'rotate-y-180' : ''
                    }`}
                >
                  {/* FRONT side */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#000000] via-[#000000] to-[#000000]/40 p-5 flex flex-col justify-between backface-hidden rounded-xl border border-white/10 select-none">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        {/* <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">JDM Tokyo Motorsports</span> */}
                        <div className="w-12 h-9 bg-amber-400/80 rounded-md border border-amber-600/30 flex items-center justify-center mt-1.5 shadow-inner">
                          {/* Card chip lines */}
                          <div className="w-8 h-6 border-r border-b border-black/15 flex flex-wrap">
                            <div className="w-1/2 h-1/2 border-r border-b border-black/15" />
                            <div className="w-1/2 h-1/2 border-b border-black/15" />
                          </div>
                        </div>
                      </div>
                      {/* Logo based on card type */}
                      <span className="text-right font-black italic tracking-tighter text-xl text-white">
                        {cardType === 'visa' && <span className="text-blue-400">VISA</span>}
                        {cardType === 'mastercard' && <span className="text-orange-400">MasterCard</span>}
                        {cardType === 'amex' && <span className="text-cyan-400">AMEX</span>}
                        {cardType === 'discover' && <span className="text-orange-300">Discover</span>}
                        {cardType === 'generic' && <span className="text-muted-foreground">DEBIT</span>}
                      </span>
                    </div>

                    <div className="my-2">
                      <p className="font-mono text-xl text-white tracking-widest text-center">
                        {card.number || '•••• •••• •••• ••••'}
                      </p>
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="flex flex-col min-w-0 flex-1 mr-4">
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-medium">Cardholder Name</span>
                        <p className="text-sm font-semibold text-white uppercase truncate">
                          {card.name || `${form.firstName} ${form.lastName}`.trim() || 'John Doe'}
                        </p>
                      </div>
                      <div className="flex flex-col shrink-0">
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-medium">Expires</span>
                        <p className="text-sm font-semibold text-white font-mono">
                          {card.expiryMonth && card.expiryYear ? `${card.expiryMonth}/${card.expiryYear}` : 'MM/YY'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* BACK side */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1E1E24] via-[#0F0F12] to-[#111] p-5 flex flex-col justify-between rotate-y-180 backface-hidden rounded-xl border border-white/10 select-none">
                    <div className="w-full h-10 bg-black absolute top-5 left-0" />

                    <div className="mt-14 w-full flex flex-col gap-1.5">
                      <span className="text-[8px] text-right uppercase tracking-wider text-muted-foreground/50 pr-4">Authorized Signature</span>
                      <div className="w-full h-8 bg-zinc-200 rounded flex justify-end items-center pr-3 border border-black/10 shadow-inner">
                        <span className="font-mono italic font-bold text-black tracking-widest text-sm select-all">
                          {card.cvv || '•••'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[7px] text-muted-foreground/30 text-center leading-tight mt-2">
                      This card is processed securely by Authorize.net. Credit card numbers are tokenized client-side and are never stored or processed locally on our servers.
                    </div>
                  </div>
                </div>
              </div>

              {/* CC Input Form */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="space-y-1 sm:col-span-4">
                  <Label className="text-xs text-muted-foreground">Cardholder Name</Label>
                  <Input
                    required
                    type="text"
                    value={card.name}
                    onChange={(e) => setCard((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="As shown on card"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1 sm:col-span-4">
                  <Label className="text-xs text-muted-foreground">Card Number</Label>
                  <div className="relative">
                    <Input
                      required
                      type="text"
                      inputMode="numeric"
                      value={card.number}
                      onChange={(e) => handleCardNumberChange(e.target.value)}
                      placeholder="4000 1234 5678 9010"
                      className={`${inputClass} font-mono tracking-wider pr-10`}
                      maxLength={19}
                    />
                    <div className="absolute right-3 top-2.5 text-muted-foreground/40">
                      <CreditCard className="size-5" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs text-muted-foreground">Expiry Month</Label>
                  <Select
                    value={card.expiryMonth}
                    onValueChange={(v) => setCard((prev) => ({ ...prev, expiryMonth: v ?? '' }))}
                  >
                    <SelectTrigger className="border-border bg-input text-foreground focus:border-[#DC2626] font-mono text-sm w-full">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 border-border bg-card">
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                        <SelectItem key={m} value={m} className="font-mono focus:bg-[#DC2626]/20">
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <Label className="text-xs text-muted-foreground">Expiry Year</Label>
                  <Select
                    value={card.expiryYear}
                    onValueChange={(v) => setCard((prev) => ({ ...prev, expiryYear: v ?? '' }))}
                  >
                    <SelectTrigger className="border-border bg-input text-foreground focus:border-[#DC2626] font-mono text-sm w-full">
                      <SelectValue placeholder="YYYY" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 border-border bg-card">
                      {Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + i)).map((y) => (
                        <SelectItem key={y} value={y} className="font-mono focus:bg-[#DC2626]/20">
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">CVV / Security Code</Label>
                  <Input
                    required
                    type="password"
                    inputMode="numeric"
                    value={card.cvv}
                    onChange={(e) => setCard((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                    onFocus={() => setCardFocus(true)}
                    onBlur={() => setCardFocus(false)}
                    placeholder="•••"
                    className={`${inputClass} font-mono tracking-widest`}
                    maxLength={4}
                  />
                </div>
              </div>

              <p className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                <ShieldCheck className="size-3.5" />
                {t('trust.securePayment')}
              </p>
            </section>

            {(submitError ?? error) && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {submitError ?? error}
              </p>
            )}

            {/* Policy links */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground/50">
              <Link href="/shipping" className="hover:text-foreground transition-colors">{t('policies.shipping')}</Link>
              <Link href="/returns" className="hover:text-foreground transition-colors">{t('policies.refund')}</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">{t('policies.privacy')}</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">{t('policies.terms')}</Link>
            </div>
          </div>

          {/* ── Right Column: Order Summary ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-5">
              {/* Order summary card */}
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-4 text-base font-semibold text-foreground">
                  {t('orderSummary')}
                </h2>

                {/* Items with images */}
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.productId} className="flex items-center gap-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Package className="size-5 text-muted-foreground/30" />
                          </div>
                        )}
                        {item.quantity > 1 && (
                          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
                            {item.quantity}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground/60">{item.sku}</p>
                      </div>
                      <span className="shrink-0 text-sm font-medium text-foreground">
                        {formatCents(item.price_cents * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <Separator className="my-4 bg-border" />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">{formatCents(total)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-foreground">
                      {isFreeShipping ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                      ) : isAddressKnown ? (
                        formatCents(effectiveShippingRate)
                      ) : (
                        <span className="text-xs text-muted-foreground/60">{t('calculatedAtCheckout')}</span>
                      )}
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                      <span>Discount ({discountPercentage}%)</span>
                      <span>-{formatCents(discountAmount)}</span>
                    </div>
                  )}
                  <Separator className="bg-border" />
                  <div className="flex justify-between pt-1">
                    <span className="text-base font-semibold text-foreground">Total</span>
                    <span className="font-heading text-xl font-bold text-[#DC2626]">
                      {formatCents(isAddressKnown ? grandTotal : (total - discountAmount))}
                    </span>
                  </div>
                </div>

                {/* Place Order button */}
                <Button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="mt-5 w-full bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      {t('payment.processing')}
                    </>
                  ) : (
                    t('placeOrder')
                  )}
                </Button>

                <Link
                  href="/cart"
                  className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/50 transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-3" />
                  Back to cart
                </Link>
              </div>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center">
                  <ShieldCheck className="size-5 text-[#DC2626]" />
                  <span className="text-[10px] leading-tight text-muted-foreground">{t('trust.securePayment')}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center">
                  <RotateCcw className="size-5 text-[#DC2626]" />
                  <span className="text-[10px] leading-tight text-muted-foreground">{t('trust.warranty')}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center">
                  <Truck className="size-5 text-[#DC2626]" />
                  <span className="text-[10px] leading-tight text-muted-foreground">{t('trust.shipping')}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </GoogleMapsProvider>

      {/* 3D credit card flip perspective styles */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
