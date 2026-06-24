'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, ExternalLink, Calendar, TrendingUp } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatCents } from '@/lib/constants';
import { DashboardStats, type DashboardStatsData } from '@/components/admin/DashboardStats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Order } from '@/hooks/useOrders';

interface DailyTrend {
  date: string;
  revenue: number;
  order_count: number;
}

interface CategoryRevenue {
  category: string;
  revenue: number;
  order_count: number;
}

interface BackendStatsData {
  total_orders: number;
  total_revenue_cents: number;
  monthly_orders: number;
  monthly_revenue_cents: number;
  daily_orders: number;
  daily_revenue_cents: number;
  orders_by_status: Array<{ status: string; count: number }>;
  active_products: number;
  low_stock_count: number;
  daily_trend: DailyTrend[];
  category_revenue: CategoryRevenue[];
}

interface DashboardResponse {
  success: boolean;
  data: BackendStatsData;
}

interface RecentOrdersResponse {
  success: boolean;
  data: Order[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface DashboardData {
  stats: DashboardStatsData;
  recentOrders: Order[];
  dailyTrend: DailyTrend[];
  categoryRevenue: CategoryRevenue[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-foreground border-yellow-500/20',
  confirmed: 'bg-blue-500/10 text-foreground border-blue-500/20',
  processing: 'bg-purple-500/10 text-foreground border-purple-500/20',
  shipped: 'bg-cyan-500/10 text-foreground border-cyan-500/20',
  delivered: 'bg-green-500/10 text-foreground border-green-500/20',
  cancelled: 'bg-red-500/10 text-foreground border-red-500/20',
};

// ── Curated Interactive SVG Area Trend Chart ────────────────────────────────
function RevenueTrendChart({ data }: { data: DailyTrend[] }) {
  const tCharts = useTranslations('admin.charts');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-muted-foreground text-sm">
        {tCharts('noData')}
      </div>
    );
  }

  // Pre-process
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 100000); // minimum scale $1000 in cents

