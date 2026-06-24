'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Package, Truck, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Pagination } from '@/components/ui/pagination';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

interface OrderItem {
  product_title: string;
  product_sku: string;
  quantity: number;
  unit_price_cents: number;
  total_cents: number;
}

interface TrackedOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  customer_first_name: string;
  customer_last_name: string;
  shipping_city: string;
  shipping_state: string;
  shipping_type: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  tracking_number: string | null;
  carrier: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  items: OrderItem[];
}

interface TrackResponse {
  success: boolean;
  data: TrackedOrder[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}

type SearchType = 'order_number' | 'email' | 'phone';

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'text-blue-500', label: 'Confirmed' },
  processing: { icon: Package, color: 'text-blue-500', label: 'Processing' },
  shipped: { icon: Truck, color: 'text-purple-500', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-green-500', label: 'Delivered' },
  cancelled: { icon: Clock, color: 'text-red-500', label: 'Cancelled' },
  refunded: { icon: Clock, color: 'text-orange-500', label: 'Refunded' },
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getCarrierTrackingUrl(carrier: string | null, trackingNumber: string, shippingCarriersRaw?: string): string | null {
  if (!carrier) return null;
  const c = carrier.toLowerCase().trim();
  const num = encodeURIComponent(trackingNumber.trim());

  if (shippingCarriersRaw) {
    try {
      const parsed = JSON.parse(shippingCarriersRaw);
      if (Array.isArray(parsed)) {
        const match = parsed.find(
          (car: any) => {
            if (!car.name) return false;
            const name = car.name.toLowerCase().trim();
            return c === name || c.includes(name) || name.includes(c);
          }
        );
        if (match && match.tracking_url) {
          const url = match.tracking_url;
          if (url.includes('{tracking_number}')) {
            return url.replace('{tracking_number}', num);
          } else if (url.includes('{{tracking_number}}')) {
            return url.replace('{{tracking_number}}', num);
          } else {
            return url + num;
          }
        }
      }
    } catch {
      // fallback
    }
  }

  if (c.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
  }
  if (c.includes('ups')) {
    return `https://www.ups.com/track?tracknum=${num}`;
  }
  if (c.includes('usps')) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${num}`;
  }
  if (c.includes('dhl')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${num}`;
  }
  return null;
}

export default function TrackOrderPage() {
  const t = useTranslations('trackOrder');
  const { get } = useSiteSettings();
  const shippingCarriersRaw = get('shipping_carriers');

  const [searchType, setSearchType] = useState<SearchType>('order_number');
  const [searchValue, setSearchValue] = useState('');
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (searchPage = 1) => {
    if (!searchValue.trim()) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const params: Record<string, unknown> = { page: searchPage, limit: 10 };
      params[searchType] = searchValue.trim();
      const res = await api.get<TrackResponse>('/orders/track', params);
      setOrders(res.data);
      setTotalPages(res.meta.total_pages);
      setPage(searchPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search orders');
      setOrders([]);
      setTotalPages(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchType, searchValue]);

  const handlePageChange = useCallback((newPage: number) => {
    handleSearch(newPage);
  }, [handleSearch]);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: t('title') },
  ];

  const searchTypes: { value: SearchType; label: string; placeholder: string }[] = [
    { value: 'order_number', label: t('orderNumber'), placeholder: t('enterOrderNumber') },
    { value: 'email', label: t('email'), placeholder: t('enterEmail') },
    { value: 'phone', label: t('phone'), placeholder: t('enterPhone') },
  ];

  const currentPlaceholder = searchTypes.find((s) => s.value === searchType)?.placeholder ?? '';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={breadcrumbs} className="mb-8" />

      <div className="mb-10">
        <h1 className="font-heading text-4xl font-bold uppercase tracking-wide text-foreground lg:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Separator className="mb-10 bg-border" />

      {/* Search Form */}
      <Card className="bg-card border-border mb-10">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{t('searchBy')}</Label>
            <div className="flex flex-wrap gap-2">
              {searchTypes.map((st) => (
                <button
                  key={st.value}
                  onClick={() => { setSearchType(st.value); setSearchValue(''); setHasSearched(false); }}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    searchType === st.value
                      ? 'bg-[#DC2626] text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={currentPlaceholder}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60"
            />
            <Button
              onClick={() => handleSearch()}
              disabled={isLoading || !searchValue.trim()}
              className="bg-[#DC2626] text-white hover:bg-[#ef4444] shrink-0"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <Search className="size-4 mr-2" />
              )}
              {isLoading ? t('searching') : t('search')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <p className="mb-6 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 px-4 py-3 text-sm text-[#DC2626]">
          {error}
        </p>
      )}

      {/* No results */}
      {hasSearched && !isLoading && orders.length === 0 && !error && (
        <div className="text-center py-16">
          <Package className="mx-auto size-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">{t('noResults')}</p>
        </div>
      )}

      {/* Order Results */}
      {orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusConfig.icon;
            const trackingUrl = order.tracking_number ? getCarrierTrackingUrl(order.carrier, order.tracking_number, shippingCarriersRaw) : null;

            return (
              <Card key={order.id} className="bg-card border-border overflow-hidden">
                <CardContent className="p-0">
                  {/* Order header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <div className="flex items-center gap-3">
                      <StatusIcon className={`size-5 ${statusConfig.color}`} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {t('orderPrefix')}{order.order_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        order.status === 'delivered'
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : order.status === 'shipped'
                            ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                            : order.status === 'cancelled' || order.status === 'refunded'
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {statusConfig.label}
                      </span>
                      <p className="text-sm font-semibold text-foreground">
                        {formatCents(order.total_cents)}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-5 py-3 space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{item.product_title}</span>
                          {item.quantity > 1 && (
                            <span className="text-muted-foreground">x{item.quantity}</span>
                          )}
                        </div>
                        <span className="text-muted-foreground">{formatCents(item.total_cents)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tracking info */}
                  {order.tracking_number && (
                    <div className="border-t border-border px-5 py-3 bg-muted/30">
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Truck className="size-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{t('carrier')}:</span>
                          <span className="text-foreground font-medium">{order.carrier}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('trackingNumber')}:</span>{' '}
                          {trackingUrl ? (
                            <a
                              href={trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#DC2626] font-mono text-xs font-semibold hover:underline"
                            >
                              {order.tracking_number}
                            </a>
                          ) : (
                            <span className="text-foreground font-mono text-xs">{order.tracking_number}</span>
                          )}
                        </div>
                        {order.shipped_at && (
                          <div>
                            <span className="text-muted-foreground">{t('shipped')}:</span>{' '}
                            <span className="text-foreground">{formatDate(order.shipped_at)}</span>
                          </div>
                        )}
                        {order.delivered_at && (
                          <div>
                            <span className="text-muted-foreground">{t('delivered')}:</span>{' '}
                            <span className="text-foreground">{formatDate(order.delivered_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="mt-6"
          />
        </div>
      )}
    </div>
  );
}
