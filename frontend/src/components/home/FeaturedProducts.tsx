'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/product/ProductCard';
import LoadingSkeleton from '@/components/animations/LoadingSkeleton';

export default function FeaturedProducts() {
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const { products, isLoading } = useProducts({ featured: true, limit: 8 });

  const trackRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const track = trackRef.current;
    if (!track) return;
    const amount = direction === 'right' ? 320 : -320;
    track.scrollBy({ left: amount, behavior: 'smooth' });
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (isHovered || isLoading || !products || products.length === 0) return;
    autoRef.current = setInterval(() => scrollBy('right'), 4000);
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, [isHovered, isLoading, products, scrollBy]);

  return (
    <section className="w-full overflow-hidden">
      {/* Header */}
      <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        <div className="flex items-end justify-between">
          <div>
            <div className="mb-1 h-0.5 w-8 bg-[#DC2626]" aria-hidden="true" />
            <h2 className="font-heading text-2xl font-black uppercase tracking-wide text-foreground sm:text-3xl">
              {t('featured')}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Arrow controls */}
            <div className="flex gap-1">
              <button
                onClick={() => scrollBy('left')}
                aria-label="Previous"
                className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-[#DC2626]/50 hover:text-[#DC2626]"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => scrollBy('right')}
                aria-label="Next"
                className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-[#DC2626]/50 hover:text-[#DC2626]"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <Link
              href="/engines"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#DC2626] transition-colors hover:text-[#ef4444]"
            >
              {tc('viewAll')}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Scrollable track */}
      <div className="mt-6 mx-auto max-w-none px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        <div
          ref={trackRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
          style={{ scrollbarWidth: 'thin' }}
        >
          {isLoading || !products ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[320px] shrink-0">
                <LoadingSkeleton variant="productCard" />
              </div>
            ))
          ) : products.length === 0 ? (
            <p className="w-full py-12 text-center text-muted-foreground/50">{t('noProductsFound')}</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="w-[320px] shrink-0">
                <ProductCard product={product} className="h-full" />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
