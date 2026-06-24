'use client';

import { useState } from 'react';
import { useProductReviews } from '@/hooks/useReviews';
import { ReviewCard } from './ReviewCard';
import { WriteReviewDialog } from './WriteReviewDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Star, MessageSquare, Loader2 } from 'lucide-react';

interface ProductReviewsProps {
  productId: string;
  productTitle: string;
}

export function ProductReviews({ productId, productTitle }: ProductReviewsProps) {
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDialog, setShowDialog] = useState(false);
  const { reviews, total, isLoading, error } = useProductReviews(productId, sortBy, sortOrder);

  const handleSortChange = (value: string | null) => { if (!value) return;
    if (value === 'date-asc' || value === 'date-desc') {
      setSortBy('date');
      setSortOrder(value.split('-')[1] as 'asc' | 'desc');
    } else if (value === 'rating-asc' || value === 'rating-desc') {
      setSortBy('rating');
      setSortOrder(value.split('-')[1] as 'asc' | 'desc');
    } else if (value === 'name-asc' || value === 'name-desc') {
      setSortBy('name');
      setSortOrder(value.split('-')[1] as 'asc' | 'desc');
    }
  };

  const getSortValue = () => `${sortBy}-${sortOrder}`;

  const sortLabels: Record<string, string> = {
    'date-desc': 'Newest First',
    'date-asc': 'Oldest First',
    'rating-desc': 'Highest Rated',
    'rating-asc': 'Lowest Rated',
    'name-asc': 'Name A-Z',
    'name-desc': 'Name Z-A',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="size-5 text-[#DC2626]" />
          <h3 className="text-lg font-bold text-foreground">
            Customer Reviews {total > 0 && <span className="text-muted-foreground font-normal">({total})</span>}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <Select value={getSortValue()} onValueChange={(v) => v && handleSortChange(v)}>
            <SelectTrigger className="h-9 w-[160px] bg-muted border-border text-sm">
              <span>{sortLabels[getSortValue()] || 'Sort by'}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
              <SelectItem value="rating-asc">Lowest Rated</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setShowDialog(true)}
            className="bg-[#DC2626] text-white hover:bg-[#ef4444] gap-1.5"
            size="sm"
          >
            <Star className="size-4" />
            Write a Review
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-[#DC2626]" />
        </div>
      ) : error ? (
        <p className="text-sm text-[#DC2626]">{error}</p>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
          <MessageSquare className="size-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-foreground">No reviews yet</p>
            <p className="text-xs text-muted-foreground">Be the first to review this product!</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDialog(true)}
            className="border-[#DC2626]/40 text-[#DC2626] hover:bg-[#DC2626]/10"
          >
            <Star className="mr-1.5 size-4" />
            Write a Review
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              customerName={review.customer_name}
              rating={review.rating}
              title={review.title}
              content={review.content}
              images={review.images}
              createdAt={review.created_at}
            />
          ))}
        </div>
      )}

      <WriteReviewDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        productId={productId}
        productTitle={productTitle}
      />
    </div>
  );
}
