import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Calendar, ArrowLeft, BookOpen } from 'lucide-react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Separator } from '@/components/ui/separator';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

interface BlogPost {
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
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/blog/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return { title: 'Post Not Found | JDM Tokyo Motorsports' };
  }

  return {
    title: post.meta_title ?? `${post.title} | JDM Tokyo Blog`,
    description: post.meta_description ?? post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: post.featured_image_path ? [{ url: post.featured_image_path }] : [],
    },
  };
}

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

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post || post.status !== 'published') notFound();

  const t = await getTranslations('blog');

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: t('title'), href: '/blog' },
    { label: post.title },
  ];

  const pubDate = post.published_at ?? post.created_at;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={breadcrumbs} className="mb-8" />

      {/* Featured image */}
      {post.featured_image_path && (
        <div className="mb-10 overflow-hidden rounded-lg border border-border">
          <img
            src={post.featured_image_path}
            alt={post.title}
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      {/* Meta */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground/60">
        <Calendar className="size-4" />
        <span>{t('publishedOn', { date: formatDate(pubDate) })}</span>
      </div>

      {/* Title */}
      <h1 className="mb-6 font-heading text-4xl font-bold leading-tight text-foreground lg:text-5xl">
        {post.title}
      </h1>

      {post.excerpt && (
        <p className="mb-6 text-lg leading-relaxed text-muted-foreground">{post.excerpt}</p>
      )}

      <Separator className="mb-10 bg-border" />

      {/* Content */}
      <div className="prose-jdm text-foreground/80 leading-relaxed whitespace-pre-line">
        {post.content}
      </div>

      <Separator className="mt-10 mb-8 bg-border" />

      {/* Back link */}
      <Link
        href="/blog"
        className="flex items-center gap-2 text-sm font-medium text-[#DC2626] transition-colors hover:text-[#ef4444]"
      >
        <ArrowLeft className="size-4" />
        {t('backToBlog')}
      </Link>
    </div>
  );
}
