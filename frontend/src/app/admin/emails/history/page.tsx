'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, X, Search, RotateCcw, Mail, Paperclip } from 'lucide-react';
import { adminApi } from '@/lib/api';
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
import EmailDetailDialog from '@/components/admin/EmailDetailDialog';

interface SentEmail {
  id: string;
  recipient_email: string;
  subject: string;
  template_used: string | null;
  body_content: string | null;
  has_attachment?: boolean;
  sent_at: string;
  status: 'sent' | 'failed' | 'bounced';
  order_id: string | null;
}

interface PaginatedResponse {
  success: boolean;
  data: SentEmail[];
}

const PAGE_SIZE = 50;

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-green-500/10 text-foreground border border-green-500/20',
  failed: 'bg-red-500/10 text-foreground border border-red-500/20',
  bounced: 'bg-yellow-500/10 text-foreground border border-yellow-500/20',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export default function EmailHistoryPage() {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmail, setSelectedEmail] = useState<SentEmail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState<string>('sent_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const fetchEmails = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      params.set('limit', String(PAGE_SIZE));
      if (search) params.set('search', search);
      if (statusFilter.length > 0) params.set('status', statusFilter.join(','));
      if (sortBy) params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const res = await adminApi.get<PaginatedResponse & { meta?: { total: number; total_pages: number } }>(
        `/admin/email/log?${params.toString()}`
      );
      setEmails(res.data ?? []);
      setTotal(res.meta?.total ?? res.data?.length ?? 0);
      setTotalPages(res.meta?.total_pages ?? 1);
    } catch {
      setEmails([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchEmails(page);
  }, [page, fetchEmails]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

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

  const openDetail = (email: SentEmail) => {
    setSelectedEmail(email);
    setDetailOpen(true);
  };

  const hasActiveFilters = statusFilter.length > 0 || search;

  const resetAllFilters = () => {
    setStatusFilter([]);
    setSearch('');
    setSearchInput('');
    setSortBy('sent_at');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Email History</h1>
          <p className="text-sm text-muted-foreground">View all sent and failed emails.</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border relative z-20">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex flex-1 items-center gap-2 min-w-[200px]">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search by email or subject..."
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
                <Search className="size-3.5 mr-1" />
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
          {loading && emails.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
            </div>
          ) : emails.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No emails found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <SortableHeader label="Recipient" column="recipient_email" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="text-muted-foreground">Subject</TableHead>
                  <SortableHeader label="Status" column="status" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Date" column="sent_at" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map((email) => (
                  <TableRow
                    key={email.id}
                    className="border-border hover:bg-muted cursor-pointer"
                    onClick={() => openDetail(email)}
                  >
                    <TableCell className="text-foreground truncate max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <Mail className="size-3.5 shrink-0 text-muted-foreground/60" />
                        <span className="truncate">{email.recipient_email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[300px]">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{email.subject}</span>
                        {email.has_attachment && (
                          <Paperclip className="size-3 shrink-0 text-muted-foreground/40" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[email.status] ?? ''}`}
                      >
                        {email.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatDate(email.sent_at)}
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

      <EmailDetailDialog
        email={selectedEmail}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRetry={() => { fetchEmails(1); setPage(1); }}
      />
    </div>
  );
}
