'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  ShoppingBag,
  MapPin,
  ExternalLink,
  User,
  TrendingUp,
  CreditCard,
  Package,
  Paperclip,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatCents } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPhoneDisplay } from '@/lib/phone';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import EmailDetailDialog from '@/components/admin/EmailDetailDialog';

const ORDER_STATUS_COLORS: Record<string, string> = {
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

interface CustomerDetails {
  customer: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    total_orders: number;
    total_spent: number;
    paid_revenue: number;
    first_order_date: string;
    last_order_date: string;
    shipping_addresses: string[];
  };
  orders: Array<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total_cents: number;
    created_at: string;
    items: Array<{
      id: string;
      product_title: string;
      product_sku: string;
      quantity: number;
      unit_price_cents: number;
    }>;
  }>;
}

// Simple mini chart component for spending over time
function SpendingChart({ orders }: { orders: CustomerDetails['orders'] }) {
  if (orders.length < 2) return null;

  // Group orders by month
  const monthlySpend: Record<string, number> = {};
  for (const o of orders) {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlySpend[key] = (monthlySpend[key] || 0) + o.total_cents;
  }

  const sortedKeys = Object.keys(monthlySpend).sort();
  const values = sortedKeys.map((k) => monthlySpend[k]);
  const maxVal = Math.max(...values, 1);

  const width = 600;
  const height = 180;
  const padX = 50;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = values.map((v, i) => ({
    x: padX + (i / Math.max(values.length - 1, 1)) * chartW,
    y: padY + chartH - (v / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`;

  return (
    <Card className="border border-border bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-foreground flex items-center gap-2">
          <TrendingUp className="size-4 text-[#DC2626]" />
          Monthly Spending Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 200 }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = padY + chartH - frac * chartH;
            return (
              <g key={frac}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                  strokeDasharray="4 4"
                />
                <text
                  x={padX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="currentColor"
                  fillOpacity={0.35}
                  fontSize={10}
                  className="font-mono"
                >
                  ${Math.round((frac * maxVal) / 100).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#DC2626" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#spendGrad)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="#DC2626" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill="#DC2626" stroke="#18181b" strokeWidth={2} />
          ))}

          {/* X-axis labels */}
          {sortedKeys.map((key, i) => {
            const x = padX + (i / Math.max(sortedKeys.length - 1, 1)) * chartW;
            const label = key.split('-').reverse().join('/');
            return (
              <text
                key={key}
                x={x}
                y={height - 2}
                textAnchor="middle"
                fill="currentColor"
                fillOpacity={0.35}
                fontSize={9}
                className="font-mono"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </CardContent>
    </Card>
  );
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tStatus = useTranslations('admin.orderStatus');
  const tPayment = useTranslations('admin.paymentStatus');

  const email = decodeURIComponent(String(params.email || ''));
  const [details, setDetails] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Email log state
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!email) return;
    setIsLoading(true);
    setLoadingLogs(true);
    adminApi
      .get<{ success: boolean; data: CustomerDetails }>(
        `/admin/customers/${encodeURIComponent(email)}`,
      )
      .then((res) => {
        if (res.success) setDetails(res.data);
      })
      .catch((err) => console.error('Failed to load customer details', err))
      .finally(() => setIsLoading(false));

    adminApi
      .get<{ success: boolean; data: any[] }>(
        `/admin/email/log/recipient/${encodeURIComponent(email)}`,
      )
      .then((res) => setEmailLogs(res.data ?? []))
      .catch(() => setEmailLogs([]))
      .finally(() => setLoadingLogs(false));
  }, [email]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/admin/customers')} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Customers
        </Button>
        <p className="text-muted-foreground">Customer not found.</p>
      </div>
    );
  }

  const c = details.customer;
  const avgOrderValue = c.total_orders > 0 ? c.total_spent / c.total_orders : 0;
  const paidOrderCount = details.orders.filter((o) => o.payment_status === 'paid').length;

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  for (const o of details.orders) {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Back Button + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/customers')}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626] ring-2 ring-[#DC2626]/20">
              <User className="size-6" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                {c.first_name} {c.last_name}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {c.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="size-3.5 text-[#DC2626]" />
              Total Spent
            </span>
            <span className="text-xl font-bold font-mono text-foreground">{formatCents(c.total_spent)}</span>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="size-3.5 text-green-500" />
              Paid Revenue
            </span>
            <span className="text-xl font-bold font-mono text-green-400">{formatCents(c.paid_revenue)}</span>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <ShoppingBag className="size-3.5" />
              Orders
            </span>
            <span className="text-xl font-bold font-mono text-foreground">{c.total_orders}</span>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-blue-400" />
              Avg Order
            </span>
            <span className="text-xl font-bold font-mono text-foreground">{formatCents(Math.round(avgOrderValue))}</span>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Package className="size-3.5 text-cyan-400" />
              Paid Orders
            </span>
            <span className="text-xl font-bold font-mono text-foreground">{paidOrderCount}</span>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card/60 backdrop-blur-md">
          <CardContent className="p-4 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Customer Since
            </span>
            <span className="text-sm font-semibold text-foreground">
              {new Date(c.first_order_date).toLocaleDateString()}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout: Chart + Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SpendingChart orders={details.orders} />
        </div>

        <div className="space-y-4">
          {/* Contact Info Card */}
          <Card className="border border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <User className="size-4 text-[#DC2626]" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail className="size-4 text-muted-foreground/60 shrink-0" />
                <span className="text-foreground select-all">{c.email}</span>
              </div>
              {c.phone && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="size-4 text-muted-foreground/60 shrink-0" />
                  <span className="text-foreground select-all font-mono">{formatPhoneDisplay(c.phone)}</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm">
                <Calendar className="size-4 text-muted-foreground/60 shrink-0" />
                <span className="text-muted-foreground">
                  Last Order:{' '}
                  <span className="text-foreground font-medium">
                    {new Date(c.last_order_date).toLocaleDateString()}
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Order Status Breakdown */}
          <Card className="border border-border bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <ShoppingBag className="size-4 text-[#DC2626]" />
                Order Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded-full ${ORDER_STATUS_COLORS[status] || ''}`}>
                    {tStatus(status)}
                  </Badge>
                  <span className="text-sm font-mono font-bold text-foreground">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shipping Addresses */}
      {c.shipping_addresses.length > 0 && (
        <Card className="border border-border bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-foreground flex items-center gap-2">
              <MapPin className="size-4 text-[#DC2626]" />
              Shipping Addresses Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {c.shipping_addresses.map((addr, idx) => (
                <div
                  key={idx}
                  className="text-xs border border-border/40 p-3 rounded-lg bg-muted/10 text-muted-foreground leading-relaxed flex items-start gap-2"
                >
                  <MapPin className="size-3.5 shrink-0 mt-0.5 text-muted-foreground/40" />
                  <span>{addr}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Order History Table */}
      <Card className="border border-border bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <ShoppingBag className="size-4 text-[#DC2626]" />
            Complete Order History ({details.orders.length} orders)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="text-muted-foreground">Order #</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground hidden sm:table-cell">Payment</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Items</TableHead>
                <TableHead className="text-muted-foreground text-right">Total</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.orders.map((order) => (
                <TableRow
                  key={order.id}
                  className="border-b border-border/40 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/orders/${order.id}`)}
                >
                  <TableCell className="font-mono text-xs text-foreground font-bold">
                    {order.order_number}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded-full ${ORDER_STATUS_COLORS[order.status] || ''}`}>
                      {tStatus(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded-full ${PAYMENT_STATUS_COLORS[order.payment_status] || ''}`}>
                      {tPayment(order.payment_status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs hidden md:table-cell">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-foreground">
                    {formatCents(order.total_cents)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/orders/${order.id}`);
                      }}
                    >
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email History */}
      <Card className="border border-border bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <Mail className="size-4 text-[#DC2626]" />
            Email History ({emailLogs.length} emails)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingLogs ? (
            <div className="flex h-24 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
            </div>
          ) : emailLogs.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No emails sent to this customer.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="text-muted-foreground">Subject</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emailLogs.map((log: any) => (
                  <TableRow
                    key={log.id}
                    className="border-b border-border/40 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => { setSelectedEmail(log); setDetailOpen(true); }}
                  >
                    <TableCell className="text-foreground text-sm truncate max-w-[300px]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{log.subject}</span>
                        {log.has_attachment && (
                          <Paperclip className="size-3 shrink-0 text-muted-foreground/40" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(log.sent_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] uppercase font-bold py-0.5 px-2 rounded-full ${log.status === 'sent' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {log.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EmailDetailDialog
        email={selectedEmail ? {
          id: selectedEmail.id,
          recipient_email: selectedEmail.recipient_email,
          subject: selectedEmail.subject,
          template_used: selectedEmail.template_used ?? null,
          body_content: selectedEmail.body_content ?? null,
          has_attachment: selectedEmail.has_attachment,
          sent_at: selectedEmail.sent_at,
          status: selectedEmail.status as 'sent' | 'failed' | 'bounced',
          order_id: selectedEmail.order_id ?? null,
        } : null}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
