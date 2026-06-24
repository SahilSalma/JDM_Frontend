'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  X,
  Search,
  RotateCcw,
  ExternalLink,
  Check,
  Users,
  Mail,
  Trash2,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatCents } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPhoneDisplay } from '@/lib/phone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

const LTV_TIERS = ['high', 'medium', 'low'] as const;
const ORDER_VOLUMES = ['frequent', 'repeat', 'onetime'] as const;
const RECENCY_STATUSES = ['active', 'slipping', 'inactive'] as const;

const LTV_TIER_LABELS: Record<string, string> = {
  high: 'VIP / High (≥ $1k)',
  medium: 'Medium LTV ($200-$1k)',
  low: 'Low LTV (< $200)',
};

const ORDER_VOLUME_LABELS: Record<string, string> = {
  frequent: 'Frequent (≥ 5)',
  repeat: 'Repeat (2-4)',
  onetime: 'One-time (1)',
};

const RECENCY_LABELS: Record<string, string> = {
  active: 'Active (< 30d)',
  slipping: 'Slipping (30-90d)',
  inactive: 'Inactive (> 90d)',
};

// ── Multi-Select Popover Component ───────────────────────────────────────────
function MultiSelectPopover({
  label,
  options,
  selected,
  onChange,
  renderOption,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (v: string[]) => void;
  renderOption: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleItem = (item: string) => {
    onChange(
      selected.includes(item)
        ? selected.filter((s) => s !== item)
        : [...selected, item],
    );
  };

  const displayTitle =
    selected.length === 0
      ? label
      : `${label.split(' ')[0]}: ${selected.map(renderOption).join(', ')}`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-8 rounded-lg border border-border bg-muted px-3 text-sm text-foreground hover:bg-muted/80 transition-colors min-w-[140px] max-w-[280px]"
      >
        <span className="truncate">{displayTitle}</span>
        <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 mt-1 z-50 w-56 rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleItem(opt)}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors text-left"
              >
                <span>{renderOption(opt)}</span>
                {isSelected && <Check className="size-3.5 text-[#DC2626]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sortable Table Header ──
function SortableHeader({
  label,
  column,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  column: string;
  currentSort: string;
  currentOrder: 'asc' | 'desc';
  onSort: (col: string, order: 'asc' | 'desc') => void;
}) {
  const isSorted = currentSort === column;

  const handleClick = () => {
    if (isSorted) {
      onSort(column, currentOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(column, 'desc');
    }
  };

  return (
    <TableHead
      onClick={handleClick}
      className="cursor-pointer select-none text-muted-foreground hover:text-foreground transition-colors py-3"
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isSorted ? (
          currentOrder === 'asc' ? (
            <ChevronUp className="size-3 shrink-0" />
          ) : (
            <ChevronDown className="size-3 shrink-0" />
          )
        ) : (
          <ChevronsUpDown className="size-3 shrink-0 opacity-40" />
        )}
      </div>
    </TableHead>
  );
}

interface CustomerRow {
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  order_count: number;
  lifetime_value: number;
  last_order_date: string;
}

interface CustomersResponse {
  success: boolean;
  data: CustomerRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface Subscriber {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  source: string;
  subscribed_at: string;
  is_active: boolean;
}

interface SubscribersResponse {
  success: boolean;
  data: Subscriber[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export default function AdminCustomersPage() {
  const t = useTranslations('admin.customersPage');
  const router = useRouter();

  // Tab 1: Customers State
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('last_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Filters State
  const [ltvTierFilter, setLtvTierFilter] = useState<string[]>([]);
  const [orderVolumeFilter, setOrderVolumeFilter] = useState<string[]>([]);
  const [recencyFilter, setRecencyFilter] = useState<string[]>([]);

  // Tab 2: Subscribers State
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subPage, setSubPage] = useState(1);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // Load registered customers
  const loadCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 20,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (ltvTierFilter.length > 0) params.ltvTier = ltvTierFilter.join(',');
      if (orderVolumeFilter.length > 0) params.orderVolume = orderVolumeFilter.join(',');
      if (recencyFilter.length > 0) params.recency = recencyFilter.join(',');

      const res = await adminApi.get<CustomersResponse>('/admin/customers', { params });
      setCustomers(res.data ?? []);
      setTotalPages(res.meta?.total_pages ?? 1);
    } catch {
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, page, sortBy, sortOrder, ltvTierFilter, orderVolumeFilter, recencyFilter]);

  // Load subscribers
  const loadSubscribers = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await adminApi.get<SubscribersResponse>('/admin/subscriptions', {
        params: {
          page: subPage,
          limit: 20,
        },
      });
      setSubscribers(res.data ?? []);
      setSubTotalPages(res.meta?.total_pages ?? 1);
    } catch {
      setSubscribers([]);
    } finally {
      setLoadingSubs(false);
    }
  }, [subPage]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const handleSort = (col: string, order: 'asc' | 'desc') => {
    setSortBy(col);
    setSortOrder(order);
    setPage(1);
  };

  const hasActiveFilters =
    search ||
    sortBy !== 'last_order' ||
    sortOrder !== 'desc' ||
    ltvTierFilter.length > 0 ||
    orderVolumeFilter.length > 0 ||
    recencyFilter.length > 0;

  const resetAllFilters = () => {
    setSearchInput('');
    setSearch('');
    setSortBy('last_order');
    setSortOrder('desc');
    setLtvTierFilter([]);
    setOrderVolumeFilter([]);
    setRecencyFilter([]);
    setPage(1);
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Are you sure you want to remove this subscriber?')) return;
    try {
      await adminApi.delete(`/admin/subscriptions/${id}`);
      toast.success('Subscriber deleted successfully');
      loadSubscribers();
    } catch {
      toast.error('Failed to delete subscriber');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
        Customers & Subscribers
      </h1>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="bg-muted border border-border p-1 mb-6 rounded-lg w-full max-w-sm grid grid-cols-2 group-data-horizontal/tabs:h-10">
          <TabsTrigger value="customers" className="gap-2">
            <Users className="size-4" />
            Customers Base
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2">
            <Mail className="size-4" />
            Newsletter List
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Customer Base */}
        <TabsContent value="customers" className="space-y-4">
          {/* Filters card */}
          <Card className="bg-card border-border relative z-20 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* LTV Tier Popover */}
                <MultiSelectPopover
                  label="All LTV Tiers"
                  options={LTV_TIERS}
                  selected={ltvTierFilter}
                  onChange={(v) => {
                    setLtvTierFilter(v);
                    setPage(1);
                  }}
                  renderOption={(t) => LTV_TIER_LABELS[t] ?? t}
                />

                {/* Order Volume Popover */}
                <MultiSelectPopover
                  label="All Order Volumes"
                  options={ORDER_VOLUMES}
                  selected={orderVolumeFilter}
                  onChange={(v) => {
                    setOrderVolumeFilter(v);
                    setPage(1);
                  }}
                  renderOption={(v) => ORDER_VOLUME_LABELS[v] ?? v}
                />

                {/* Recency Popover */}
                <MultiSelectPopover
                  label="All Recencies"
                  options={RECENCY_STATUSES}
                  selected={recencyFilter}
                  onChange={(v) => {
                    setRecencyFilter(v);
                    setPage(1);
                  }}
                  renderOption={(r) => RECENCY_LABELS[r] ?? r}
                />

                {/* Search */}
                <div className="flex flex-1 items-center gap-2 min-w-[200px]">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder={t('searchPlaceholder')}
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 pr-8 h-8 text-sm"
                    />
                    {searchInput && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSearch}
                    className="bg-[#DC2626] text-white hover:bg-[#ef4444] shrink-0 h-8"
                  >
                    Search
                  </Button>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetAllFilters}
                    className="text-muted-foreground hover:text-foreground gap-1.5 h-8"
                  >
                    <RotateCcw className="size-3.5" />
                    Reset
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Table Card */}
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
                </div>
              ) : customers.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">{t('noCustomers')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <SortableHeader label={t('table.name')} column="name" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label={t('table.email')} column="email" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                      <TableHead className="text-muted-foreground hidden md:table-cell">Phone</TableHead>
                      <SortableHeader label={t('table.orders')} column="orders" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label={t('table.ltv')} column="ltv" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                      <SortableHeader label={t('table.lastOrder')} column="last_order" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                      <TableHead className="text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((c) => (
                      <TableRow
                        key={c.customer_email}
                        onClick={() => router.push(`/admin/customers/${encodeURIComponent(c.customer_email)}`)}
                        className="border-border hover:bg-muted cursor-pointer"
                      >
                        <TableCell className="text-foreground font-semibold text-xs py-3.5">
                          {c.customer_first_name} {c.customer_last_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs py-3.5 font-mono">{c.customer_email}</TableCell>
                        <TableCell className="text-muted-foreground text-xs hidden md:table-cell font-mono py-3.5">
                          {formatPhoneDisplay(c.customer_phone)}
                        </TableCell>
                        <TableCell className="text-foreground font-mono py-3.5">{c.order_count}</TableCell>
                        <TableCell className="text-foreground font-mono font-bold py-3.5">
                          {formatCents(c.lifetime_value)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs py-3.5">
                          {new Date(c.last_order_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/customers/${encodeURIComponent(c.customer_email)}`);
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

          {/* Pagination */}
          {!isLoading && customers.length > 0 && (
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </TabsContent>

        {/* Tab 2: Newsletter Subscribers List */}
        <TabsContent value="subscribers" className="space-y-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold text-foreground">Newsletter Subscribers</CardTitle>
              <CardDescription className="text-xs">
                Audience members who subscribed to marketing updates via footer forms or checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSubs ? (
                <div className="flex h-48 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
                </div>
              ) : subscribers.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No subscribers found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground">Email Address</TableHead>
                      <TableHead className="text-muted-foreground">Captured Source</TableHead>
                      <TableHead className="text-muted-foreground">Subscribed Date</TableHead>
                      <TableHead className="text-muted-foreground text-center">Status</TableHead>
                      <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((sub) => (
                      <TableRow key={sub.id} className="border-border">
                        <TableCell className="text-foreground font-semibold text-xs py-3.5 font-mono">
                          {sub.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs py-3.5 capitalize">
                          {sub.source || 'Footer'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs py-3.5">
                          {new Date(sub.subscribed_at).toLocaleDateString()} at {new Date(sub.subscribed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-center py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              sub.is_active
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}
                          >
                            {sub.is_active ? 'Active' : 'Unsubscribed'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-3.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubscriber(sub.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-[#DC2626] hover:bg-muted"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Subscribers Pagination */}
          {!loadingSubs && subscribers.length > 0 && (
            <Pagination currentPage={subPage} totalPages={subTotalPages} onPageChange={setSubPage} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
