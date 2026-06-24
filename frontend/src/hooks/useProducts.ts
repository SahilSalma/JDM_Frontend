'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Product {
  id: string;
  slug: string;
  title: string;
  sku: string;
  price_cents: number;
  compare_at_price_cents?: number | null;
  description: string;
  category: string;
  make: string;
  model: string;
  year_start: number;
  year_end: number;
  engine_code?: string;
  displacement?: string;
  cylinders?: number;
  fuel_type?: string;
  mileage?: number;
  condition: string;
  max_per_order: number;
  meta_title?: string;
  meta_description?: string;
  transmission_type?: string;
  warranty?: string;
  status: string;
  featured: boolean;
  stock: number; // maps from `quantity` in DB/API
  quantity?: number; // raw DB field
  images: Array<{
    id: string;
    image_path: string;
    medium_path?: string;
    large_path?: string;
    thumb_path?: string;
  }>;
  part_number?: string;
  primary_image_path?: string | null;
  related_product_ids?: string | null;
  mileage_km?: number | null;
  condition_notes?: string | null;
  included_items?: string | null;
  specs_json?: string | null;
  warranty_summary?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  category?: string;
  make?: string;
  model?: string;
  year?: number | string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
  transmissionType?: string;
  ids?: string;
}

interface ApiResponse {
  success: boolean;
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseProductsOptions extends ProductFilters {
  page?: number;
  limit?: number;
  sort?: string;
}

interface UseProductsResult {
  products: Product[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {
          page: options.page ?? 1,
          limit: options.limit ?? 12,
          ...(options.sort && { sort: options.sort }),
          ...(options.category && { category: options.category }),
          ...(options.make && { make: options.make }),
          ...(options.model && { model: options.model }),
          ...(options.year && { year: options.year }),
          ...(options.minPrice !== undefined && { min_price: options.minPrice }),
          ...(options.maxPrice !== undefined && { max_price: options.maxPrice }),
          ...(options.inStock !== undefined && { inStock: options.inStock }),
          ...(options.featured !== undefined && { featured: options.featured }),
          ...(options.search && { search: options.search }),
          ...(options.transmissionType && { transmission_type: options.transmissionType }),
          ...(options.ids && { ids: options.ids }),
        };

        const res = await api.get<ApiResponse>('/products', params);

        if (!cancelled) {
          // Map `quantity` from API to `stock` for frontend compatibility
          const mapped = (res.data ?? []).map((p: Product & { quantity?: number }) => ({
            ...p,
            stock: p.stock ?? p.quantity ?? 0,
          }));
          setProducts(mapped);
          setTotal(res.meta?.total ?? 0);
          setTotalPages(res.meta?.total_pages ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load products');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    trigger,
    options.page,
    options.limit,
    options.sort,
    options.category,
    options.make,
    options.model,
    options.year,
    options.minPrice,
    options.maxPrice,
    options.inStock,
    options.featured,
    options.search,
    options.transmissionType,
    options.ids,
  ]);

  return { products, total, totalPages, isLoading, error, refetch };
}
