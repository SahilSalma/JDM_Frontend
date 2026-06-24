'use client';

import Image from 'next/image';
import { StarRating } from './StarRating';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  customerName: string;
  rating: number;
  title?: string | null;
  content: string;
  images?: string[];
  createdAt: string;
  productName?: string;
  productSlug?: string;
  compact?: boolean;
}

export function ReviewCard({
  customerName,
  rating,
  title,
  content,
  images = [],
  createdAt,
  productName,
  productSlug,
  compact = false,
}: ReviewCardProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > 300;

  return (
    <>
      <div
        className={cn(
          'rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-border/80 hover:shadow-sm',
          compact ? 'p-4' : 'p-5',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DC2626]/10 text-sm font-bold text-[#DC2626]">
              {customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{customerName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <StarRating rating={rating} size="sm" />
                <span className="flex items-center gap-1">
                  <Calendar className="size-3" />
                  {new Date(createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {productName && (
            <span className="shrink-0 text-xs text-muted-foreground/60 italic truncate max-w-[160px] text-right">
              {productName}
            </span>
          )}
        </div>

        {title && (
          <h4 className="mt-3 text-sm font-semibold text-foreground">{title}</h4>
        )}

        <div className="mt-2">
          <p className={cn('text-sm leading-relaxed text-muted-foreground', !expanded && isLong && 'line-clamp-4')}>
            {content}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="mt-1 text-xs font-medium text-[#DC2626] hover:underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {images.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setLightboxIndex(i)}
                className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-muted"
              >
                <Image
                  src={`/api${img}`}
                  alt={`Review image ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-110"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
          >
            <X className="size-5" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex === 0 ? images.length - 1 : lightboxIndex - 1);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(lightboxIndex === images.length - 1 ? 0 : lightboxIndex + 1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <div className="relative max-h-[80vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={`/api${images[lightboxIndex]}`}
              alt={`Review image ${lightboxIndex + 1}`}
              width={1200}
              height={900}
              className="h-auto max-h-[80vh] w-auto rounded-lg object-contain"
              sizes="90vw"
            />
          </div>

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm text-white">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
