'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar, ArrowRight, BookOpen } from 'lucide-react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlog } from '@/hooks/useBlog';
import { Pagination } from '@/components/ui/pagination';

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function BlogPage() {
  const t = useTranslations('blog');
  const [page, setPage] = useState(1);
  const { posts, totalPages, isLoading } = useBlog(page, 9);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: t('title') },
  ];

  return (
    <div className="mx-auto max-w-none px-4 py-10 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
      <Breadcrumbs items={breadcrumbs} className="mb-8" />

      <div className="mb-12">
        <h1 className="font-heading text-5xl font-bold uppercase tracking-wide text-foreground">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('latestPosts')}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border">
              <Skeleton className="aspect-video w-full bg-muted" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-4 w-1/3 bg-muted" />
                <Skeleton className="h-6 w-full bg-muted" />
                <Skeleton className="h-4 w-5/6 bg-muted" />
                <Skeleton className="h-4 w-4/6 bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <BookOpen className="size-16 text-muted-foreground/30" />
          <p className="text-lg text-muted-foreground">{t('noPosts')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-colors hover:border-[#DC2626]/40"
              >
                {/* Featured image */}
                <Link href={`/blog/${post.slug}`} className="relative block aspect-video overflow-hidden bg-muted">
                  {post.featured_image_path ? (
                    <img
                      src={post.featured_image_path}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="size-12 text-muted-foreground/20" />
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                    <Calendar className="size-3.5" />
                    <span>
                      {post.published_at
                        ? formatDate(post.published_at)
                        : formatDate(post.created_at)}
                    </span>
                  </div>

                  <Link href={`/blog/${post.slug}`}>
                    <h2 className="font-heading text-xl font-bold text-foreground transition-colors group-hover:text-[#DC2626] line-clamp-2">
                      {post.title}
                    </h2>
                  </Link>

                  {post.excerpt && (
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}

                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-auto flex items-center gap-1.5 text-sm font-medium text-[#DC2626] transition-colors hover:text-[#ef4444]"
                  >
                    {t('readMore')}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-12"
          />
        </>
      )}
    </div>
  );
}
