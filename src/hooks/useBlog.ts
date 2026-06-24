'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, adminApi } from '@/lib/api';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_path?: string;
  meta_title?: string;
  meta_description?: string;
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export type BlogPostInput = Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>;

interface BlogResponse {
  success: boolean;
  data: BlogPost[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}

interface UseBlogReturn {
  posts: BlogPost[];
  total: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  createPost: (data: BlogPostInput) => Promise<BlogPost>;
  updatePost: (id: string, data: Partial<BlogPostInput>) => Promise<BlogPost>;
  deletePost: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useBlog(page = 1, limit = 10, admin = false): UseBlogReturn {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trigger, setTrigger] = useState(0);

  const refetch = useCallback(() => setTrigger((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const client = admin ? adminApi : api;
    const endpoint = admin ? '/admin/blog' : '/blog';

    client
      .get<BlogResponse>(endpoint, { page, limit })
      .then((res) => {
        if (!cancelled) {
          setPosts(res.data ?? []);
          setTotal(res.meta?.total ?? 0);
          setTotalPages(res.meta?.total_pages ?? 0);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load posts');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trigger, page, limit, admin]);

  const createPost = useCallback(async (data: BlogPostInput): Promise<BlogPost> => {
    const res = await adminApi.post<{ success: boolean; data: BlogPost }>('/admin/blog', data);
    const created = res.data;
    setPosts((prev) => [created, ...prev]);
    return created;
  }, []);

  const updatePost = useCallback(
    async (id: string, data: Partial<BlogPostInput>): Promise<BlogPost> => {
      const res = await adminApi.patch<{ success: boolean; data: BlogPost }>(`/admin/blog/${id}`, data);
      const updated = res.data;
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    },
    [],
  );

  const deletePost = useCallback(async (id: string): Promise<void> => {
    await adminApi.delete(`/admin/blog/${id}`);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    posts,
    total,
    totalPages,
    isLoading,
    error,
    createPost,
    updatePost,
    deletePost,
    refetch,
  };
}
