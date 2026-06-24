'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, X, Check, RotateCcw } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { formatCents, CATEGORIES } from '@/lib/constants';
import type { Product } from '@/hooks/useProducts';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const PRODUCT_STATUSES = ['active', 'draft', 'archived'] as const;

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-foreground border border-green-500/20',
  draft: 'bg-yellow-500/10 text-foreground border border-yellow-500/20',
  archived: 'bg-[#262626] text-foreground border border-border',
};

const CATEGORY_COLORS: Record<string, string> = {
  engine: 'bg-orange-500/10 text-foreground border border-orange-500/20',
  transmission: 'bg-blue-500/10 text-foreground border border-blue-500/20',
  part: 'bg-purple-500/10 text-foreground border border-purple-500/20',
};

const CATEGORY_NAMES: Record<string, string> = {
  engine: 'Engine',
  transmission: 'Transmission',
  part: 'Part',
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

export default function AdminProductsPage() {
  const t = useTranslations('admin.productsPage');
  const tForm = useTranslations('admin.productForm');
  const router = useRouter();

  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteTitle, setDeleteTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const params: Record<string, unknown> = {
      page,
      limit: PAGE_SIZE,
      ...(categoryFilter.length > 0 && { category: categoryFilter.join(',') }),
      ...(statusFilter.length > 0 && { status: statusFilter.join(',') }),
      ...(search && { search }),
      ...(sortBy && { sortBy, sortOrder }),
    };

    adminApi
      .get<ProductsResponse>('/admin/products', params)
      .then((res) => {
        if (!cancelled) {
          setProducts(res.data ?? []);
          setTotalPages(res.meta?.total_pages ?? 0);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [trigger, page, categoryFilter, statusFilter, search, sortBy, sortOrder]);

  const refetch = useCallback(() => setTrigger((n) => n + 1), []);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setSearch('');
    setPage(1);
    sessionStorage.removeItem('admin_product_search');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
    if (searchInput) {
      const now = Date.now();
      sessionStorage.setItem('admin_product_search', JSON.stringify({ query: searchInput, timestamp: now }));
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        clearSearch();
      }, 30000);
    } else {
      clearSearch();
    }
  }, [searchInput, clearSearch]);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_product_search');
    if (stored) {
      try {
        const { query, timestamp } = JSON.parse(stored);
        const elapsed = Date.now() - timestamp;
        if (elapsed < 30000) {
          setSearchInput(query);
          setSearch(query);
          const remaining = 30000 - elapsed;
          if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = setTimeout(() => {
            clearSearch();
          }, remaining);
        } else {
          sessionStorage.removeItem('admin_product_search');
        }
      } catch (e) {
        sessionStorage.removeItem('admin_product_search');
      }
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [clearSearch]);

  const handleSort = (col: string, order: 'asc' | 'desc') => {
    setSortBy(col);
    setSortOrder(order);
    setPage(1);
  };

  const hasActiveFilters = categoryFilter.length > 0 || statusFilter.length > 0 || search || sortBy;

  const resetAllFilters = () => {
    setCategoryFilter([]);
    setStatusFilter([]);
    clearSearch();
    setSortBy('');
    setSortOrder('desc');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await adminApi.delete(`/admin/products/${deleteId}`);
      refetch();
    } catch {
      // silent
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const selectClass =
    'h-8 rounded-lg border border-border bg-muted px-2 text-sm text-foreground focus:border-[#DC2626] focus:outline-none';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t('title')}</h1>
        <Button
          onClick={() => router.push('/admin/products/new')}
          className="bg-[#DC2626] text-foreground hover:bg-[#ef4444] gap-1.5"
          size="sm"
        >
          <Plus className="size-4" />
          {t('newProduct')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 relative z-10">
        <MultiSelectPopover
          label={t('allCategories')}
          options={CATEGORIES}
          selected={categoryFilter}
          onChange={(v) => {
            setCategoryFilter(v);
            setPage(1);
          }}
          renderOption={(c) => c.charAt(0).toUpperCase() + c.slice(1)}
        />

        <MultiSelectPopover
          label={t('allStatuses')}
          options={PRODUCT_STATUSES}
          selected={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          renderOption={(s) => tForm(s)}
        />

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

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
          </div>
        ) : error ? (
          <p className="p-4 text-sm text-[#DC2626]">{error}</p>
        ) : !products || products.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t('noProducts')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground w-12">{t('table.image')}</TableHead>
                <SortableHeader label={t('table.title')} column="title" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label={t('table.sku')} column="sku" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label={t('table.category')} column="category" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="hidden lg:table-cell" />
                <SortableHeader label={t('table.price')} column="price" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <SortableHeader label={t('table.stock')} column="stock" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="hidden sm:table-cell" />
                <SortableHeader label={t('table.status')} column="status" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                <TableHead className="text-muted-foreground">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="border-border hover:bg-muted">
                  <TableCell>
                    {product.images?.[0] ? (
                      <div className="size-10 overflow-hidden rounded bg-muted">
                        <img src={`/api${product.images[0].thumb_path || product.images[0].medium_path || product.images[0].image_path}`} alt={product.title} className="size-full object-cover" />
                      </div>
                    ) : (
                      <div className="size-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="text-foreground max-w-[160px] truncate">{product.title}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground hidden md:table-cell">{product.sku}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[product.category] ?? 'bg-muted border border-border text-muted-foreground'}`}>
                      {CATEGORY_NAMES[product.category] ?? product.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-foreground">{formatCents(product.price_cents)}</TableCell>
                  <TableCell className="text-foreground hidden sm:table-cell">{(product as unknown as { quantity?: number }).quantity ?? product.stock ?? 0}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[product.status] ?? ''}`}>
                      {tForm(product.status as 'active' | 'draft' | 'archived')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-[#DC2626]"
                        onClick={() => { setDeleteId(product.id); setDeleteTitle(product.title); }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('deleteTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('deleteConfirm')} <span className="text-foreground">"{deleteTitle}"</span>
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)} className="border-border text-muted-foreground hover:text-foreground hover:bg-muted">
              Cancel
            </Button>
            <Button size="sm" onClick={handleDelete} disabled={isDeleting} className="bg-[#DC2626] text-foreground hover:bg-[#ef4444]">
              {isDeleting ? '...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
