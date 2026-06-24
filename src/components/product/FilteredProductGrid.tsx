'use client';

import { Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useProducts } from '@/hooks/useProducts';
import ProductGrid from '@/components/product/ProductGrid';
import FilterSidebar from '@/components/product/FilterSidebar';
import { Pagination, PaginationStatus } from '@/components/ui/pagination';
import { useVehicleData } from '@/hooks/useVehicleData';

export interface FilteredProductGridProps {
  /** Optional category filter — omit to show all categories */
  category?: 'engine' | 'transmission' | 'part';
  /** Locked make from URL path segment — takes priority over search params */
  make?: string;
  /** Locked model from URL path segment — takes priority over search params */
  model?: string;
  /** Locked transmission type from URL path segment */
  transmissionType?: string;
}

// ---------------------------------------------------------------------------
// Inner component — must be wrapped in Suspense because it calls useSearchParams
// ---------------------------------------------------------------------------

function FilteredProductGridInner({
  category: categoryProp,
  make,
  model,
  transmissionType,
}: FilteredProductGridProps) {
  const searchParams = useSearchParams();
  const category: 'engine' | 'transmission' | 'part' | undefined = categoryProp !== undefined ? categoryProp : (searchParams.get('category') as any) || undefined;
  const t = useTranslations('home');
  const pathname = usePathname();
  const { makes } = useVehicleData();

  // Path-based props take priority; fall back to search params for listing pages
  // Normalize make to proper case (e.g. 'honda' → 'Honda') so backend matching works
  const rawMake = make ?? (searchParams.get('make') ?? undefined);
  const effectiveMake = rawMake
    ? makes.find((m) => m.toLowerCase() === rawMake.toLowerCase()) ?? rawMake
    : undefined;
  const effectiveModel = model ?? (searchParams.get('model') ?? undefined);

  // Additional filters always come from search params
  const year = searchParams.get('year') || undefined;
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const inStock = searchParams.get('inStock') === 'true' ? true : undefined;
  const page = Number(searchParams.get('page')) || 1;

  const { products, total, totalPages, isLoading } = useProducts({
    category,
    make: effectiveMake,
    model: effectiveModel,
    year,
    minPrice,
    maxPrice,
    inStock,
    transmissionType,
    page,
    limit: 12,
  });

  return (
    <>
      {/* Product count */}
      {!isLoading && (
        <p className="mb-6 text-sm text-muted-foreground/60">
          {t('productsCount', { count: total })}
        </p>
      )}

      {/* Layout: filters + grid */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar lockedCategory={category} lockedMake={effectiveMake} />

        <div className="min-w-0 flex-1">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            emptyMessage={t('noProductsFound')}
          />

          {/* Status — always visible when there are results */}
          <PaginationStatus
            currentPage={page}
            pageSize={12}
            totalItems={total}
            className="mt-8"
          />

          {/* Pagination — only renders when more than one page */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) => {
              const ps = new URLSearchParams(searchParams.toString());
              ps.set('page', String(p));
              return `${pathname}?${ps.toString()}`;
            }}
            className="mt-4"
          />
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Skeleton shown while the client component is resolving
// ---------------------------------------------------------------------------

function FilteredGridSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row animate-pulse">
      <div className="hidden w-64 shrink-0 rounded-xl border border-border bg-card lg:block" style={{ minHeight: '400px' }} />
      <div className="min-w-0 flex-1">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public export — Suspense boundary is built-in so callers don't need to add one
// ---------------------------------------------------------------------------

export default function FilteredProductGrid(props: FilteredProductGridProps) {
  return (
    <Suspense fallback={<FilteredGridSkeleton />}>
      <FilteredProductGridInner {...props} />
    </Suspense>
  );
}
