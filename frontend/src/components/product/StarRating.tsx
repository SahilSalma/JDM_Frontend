'use client';

import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
}

const sizeClasses = {
  sm: 'size-3.5',
  md: 'size-5',
  lg: 'size-6',
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
  showValue = false,
}: StarRatingProps) {
  const stars = [];

  for (let i = 1; i <= maxRating; i++) {
    const filled = i <= Math.floor(rating);
    const halfFilled = !filled && i - 0.5 <= rating;

    stars.push(
      <button
        key={i}
        type="button"
        disabled={!interactive}
        onClick={() => interactive && onChange?.(i)}
        className={cn(
          'transition-colors',
          interactive
            ? 'cursor-pointer hover:scale-110 active:scale-95'
            : 'cursor-default',
          filled ? 'text-[#DC2626]' : halfFilled ? 'text-[#DC2626]/60' : 'text-muted-foreground/30',
        )}
      >
        <Star
          className={cn(
            sizeClasses[size],
            filled ? 'fill-[#DC2626]' : halfFilled ? 'fill-[#DC2626]/60' : 'fill-none',
          )}
        />
      </button>,
    );
  }

  return (
    <div className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of ${maxRating} stars`}>
      {stars}
      {showValue && (
        <span className="ml-1.5 text-sm font-medium text-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
