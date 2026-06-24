'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, adminApi } from '@/lib/api';

export interface Review {
  id: string;
  product_id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string | null;
  content: string;
  images: string[];
  status: 'approved' | 'pending' | 'rejected';
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  product?: { id: string; title: string; slug: string; primary_image_path?: string | null } | null;
  order?: { id: string; order_number: string } | null;
}

export interface EligibleProduct {
  product_id: string;
  product_title: string;
  product_sku: string;
  order_id: string;
  order_number: string;
  created_at: string;
}

interface ReviewMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export function useProductReviews(productId: string | undefined, sortBy = 'date', sortOrder: 'asc' | 'desc' = 'desc') {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    api
      .get<{ success: boolean; data: Review[]; meta: ReviewMeta }>(
        `/reviews/product/${productId}?sortBy=${sortBy}&sortOrder=${sortOrder}`,
      )
      .then((res) => {
        setReviews(res.data);
        setTotal(res.meta.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load reviews'))
      .finally(() => setIsLoading(false));
  }, [productId, sortBy, sortOrder]);

  return { reviews, total, isLoading, error };
}

export function useReviewEligibility() {
  const [eligible, setEligible] = useState<EligibleProduct[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const checkEligibility = useCallback(async (email: string, productId?: string) => {
    setIsChecking(true);
    try {
      const res = await api.post<{ success: boolean; data: EligibleProduct[] }>(
        '/reviews/check-eligibility',
        { email, product_id: productId },
      );
      setEligible(res.data);
      return res.data;
    } catch (err) {
      setEligible([]);
      throw err;
    } finally {
      setIsChecking(false);
    }
  }, []);

  return { eligible, isChecking, checkEligibility };
}

export function useSubmitReview() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReview = useCallback(
    async (data: {
      product_id: string;
      order_id: string;
      customer_email: string;
      rating: number;
      title?: string;
      content: string;
      images?: string[];
    }) => {
      setIsSubmitting(true);
      try {
        const res = await api.post<{ success: boolean; data: Review }>('/reviews', data);
        return res.data;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { isSubmitting, submitReview };
}

export function useHomepageReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ success: boolean; data: Review[] }>('/reviews/homepage')
      .then((res) => setReviews(res.data))
      .catch(() => setReviews([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { reviews, isLoading };
}

export function useAdminReviews(
  filters: {
    status?: string;
    search?: string;
    rating_min?: number;
    rating_max?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {},
  page = 1,
  limit = 20,
) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<ReviewMeta>({ total: 0, page: 1, limit: 20, total_pages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);
      if (filters.rating_min) params.set('rating_min', String(filters.rating_min));
      if (filters.rating_max) params.set('rating_max', String(filters.rating_max));
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
      params.set('page', String(page));
      params.set('limit', String(limit));

      const res = await adminApi.get<{ success: boolean; data: Review[]; meta: ReviewMeta }>(
        `/admin/reviews?${params.toString()}`,
      );
      setReviews(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { reviews, meta, isLoading, error, refetch: fetchReviews };
}
