'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Loader2, ArrowLeft, Info, Sparkles, BookOpen, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconRenderer, ICON_MAP } from '@/components/admin/IconRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/ThemeProvider';
import { toast } from 'sonner';

const VALUES_KEYS = ['quality', 'warranty', 'source', 'mileage', 'support', 'shipping'];

export default function AboutSettingsPage() {
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

        // Prefill default settings when not available from DB
        if (map['about_story_p1'] === undefined || map['about_story_p1'].trim() === '') {
          map['about_story_p1'] = 'JDM Tokyo Motorsports was founded by a group of passionate JDM enthusiasts who saw a gap in the market for reliable, quality-inspected Japanese engines and transmissions in the United States.';
        }
        if (map['about_story_p2'] === undefined || map['about_story_p2'].trim() === '') {
          map['about_story_p2'] = 'We established direct relationships with trusted dismantlers and importers in Japan, allowing us to source low-mileage units — typically under 65,000 miles — that meet our strict quality standards before they ever leave Japan.';
        }
        if (map['about_story_p3'] === undefined || map['about_story_p3'].trim() === '') {
          map['about_story_p3'] = 'Today, we ship nationwide and have helped thousands of customers find the perfect engine or transmission for their build, swap, or repair. Our team of experts is always available to help you find the right fitment.';
        }

        const valueDefaults: Record<string, { title: string; desc: string; icon: string }> = {
          quality: {
            title: 'Quality First',
            desc: 'Every unit is inspected and compression-tested before shipping. We stand behind every product we sell.',
            icon: 'shield',
          },
          warranty: {
            title: '30-Day Warranty',
            desc: 'Every engine and transmission comes with a 30-day warranty against defects and compression failures.',
            icon: 'star',
          },
          source: {
            title: 'Trusted Source',
            desc: 'Every unit is sourced from verified dismantlers and importers in Japan with full documentation and history.',
            icon: 'globe',
          },
          mileage: {
            title: 'Low Mileage',
            desc: 'Most of our engines and transmissions have under 65,000 miles — ensuring reliability and longevity for your build.',
            icon: 'zap',
          },
          support: {
            title: 'Expert Support',
            desc: 'Our team of JDM specialists is available by phone and email to help with fitment questions and technical support.',
            icon: 'users',
          },
          shipping: {
            title: 'Nationwide Shipping',
            desc: 'We ship to all 50 states via freight carriers. Business and residential delivery options available.',
            icon: 'truck',
          },
        };

        for (const key of VALUES_KEYS) {
          const titleKey = `about_value_${key}_title`;
          const descKey = `about_value_${key}_desc`;
          const iconKey = `about_value_${key}_icon`;
          const def = valueDefaults[key];

          if (map[titleKey] === undefined || map[titleKey].trim() === '') {
            map[titleKey] = def.title;
          }
          if (map[descKey] === undefined || map[descKey].trim() === '') {
            map[descKey] = def.desc;
          }
          if (map[iconKey] === undefined || map[iconKey].trim() === '') {
            map[iconKey] = def.icon;
          }
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
        'about_story_p1',
        'about_story_p2',
        'about_story_p3',
        ...VALUES_KEYS.map(k => `about_value_${k}_title`),
        ...VALUES_KEYS.map(k => `about_value_${k}_desc`),
        ...VALUES_KEYS.map(k => `about_value_${k}_icon`),
      ];
      const entries = keysToSave.map((key) => ({ key, value: get(key) }));
      await adminApi.put('/admin/settings/bulk', { settings: entries });
      toast.success(t('savedSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const textareaClass = 'bg-muted border-border text-foreground placeholder:text-muted-foreground/60 text-sm min-h-[100px] w-full rounded-md border px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-[#DC2626]';

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
      </div>
    );
  }

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
            <Info className="size-5 text-[#DC2626]" />
            About Page Content Editor
          </h1>
          <p className="text-xs text-muted-foreground">Modify company stories, vision details, values, and features of JDM Tokyo.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Forms Side */}
        <div className="xl:col-span-7 space-y-6">
          {/* Story paragraphs */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <BookOpen className="size-4 text-[#DC2626]" />
                Our Story Paragraphs
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Paragraph 1: Origin Story</Label>
                <textarea
                  value={get('about_story_p1')}
                  onChange={(e) => set('about_story_p1', e.target.value)}
                  placeholder="JDM Tokyo Motorsports was founded by a group of passionate JDM enthusiasts..."
                  className={textareaClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Paragraph 2: Operations & Quality Sourcing</Label>
                <textarea
                  value={get('about_story_p2')}
                  onChange={(e) => set('about_story_p2', e.target.value)}
                  placeholder="We established direct relationships with trusted dismantlers in Japan..."
                  className={textareaClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Paragraph 3: Vision & Growth</Label>
                <textarea
                  value={get('about_story_p3')}
                  onChange={(e) => set('about_story_p3', e.target.value)}
                  placeholder="Today, we ship nationwide and have helped thousands of customers find the perfect engine..."
                  className={textareaClass}
                />
              </div>
            </CardContent>
          </Card>

          {/* Value Cards grid */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <Star className="size-4 text-[#DC2626]" />
                Company Core Values & Features
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {VALUES_KEYS.map((key) => {
                const iconKey = `about_value_${key}_icon`;
                const titleKey = `about_value_${key}_title`;
                const descKey = `about_value_${key}_desc`;

                return (
                  <div key={key} className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#DC2626]">
                      Value Block: {key.toUpperCase()}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Icon</Label>
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded bg-muted border border-border flex items-center justify-center text-[#DC2626] shrink-0">
                            <IconRenderer name={get(iconKey, key === 'quality' ? 'shield' : key === 'support' ? 'users' : key === 'shipping' ? 'truck' : 'star')} className="size-4" />
                          </div>
                          <select
                            value={get(iconKey, key === 'quality' ? 'shield' : key === 'support' ? 'users' : key === 'shipping' ? 'truck' : 'star')}
                            onChange={(e) => set(iconKey, e.target.value)}
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
                          value={get(titleKey)}
                          onChange={(e) => set(titleKey, e.target.value)}
                          placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} Title`}
                          className="h-9 bg-muted border-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Input
                        value={get(descKey)}
                        onChange={(e) => set(descKey, e.target.value)}
                        placeholder={`Details about ${key}...`}
                        className="h-9 bg-muted border-border"
                      />
                    </div>
                  </div>
                );
              })}
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
              Save About Settings
            </Button>
          </div>
        </div>

        {/* Live Storefront Mockup Side */}
        <div className="xl:col-span-5 xl:sticky xl:top-6 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-1">
            <Sparkles className="size-3.5 text-[#DC2626]" />
            Live Storefront About Page Preview
          </div>

          <Card className={cn(
            "border border-border/80 overflow-hidden shadow-2xl rounded-xl transition-colors",
            isDark ? "bg-zinc-950" : "bg-white"
          )}>
            {/* Header announcement block mockup */}
            <div className={cn(
              "px-4 py-2 border-b text-[9px] text-center font-semibold uppercase transition-colors",
              isDark ? "bg-zinc-900 border-border/40 text-muted-foreground" : "bg-zinc-50 border-zinc-200 text-zinc-500"
            )}>
              MOCK STOREFRONT ABOUT PAGE
            </div>

            <ScrollArea className="h-[520px] p-5">
              <div className="space-y-6 pb-6 text-left">
                {/* Breadcrumbs Mockup */}
                <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                  <span>Home</span>
                  <span>/</span>
                  <span>About Us</span>
                </div>

                {/* Page Title & Subtitle */}
                <div className="text-center space-y-2 py-4">
                  <h1 className={cn(
                    "font-heading text-2xl font-bold uppercase tracking-wide transition-colors",
                    isDark ? "text-white" : "text-zinc-950"
                  )}>
                    About Us
                  </h1>
                  <p className={cn(
                    "mx-auto mt-2 max-w-[280px] text-[10px] leading-relaxed transition-colors",
                    isDark ? "text-muted-foreground" : "text-zinc-500"
                  )}>
                    JDM Tokyo Motorsports is your trusted source for premium Japanese domestic market engines and transmissions, sourced directly from Japan.
                  </p>
                </div>

                <div className={cn("h-[1px] w-full transition-colors", isDark ? "bg-border/30" : "bg-zinc-200")} />

                {/* Our Story section */}
                <section className="space-y-3">
                  <h2 className={cn(
                    "font-heading text-xs font-bold uppercase tracking-wide transition-colors",
                    isDark ? "text-white" : "text-zinc-950"
                  )}>
                    Our Story
                  </h2>
                  <div className={cn(
                    "space-y-2 text-[8px] leading-relaxed transition-colors",
                    isDark ? "text-muted-foreground" : "text-zinc-600"
                  )}>
                    {get('about_story_p1') && <p>{get('about_story_p1')}</p>}
                    {get('about_story_p2') && <p>{get('about_story_p2')}</p>}
                    {get('about_story_p3') && <p>{get('about_story_p3')}</p>}
                  </div>
                </section>

                <div className={cn("h-[1px] w-full transition-colors", isDark ? "bg-border/30" : "bg-zinc-200")} />

                {/* Values section preview */}
                <section className="space-y-4">
                  <h2 className={cn(
                    "font-heading text-xs font-bold uppercase tracking-wide transition-colors",
                    isDark ? "text-white" : "text-zinc-950"
                  )}>
                    Our Values
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {VALUES_KEYS.map((key) => {
                      const icon = get(`about_value_${key}_icon`, key === 'quality' ? 'shield' : key === 'support' ? 'users' : key === 'shipping' ? 'truck' : 'star');
                      const title = get(`about_value_${key}_title`, key.charAt(0).toUpperCase() + key.slice(1));
                      const desc = get(`about_value_${key}_desc`, 'Details and features representation.');

                      return (
                        <div
                          key={key}
                          className={cn(
                            "rounded-lg border p-3.5 shadow-xs flex flex-col justify-start transition-colors",
                            isDark ? "border-border bg-card" : "border-zinc-200 bg-white"
                          )}
                        >
                          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#DC2626]/10 shrink-0">
                            <IconRenderer name={icon} className="size-4 text-[#DC2626]" />
                          </div>
                          <div>
                            <h3 className={cn(
                              "font-heading text-[9px] font-bold text-foreground transition-colors",
                              isDark ? "text-white" : "text-zinc-950"
                            )}>
                              {title}
                            </h3>
                            <p className={cn(
                              "mt-1 text-[7px] leading-relaxed transition-colors",
                              isDark ? "text-muted-foreground" : "text-zinc-500"
                            )}>
                              {desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <div className={cn("h-[1px] w-full transition-colors", isDark ? "bg-border/30" : "bg-zinc-200")} />

                {/* Why Choose Us Section */}
                <section className="space-y-3">
                  <h2 className={cn(
                    "font-heading text-xs font-bold uppercase tracking-wide transition-colors",
                    isDark ? "text-white" : "text-zinc-950"
                  )}>
                    Why Choose JDM Tokyo Motorsports
                  </h2>
                  <div className={cn(
                    "space-y-2 text-[8px] leading-relaxed transition-colors",
                    isDark ? "text-muted-foreground" : "text-zinc-600"
                  )}>
                    <p>When you buy from JDM Tokyo Motorsports, you're getting a unit that has been sourced, inspected, and vetted by people who love these engines as much as you do. We don't just sell parts — we help you build.</p>
                    <p>With over 10 years of importing experience and thousands of satisfied customers, we are one of the most trusted JDM suppliers in the United States. Our transparent process, honest descriptions, and responsive customer service set us apart.</p>
                  </div>
                </section>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
