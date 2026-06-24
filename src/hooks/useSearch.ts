'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

export interface SearchResult {
  id: string;
  title: string;
  /** Price in dollars (backward-compat for SearchBar) */
  price: number;
  /** Price in cents */
  price_cents: number;
  image: string;
  category: string;
  make?: string;
  model?: string;
  href: string;
  slug?: string;
}

interface ApiSearchResponse {
  success: boolean;
  data: Array<{
    id: string;
    title: string;
    price_cents: number;
    primary_image_path?: string | null;
    category: string;
    make?: string;
    model?: string;
    slug: string;
  }>;
}

interface UseSearchReturn {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  search: (query: string) => void;
  setQuery: (q: string) => void;
  clearQuery: () => void;
  hasResults: boolean;
}

const DEBOUNCE_MS = 300;

function toSearchResult(
  product: ApiSearchResponse['data'][number],
): SearchResult {
  return {
    id: product.id,
    title: product.title,
    price: product.price_cents / 100,
    price_cents: product.price_cents,
    image: product.primary_image_path ? `/api${product.primary_image_path}` : '',
    category: product.category,
    make: product.make,
    model: product.model,
    href: `/products/${product.slug}`,
    slug: product.slug,
  };
}

export function useSearch(): UseSearchReturn {
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const search = useCallback((value: string) => setQueryState(value), []);
  const setQuery = useCallback((q: string) => setQueryState(q), []);
  const clearQuery = useCallback(() => {
    setQueryState('');
    setResults([]);
    setError(null);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();

      try {
        const res = await api.get<ApiSearchResponse>('/products/search', {
          q: query.trim(),
          limit: 8,
        });
        setResults((res.data ?? []).map(toSearchResult));
        setError(null);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { query, results, isLoading, error, search, setQuery, clearQuery, hasResults: results.length > 0 };
}
