// Shipping rates in cents (fallback defaults — actual rates come from API)
export const SHIPPING_RATES = {
  forklift: 50000,
  no_forklift: 70000,
  liftgate: 85000,
  residential_delivery: 75000,
} as const;

export type ShippingType = keyof typeof SHIPPING_RATES;

export const SHIPPING_TYPE_LABELS: Record<ShippingType, string> = {
  forklift: 'With Forklift',
  no_forklift: 'Without Forklift',
  liftgate: 'Liftgate Delivery',
  residential_delivery: 'Residential Delivery',
};

// Maximum quantity per product per order
export const MAX_PER_ORDER = 1;

// Product categories
export const CATEGORIES = ['engine', 'transmission', 'part'] as const;
export type Category = (typeof CATEGORIES)[number];

// Transmission types (used as URL slugs under /transmissions/)
export const TRANSMISSION_TYPES = ['manual', 'automatic', 'sequential', 'cvt'] as const;
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];

// Order lifecycle statuses
export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Payment statuses
export const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Format a price in cents to a USD dollar string
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
