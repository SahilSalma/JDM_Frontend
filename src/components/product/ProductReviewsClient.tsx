'use client';

import { ProductReviews } from './ProductReviews';
import { MessageSquare } from 'lucide-react';

interface ProductReviewsClientProps {
  productId: string;
  productTitle: string;
}

export function ProductReviewsClient({ productId, productTitle }: ProductReviewsClientProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 md:p-8">
      <ProductReviews productId={productId} productTitle={productTitle} />
    </div>
  );
}
