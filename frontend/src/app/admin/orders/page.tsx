'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ExternalLink, ChevronUp, ChevronDown, ChevronsUpDown, X, Check, RotateCcw } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import { formatCents, ORDER_STATUSES, PAYMENT_STATUSES } from '@/lib/constants';
import type { OrderStatus, PaymentStatus } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';

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

const PAGE_SIZE = 20;

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
        <div className="absolute top-full mt-1 left-0 z-50 w-56 rounded-lg border border-border bg-card shadow-lg shadow-black/30 py-1 animate-in fade-in-0 zoom-in-95">
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleItem(opt)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <span
                  className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                    isSelected
                      ? 'bg-[#DC2626] border-[#DC2626]'
                      : 'border-muted-foreground/40'
                  }`}
                >
                  {isSelected && <Check className="size-3 text-white" />}
                </span>
                <span>{renderOption(opt)}</span>
              </button>
            );
          })}
          {selected.length > 0 && (
            <div className="border-t border-border mt-1 pt-1 px-3 pb-1">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sortable Column Header ───────────────────────────────────────────────────
function SortableHeader({
  label,
  column,
  currentSort,
  currentOrder,
  onSort,
  className,
}: {
  label: string;
  column: string;
  currentSort?: string;
  currentOrder?: 'asc' | 'desc';
  onSort: (col: string, order: 'asc' | 'desc') => void;
  className?: string;
}) {
  const isActive = currentSort === column;
  const handleClick = () => {
    if (isActive && currentOrder === 'asc') {
      onSort(column, 'desc');
    } else if (isActive && currentOrder === 'desc') {
      onSort('', 'desc'); // clear sort
    } else {
      onSort(column, 'asc');
    }
  };

  return (
    <TableHead
      className={`text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors group ${className || ''}`}
      onClick={handleClick}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col">
          {isActive ? (
            currentOrder === 'asc' ? (
              <ChevronUp className="size-3.5 text-[#DC2626]" />
            ) : (
              <ChevronDown className="size-3.5 text-[#DC2626]" />
            )
          ) : (
            <ChevronsUpDown className="size-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          )}
        </span>
      </span>
    </TableHead>
  );
}

export default function AdminOrdersPage() {
  const t = useTranslations('admin.ordersPage');
  const tStatus = useTranslations('admin.orderStatus');
  const tPayment = useTranslations('admin.paymentStatus');
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { orders, total, totalPages, isLoading, error } = useOrders({
    status: statusFilter.length > 0 ? statusFilter.join(',') : undefined,
    paymentStatus: paymentFilter.length > 0 ? paymentFilter.join(',') : undefined,
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
    sortBy: sortBy || undefined,
    sortOrder,
  });

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

  const hasActiveFilters = statusFilter.length > 0 || paymentFilter.length > 0 || search;

  const resetAllFilters = () => {
    setStatusFilter([]);
    setPaymentFilter([]);
    setSearch('');
    setSearchInput('');
    setSortBy('');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t('title')}</h1>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border relative z-20">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Multi-Select */}
            <MultiSelectPopover
              label={t('allStatuses')}
              options={ORDER_STATUSES}
              selected={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              renderOption={(s) => tStatus(s as OrderStatus)}
            />

            {/* Payment Status Multi-Select */}
            <MultiSelectPopover
              label={t('allPayments')}
              options={PAYMENT_STATUSES}
              selected={paymentFilter}
              onChange={(v) => {
                setPaymentFilter(v);
                setPage(1);
              }}
              renderOption={(s) => tPayment(s as PaymentStatus)}
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
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 pr-8"
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
                className="bg-[#DC2626] text-foreground hover:bg-[#ef4444] shrink-0"
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
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
            </div>
          ) : error ? (
            <p className="p-4 text-sm text-[#DC2626]">{error}</p>
          ) : orders.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">{t('noOrders')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <SortableHeader label={t('table.orderNumber')} column="order_number" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label={t('table.date')} column="created_at" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label={t('table.customer')} column="customer_first_name" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="text-muted-foreground hidden md:table-cell">{t('table.email')}</TableHead>
                  <SortableHeader label={t('table.status')} column="status" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label={t('table.paymentStatus')} column="payment_status" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="hidden sm:table-cell" />
                  <SortableHeader label={t('table.total')} column="total_cents" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="text-muted-foreground">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-border hover:bg-muted cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-foreground">
                      {order.order_number}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-foreground">{order.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs hidden md:table-cell">
                      {order.customer_email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status] ?? ''}`}
                      >
                        {tStatus(order.status)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_COLORS[order.payment_status] ?? ''}`}
                      >
                        {tPayment(order.payment_status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">
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

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
