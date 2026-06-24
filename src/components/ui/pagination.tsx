'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Callback mode (admin pages with client state) */
  onPageChange?: (page: number) => void;
  /** Link mode (store pages with URL params) */
  buildHref?: (page: number) => string;
  className?: string;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('...');

  pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  buildHref,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  const renderButton = (page: number, children: React.ReactNode, disabled: boolean, ariaLabel?: string) => {
    if (buildHref && !disabled) {
      return (
        <Link
          href={buildHref(page)}
          aria-label={ariaLabel}
          className={cn(
            'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-2 text-sm font-medium transition-colors',
            'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {children}
        </Link>
      );
    }

    return (
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={() => onPageChange?.(page)}
        className="h-9 min-w-9 border-border text-muted-foreground hover:text-foreground"
      >
        {children}
      </Button>
    );
  };

  return (
    <nav aria-label="Pagination" className={cn('flex items-center justify-center gap-1', className)}>
      {/* Previous */}
      {renderButton(currentPage - 1, <ChevronLeft className="size-4" />, currentPage <= 1, 'Previous page')}

      {/* Page numbers */}
      {pages.map((page, idx) => {
        if (page === '...') {
          return (
            <span key={`ellipsis-${idx}`} className="flex h-9 min-w-9 items-center justify-center text-sm text-muted-foreground">
              ...
            </span>
          );
        }

        const isActive = page === currentPage;

        if (buildHref && !isActive) {
          return (
            <Link
              key={page}
              href={buildHref(page)}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {page}
            </Link>
          );
        }

        return (
          <Button
            key={page}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            disabled={isActive}
            onClick={() => onPageChange?.(page)}
            className={cn(
              'h-9 min-w-9',
              isActive
                ? 'bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-100'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {page}
          </Button>
        );
      })}

      {/* Next */}
      {renderButton(currentPage + 1, <ChevronRight className="size-4" />, currentPage >= totalPages, 'Next page')}
    </nav>
  );
}

interface PaginationStatusProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  className?: string;
}

/** Always-visible status banner — shows "Showing X–Y of Z results". */
export function PaginationStatus({
  currentPage,
  pageSize,
  totalItems,
  className,
}: PaginationStatusProps) {
  if (totalItems <= 0) return null;
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  return (
    <p className={cn('text-center text-sm text-muted-foreground', className)}>
      Showing <span className="font-semibold text-foreground">{start}</span>–
      <span className="font-semibold text-foreground">{end}</span> of{' '}
      <span className="font-semibold text-foreground">{totalItems}</span> results
    </p>
  );
}
