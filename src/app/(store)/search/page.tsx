'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { useProducts } from '@/hooks/useProducts';
import ProductGrid from '@/components/product/ProductGrid';
import FilterSidebar from '@/components/product/FilterSidebar';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Pagination, PaginationStatus } from '@/components/ui/pagination';

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  const params = use(searchParams);
  const t = useTranslations('home');
  const ts = useTranslations('search');
  const tn = useTranslations('nav');

  const query = typeof params.q === 'string' ? params.q : '';
  const make = typeof params.make === 'string' ? params.make : undefined;
  const minPrice = typeof params.minPrice === 'string' ? Number(params.minPrice) : undefined;
  const maxPrice = typeof params.maxPrice === 'string' ? Number(params.maxPrice) : undefined;
  const inStock = params.inStock === 'true';
  const page = typeof params.page === 'string' ? Number(params.page) : 1;

  const { products, total, totalPages, isLoading } = useProducts({
    search: query || undefined,
    make,
    minPrice,
    maxPrice,
    inStock: inStock || undefined,
    page,
    limit: 12,
  });

  const breadcrumbs = [
    { label: tn('home'), href: '/' },
    { label: t('searchPageTitle'), href: '/search' },
    ...(query ? [{ label: `"${query}"` }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-none px-4 py-8 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        {/* Page header */}
        <div className="mb-8">
          <div className="mb-1 h-0.5 w-8 bg-[#DC2626]" aria-hidden="true" />
          <h1 className="font-heading text-3xl font-black uppercase tracking-wide text-foreground sm:text-4xl">
            {t('searchPageTitle')}
          </h1>
          {!isLoading && query && (
            <p className="mt-1 text-sm text-muted-foreground/60">
              {ts('results', { count: total, query })}
            </p>
          )}
        </div>

        {/* Layout: filters + grid */}
        <div className="flex flex-col gap-6 lg:flex-row">
          <FilterSidebar />

          <div className="min-w-0 flex-1">
            {!isLoading && !query && products.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-medium text-muted-foreground">
                  {ts('noResultsHint')}
                </p>
              </div>
            ) : (
              <ProductGrid
                products={products}
                isLoading={isLoading}
                emptyMessage={query ? ts('noResults', { query }) : t('noProductsFound')}
              />
            )}

            {/* Pagination */}
            <PaginationStatus
              currentPage={page}
              pageSize={12}
              totalItems={total}
              className="mt-8"
            />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              buildHref={(p) => {
                const ps = new URLSearchParams();
                if (query) ps.set('q', query);
                if (make) ps.set('make', make);
                if (minPrice !== undefined) ps.set('minPrice', String(minPrice));
                if (maxPrice !== undefined) ps.set('maxPrice', String(maxPrice));
                if (inStock) ps.set('inStock', 'true');
                ps.set('page', String(p));
                return `/search?${ps.toString()}`;
              }}
              className="mt-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
