'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Loader2, Plus, Trash2, ArrowLeft, Home, Sparkles, AlertCircle, ArrowRight, Star, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { IconRenderer, ICON_MAP } from '@/components/admin/IconRenderer';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/ThemeProvider';
import { toast } from 'sonner';

export default function HomepageSettingsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = useTranslations('admin.settingsPage');
  const router = useRouter();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load Settings
  useEffect(() => {
    adminApi
      .get<{ success: boolean; data: any[] }>('/admin/settings')
      .then((res) => {
        const map: Record<string, string> = {};
        for (const row of res.data) {
          map[row.rule_key] = row.rule_value;
        }

        const isFalsyOrPlaceholder = (val: any) => {
          return val === undefined || val === null || typeof val !== 'string' || val.trim() === '' || val.trim() === 'undefined' || val.trim() === 'null';
        };

        // Prefill default settings when not available from DB
        if (isFalsyOrPlaceholder(map['announcement_enabled'])) {
          map['announcement_enabled'] = '1';
        }
        if (isFalsyOrPlaceholder(map['announcement_message'])) {
          map['announcement_message'] = 'Free Shipping on Orders Over $5,000 | JDM Direct from Japan';
        }
        if (isFalsyOrPlaceholder(map['hero_title'])) {
          map['hero_title'] = 'Premium JDM Engines & Transmissions';
        }
        if (isFalsyOrPlaceholder(map['hero_subtitle'])) {
          map['hero_subtitle'] = 'Direct from Japan. Under 65K Miles. Nationwide Shipping.';
        }
        if (isFalsyOrPlaceholder(map['hero_primary_btn_text'])) {
          map['hero_primary_btn_text'] = 'Shop Engines';
        }
        if (isFalsyOrPlaceholder(map['hero_primary_btn_link'])) {
          map['hero_primary_btn_link'] = '/engines';
        }
        if (isFalsyOrPlaceholder(map['hero_secondary_btn_text'])) {
          map['hero_secondary_btn_text'] = 'Shop Transmissions';
        }
        if (isFalsyOrPlaceholder(map['hero_secondary_btn_link'])) {
          map['hero_secondary_btn_link'] = '/transmissions';
        }
        if (isFalsyOrPlaceholder(map['home_categories']) || map['home_categories'].trim() === '[]') {
          map['home_categories'] = JSON.stringify([
            { title: 'JDM Engines', description: 'Direct from Japan. Under 65K Miles. Nationwide Shipping.', href: '/engines', icon: 'zap' },
            { title: 'JDM Transmissions', description: 'Direct from Japan. Under 65K Miles. Nationwide Shipping.', href: '/transmissions', icon: 'settings' },
            { title: 'JDM Parts', description: 'OEM and aftermarket JDM parts, accessories, and components for your build.', href: '/parts', icon: 'wrench' }
          ]);
        }
        if (isFalsyOrPlaceholder(map['trust_badges']) || map['trust_badges'].trim() === '[]') {
          map['trust_badges'] = JSON.stringify([
            { title: '30-Day Warranty', description: 'Every unit backed by our 30-day warranty', icon: 'shield' },
            { title: 'Nationwide Shipping', description: 'Fast delivery across the continental US', icon: 'truck' },
            { title: 'Under 65K Miles', description: 'All units verified under 65,000 miles', icon: 'gauge' },
            { title: 'Expert Support', description: 'JDM specialists ready to help you', icon: 'headset' }
          ]);
        }

        setSettings(map);
      })
      .catch((err) => console.error('Failed to load settings', err))
      .finally(() => setIsLoading(false));
  }, []);

  const get = useCallback((key: string, fallback = '') => settings[key] ?? fallback, [settings]);
  const set = useCallback((key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const keysToSave = [
        'reviews_enabled',
        'reviews_mode',
        'reviews_title',
        'reviews_subtitle',
        'announcement_enabled',
        'announcement_message',
        'hero_title',
        'hero_subtitle',
        'hero_primary_btn_text',
        'hero_primary_btn_link',
        'hero_secondary_btn_text',
        'hero_secondary_btn_link',
        'trust_badges',
        'home_categories'
      ];
      const entries = keysToSave.map((key) => ({ key, value: get(key, '') || '' }));
      await adminApi.put('/admin/settings/bulk', { settings: entries });
      toast.success(t('savedSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for Lists (Trust Badges & Categories)
  const getListItems = (key: string): Array<Record<string, string>> => {
    const raw = get(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const updateListItem = (storageKey: string, idx: number, field: string, value: string) => {
    const items = getListItems(storageKey);
    const next = items.map((it, i) => (i === idx ? { ...it, [field]: value } : it));
    set(storageKey, JSON.stringify(next));
  };

  const addListItem = (storageKey: string, blankFields: Record<string, string>) => {
    const items = getListItems(storageKey);
    set(storageKey, JSON.stringify([...items, blankFields]));
  };

  const removeListItem = (storageKey: string, idx: number) => {
    const items = getListItems(storageKey);
    set(storageKey, JSON.stringify(items.filter((_, i) => i !== idx)));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
      </div>
    );
  }

  const categoryItems = getListItems('home_categories');
  const badgeItems = getListItems('trust_badges');

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => router.push('/admin/settings')}
          className="border-border hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <Home className="size-5 text-[#DC2626]" />
            Homepage Content Editor
          </h1>
          <p className="text-xs text-muted-foreground">Modify heroes, categories, banners, and trust badges on your homepage.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Forms Side */}
        <div className="xl:col-span-7 space-y-6">
          {/* Announcement Bar Card */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground">Announcement Bar Banner</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-foreground font-semibold">Enabled</Label>
                  <p className="text-xs text-muted-foreground">Show a banner at the absolute top of the public storefront</p>
                </div>
                <Switch
                  checked={get('announcement_enabled') === '1'}
                  onCheckedChange={(v) => set('announcement_enabled', v ? '1' : '0')}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Announcement Message</Label>
                <Input
                  value={get('announcement_message')}
                  onChange={(e) => set('announcement_message', e.target.value)}
                  placeholder="Free Shipping on Orders Over $5,000 | JDM Direct from Japan"
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Reviews Card */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <MessageSquare className="size-4 text-[#DC2626]" />
                Customer Reviews Section
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-foreground font-semibold">Enabled</Label>
                  <p className="text-xs text-muted-foreground">Show customer reviews section on the homepage</p>
                </div>
                <Switch
                  checked={get('reviews_enabled') === '1'}
                  onCheckedChange={(v) => set('reviews_enabled', v ? '1' : '0')}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Mode</Label>
                <Select value={get('reviews_mode', 'automatic')} onValueChange={(v) => v && set('reviews_mode', v)}>
                  <SelectTrigger className="h-9 bg-muted border-border text-sm">
                    <span>{get('reviews_mode') === 'automatic' ? 'Automatic (top rated)' : 'Manual pick'}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automatic (top rated)</SelectItem>
                    <SelectItem value="manual">Manual pick</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {get('reviews_mode') === 'manual'
                    ? 'Manually select featured reviews from the Reviews admin page.'
                    : 'Automatically shows the highest-rated reviews.'}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Section Title</Label>
                <Input
                  value={get('reviews_title')}
                  onChange={(e) => set('reviews_title', e.target.value)}
                  placeholder="Customer Reviews"
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Section Subtitle</Label>
                <Input
                  value={get('reviews_subtitle')}
                  onChange={(e) => set('reviews_subtitle', e.target.value)}
                  placeholder="What our customers say about their JDM engines and transmissions"
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* Hero Section Content Editor Card */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground">Hero Section Header & Call-to-Actions</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hero Title</Label>
                <Input
                  value={get('hero_title')}
                  onChange={(e) => set('hero_title', e.target.value)}
                  placeholder="Premium JDM Engines & Transmissions"
                  className="bg-muted border-border text-foreground text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Hero Subtitle</Label>
                <Input
                  value={get('hero_subtitle')}
                  onChange={(e) => set('hero_subtitle', e.target.value)}
                  placeholder="Direct from Japan. Under 65K Miles. Nationwide Shipping."
                  className="bg-muted border-border text-foreground text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Primary Button Text</Label>
                  <Input
                    value={get('hero_primary_btn_text')}
                    onChange={(e) => set('hero_primary_btn_text', e.target.value)}
                    placeholder="Shop Engines"
                    className="bg-muted border-border text-foreground text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Primary Button Link</Label>
                  <Input
                    value={get('hero_primary_btn_link')}
                    onChange={(e) => set('hero_primary_btn_link', e.target.value)}
                    placeholder="/engines"
                    className="bg-muted border-border text-foreground text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Secondary Button Text</Label>
                  <Input
                    value={get('hero_secondary_btn_text')}
                    onChange={(e) => set('hero_secondary_btn_text', e.target.value)}
                    placeholder="Shop Transmissions"
                    className="bg-muted border-border text-foreground text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Secondary Button Link</Label>
                  <Input
                    value={get('hero_secondary_btn_link')}
                    onChange={(e) => set('hero_secondary_btn_link', e.target.value)}
                    placeholder="/transmissions"
                    className="bg-muted border-border text-foreground text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trust Badges Card */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-foreground">Value Trust Badges</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addListItem('trust_badges', { icon: 'shield', title: 'New Trust Badge', description: 'Brief description' })}
                className="gap-1 text-xs text-[#DC2626] hover:bg-[#DC2626]/10"
              >
                <Plus className="size-3.5" /> Add Badge
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {badgeItems.length === 0 && (
                <p className="text-xs italic text-muted-foreground py-2">No trust badges configured. Click "Add Badge" above.</p>
              )}
              {badgeItems.map((badge, idx) => (
                <div key={idx} className="relative rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => removeListItem('trust_badges', idx)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-[#DC2626] transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Icon</Label>
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded bg-muted border border-border flex items-center justify-center text-[#DC2626] shrink-0">
                          <IconRenderer name={badge.icon || 'shield'} className="size-4" />
                        </div>
                        <select
                          value={badge.icon || 'shield'}
                          onChange={(e) => updateListItem('trust_badges', idx, 'icon', e.target.value)}
                          className="h-9 bg-muted border border-border text-foreground text-xs rounded px-2 w-full focus:ring-1 focus:ring-[#DC2626]"
                        >
                          {Object.keys(ICON_MAP).map((k) => (
                            <option key={k} value={k}>
                              {k.charAt(0).toUpperCase() + k.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <Input
                        value={badge.title || ''}
                        onChange={(e) => updateListItem('trust_badges', idx, 'title', e.target.value)}
                        className="h-9 bg-muted border border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Input
                      value={badge.description || ''}
                      onChange={(e) => updateListItem('trust_badges', idx, 'description', e.target.value)}
                      className="h-9 bg-muted border border-border"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Categories Grid Card */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-foreground">Featured Homepage Categories</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addListItem('home_categories', { icon: 'sparkles', title: 'New Category', description: 'Brief description', href: '/parts' })}
                className="gap-1 text-xs text-[#DC2626] hover:bg-[#DC2626]/10"
              >
                <Plus className="size-3.5" /> Add Category
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {categoryItems.length === 0 && (
                <p className="text-xs italic text-muted-foreground py-2">No category cards configured. Click "Add Category" above.</p>
              )}
              {categoryItems.map((cat, idx) => (
                <div key={idx} className="relative rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => removeListItem('home_categories', idx)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-[#DC2626] transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Icon</Label>
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded bg-muted border border-border flex items-center justify-center text-[#DC2626] shrink-0">
                          <IconRenderer name={cat.icon || 'sparkles'} className="size-4" />
                        </div>
                        <select
                          value={cat.icon || 'sparkles'}
                          onChange={(e) => updateListItem('home_categories', idx, 'icon', e.target.value)}
                          className="h-9 bg-muted border border-border text-foreground text-xs rounded px-2 w-full focus:ring-1 focus:ring-[#DC2626]"
                        >
                          {Object.keys(ICON_MAP).map((k) => (
                            <option key={k} value={k}>
                              {k.charAt(0).toUpperCase() + k.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Title</Label>
                      <Input
                        value={cat.title || ''}
                        onChange={(e) => updateListItem('home_categories', idx, 'title', e.target.value)}
                        className="h-9 bg-muted border-border"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Short Description</Label>
                      <Input
                        value={cat.description || ''}
                        onChange={(e) => updateListItem('home_categories', idx, 'description', e.target.value)}
                        className="h-9 bg-muted border-border"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label className="text-xs text-muted-foreground">Link Href</Label>
                      <Input
                        value={cat.href || ''}
                        onChange={(e) => updateListItem('home_categories', idx, 'href', e.target.value)}
                        className="h-9 bg-muted border-border"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#DC2626] text-white hover:bg-[#ef4444] ml-auto gap-2"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Homepage Settings
            </Button>
          </div>
        </div>

        {/* Live Storefront Mockup Side */}
        <div className="xl:col-span-5 xl:sticky xl:top-6 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-1">
            <Sparkles className="size-3.5 text-[#DC2626]" />
            Live Storefront Homepage Preview
          </div>

          <Card className="border border-border/80 overflow-hidden shadow-2xl rounded-xl transition-colors bg-background text-foreground">
            {/* Announcement preview */}
            {get('announcement_enabled') === '1' && (
              <div className="bg-[#DC2626] text-white py-1 px-4 text-[9px] font-semibold text-center tracking-wide transition-all truncate animate-pulse">
                {get('announcement_message') || 'Announcement banner goes here'}
              </div>
            )}

            {/* Store Header Mockup */}
            <div className="px-4 py-3 border-b border-border bg-background flex items-center justify-between text-[10px] text-foreground transition-colors">
              <span className="font-heading font-black tracking-tight flex items-center gap-1 text-foreground transition-colors">
                <span className="bg-[#DC2626] px-1 py-0.5 rounded text-[8px] font-bold text-white">JDM</span>
                JDM TOKYO
              </span>
              <div className="h-6 w-32 rounded border border-border bg-muted flex items-center px-2 text-[8px] text-muted-foreground/60 transition-colors">
                Search parts, makes...
              </div>
              <div className="flex items-center gap-2 text-muted-foreground transition-colors">
                <span className="size-2 rounded-full bg-green-500" />
                Cart (0)
              </div>
            </div>

            <CardContent className="p-5 space-y-6 min-h-[300px] bg-background text-foreground transition-colors">
              {/* 1. Hero Banner Mockup */}
              <div className="relative rounded-lg p-5 border border-border bg-gradient-to-br from-card via-card/90 to-[#DC2626]/5 text-center space-y-2 transition-colors">
                <div className="absolute top-2 right-2 text-[7px] text-[#DC2626] font-black tracking-widest uppercase">
                  DIRECT FROM JAPAN
                </div>
                <h3 className="text-xs font-heading font-black tracking-tight uppercase text-foreground transition-colors leading-tight">
                  {get('hero_title') || 'Premium JDM Engines & Transmissions'}
                </h3>
                <p className="text-[8px] max-w-[240px] mx-auto leading-relaxed text-muted-foreground transition-colors">
                  {get('hero_subtitle') || 'Direct from Japan. Under 65K Miles. Nationwide Shipping.'}
                </p>
                <div className="flex justify-center gap-1.5 pt-1">
                  <div className="px-2.5 py-1 rounded bg-[#DC2626] text-white text-[8px] font-bold shadow-md shadow-red-950/40 cursor-pointer">
                    {get('hero_primary_btn_text') || 'Shop Engines'}
                  </div>
                  <div className="px-2.5 py-1 rounded border border-border bg-muted text-muted-foreground text-[8px] font-bold transition-colors cursor-pointer">
                    {get('hero_secondary_btn_text') || 'Shop Transmissions'}
                  </div>
                </div>
              </div>

              {/* 2. Vehicle Selector Mockup */}
              <div className="rounded-xl border border-border bg-muted/30 p-3 shadow-sm space-y-2">
                <div className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Find My Engine / Transmission
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="h-7 rounded border border-border bg-card text-[8px] text-muted-foreground/60 flex items-center px-1.5 justify-between">
                    Select Make
                    <span className="text-[6px]">▼</span>
                  </div>
                  <div className="h-7 rounded border border-border bg-card text-[8px] text-muted-foreground/60 flex items-center px-1.5 justify-between">
                    Select Model
                    <span className="text-[6px]">▼</span>
                  </div>
                  <div className="h-7 rounded border border-border bg-card text-[8px] text-muted-foreground/60 flex items-center px-1.5 justify-between">
                    Select Year
                    <span className="text-[6px]">▼</span>
                  </div>
                </div>
                <Button className="w-full h-7 bg-[#DC2626] text-white hover:bg-[#ef4444] text-[8px] font-bold uppercase tracking-widest gap-1">
                  Find My Engine
                </Button>
              </div>

              {/* 3. Trust Badges Mockup Section */}
              <div className="space-y-2 pt-2 border-t border-border transition-colors">
                <div className="grid grid-cols-4 gap-2">
                  {badgeItems.length === 0 ? (
                    <div className="col-span-4 text-center py-2 text-[9px] text-muted-foreground transition-colors">
                      No trust badges added
                    </div>
                  ) : (
                    badgeItems.slice(0, 4).map((badge, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center text-center gap-1.5 rounded-xl border border-border bg-card p-2 shadow-xs transition-colors"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg text-[#DC2626] bg-[#DC2626]/5 transition-colors">
                          <IconRenderer name={badge.icon || 'shield'} className="size-3" />
                        </div>
                        <div>
                          <p className="font-heading text-[8px] font-bold uppercase tracking-wide text-foreground transition-colors">
                            {badge.title || 'Badge Title'}
                          </p>
                          <p className="mt-0.5 text-[6px] leading-tight text-muted-foreground transition-colors line-clamp-2">
                            {badge.description || 'Description'}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 4. Categories Cards Mockup Section */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-wide uppercase text-foreground transition-colors">Shop By Category</span>
                  <span className="text-[7px] text-muted-foreground hover:underline transition-colors">View all</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {categoryItems.length === 0 ? (
                    <div className="col-span-3 text-center py-4 text-[9px] border border-dashed border-border/30 rounded text-muted-foreground/50 transition-colors">
                      Categories list is empty
                    </div>
                  ) : (
                    categoryItems.slice(0, 3).map((cat, idx) => {
                      const gradients = [
                        'radial-gradient(ellipse at top right, #DC2626 0%, transparent 60%)',
                        'radial-gradient(ellipse at bottom left, #DC2626 0%, transparent 60%)',
                        'radial-gradient(ellipse at bottom right, #DC2626 0%, transparent 60%)',
                      ];
                      const gradient = gradients[idx % gradients.length];
                      return (
                        <div
                          key={idx}
                          className="relative block h-[100px] overflow-hidden rounded-xl border border-border bg-card hover:border-[#DC2626]/60 shadow-[0_0_12px_rgba(220,38,38,0.05)] transition-all duration-300 group cursor-pointer"
                        >
                          {/* Background gradient */}
                          <div
                            className="absolute inset-0 opacity-15 transition-opacity duration-300 group-hover:opacity-25"
                            style={{ background: gradient }}
                          />

                          {/* Content */}
                          <div className="relative flex h-full flex-col justify-between p-2">
                            {/* Icon */}
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-[#DC2626]/20 bg-[#DC2626]/5 text-[#DC2626] transition-all duration-300">
                              <IconRenderer name={cat.icon || 'sparkles'} className="size-3" />
                            </div>

                            {/* Text */}
                            <div>
                              <h3 className="font-heading text-[8px] font-black uppercase tracking-wide leading-tight text-foreground transition-colors">
                                {cat.title || 'Category'}
                              </h3>
                              <p className="mt-0.5 text-[6px] leading-tight line-clamp-2 text-muted-foreground transition-colors">
                                {cat.description || 'Description'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 5. Product Cards Mockup (Featured Products) */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-wide uppercase text-foreground transition-colors">Featured Products</span>
                  <span className="text-[7px] text-muted-foreground hover:underline transition-colors">View all</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-card p-2 space-y-1.5 relative">
                    <span className="absolute top-1 left-1 bg-red-600 text-white text-[5px] font-black uppercase px-1 rounded-sm">JDM</span>
                    <div className="h-16 w-full rounded bg-muted flex items-center justify-center text-[8px] text-muted-foreground">
                      [Engine Image]
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] font-bold text-foreground truncate">Toyota 2JZ-GTE VVTi Engine</div>
                      <div className="text-[7px] text-muted-foreground">3.0L twin-turbo I6 • Auto</div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[8px] font-bold text-foreground">$4,500.00</span>
                      <div className="bg-[#DC2626] text-white text-[7px] font-bold px-1.5 py-0.5 rounded">Add</div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-2 space-y-1.5 relative">
                    <span className="absolute top-1 left-1 bg-red-600 text-white text-[5px] font-black uppercase px-1 rounded-sm">JDM</span>
                    <div className="h-16 w-full rounded bg-muted flex items-center justify-center text-[8px] text-muted-foreground">
                      [Engine Image]
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] font-bold text-foreground truncate">Nissan RB26DETT Engine</div>
                      <div className="text-[7px] text-muted-foreground">2.6L twin-turbo I6 • AWD</div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[8px] font-bold text-foreground">$7,200.00</span>
                      <div className="bg-[#DC2626] text-white text-[7px] font-bold px-1.5 py-0.5 rounded">Add</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Make Scroll Mockup */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                  Shop Engines & Transmissions by Brand
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar justify-center text-[7px] font-bold uppercase">
                  {['Toyota', 'Honda', 'Nissan', 'Subaru', 'Mazda', 'Mitsubishi'].map((make) => (
                    <div key={make} className="px-2 py-1 rounded border border-border bg-card text-foreground hover:border-[#DC2626] transition-colors cursor-pointer shrink-0">
                      {make}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
