'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Loader2, ArrowLeft, Mail, Phone, MapPin, Clock, Sparkles, Share2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/ThemeProvider';
import { toast } from 'sonner';

export default function ContactFooterSettingsPage() {
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
        if (map['contact_phone'] === undefined || map['contact_phone'].trim() === '') {
          map['contact_phone'] = '+1 (800) 536-8669';
        }
        if (map['contact_email'] === undefined || map['contact_email'].trim() === '') {
          map['contact_email'] = 'sales@jdmtokyomotors.com';
        }
        if (map['contact_address'] === undefined || map['contact_address'].trim() === '') {
          map['contact_address'] = '123 JDM Way, Los Angeles, CA 90001';
        }
        if (map['hours_weekdays'] === undefined || map['hours_weekdays'].trim() === '') {
          map['hours_weekdays'] = '9:00 AM - 5:00 PM PST';
        }
        if (map['hours_saturday'] === undefined || map['hours_saturday'].trim() === '') {
          map['hours_saturday'] = '9:00 AM - 3:00 PM PST';
        }
        if (map['hours_sunday'] === undefined || map['hours_sunday'].trim() === '') {
          map['hours_sunday'] = 'Closed';
        }
        if (map['social_instagram'] === undefined || map['social_instagram'].trim() === '') {
          map['social_instagram'] = 'https://instagram.com/jdmtokyo';
        }
        if (map['social_facebook'] === undefined || map['social_facebook'].trim() === '') {
          map['social_facebook'] = 'https://facebook.com/jdmtokyo';
        }
        if (map['social_tiktok'] === undefined || map['social_tiktok'].trim() === '') {
          map['social_tiktok'] = 'https://tiktok.com/@jdmtokyo';
        }
        if (map['social_x'] === undefined || map['social_x'].trim() === '') {
          map['social_x'] = 'https://x.com/jdmtokyo';
        }
        if (map['footer_description'] === undefined || map['footer_description'].trim() === '') {
          map['footer_description'] = 'Direct importers of premium JDM engines and transmissions from Japan. Sourced directly from Japan.';
        }
        if (map['product_share_enabled'] === undefined || map['product_share_enabled'].trim() === '') {
          map['product_share_enabled'] = '1';
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
        'contact_phone',
        'contact_email',
        'contact_address',
        'hours_weekdays',
        'hours_saturday',
        'hours_sunday',
        'social_instagram',
        'social_facebook',
        'social_tiktok',
        'social_x',
        'footer_description',
        'product_share_enabled',
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

  const inputClass = 'bg-muted border-border text-foreground placeholder:text-muted-foreground/60 text-sm';
  const labelClass = 'text-xs text-muted-foreground';

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
            <Mail className="size-5 text-[#DC2626]" />
            Contact & Footer Settings
          </h1>
          <p className="text-xs text-muted-foreground">Manage public telephone, support emails, operational hours, footer copy, and social buttons.</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Forms Side */}
        <div className="xl:col-span-7 space-y-6">
          {/* Contact Details Card */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <Info className="size-4 text-[#DC2626]" />
                Store Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className={labelClass}>Telephone Number</Label>
                <Input value={get('contact_phone')} onChange={(e) => set('contact_phone', e.target.value)} placeholder="+1 (800) 536-8669" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Sales & Support Email</Label>
                <Input value={get('contact_email')} onChange={(e) => set('contact_email', e.target.value)} placeholder="sales@jdmtokyomotors.com" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <Label className={labelClass}>Physical Showroom Address</Label>
                <Input value={get('contact_address')} onChange={(e) => set('contact_address', e.target.value)} placeholder="123 JDM Way, Los Angeles, CA 90001" className={inputClass} />
              </div>
            </CardContent>
          </Card>

          {/* Business Hours Card */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <Clock className="size-4 text-[#DC2626]" />
                Operational / Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Weekdays (Mon–Fri)</Label>
                  <Input value={get('hours_weekdays')} onChange={(e) => set('hours_weekdays', e.target.value)} placeholder="9:00 AM - 5:00 PM PST" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Saturday</Label>
                  <Input value={get('hours_saturday')} onChange={(e) => set('hours_saturday', e.target.value)} placeholder="9:00 AM - 3:00 PM PST" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Sunday</Label>
                  <Input value={get('hours_sunday')} onChange={(e) => set('hours_sunday', e.target.value)} placeholder="Closed" className={inputClass} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links & Share buttons */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <Share2 className="size-4 text-[#DC2626]" />
                Social Connections & Product Share
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Instagram URL</Label>
                  <Input value={get('social_instagram')} onChange={(e) => set('social_instagram', e.target.value)} placeholder="https://instagram.com/jdmtokyo" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Facebook URL</Label>
                  <Input value={get('social_facebook')} onChange={(e) => set('social_facebook', e.target.value)} placeholder="https://facebook.com/jdmtokyo" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>TikTok URL</Label>
                  <Input value={get('social_tiktok')} onChange={(e) => set('social_tiktok', e.target.value)} placeholder="https://tiktok.com/@jdmtokyo" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Twitter / X URL</Label>
                  <Input value={get('social_x')} onChange={(e) => set('social_x', e.target.value)} placeholder="https://x.com/jdmtokyo" className={inputClass} />
                </div>
              </div>

              <Separator className="bg-border my-2" />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm text-foreground font-semibold">Enable Share Buttons</Label>
                  <p className="text-xs text-muted-foreground">Show social media share triggers on product detail pages</p>
                </div>
                <Switch
                  checked={get('product_share_enabled', '1') !== '0'}
                  onCheckedChange={(v) => set('product_share_enabled', v ? '1' : '0')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Footer overrides */}
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-sm text-foreground">Footer Branding Info</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-1.5">
                <Label className={labelClass}>Footer Slogan Description Override</Label>
                <textarea
                  value={get('footer_description')}
                  onChange={(e) => set('footer_description', e.target.value)}
                  placeholder="Direct importers of premium JDM engines and transmissions from Japan..."
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 text-sm min-h-[80px] w-full rounded-md border px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
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
              Save Sourcing Settings
            </Button>
          </div>
        </div>

        {/* Live Storefront Mockup Side */}
        <div className="xl:col-span-5 xl:sticky xl:top-6 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-1">
            <Sparkles className="size-3.5 text-[#DC2626]" />
            Live Storefront Contact & Footer Preview
          </div>

          <Card className={cn(
            "border border-border/80 overflow-hidden shadow-2xl rounded-xl transition-colors",
            isDark ? "bg-zinc-950" : "bg-white"
          )}>
            <div className={cn(
              "px-4 py-2 border-b text-[9px] text-center font-semibold uppercase transition-colors",
              isDark ? "bg-zinc-900 border-border/40 text-muted-foreground" : "bg-zinc-50 border-zinc-200 text-zinc-500"
            )}>
              MOCK STOREFRONT CONTACT PAGE
            </div>

            <ScrollArea className="h-[480px] p-5">
              {/* Contact Page Preview */}
              <div className="space-y-6 pb-6 text-left">
                {/* Breadcrumbs Mockup */}
                <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                  <span>Home</span>
                  <span>/</span>
                  <span>Contact Us</span>
                </div>

                {/* Page Title & Subtitle */}
                <div className="space-y-2 py-4">
                  <h1 className={cn(
                    "font-heading text-2xl font-bold uppercase tracking-wide transition-colors",
                    isDark ? "text-white" : "text-zinc-950"
                  )}>
                    Contact Us
                  </h1>
                  <p className={cn(
                    "text-[10px] leading-relaxed transition-colors",
                    isDark ? "text-muted-foreground" : "text-zinc-500"
                  )}>
                    Have questions about fitment, shipping, or warranty? Get in touch with our team of JDM specialists.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Form Mockup */}
                  <div className={cn(
                    "p-3 rounded-lg border text-[8px] space-y-2.5 transition-colors",
                    isDark ? "bg-zinc-900/20 border-border" : "bg-zinc-50/50 border-zinc-200"
                  )}>
                    <p className="font-bold text-foreground">Send us a message</p>
                    <div className="space-y-1">
                      <div className="h-6 w-full rounded border bg-muted/30 border-border/60 px-1.5 flex items-center text-[7px] text-muted-foreground/60">Name</div>
                      <div className="h-6 w-full rounded border bg-muted/30 border-border/60 px-1.5 flex items-center text-[7px] text-muted-foreground/60">Email</div>
                      <div className="h-10 w-full rounded border bg-muted/30 border-border/60 px-1.5 pt-1 text-[7px] text-muted-foreground/60">Your message...</div>
                    </div>
                    <div className="h-6 w-full rounded bg-[#DC2626] text-white flex items-center justify-center font-bold text-[7px]">
                      Send Message
                    </div>
                  </div>

                  {/* Info Cards Mockup */}
                  <div className="space-y-3">
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-[9px] shadow-sm transition-colors",
                      isDark ? "border-border bg-card hover:border-[#DC2626]/40" : "border-zinc-200 bg-white hover:border-[#DC2626]/40"
                    )}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DC2626]/10 shrink-0">
                        <Phone className="size-4 text-[#DC2626]" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Phone</p>
                        <p className="mt-0.5 text-[8px] text-muted-foreground">{get('contact_phone') || '+1 (800) 536-8669'}</p>
                      </div>
                    </div>

                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-[9px] shadow-sm transition-colors",
                      isDark ? "border-border bg-card hover:border-[#DC2626]/40" : "border-zinc-200 bg-white hover:border-[#DC2626]/40"
                    )}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DC2626]/10 shrink-0">
                        <Mail className="size-4 text-[#DC2626]" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Email</p>
                        <p className="mt-0.5 text-[8px] text-muted-foreground">{get('contact_email') || 'sales@jdmtokyomotors.com'}</p>
                      </div>
                    </div>

                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-[9px] shadow-sm transition-colors",
                      isDark ? "border-border bg-card" : "border-zinc-200 bg-white"
                    )}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DC2626]/10 shrink-0">
                        <MapPin className="size-4 text-[#DC2626]" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Address</p>
                        <p className="mt-0.5 text-[8px] text-muted-foreground whitespace-pre-line">{get('contact_address') || '123 JDM Way, Los Angeles, CA 90001'}</p>
                      </div>
                    </div>

                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-[9px] shadow-sm transition-colors",
                      isDark ? "border-border bg-card" : "border-zinc-200 bg-white"
                    )}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DC2626]/10 shrink-0">
                        <Clock className="size-4 text-[#DC2626]" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Business Hours</p>
                        <div className="mt-1 space-y-0.5 text-[7px] text-muted-foreground">
                          <p><span className="font-medium text-foreground/80">Mon – Fri:</span> {get('hours_weekdays')}</p>
                          {get('hours_saturday') && <p><span className="font-medium text-foreground/80">Sat:</span> {get('hours_saturday')}</p>}
                          {get('hours_sunday') && <p><span className="font-medium text-foreground/80">Sun:</span> {get('hours_sunday')}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Site Footer preview block */}
              <div className={cn(
                "pt-6 border-t space-y-4 transition-colors",
                isDark ? "border-border/30" : "border-zinc-200"
              )}>
                <h4 className={cn(
                  "text-[9px] font-bold uppercase tracking-widest text-center transition-colors",
                  isDark ? "text-white" : "text-zinc-950"
                )}>Footer Layout Mockup</h4>
                
                <div className={cn(
                  "rounded-lg p-5 border text-[8px] space-y-6 transition-colors",
                  isDark ? "bg-zinc-950 border-border/40" : "bg-white border-zinc-200"
                )}>
                  {/* Footer Top Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Brand Column */}
                    <div className="space-y-2">
                      <span className={cn(
                        "font-heading font-black tracking-tight flex items-center gap-1 transition-colors",
                        isDark ? "text-white" : "text-zinc-950"
                      )}>
                        <span className="bg-[#DC2626] px-1 py-0.5 rounded text-[6px] font-bold text-white">JDM</span>
                        JDM TOKYO
                      </span>
                      <p className={cn(
                        "leading-relaxed text-[7px] transition-colors",
                        isDark ? "text-muted-foreground" : "text-zinc-500"
                      )}>
                        {get('footer_description') || 'Direct importers of premium JDM engines and transmissions from Japan.'}
                      </p>
                      {/* Social icons */}
                      <div className="flex gap-2 pt-1">
                        {get('social_instagram') && <span className="flex size-5 items-center justify-center rounded border border-border text-[6px] text-muted-foreground hover:text-[#DC2626]">IG</span>}
                        {get('social_facebook') && <span className="flex size-5 items-center justify-center rounded border border-border text-[6px] text-muted-foreground hover:text-[#DC2626]">FB</span>}
                        {get('social_tiktok') && <span className="flex size-5 items-center justify-center rounded border border-border text-[6px] text-muted-foreground hover:text-[#DC2626]">TT</span>}
                        {get('social_x') && <span className="flex size-5 items-center justify-center rounded border border-border text-[6px] text-muted-foreground hover:text-[#DC2626]">X</span>}
                      </div>
                    </div>

                    {/* Quick Links Column */}
                    <div className="space-y-1.5 text-left pl-2">
                      <p className={cn("font-bold uppercase tracking-wider text-[8px]", isDark ? "text-white" : "text-zinc-950")}>Quick Links</p>
                      <ul className="space-y-1 text-[7px] text-muted-foreground">
                        <li>JDM Engines</li>
                        <li>JDM Transmissions</li>
                        <li>About Us</li>
                        <li>Contact Us</li>
                      </ul>
                    </div>
                  </div>

                  <div className={cn("h-[1px] w-full transition-colors", isDark ? "bg-border/20" : "bg-zinc-200")} />

                  {/* Sourcing Contact details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                      <p className={cn("font-bold uppercase text-[7px] flex items-center gap-1", isDark ? "text-white" : "text-zinc-950")}>
                        <Phone className="size-2 text-[#DC2626]" /> Call Support
                      </p>
                      <p className="text-[7px] text-muted-foreground">{get('contact_phone')}</p>
                      <p className="text-[7px] text-muted-foreground">{get('contact_email')}</p>
                    </div>

                    <div className="space-y-1 text-left pl-2">
                      <p className={cn("font-bold uppercase text-[7px] flex items-center gap-1", isDark ? "text-white" : "text-zinc-950")}>
                        <Clock className="size-2 text-[#DC2626]" /> Hours
                      </p>
                      <p className="text-[6.5px] text-muted-foreground">Mon-Fri: {get('hours_weekdays')}</p>
                      {get('hours_saturday') && <p className="text-[6.5px] text-muted-foreground">Sat: {get('hours_saturday')}</p>}
                    </div>
                  </div>

                  {/* Bottom bar */}
                  <div className={cn(
                    "pt-3 border-t flex flex-col sm:flex-row items-center justify-between text-muted-foreground text-[6px] gap-2 transition-colors",
                    isDark ? "border-border/10" : "border-zinc-200"
                  )}>
                    <span>© {new Date().getFullYear()} JDM Tokyo. All rights reserved.</span>
                    <span>Built by <span className="text-[#DC2626] font-bold">Ltiora</span></span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
