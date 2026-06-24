'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { useBlog, type BlogPost, type BlogPostInput } from '@/hooks/useBlog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/admin/RichTextEditor';

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.blogEditor');
  const router = useRouter();
  const { updatePost } = useBlog(1, 10, true);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [published, setPublished] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{ success: boolean; data: BlogPost }>(`/admin/blog/${id}`)
      .then((res) => {
        if (cancelled) return;
        const p = res.data;
        setPost(p);
        setTitle(p.title);
        setSlug(p.slug);
        setContent(p.content ?? '');
        setExcerpt(p.excerpt ?? '');
        setFeaturedImage(p.featured_image_path ?? '');
        setMetaTitle(p.meta_title ?? '');
        setMetaDescription(p.meta_description ?? '');
        setPublished(p.status === 'published');
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load post');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleImageDrop = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await adminApi.upload<{ success: boolean; data: { path: string } }>('/admin/blog/upload-image', formData);
      setFeaturedImage(res.data.path);
    } catch {
      setError('Failed to upload image');
    }
  }, []);

  const handleSave = async (publish: boolean) => {
    setError(null);
    setIsSaving(true);
    try {
      const data: Partial<BlogPostInput> = {
        title,
        slug,
        content,
        excerpt,
        featured_image_path: featuredImage || undefined,
        meta_title: metaTitle || undefined,
        meta_description: metaDescription || undefined,
        status: publish ? 'published' : 'draft',
        published_at: publish ? (post?.published_at ?? new Date().toISOString()) : undefined,
      };
      await updatePost(id, data);
      router.push('/admin/blog');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'bg-muted border-border text-foreground placeholder:text-muted-foreground/60 h-8 text-sm';
  const labelClass = 'text-xs text-muted-foreground';

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
      </div>
    );
  }

  if (error && !post) {
    return <div className="p-4 text-muted-foreground">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="font-heading text-2xl font-bold text-foreground">{t('editPost')}</h1>
      </div>

      <div className="space-y-4">
        {/* Main content */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1">
              <Label className={labelClass}>{t('title')}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('slug')}</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputClass} font-mono`} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('excerpt')}</Label>
              <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder={t('excerptPlaceholder')} className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 text-sm resize-none min-h-[70px]" />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('content')}</Label>
              <RichTextEditor value={content} onChange={setContent} minHeight="240px" />
            </div>
          </CardContent>
        </Card>

        {/* Featured Image */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">{t('featuredImage')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {featuredImage ? (
              <div className="relative inline-block">
                <img src={featuredImage} alt="" className="h-32 w-auto rounded-lg object-cover border border-border" />
                <button type="button" onClick={() => setFeaturedImage('')} className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-background/70 text-foreground hover:bg-[#DC2626]">
                  <X className="size-3" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleImageDrop(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragging ? 'border-[#DC2626] bg-[#DC2626]/5' : 'border-border hover:border-[#525252]'}`}
              >
                <Upload className="size-6 text-muted-foreground/60 mb-2" />
                <p className="text-sm text-muted-foreground">Drop image or click to browse</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageDrop(e.target.files)} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* SEO */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">SEO</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1">
              <Label className={labelClass}>{t('metaTitle')}</Label>
              <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('metaDescription')}</Label>
              <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="bg-muted border-border text-foreground text-sm resize-none min-h-[70px]" />
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Switch checked={published} onCheckedChange={setPublished} />
              <Label className="text-sm text-foreground">
                {published ? t('published') : t('draft')}
              </Label>
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 px-3 py-2 text-sm text-[#DC2626]">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button onClick={() => handleSave(true)} disabled={isSaving || !title} className="bg-[#DC2626] text-foreground hover:bg-[#ef4444] disabled:opacity-50">
            {isSaving ? t('saving') : t('publish')}
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving || !title} className="border-border text-muted-foreground hover:text-foreground hover:bg-muted">
            {t('saveDraft')}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
