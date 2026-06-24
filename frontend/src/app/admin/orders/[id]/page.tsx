'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowLeft, Save, Truck, Mail, MessageSquare, Star } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { formatCents, ORDER_STATUSES } from '@/lib/constants';
import type { OrderStatus } from '@/lib/constants';
import type { Order } from '@/hooks/useOrders';
import { StarRating } from '@/components/product/StarRating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
} from '@/components/ui/table';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-foreground border border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-foreground border border-blue-500/20',
  processing: 'bg-purple-500/10 text-foreground border border-purple-500/20',
  shipped: 'bg-cyan-500/10 text-foreground border border-cyan-500/20',
  delivered: 'bg-green-500/10 text-foreground border border-green-500/20',
  cancelled: 'bg-red-500/10 text-foreground border border-red-500/20',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-foreground border border-yellow-500/20',
  paid: 'bg-green-500/10 text-foreground border border-green-500/20',
  failed: 'bg-red-500/10 text-foreground border border-red-500/20',
  refunded: 'bg-orange-500/10 text-foreground border border-orange-500/20',
  partially_refunded: 'bg-orange-500/10 text-foreground border border-orange-500/20',
};



export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.orderDetail');
  const tStatus = useTranslations('admin.orderStatus');
  const tPayment = useTranslations('admin.paymentStatus');
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Tracking
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [savingTracking, setSavingTracking] = useState(false);

  // Notes
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const [carriers, setCarriers] = useState<string[]>(['UPS', 'FedEx', 'USPS', 'DHL', 'Other']);
  const [orderReviews, setOrderReviews] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      adminApi.get<{ success: boolean; data: Order }>(`/admin/orders/${id}`),
      adminApi.get<{ success: boolean; data: any[] }>('/admin/settings')
    ])
      .then(([orderRes, settingsRes]) => {
        if (!cancelled) {
          setOrder(orderRes.data);
          setSelectedStatus(orderRes.data.status);
          setTrackingNumber(orderRes.data.tracking_number ?? '');
          setCarrier(orderRes.data.carrier ?? '');
          setNotes(orderRes.data.admin_notes ?? '');

          const carriersSetting = settingsRes.data.find(r => r.rule_key === 'shipping_carriers');
          if (carriersSetting && carriersSetting.rule_value) {
            try {
              const parsed = JSON.parse(carriersSetting.rule_value);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setCarriers(parsed.map((c: any) => c.name).filter(Boolean));
              }
            } catch (err) {
              console.error('Failed to parse shipping carriers', err);
            }
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load order');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    adminApi.get<{ success: boolean; data: any[] }>(`/admin/reviews?order_id=${id}&limit=100`)
      .then((res) => setOrderReviews(res.data))
      .catch(() => {});
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !order) return;
    setUpdatingStatus(true);
    try {
      await adminApi.patch(`/admin/orders/${id}`, { status: selectedStatus });
      setOrder((o) => (o ? { ...o, status: selectedStatus } : o));
      toast.success('Order status updated successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!order) return;
    setSavingTracking(true);
    try {
      await adminApi.patch(`/admin/orders/${id}/tracking`, { tracking_number: trackingNumber, carrier });
      setOrder((o) => (o ? { ...o, tracking_number: trackingNumber, carrier } : o));
      toast.success('Tracking details saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save tracking details');
    } finally {
      setSavingTracking(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await adminApi.patch(`/admin/orders/${id}`, { admin_notes: notes });
      setOrder((o) => (o ? { ...o, admin_notes: notes } : o));
      toast.success('Admin notes saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save admin notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const selectClass =
    'h-8 w-full rounded-lg border border-border bg-muted px-2 text-sm text-foreground focus:border-[#DC2626] focus:outline-none';

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-4 text-muted-foreground">{error ?? t('notFound')}</div>
    );
  }

  const subtotal = order.total_cents - order.shipping_cents;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t('title')}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Order Info */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground">{t('orderInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">{t('orderNumber')}</p>
                <p className="font-mono text-foreground">{order.order_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t('date')}</p>
                <p className="text-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t('status')}</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? ''}`}
                >
                  {tStatus(order.status)}
                </span>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">{t('payment')}</p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[order.payment_status] ?? ''}`}
                >
                  {tPayment(order.payment_status)}
                </span>
              </div>
              {order.authorizenet_transaction_id && (
                <>
                  <div>
                    <p className="text-muted-foreground">{t('paymentGateway')}</p>
                    <p className="text-foreground font-medium">Authorize.net Accept.js</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('transactionId')}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-mono text-foreground">{order.authorizenet_transaction_id}</span>
                      <a
                        href={process.env.NEXT_PUBLIC_AUTHORIZE_NET_ENVIRONMENT === 'production'
                          ? 'https://merchant.authorize.net/'
                          : 'https://sandbox.authorize.net/'}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#DC2626] hover:underline flex items-center gap-0.5 font-medium shrink-0"
                      >
                        {t('viewInAuthorizeNet')}
                      </a>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground">{t('items')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">{t('product')}</TableHead>
                    <TableHead className="text-muted-foreground">{t('sku')}</TableHead>
                    <TableHead className="text-muted-foreground text-right">{t('quantity')}</TableHead>
                    <TableHead className="text-muted-foreground text-right">{t('unitPrice')}</TableHead>
                    <TableHead className="text-muted-foreground text-right">{t('lineTotal')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, i) => (
                    <TableRow key={i} className="border-border">
                      <TableCell className="text-foreground">{item.product_title}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.product_sku}</TableCell>
                      <TableCell className="text-foreground text-right">{item.quantity}</TableCell>
                      <TableCell className="text-foreground text-right">
                        {formatCents(item.unit_price_cents)}
                      </TableCell>
                      <TableCell className="text-foreground text-right">
                        {formatCents(item.total_cents)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="border-t border-border bg-card">
                  <TableRow className="border-border">
                    <TableCell colSpan={4} className="text-right text-muted-foreground">
                      {t('subtotal')}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {formatCents(subtotal)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-border">
                    <TableCell colSpan={4} className="text-right text-muted-foreground">
                      {t('shipping')}
                    </TableCell>
                    <TableCell className="text-right text-foreground">
                      {formatCents(order.shipping_cents)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-0">
                    <TableCell colSpan={4} className="text-right font-medium text-foreground">
                      {t('total')}
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#DC2626]">
                      {formatCents(order.total_cents)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>
          {/* Customer & Shipping Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-sm text-foreground">{t('customerInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">{t('name')}</p>
                  <p className="text-foreground font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t('email')}</p>
                  <p className="text-foreground break-all">{order.customer_email}</p>
                </div>
                {order.customer_phone && (
                  <div>
                    <p className="text-muted-foreground text-xs">{t('phone')}</p>
                    <p className="text-foreground">{order.customer_phone}</p>
                  </div>
                )}
                {order.customer_notes && (
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-muted-foreground text-xs font-semibold">Customer Notes / Instructions</p>
                    <p className="text-foreground bg-muted p-2 rounded text-xs mt-1 whitespace-pre-wrap leading-relaxed">
                      {order.customer_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-foreground">{t('shippingAddress')}</CardTitle>
                  {order.shipping_type && (
                    <span className="rounded-full border border-[#DC2626]/20 bg-[#DC2626]/5 px-2.5 py-0.5 text-xs font-semibold text-[#DC2626]">
                      {order.shipping_type === 'forklift'
                        ? 'With Forklift'
                        : order.shipping_type === 'no_forklift'
                          ? 'Without Forklift'
                          : order.shipping_type === 'liftgate'
                            ? 'Liftgate Delivery'
                            : 'Residential Delivery'}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 text-sm text-foreground space-y-1">
                {order.shipping_address?.address && <p>{order.shipping_address.address}</p>}
                {order.shipping_address?.address2 && <p>{order.shipping_address.address2}</p>}
                {(order.shipping_address?.city || order.shipping_address?.state) && (
                  <p>
                    {[
                      order.shipping_address.city,
                      order.shipping_address.state,
                      order.shipping_address.zip,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card className="bg-card border-border">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-sm text-foreground">{t('billingAddress')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm text-foreground space-y-1">
                {order.billing_address ? (
                  <>
                    <p>{order.billing_address.address}</p>
                    {order.billing_address?.address2 && <p>{order.billing_address.address2}</p>}
                    {(order.billing_address?.city || order.billing_address?.state) && (
                      <p>
                        {[
                          order.billing_address.city,
                          order.billing_address.state,
                          order.billing_address.zip,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground italic">Same as shipping address</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Reviews */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-[#DC2626]" />
                <CardTitle className="text-sm text-foreground">Reviews</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {orderReviews.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No reviews for this order yet.</p>
              ) : (
                <div className="space-y-3">
                  {orderReviews.map((review: any) => (
                    <div key={review.id} className="rounded-lg border border-border bg-muted/20 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="size-3.5 fill-[#DC2626] text-[#DC2626]" />
                          <span className="text-sm font-medium text-foreground">{review.customer_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.product && (
                        <p className="mt-1 text-xs font-medium text-[#DC2626]">
                          {review.product.title}
                        </p>
                      )}
                      {review.title && (
                        <p className="mt-1 text-xs font-medium text-foreground">{review.title}</p>
                      )}
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{review.content}</p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <StarRating rating={review.rating} size="sm" />
                        <span>/ {review.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Update Status */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground">{t('statusUpdate')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                className={selectClass}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {tStatus(s)}
                  </option>
                ))}
              </select>
              <Button
                onClick={handleStatusUpdate}
                disabled={updatingStatus || selectedStatus === order.status}
                className="w-full bg-[#DC2626] text-foreground hover:bg-[#ef4444] disabled:opacity-50"
                size="sm"
              >
                {updatingStatus ? '...' : t('confirmStatus')}
              </Button>
            </CardContent>
          </Card>

          {/* Tracking */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-[#DC2626]" />
                <CardTitle className="text-sm text-foreground">{t('trackingUpdate')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('tracking')}</Label>
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="bg-muted border-border text-foreground h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('carrier')}</Label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className={selectClass}
                >
                  <option value="">{t('selectCarrier')}</option>
                  {carriers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleSaveTracking}
                disabled={
                  savingTracking ||
                  (trackingNumber === (order.tracking_number ?? '') &&
                    carrier === (order.carrier ?? ''))
                }
                className="w-full bg-[#DC2626] text-foreground hover:bg-[#ef4444] disabled:opacity-50"
                size="sm"
              >
                <Save className="size-3.5" />
                {savingTracking ? '...' : t('saveTracking')}
              </Button>
            </CardContent>
          </Card>

          {/* Send Email */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <Button
                variant="outline"
                className="w-full border-border text-muted-foreground hover:text-foreground hover:bg-muted gap-2"
                size="sm"
                onClick={() =>
                  router.push(`/admin/emails?to=${encodeURIComponent(order.customer_email)}&order=${order.id}&orderNumber=${encodeURIComponent(order.order_number)}`)
                }
              >
                <Mail className="size-4" />
                {t('sendEmail')}
              </Button>
            </CardContent>
          </Card>

          {/* Admin Notes */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground">{t('notes')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder')}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 min-h-[80px] text-sm resize-none"
              />
              <Button
                onClick={handleSaveNotes}
                disabled={savingNotes || notes === (order.admin_notes ?? '')}
                variant="outline"
                size="sm"
                className="w-full border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                {savingNotes ? '...' : t('saveNotes')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}