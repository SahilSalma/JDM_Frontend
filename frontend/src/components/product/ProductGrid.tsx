import { Package } from 'lucide-react';
import LoadingSkeleton from '@/components/animations/LoadingSkeleton';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/hooks/useProducts';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function ProductGrid({
  products,
  isLoading = false,
  emptyMessage,
}: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <LoadingSkeleton key={i} variant="productCard" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Package className="size-8 text-muted-foreground/30" aria-hidden="true" />
        </div>
        <p className="text-base font-medium text-muted-foreground">
          {emptyMessage ?? 'No products found'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} className="h-full" />
      ))}
    </div>
  );
}
