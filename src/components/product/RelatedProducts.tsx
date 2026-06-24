'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/product/ProductCard';
import { useProducts } from '@/hooks/useProducts';

interface RelatedProductsProps {
  currentProductId: string;
  make: string;
  category: string;
  relatedProductIds?: string | null;
}

export default function RelatedProducts({
  currentProductId,
  make,
  category,
  relatedProductIds,
}: RelatedProductsProps) {
  const t = useTranslations('product');

  let targetIds: string[] = [];
  if (relatedProductIds) {
    try {
      const parsed = JSON.parse(relatedProductIds);
      if (Array.isArray(parsed)) {
        targetIds = parsed.filter(Boolean);
      }
    } catch (e) {
      console.error('Failed to parse relatedProductIds:', e);
    }
  }

  const { products, isLoading } = useProducts(
    targetIds.length > 0
      ? { ids: targetIds.join(',') }
      : { make, category, limit: 8 }
  );

  const related = products.filter((p) => p.id !== currentProductId);

  if (!isLoading && related.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="mb-6 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
        {t('related')}
      </h2>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-64 shrink-0">
              <Skeleton className="aspect-square w-full rounded-lg bg-muted" />
              <div className="mt-3 space-y-2 px-1">
                <Skeleton className="h-4 w-3/4 bg-muted" />
                <Skeleton className="h-4 w-1/2 bg-muted" />
                <Skeleton className="h-6 w-1/3 bg-muted" />
                <Skeleton className="h-10 w-full bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {related.slice(0, 6).map((product) => (
            <div key={product.id} className="w-64 shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
