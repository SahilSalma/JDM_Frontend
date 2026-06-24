'use client';

import { useHomepageReviews } from '@/hooks/useReviews';
import { ReviewCard } from '@/components/product/ReviewCard';
import { Star, Loader2, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export function ReviewSection() {
  const { reviews, isLoading } = useHomepageReviews();
  const [page, setPage] = useState(0);
  const itemsPerPage = 1;
  const totalPages = Math.max(1, Math.ceil(reviews.length / itemsPerPage));
  const currentReview = reviews[page];

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-[#DC2626]" />
          </div>
        </div>
      </section>
    );
  }

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-[#DC2626]/[0.02] to-background py-20">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-40 w-40 rounded-full bg-[#DC2626]/5 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-40 w-40 rounded-full bg-[#DC2626]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#DC2626]/20 bg-[#DC2626]/5 px-4 py-1.5 text-xs font-semibold text-[#DC2626]">
            <Star className="size-3.5 fill-[#DC2626]" />
            Customer Reviews
          </div>
          <h2 className="font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            What Our Customers Say
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Real reviews from JDM enthusiasts who trust our products
          </p>
        </div>

        {/* Desktop Grid: Show up to 3 reviews */}
        <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
          {reviews.slice(0, 3).map((review, idx) => (
            <div key={review.id} className="relative">
              {review.product && (
                <Link
                  href={`/products/${review.product.slug}`}
                  className="mb-2 block text-xs font-medium text-[#DC2626] hover:underline truncate"
                >
                  {review.product.title}
                </Link>
              )}
              <ReviewCard
                customerName={review.customer_name}
                rating={review.rating}
                title={review.title}
                content={review.content}
                images={review.images}
                createdAt={review.created_at}
                compact
              />
            </div>
          ))}
        </div>

        {/* Mobile: Carousel (1 at a time) */}
        {reviews.length > 0 && (
          <div className="md:hidden">
            <div className="relative">
              {currentReview && (
                <div>
                  {currentReview.product && (
                    <Link
                      href={`/products/${currentReview.product.slug}`}
                      className="mb-2 block text-xs font-medium text-[#DC2626] hover:underline truncate text-center"
                    >
                      {currentReview.product.title}
                    </Link>
                  )}
                  <ReviewCard
                    customerName={currentReview.customer_name}
                    rating={currentReview.rating}
                    title={currentReview.title}
                    content={currentReview.content}
                    images={currentReview.images}
                    createdAt={currentReview.created_at}
                  />
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="rounded-full border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Reviews if we have more than 3 */}
        {reviews.length > 3 && (
          <div className="mt-8 hidden gap-6 md:grid md:grid-cols-2">
            {reviews.slice(3, 5).map((review) => (
              <div key={review.id} className="relative">
                {review.product && (
                  <Link
                    href={`/products/${review.product.slug}`}
                    className="mb-2 block text-xs font-medium text-[#DC2626] hover:underline truncate"
                  >
                    {review.product.title}
                  </Link>
                )}
                <ReviewCard
                  customerName={review.customer_name}
                  rating={review.rating}
                  title={review.title}
                  content={review.content}
                  images={review.images}
                  createdAt={review.created_at}
                  compact
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
