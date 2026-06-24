'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ExternalLink,
  Trash2,
  Star,
  Search,
  X,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
  MessageSquare,
  Check,
  XCircle,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { useAdminReviews } from '@/hooks/useReviews';
import type { Review } from '@/hooks/useReviews';
import { StarRating } from '@/components/product/StarRating';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-500/10 text-foreground border border-green-500/20',
  pending: 'bg-yellow-500/10 text-foreground border border-yellow-500/20',
  rejected: 'bg-red-500/10 text-foreground border border-red-500/20',
};

const PAGE_SIZE = 20;

function SortableHeader({
  label,
  column,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string;
  column: string;
  currentSort?: string;
  currentOrder?: 'asc' | 'desc';
  onSort: (col: string, order: 'asc' | 'desc') => void;
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
      className="text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors group"
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

export default function AdminReviewsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    status: statusFilter || undefined,
    search: search || undefined,
    sortBy,
    sortOrder,
  }), [statusFilter, search, sortBy, sortOrder]);

  const { reviews, meta, isLoading, error, refetch } = useAdminReviews(
    filters,
    page,
    PAGE_SIZE,
  );

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

  const handleStatusChange = async (reviewId: string, status: string) => {
    setUpdatingStatusId(reviewId);
    try {
      await adminApi.patch(`/admin/reviews/${reviewId}`, { status });
      toast.success(`Review ${status}`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!confirm(`Delete review by ${review.customer_name}?`)) return;
    setDeletingId(review.id);
    try {
      await adminApi.delete(`/admin/reviews/${review.id}`);
      toast.success('Review deleted');
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete review');
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveFilters = statusFilter || search;

  const resetFilters = () => {
    setStatusFilter('');
    setSearch('');
    setSearchInput('');
    setSortBy('created_at');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="size-6 text-[#DC2626]" />
          Reviews
          {meta.total > 0 && (
            <span className="text-base font-normal text-muted-foreground">({meta.total})</span>
          )}
        </h1>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={(v) => { if (v !== null) { setStatusFilter(v); setPage(1); } }}>
              <SelectTrigger className="h-9 w-[160px] bg-muted border-border text-sm">
                <span>{statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : 'All statuses'}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-1 items-center gap-2 min-w-[200px]">
              <div className="relative flex-1">
                <Input
                  placeholder="Search customer or product..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 pr-8"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <Button size="sm" onClick={handleSearch} className="bg-[#DC2626] text-foreground hover:bg-[#ef4444] shrink-0">
                <Search className="size-3.5 mr-1" />
                Search
              </Button>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground gap-1.5">
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
              <Loader2 className="size-6 animate-spin text-[#DC2626]" />
            </div>
          ) : error ? (
            <p className="p-4 text-sm text-[#DC2626]">{error}</p>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <MessageSquare className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No reviews found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <SortableHeader label="Customer" column="customer_name" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="text-muted-foreground">Product</TableHead>
                  <SortableHeader label="Rating" column="rating" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="text-muted-foreground hidden md:table-cell">Review</TableHead>
                  <SortableHeader label="Date" column="created_at" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id} className="border-border hover:bg-muted">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{review.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{review.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {review.product ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/products/${review.product_id}/edit`)}
                          className="text-xs text-[#DC2626] hover:underline text-left"
                        >
                          {review.product.title}
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Deleted product</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StarRating rating={review.rating} size="sm" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[250px]">
                      <p className="truncate text-xs text-muted-foreground">
                        {review.title && <span className="font-medium text-foreground">{review.title} — </span>}
                        {review.content}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={review.status}
                        onValueChange={(v) => v && handleStatusChange(review.id, v)}
                        disabled={updatingStatusId === review.id}
                      >
                        <SelectTrigger className={`h-7 w-[110px] text-xs font-medium capitalize ${STATUS_COLORS[review.status] || ''}`}>
                          <span>{review.status}</span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved" className="text-xs">
                            <span className="flex items-center gap-1.5"><Check className="size-3" /> Approved</span>
                          </SelectItem>
                          <SelectItem value="pending" className="text-xs">
                            <span className="flex items-center gap-1.5"><Loader2 className="size-3" /> Pending</span>
                          </SelectItem>
                          <SelectItem value="rejected" className="text-xs">
                            <span className="flex items-center gap-1.5"><XCircle className="size-3" /> Rejected</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {review.order && (
                          <button
                            type="button"
                            onClick={() => router.push(`/admin/orders/${review.order_id}`)}
                            className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="View Order"
                          >
                            <ExternalLink className="size-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(review)}
                          disabled={deletingId === review.id}
                          className="rounded p-1 text-muted-foreground hover:text-[#DC2626] transition-colors disabled:opacity-50"
                          title="Delete Review"
                        >
                          {deletingId === review.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <Pagination
        currentPage={meta.page}
        totalPages={meta.total_pages}
        onPageChange={setPage}
      />
    </div>
  );
}
