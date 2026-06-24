'use client';

import { useState, useEffect, useCallback, Fragment, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight, ChevronUp, ChevronsUpDown, Minus, Plus, X, RotateCcw, Check } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useInventory, type InventoryLogEntry } from '@/hooks/useInventory';
import type { Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { CATEGORIES } from '@/lib/constants';

interface InventoryProduct extends Product {
  pendingStock?: number;
  pendingReason?: string;
  logOpen?: boolean;
  log?: InventoryLogEntry[];
  logLoading?: boolean;
}

function getStockStatus(stock: number): 'inStock' | 'lowStock' | 'outOfStock' {
  if (stock === 0) return 'outOfStock';
  if (stock <= 1) return 'lowStock';
  return 'inStock';
}

const STOCK_STATUS_OPTIONS = ['inStock', 'lowStock', 'outOfStock'] as const;

const STOCK_STATUS_COLORS = {
  inStock: 'bg-green-500/10 text-foreground border border-green-500/20',
  lowStock: 'bg-yellow-500/10 text-foreground border border-yellow-500/20',
  outOfStock: 'bg-red-500/10 text-foreground border border-red-500/20',
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
        <div className="absolute top-full mt-1 left-0 z-50 w-56 rounded-lg border border-border bg-card shadow-lg shadow-black/30 py-1 animate-in fade-in-0 zoom-in-95">
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggleItem(opt)}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
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

// Sortable Header Component — matches /admin/orders
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
      onSort('', 'desc');
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

interface ProductsResponse {
  success: boolean;
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

const PAGE_SIZE = 20;

export default function AdminInventoryPage() {
  const t = useTranslations('admin.inventoryPage');
  const tTable = useTranslations('admin.inventoryPage.table');
  const tStatus = useTranslations('admin.inventoryPage.status');
  const tLog = useTranslations('admin.inventoryPage.log');
  const { updateStock, getLog } = useInventory();

  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [stockStatusFilter, setStockStatusFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const loadProducts = useCallback(() => {
    setIsLoading(true);
    adminApi
      .get<ProductsResponse>('/admin/products', {
        limit: PAGE_SIZE,
        page,
        ...(search ? { search } : {}),
        ...(sortBy ? { sortBy, sortOrder } : {}),
        ...(stockStatusFilter.length > 0 ? { stock_status: stockStatusFilter.join(',') } : {}),
        ...(categoryFilter.length > 0 ? { category: categoryFilter.join(',') } : {}),
      })
      .then((res) => {
        setProducts(
          (res.data ?? []).map((p) => ({
            ...p,
            stock: (p as unknown as { quantity?: number }).quantity ?? p.stock ?? 0,
            pendingStock: (p as unknown as { quantity?: number }).quantity ?? p.stock ?? 0,
            pendingReason: '',
            logOpen: false,
            log: [],
            logLoading: false,
          })),
        );
        setTotalPages(res.meta?.total_pages ?? 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setIsLoading(false));
  }, [search, page, sortBy, sortOrder, stockStatusFilter, categoryFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const updateProduct = (id: string, patch: Partial<InventoryProduct>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const handleSave = async (product: InventoryProduct) => {
    const newStock = product.pendingStock ?? product.stock;
    const reason = product.pendingReason?.trim() || undefined;
    setSaveErrors((prev) => { const n = { ...prev }; delete n[product.id]; return n; });
    setSavingId(product.id);
    try {
      await updateStock(product.id, newStock, reason);
      updateProduct(product.id, { stock: newStock, pendingReason: '' });
    } catch {
      // silent
    } finally {
      setSavingId(null);
    }
  };

  const toggleLog = async (product: InventoryProduct) => {
    if (!product.logOpen) {
      updateProduct(product.id, { logOpen: true, logLoading: true });
      const log = await getLog(product.id);
      updateProduct(product.id, { log, logLoading: false });
    } else {
      updateProduct(product.id, { logOpen: false });
    }
  };

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

  const hasActiveFilters = search || sortBy || stockStatusFilter.length > 0 || categoryFilter.length > 0;

  const resetAllFilters = () => {
    setSearchInput('');
    setSearch('');
    setSortBy('');
    setSortOrder('desc');
    setStockStatusFilter([]);
    setCategoryFilter([]);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header — matches orders */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t('title')}</h1>
      </div>

      {/* Filter Bar — matches orders */}
      <Card className="bg-card border-border relative z-20">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Stock Status Multi-Select */}
            <MultiSelectPopover
              label="All Stock Statuses"
              options={STOCK_STATUS_OPTIONS}
              selected={stockStatusFilter}
              onChange={(v) => {
                setStockStatusFilter(v);
                setPage(1);
              }}
              renderOption={(s) => tStatus(s as any)}
            />

            {/* Category Multi-Select */}
            <MultiSelectPopover
              label="All Categories"
              options={CATEGORIES}
              selected={categoryFilter}
              onChange={(v) => {
                setCategoryFilter(v);
                setPage(1);
              }}
              renderOption={(c) => c.charAt(0).toUpperCase() + c.slice(1)}
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

      {error && <p className="text-sm text-[#DC2626]">{error}</p>}

      {/* Table — matches orders */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
            </div>
          ) : products.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">{t('noProducts')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <SortableHeader label={tTable('product')} column="title" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="text-muted-foreground hidden md:table-cell">{tTable('sku')}</TableHead>
                  <SortableHeader label={tTable('stock')} column="stock" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="text-muted-foreground">{tTable('status')}</TableHead>
                  <TableHead className="text-muted-foreground">{tTable('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <Fragment key={product.id}>
                    <TableRow className="border-border align-top">
                      <TableCell className="text-foreground max-w-[180px]">
                        <p className="truncate">{product.title}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">
                        {product.sku}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() =>
                              updateProduct(product.id, {
                                pendingStock: Math.max(0, (product.pendingStock ?? product.stock) - 1),
                              })
                            }
                          >
                            <Minus className="size-3" />
                          </Button>
                          <Input
                            type="number"
                            min={0}
                            value={product.pendingStock ?? product.stock}
                            onChange={(e) =>
                              updateProduct(product.id, {
                                pendingStock: Math.max(0, parseInt(e.target.value) || 0),
                              })
                            }
                            className="h-10 w-14 bg-muted border-border text-foreground text-center text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() =>
                              updateProduct(product.id, {
                                pendingStock: (product.pendingStock ?? product.stock) + 1,
                              })
                            }
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STOCK_STATUS_COLORS[getStockStatus(product.stock)]}`}
                        >
                          {tStatus(getStockStatus(product.stock))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <Textarea
                            placeholder={t('changeReasonPlaceholder')}
                            value={product.pendingReason ?? ''}
                            onChange={(e) =>
                              updateProduct(product.id, { pendingReason: e.target.value })
                            }
                            className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 text-xs resize-none min-h-[52px] w-44"
                          />
                          {saveErrors[product.id] && (
                            <p className="text-xs text-[#DC2626]">{saveErrors[product.id]}</p>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="xs"
                              onClick={() => handleSave(product)}
                              disabled={savingId === product.id}
                              className="bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50"
                            >
                              {savingId === product.id ? t('saving') : t('saveStock')}
                            </Button>
                            <Button
                              size="xs"
                              variant="ghost"
                              onClick={() => toggleLog(product)}
                              className="text-muted-foreground hover:text-foreground gap-1"
                            >
                              {product.logOpen ? (
                                <ChevronDown className="size-3" />
                              ) : (
                                <ChevronRight className="size-3" />
                              )}
                              {tLog('title')}
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Log rows */}
                    {product.logOpen && (
                      <TableRow key={`${product.id}-log`} className="border-border bg-muted/50">
                        <TableCell colSpan={5} className="py-3">
                          {product.logLoading ? (
                            <p className="text-xs text-muted-foreground">{t('saving')}...</p>
                          ) : !product.log || product.log.length === 0 ? (
                            <p className="text-xs text-muted-foreground">{tLog('noEntries')}</p>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground mb-2">{tLog('title')}</p>
                              {product.log.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="flex items-center gap-3 text-xs text-muted-foreground border-b border-border pb-1"
                                >
                                  <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                                  <span className="text-foreground">
                                    {entry.previous_stock} → {entry.new_stock}
                                  </span>
                                  <span className="flex-1">{entry.reason}</span>
                                  <span>{entry.created_by}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination — matches orders */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