  const width = 600;
  const height = 240;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / maxRevenue) * chartHeight;
  };

  // Generate paths
  let pathD = '';
  let areaD = '';

  if (data.length > 0) {
    const points = data.map((d, i) => ({ x: getX(i), y: getY(d.revenue) }));
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
    areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  const gridRatios = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#DC2626" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {gridRatios.map((ratio, i) => {
          const y = paddingTop + chartHeight * ratio;
          const val = maxRevenue * (1 - ratio);
          return (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 8}
                y={y + 4}
                className="text-[9px] font-mono fill-muted-foreground"
                textAnchor="end"
              >
                {formatCents(val).split('.')[0]}
              </text>
            </g>
          );
        })}

        {/* X axis labels */}
        {data.map((d, i) => {
          if (i % 6 !== 0 && i !== data.length - 1) return null;
          const dateObj = new Date(d.date);
          const label = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          return (
            <text
              key={i}
              x={getX(i)}
              y={height - paddingBottom + 18}
              className="text-[9px] font-mono fill-muted-foreground"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Line curve */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Vertical pointer line */}
        {hoveredIdx !== null && (
          <line
            x1={getX(hoveredIdx)}
            y1={paddingTop}
            x2={getX(hoveredIdx)}
            y2={paddingTop + chartHeight}
            stroke="#DC2626"
            strokeWidth="1.5"
            className="opacity-45 pointer-events-none"
            strokeDasharray="2 2"
          />
        )}

        {/* Hover data dots */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(d.revenue)}
            r={hoveredIdx === i ? 5.5 : 2}
            className={`transition-all duration-150 cursor-pointer ${hoveredIdx === i
              ? 'fill-[#DC2626] stroke-white stroke-2'
              : 'fill-[#DC2626] opacity-60'
              }`}
          />
        ))}

        {/* Invisible columns for mouse triggers */}
        {data.map((d, i) => {
          const colWidth = chartWidth / (data.length - 1 || 1);
          const x = getX(i) - colWidth / 2;
          return (
            <rect
              key={i}
              x={x}
              y={paddingTop}
              width={colWidth}
              height={chartHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}
      </svg>

      {/* Interactive Tooltip Overlay */}
      {hoveredIdx !== null && (
        <div
          className="absolute z-50 p-2.5 rounded-lg border border-border bg-card/95 shadow-xl backdrop-blur-md pointer-events-none transition-all duration-75 text-xs text-foreground space-y-1"
          style={{
            left: `${(getX(hoveredIdx) / width) * 100}%`,
            top: `${(getY(data[hoveredIdx].revenue) / height) * 100 - 24}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="font-semibold text-muted-foreground text-[10px]">
            {new Date(data[hoveredIdx].date).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="size-2 rounded-full bg-[#DC2626]" />
            Revenue: <span className="font-mono text-foreground">{formatCents(data[hoveredIdx].revenue)}</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            Orders: <span className="font-mono text-foreground">{data[hoveredIdx].order_count}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Premium Category Split Horizontal Bar Chart ──────────────────────────────
function CategoryRevenueChart({ data }: { data: CategoryRevenue[] }) {
  const tCharts = useTranslations('admin.charts');

  if (!data || data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-muted-foreground text-sm">
        {tCharts('noData')}
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    engine: 'JDM Engines',
    transmission: 'JDM Transmissions',
    part: 'JDM Parts & Acc.',
  };

  const categoryGradients: Record<string, string> = {
    engine: 'from-red-600 to-red-400 shadow-red-500/25',
    transmission: 'from-purple-600 to-indigo-400 shadow-purple-500/25',
    part: 'from-cyan-600 to-blue-400 shadow-cyan-500/25',
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="space-y-5">
      {data.map((item) => {
        const pct = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
        const prettyLabel = categoryLabels[item.category] || item.category;
        const barGradient = categoryGradients[item.category] || 'from-[#DC2626] to-[#ef4444] shadow-red-500/25';

        return (
          <div key={item.category} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">{prettyLabel}</span>
              <span className="font-mono text-muted-foreground">
                {formatCents(item.revenue)} <span className="text-[10px] text-muted-foreground/50 ml-1">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            {/* Horizontal Bar */}
            <div className="relative h-3 w-full bg-muted/65 rounded-full overflow-hidden border border-border/10">
              <div
                className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r shadow-md transition-all duration-500 ease-out ${barGradient}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>{item.order_count} {item.order_count === 1 ? 'order' : 'orders'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations('admin');
  const tDash = useTranslations('admin.dashboardPage');
  const tOrders = useTranslations('admin.ordersPage');
  const tStatus = useTranslations('admin.orderStatus');
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    adminApi
      .get<DashboardResponse>('/admin/dashboard/stats')
      .then(async (statsRes) => {
        if (cancelled) return;
        const raw = statsRes.data;
        const mappedStats: DashboardStatsData = {
          totalOrders: raw?.total_orders ?? 0,
          totalRevenue: raw?.total_revenue_cents ?? 0,
          activeProducts: raw?.active_products ?? 0,
          lowStockCount: raw?.low_stock_count ?? 0,
        };

        // Fetch recent orders separately
        try {
          const ordersRes = await adminApi.get<RecentOrdersResponse>('/admin/orders', { limit: 5 });
          if (!cancelled) {
            setData({
              stats: mappedStats,
              recentOrders: ordersRes.data ?? [],
              dailyTrend: raw?.daily_trend ?? [],
              categoryRevenue: raw?.category_revenue ?? [],
            });
          }
        } catch {
          if (!cancelled) {
            setData({
              stats: mappedStats,
              recentOrders: [],
              dailyTrend: raw?.daily_trend ?? [],
              categoryRevenue: raw?.category_revenue ?? [],
            });
          }
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {error ?? t('errors.generic')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{tDash('title')}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Overview of business performance and metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push('/admin/products/new')}
            className="bg-[#DC2626] text-white hover:bg-[#ef4444] gap-1.5"
            size="sm"
          >
            <Plus className="size-4" />
            {t('addProduct')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin/orders')}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {tDash('viewAllOrders')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={data.stats} />

      {/* Interactive Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Daily Sales Trend SVG Chart */}
        <Card className="md:col-span-2 border border-border bg-card/60 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="size-4 text-[#DC2626]" />
                30-Day Sales Trend
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Daily revenue grouped by date (paid orders only).</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono px-2 py-0.5">
              LAST 30 DAYS
            </Badge>
          </CardHeader>
          <CardContent className="pb-3 pl-2 pr-6">
            <RevenueTrendChart data={data.dailyTrend} />
          </CardContent>
        </Card>

        {/* Category Split Chart */}
        <Card className="border border-border bg-card/60 backdrop-blur-md">
          <CardHeader className="space-y-0.5 pb-4">
            <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="size-4 text-[#DC2626]" />
              Revenue by Category
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Lifetime distribution by main categories.</p>
          </CardHeader>
          <CardContent>
            <CategoryRevenueChart data={data.categoryRevenue} />
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card className="bg-card border-border">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground">{tDash('recentOrders')}</CardTitle>
            <Link
              href="/admin/orders"
              className="text-xs text-[#DC2626] hover:text-[#ef4444] flex items-center gap-1 font-semibold"
            >
              {tDash('viewAllOrders')}
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentOrders.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{tDash('noRecentOrders')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">{tOrders('table.orderNumber')}</TableHead>
                  <TableHead className="text-muted-foreground">{tOrders('table.customer')}</TableHead>
                  <TableHead className="text-muted-foreground">{tOrders('table.status')}</TableHead>
                  <TableHead className="text-muted-foreground">{tOrders('table.total')}</TableHead>
                  <TableHead className="text-muted-foreground">{tOrders('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-border hover:bg-muted cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-foreground font-semibold">
                      {order.order_number}
                    </TableCell>
                    <TableCell className="text-foreground">{order.customer_name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase ${STATUS_COLORS[order.status] ?? ''}`}
                      >
                        {tStatus(order.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground font-mono">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
