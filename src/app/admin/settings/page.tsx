'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Home,
  Info,
  Mail,
  ShieldCheck,
  Truck,
  Sliders,
  Settings2,
  DollarSign,
  MapPin,
  ExternalLink,
  CheckCircle,
  Car,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { US_STATES } from '@/lib/us-cities';
import { cn } from '@/lib/utils';
import { City } from 'country-state-city';

interface SaleCondition {
  id: string;
  rule_key: string;
  rule_value: string;
  description?: string;
  is_active: boolean;
}

interface GroupedZone {
  state_code: string | null;
  city: string | null;
  rates: {
    forklift?: number;
    no_forklift?: number;
    liftgate?: number;
    residential_delivery?: number;
  };
  ids: {
    forklift?: string;
    no_forklift?: string;
    liftgate?: string;
    residential_delivery?: string;
  };
  is_active: boolean;
}

const getGroupedZones = (zones: any[]): GroupedZone[] => {
  const map: Record<string, GroupedZone> = {};
  for (const z of zones) {
    const key = `${z.state_code ?? 'default'}:${z.city ?? 'all'}`;
    if (!map[key]) {
      map[key] = {
        state_code: z.state_code,
        city: z.city,
        rates: {},
        ids: {},
        is_active: z.is_active,
      };
    }
    map[key].rates[z.zone_type as 'forklift' | 'no_forklift' | 'liftgate' | 'residential_delivery'] = z.rate_cents;
    map[key].ids[z.zone_type as 'forklift' | 'no_forklift' | 'liftgate' | 'residential_delivery'] = z.id;
    if (z.is_active) map[key].is_active = true;
  }
  return Object.values(map);
};

export default function AdminSettingsPage() {
  const t = useTranslations('admin.settingsPage');
  const router = useRouter();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Active sub-section for settings in-page configs
  const [activeConfigTab, setActiveConfigTab] = useState<'checkout' | 'shipping'>('checkout');

  // Shipping zones state
  const [shippingZones, setShippingZones] = useState<Array<{
    id: string;
    state_code: string | null;
    city: string | null;
    zone_type: string;
    rate_cents: number;
    is_active: boolean;
  }>>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null);
  const [deleteZoneGroup, setDeleteZoneGroup] = useState<GroupedZone | null>(null);
  const [editingZoneGroup, setEditingZoneGroup] = useState<GroupedZone | null>(null);
  const [newZoneScope, setNewZoneScope] = useState<'default' | 'specific'>('specific');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [applyStateWide, setApplyStateWide] = useState(true);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [rateForklift, setRateForklift] = useState('');
  const [rateNoForklift, setRateNoForklift] = useState('');
  const [rateLiftgate, setRateLiftgate] = useState('');
  const [rateResidential, setRateResidential] = useState('');

  const [showCarrierDialog, setShowCarrierDialog] = useState(false);
  const [editingCarrierIdx, setEditingCarrierIdx] = useState<number | null>(null);
  const [carrierForm, setCarrierForm] = useState({ name: '', tracking_url: '' });
  const [deleteCarrierIdx, setDeleteCarrierIdx] = useState<number | null>(null);

  const checkOverlaps = useCallback((): string[] => {
    const warnings: string[] = [];
    const currentGroupKey = editingZoneGroup
      ? `${editingZoneGroup.state_code ?? 'default'}:${editingZoneGroup.city ?? 'all'}`
      : null;

    const currentZones = shippingZones.filter((z) => {
      const key = `${z.state_code ?? 'default'}:${z.city ?? 'all'}`;
      return key !== currentGroupKey;
    });

    if (newZoneScope === 'default') {
      const hasDefault = currentZones.some((z) => !z.state_code && !z.city);
      if (hasDefault) {
        warnings.push('A default rate is already configured and will be overwritten.');
      }
    } else {
      for (const state of selectedStates) {
        if (applyStateWide) {
          const hasStateWide = currentZones.some((z) => z.state_code === state && !z.city);
          if (hasStateWide) {
            warnings.push(`A state-wide rate for ${state} is already configured and will be overwritten.`);
          }
          const citiesExist = currentZones.filter((z) => z.state_code === state && z.city);
          if (citiesExist.length > 0) {
            const uniqueCities = Array.from(new Set(citiesExist.map((z) => z.city)));
            warnings.push(`State-wide rate for ${state} will overlap with existing city rates: ${uniqueCities.join(', ')}.`);
          }
        } else {
          const stateCities = City.getCitiesOfState('US', state).map((c) => c.name);
          for (const city of selectedCities) {
            if (!stateCities.includes(city)) continue;

            const hasExact = currentZones.some((z) => z.state_code === state && z.city === city);
            if (hasExact) {
              warnings.push(`A rate for ${city}, ${state} is already configured and will be overwritten.`);
            }
          }
        }
      }
    }
    return warnings;
  }, [editingZoneGroup, shippingZones, newZoneScope, selectedStates, applyStateWide, selectedCities]);

  // Load Main Settings
  useEffect(() => {
    adminApi
      .get<{ success: boolean; data: SaleCondition[] }>('/admin/settings')
      .then((res) => {
        const map: Record<string, string> = {};
        for (const row of res.data) {
          map[row.rule_key] = row.rule_value;
        }
        setSettings(map);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load settings');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const get = useCallback((key: string, fallback = '') => settings[key] ?? fallback, [settings]);
  const set = useCallback((key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  // Load Shipping Zones
  const loadZones = useCallback(() => {
    setIsLoadingZones(true);
    adminApi
      .get<{ success: boolean; data: any[] }>('/admin/shipping-zones')
      .then((res) => setShippingZones(res.data ?? []))
      .catch(() => { })
      .finally(() => setIsLoadingZones(false));
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  const handleSaveBulk = async () => {
    setIsSaving(true);
    try {
      const keys = [
        'max_items_per_product',
        'show_out_of_stock',
        'max_inventory_per_restock',
        'free_shipping_threshold_cents',
        'shipping_business_cents',
        'shipping_residential_cents',
        'shipping_carriers',
        'discount_threshold_cents',
        'discount_percentage',
      ];
      const entries = keys.map((key) => ({ key, value: get(key) }));
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

  if (loadError) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">{t('title')}</h1>
        <div className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/10 px-4 py-3">
          <p className="text-sm text-[#DC2626]">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner Header */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-zinc-100 via-zinc-50 to-red-50/20 dark:from-zinc-950 dark:via-zinc-900 dark:to-red-950/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-black text-foreground tracking-tight uppercase flex items-center gap-2.5">
            <Settings2 className="size-6 text-[#DC2626]" />
            Branding & Storefront Settings
          </h1>
          <p className="text-xs text-muted-foreground">
            Modify the UI layout, copy, icons, policies, and shipping rules of your JDM public store pages.
          </p>
        </div>
      </div>

      {/* MODULAR PAGE CONTENT EDITORS - NAVIGATION CARDS */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold tracking-wider uppercase text-muted-foreground/80 px-1">
          Public Pages Layout Editors
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Navbar Editor Card */}
          <Card
            onClick={() => router.push('/admin/settings/navbar')}
            className="group border border-border/80 bg-card/60 hover:border-[#DC2626]/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer shadow-md"
          >
            <CardHeader className="p-4 space-y-1">
              <div className="size-9 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center text-[#DC2626] group-hover:scale-105 transition-transform">
                <Sliders className="size-4.5" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground pt-1.5 group-hover:text-[#DC2626] transition-colors">
                Navbar Links Configuration
              </CardTitle>
              <CardDescription className="text-[11px] leading-relaxed">
                Manage which brands are shown on main nav vs other brands dropdown, add custom links, and reorder.
              </CardDescription>
            </CardHeader>
          </Card>
          {/* Vehicle Data Card */}
          <Card
            onClick={() => router.push('/admin/settings/vehicles')}
            className="group border border-border/80 bg-card/60 hover:border-[#DC2626]/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer shadow-md"
          >
            <CardHeader className="p-4 space-y-1">
              <div className="size-9 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center text-[#DC2626] group-hover:scale-105 transition-transform">
                <Car className="size-4.5" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground pt-1.5 group-hover:text-[#DC2626] transition-colors">
                Vehicle Data
              </CardTitle>
              <CardDescription className="text-[11px] leading-relaxed">
                Manage makes, models, and year ranges used across storefront filters, search, and product forms.
              </CardDescription>
            </CardHeader>
          </Card>
          {/* Homepage Editor Card */}
          <Card
            onClick={() => router.push('/admin/settings/home')}
            className="group border border-border/80 bg-card/60 hover:border-[#DC2626]/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer shadow-md"
          >
            <CardHeader className="p-4 space-y-1">
              <div className="size-9 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center text-[#DC2626] group-hover:scale-105 transition-transform">
                <Home className="size-4.5" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground pt-1.5 group-hover:text-[#DC2626] transition-colors">
                Homepage UI Content
              </CardTitle>
              <CardDescription className="text-[11px] leading-relaxed">
                Edit hero sliders, announcement banners, home category tiles, and value badges.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* About Page Editor Card */}
          <Card
            onClick={() => router.push('/admin/settings/about')}
            className="group border border-border/80 bg-card/60 hover:border-[#DC2626]/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer shadow-md"
          >
            <CardHeader className="p-4 space-y-1">
              <div className="size-9 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center text-[#DC2626] group-hover:scale-105 transition-transform">
                <Info className="size-4.5" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground pt-1.5 group-hover:text-[#DC2626] transition-colors">
                About Page Content
              </CardTitle>
              <CardDescription className="text-[11px] leading-relaxed">
                Update the official brand timeline history paragraphs and core value highlights.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Order Confirmation Page Editor Card */}
          <Card
            onClick={() => router.push('/admin/settings/order-confirmation')}
            className="group border border-border/80 bg-card/60 hover:border-[#DC2626]/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer shadow-md"
          >
            <CardHeader className="p-4 space-y-1">
              <div className="size-9 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center text-[#DC2626] group-hover:scale-105 transition-transform">
                <CheckCircle className="size-4.5" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground pt-1.5 group-hover:text-[#DC2626] transition-colors">
                Order Confirmation Page
              </CardTitle>
              <CardDescription className="text-[11px] leading-relaxed">
                Edit the post-checkout thank-you page copy, steps timeline, and button destination.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Contact Page Editor Card */}
          <Card
            onClick={() => router.push('/admin/settings/contact-footer')}
            className="group border border-border/80 bg-card/60 hover:border-[#DC2626]/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer shadow-md"
          >
            <CardHeader className="p-4 space-y-1">
              <div className="size-9 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center text-[#DC2626] group-hover:scale-105 transition-transform">
                <Mail className="size-4.5" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground pt-1.5 group-hover:text-[#DC2626] transition-colors">
                Contact & Footers
              </CardTitle>
              <CardDescription className="text-[11px] leading-relaxed">
                Configure phone, support email, showroom hours, address, and social links.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Policies Page Editor Card */}
          <Card
            onClick={() => router.push('/admin/settings/policies')}
            className="group border border-border/80 bg-card/60 hover:border-[#DC2626]/50 hover:bg-muted/30 transition-all duration-200 cursor-pointer shadow-md"
          >
            <CardHeader className="p-4 space-y-1">
              <div className="size-9 rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/20 flex items-center justify-center text-[#DC2626] group-hover:scale-105 transition-transform">
                <ShieldCheck className="size-4.5" />
              </div>
              <CardTitle className="text-sm font-bold text-foreground pt-1.5 group-hover:text-[#DC2626] transition-colors">
                Legal & Store Policies
              </CardTitle>
              <CardDescription className="text-[11px] leading-relaxed">
                Edit warranty coverage, return periods, shipping terms, and privacy protocols.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CORE OPERATIONAL INPUTS & IN-PAGE FORM */}
      <div className="space-y-4">
        {/* Core Rules Section Toggle tabs */}
        <div className="flex border-b border-border gap-6">
          <button
            onClick={() => setActiveConfigTab('checkout')}
            className={cn(
              'pb-2.5 text-sm font-semibold transition-all relative',
              activeConfigTab === 'checkout'
                ? 'text-[#DC2626] border-b-2 border-[#DC2626]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Storefront & Checkout Rules
          </button>
          <button
            onClick={() => setActiveConfigTab('shipping')}
            className={cn(
              'pb-2.5 text-sm font-semibold transition-all relative',
              activeConfigTab === 'shipping'
                ? 'text-[#DC2626] border-b-2 border-[#DC2626]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Fulfillment & Shipping Rates
          </button>
        </div>

        {/* Storefront & Checkout Tab content */}
        {activeConfigTab === 'checkout' && (
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm text-foreground flex items-center gap-2">
                  <Sliders className="size-4 text-[#DC2626]" />
                  Inventory Constraints & Stripe Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-foreground">Max items per product per order</Label>
                    <p className="text-xs text-muted-foreground">Limits checkouts to avoid bulk clearing</p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={get('max_items_per_product', '1')}
                    onChange={(e) => set('max_items_per_product', e.target.value)}
                    className={cn(inputClass, 'w-24')}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/30 pt-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-foreground">Show out-of-stock products</Label>
                    <p className="text-xs text-muted-foreground">Allows users to see catalog items even with zero quantity</p>
                  </div>
                  <Switch
                    checked={get('show_out_of_stock') === '1'}
                    onCheckedChange={(v) => set('show_out_of_stock', v ? '1' : '0')}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border/30 pt-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold text-foreground">Max inventory per restock</Label>
                    <p className="text-xs text-muted-foreground">Threshold default limit for inventory updates</p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={get('max_inventory_per_restock', '5')}
                    onChange={(e) => set('max_inventory_per_restock', e.target.value)}
                    className={cn(inputClass, 'w-24')}
                  />
                </div>


              </CardContent>
            </Card>
          </div>
        )}

        {/* Shipping Tab content */}
        {activeConfigTab === 'shipping' && (
          <div className="space-y-6">
            {/* Free Shipping & default rates */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-sm text-foreground flex items-center gap-2">
                  <DollarSign className="size-4 text-[#DC2626]" />
                  Global Base Delivery Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>Free shipping threshold amount (USD)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={get('free_shipping_threshold_cents') ? String(Number(get('free_shipping_threshold_cents')) / 100) : ''}
                    onChange={(e) => set('free_shipping_threshold_cents', e.target.value ? String(Math.round(Number(e.target.value) * 100)) : '0')}
                    placeholder="e.g. 5000"
                    className={inputClass}
                  />
                  <p className="text-[11px] text-muted-foreground/60">Free freight when checkout subtotal crosses this. Set to 0 to disable.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Default Business Shipping Rate (USD)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={get('shipping_business_cents') ? String(Number(get('shipping_business_cents')) / 100) : ''}
                      onChange={(e) => set('shipping_business_cents', e.target.value ? String(Math.round(Number(e.target.value) * 100)) : '0')}
                      placeholder="500"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Default Residential Shipping Rate (USD)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={get('shipping_residential_cents') ? String(Number(get('shipping_residential_cents')) / 100) : ''}
                      onChange={(e) => set('shipping_residential_cents', e.target.value ? String(Math.round(Number(e.target.value) * 100)) : '0')}
                      placeholder="700"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/30 pt-4">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Order Discount Threshold (USD)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={get('discount_threshold_cents') ? String(Number(get('discount_threshold_cents')) / 100) : ''}
                      onChange={(e) => set('discount_threshold_cents', e.target.value ? String(Math.round(Number(e.target.value) * 100)) : '0')}
                      placeholder="e.g. 5000"
                      className={inputClass}
                    />
                    <p className="text-[11px] text-muted-foreground/60">Apply percentage discount when subtotal crosses this. Set to 0 to disable.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Discount Percentage (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={get('discount_percentage') || ''}
                      onChange={(e) => set('discount_percentage', e.target.value)}
                      placeholder="e.g. 10"
                      className={inputClass}
                    />
                    <p className="text-[11px] text-muted-foreground/60">The percentage discount to apply (e.g. 10 for 10% off).</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Shipping Zones Table */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm text-foreground flex items-center gap-2">
                    <MapPin className="size-4 text-[#DC2626]" />
                    Custom Regional Shipping Zones
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingZoneGroup(null);
                    setNewZoneScope('specific');
                    setSelectedStates([]);
                    setApplyStateWide(true);
                    setSelectedCities([]);
                    setRateForklift('');
                    setRateNoForklift('');
                    setRateLiftgate('');
                    setRateResidential('');
                    setShowAddZone(true);
                  }}
                  className="bg-[#DC2626] text-white hover:bg-[#ef4444] gap-1.5 h-8 text-xs font-semibold"
                >
                  <Plus className="size-3.5" /> Add Zone
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingZones ? (
                  <div className="flex h-24 items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-[#DC2626]" />
                  </div>
                ) : shippingZones.length === 0 ? (
                  <p className="p-4 text-xs text-muted-foreground italic">No custom state or city shipping zones configured yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/20">
                          <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold">State / Region</th>
                          <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold">City</th>
                          <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold">With Forklift</th>
                          <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold">No Forklift</th>
                          <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold">Liftgate Delivery</th>
                          <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold">Residential</th>
                          <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold">Status</th>
                          <th className="px-4 py-2.5 text-right text-muted-foreground font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getGroupedZones(shippingZones).map((zone, idx) => (
                          <tr key={idx} className="border-b border-border/40 hover:bg-muted/10">
                            <td className="px-4 py-3 text-foreground font-semibold">
                              {zone.state_code
                                ? `${US_STATES.find((s) => s.code === zone.state_code)?.name || ''} (${zone.state_code})`
                                : 'Default (Global)'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground font-medium">{zone.city || 'State-wide'}</td>
                            <td className="px-4 py-3 text-foreground font-mono font-medium">
                              {zone.rates.forklift !== undefined ? `$${(zone.rates.forklift / 100).toFixed(2)}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-foreground font-mono font-medium">
                              {zone.rates.no_forklift !== undefined ? `$${(zone.rates.no_forklift / 100).toFixed(2)}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-foreground font-mono font-medium">
                              {zone.rates.liftgate !== undefined ? `$${(zone.rates.liftgate / 100).toFixed(2)}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-foreground font-mono font-medium">
                              {zone.rates.residential_delivery !== undefined ? `$${(zone.rates.residential_delivery / 100).toFixed(2)}` : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
                                  zone.is_active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-muted text-muted-foreground border'
                                )}
                              >
                                {zone.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground hover:text-foreground h-7 w-7"
                                  onClick={() => {
                                    setEditingZoneGroup(zone);
                                    setNewZoneScope(zone.state_code ? 'specific' : 'default');
                                    setSelectedStates(zone.state_code ? [zone.state_code] : []);
                                    setApplyStateWide(!zone.city);
                                    setSelectedCities(zone.city ? [zone.city] : []);
                                    setRateForklift(zone.rates.forklift !== undefined ? String(zone.rates.forklift / 100) : '');
                                    setRateNoForklift(zone.rates.no_forklift !== undefined ? String(zone.rates.no_forklift / 100) : '');
                                    setRateLiftgate(zone.rates.liftgate !== undefined ? String(zone.rates.liftgate / 100) : '');
                                    setRateResidential(zone.rates.residential_delivery !== undefined ? String(zone.rates.residential_delivery / 100) : '');
                                    setShowAddZone(true);
                                  }}
                                >
                                  <Pencil className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-muted-foreground hover:text-[#DC2626] h-7 w-7"
                                  onClick={() => {
                                    setDeleteZoneId(zone.state_code || zone.city || 'default');
                                    setDeleteZoneGroup(zone);
                                  }}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom Carriers list */}
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm text-foreground flex items-center gap-2">
                    <Truck className="size-4 text-[#DC2626]" />
                    Shipping Carriers & Dispatch Links
                  </CardTitle>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCarrierIdx(null);
                    setCarrierForm({ name: '', tracking_url: '' });
                    setShowCarrierDialog(true);
                  }}
                  className="bg-[#DC2626] text-white hover:bg-[#ef4444] gap-1.5 h-8 text-xs font-semibold"
                >
                  <Plus className="size-3.5" /> Add Carrier
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {(() => {
                  let carriersList: Array<{ name: string; tracking_url: string }> = [];
                  const raw = get('shipping_carriers');
                  if (raw) {
                    try {
                      const parsed = JSON.parse(raw);
                      if (Array.isArray(parsed)) carriersList = parsed;
                    } catch { }
                  }

                  return (
                    <>
                      {carriersList.length === 0 ? (
                        <p className="p-4 text-xs text-muted-foreground italic">No customized shipping carriers registered.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-border bg-muted/20">
                                <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold">Carrier Name</th>
                                <th className="px-4 py-2.5 text-left text-muted-foreground font-semibold">Tracking URL Format</th>
                                <th className="px-4 py-2.5 text-right text-muted-foreground font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {carriersList.map((c, idx) => (
                                <tr key={idx} className="border-b border-border/40 hover:bg-muted/10">
                                  <td className="px-4 py-3 text-foreground font-semibold">{c.name}</td>
                                  <td className="px-4 py-3 text-muted-foreground font-mono text-[10px] max-w-sm truncate">
                                    {c.tracking_url}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-muted-foreground hover:text-foreground h-7 w-7"
                                        onClick={() => {
                                          setEditingCarrierIdx(idx);
                                          setCarrierForm({ name: c.name, tracking_url: c.tracking_url });
                                          setShowCarrierDialog(true);
                                        }}
                                      >
                                        <Pencil className="size-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="text-muted-foreground hover:text-[#DC2626] h-7 w-7"
                                        onClick={() => setDeleteCarrierIdx(idx)}
                                      >
                                        <Trash2 className="size-3.5" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Delete Carrier Confirm Dialog */}
                      <ConfirmDialog
                        open={deleteCarrierIdx !== null}
                        onOpenChange={(open) => !open && setDeleteCarrierIdx(null)}
                        title="Delete Shipping Carrier"
                        description="Are you sure you want to delete this shipping carrier?"
                        confirmLabel="Delete"
                        cancelLabel="Cancel"
                        variant="danger"
                        onConfirm={() => {
                          if (deleteCarrierIdx === null) return;
                          const next = carriersList.filter((_, i) => i !== deleteCarrierIdx);
                          set('shipping_carriers', JSON.stringify(next));
                          setDeleteCarrierIdx(null);
                        }}
                      />
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Main Bottom Bulk Saver */}
      <div className="flex items-center justify-between border-t border-border pt-5 mt-4">
        <Button
          onClick={handleSaveBulk}
          disabled={isSaving}
          className="bg-[#DC2626] text-white hover:bg-[#ef4444] ml-auto gap-2"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Global Configs
        </Button>
      </div>

      {/* dialogs */}
      {/* Delete Zone dialog */}
      <ConfirmDialog
        open={!!deleteZoneId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteZoneId(null);
            setDeleteZoneGroup(null);
          }
        }}
        title="Delete Shipping Zone"
        description="Are you sure you want to delete this custom regional shipping zone? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          if (!deleteZoneGroup) return;
          const ids = Object.values(deleteZoneGroup.ids).filter(Boolean) as string[];
          try {
            await Promise.all(ids.map((id) => adminApi.delete(`/admin/shipping-zones/${id}`)));
            toast.success('Shipping zone deleted successfully');
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete shipping zone');
          } finally {
            setDeleteZoneId(null);
            setDeleteZoneGroup(null);
            loadZones();
          }
        }}
      />

      {/* Add / Edit Zone Dialog */}
      <Dialog
        open={showAddZone}
        onOpenChange={(open) => {
          setShowAddZone(open);
          if (!open) {
            setEditingZoneGroup(null);
            setSelectedStates([]);
            setApplyStateWide(true);
            setSelectedCities([]);
            setRateForklift('');
            setRateNoForklift('');
            setRateLiftgate('');
            setRateResidential('');
          }
        }}
      >
        <DialogContent className="bg-card border-border sm:max-w-4xl max-h-[85vh] flex flex-col p-6 overflow-hidden gap-0">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="text-foreground text-lg font-bold">
              {editingZoneGroup ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Zone Scope</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="zoneScope"
                    checked={newZoneScope === 'specific'}
                    onChange={() => setNewZoneScope('specific')}
                    disabled={!!editingZoneGroup}
                    className="accent-[#DC2626] h-4 w-4"
                  />
                  Specific States & Cities
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="zoneScope"
                    checked={newZoneScope === 'default'}
                    onChange={() => setNewZoneScope('default')}
                    disabled={!!editingZoneGroup}
                    className="accent-[#DC2626] h-4 w-4"
                  />
                  Default (all other states)
                </label>
              </div>
            </div>

            {newZoneScope === 'specific' && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-foreground">Select States</Label>
                    {!editingZoneGroup && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStates(US_STATES.map((s) => s.code))}
                          className="text-xs text-[#DC2626] hover:underline font-bold"
                        >
                          Select All
                        </button>
                        <span className="text-muted-foreground/30 text-xs">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStates([]);
                            setSelectedCities([]);
                          }}
                          className="text-xs text-muted-foreground hover:underline font-bold"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto border border-border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 bg-muted/20">
                    {US_STATES.map((s) => (
                      <label
                        key={s.code}
                        className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStates.includes(s.code)}
                          disabled={!!editingZoneGroup}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStates([...selectedStates, s.code]);
                            } else {
                              setSelectedStates(selectedStates.filter((code) => code !== s.code));
                              const remaining = selectedStates.filter((code) => code !== s.code);
                              const eligible = remaining.flatMap((rs) =>
                                City.getCitiesOfState('US', rs).map((c) => c.name)
                              );
                              setSelectedCities(selectedCities.filter((c) => eligible.includes(c)));
                            }
                          }}
                          className="accent-[#DC2626] rounded border-muted h-3.5 w-3.5"
                        />
                        <span className="font-semibold">
                          {s.name} ({s.code})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedStates.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-border/40">
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={applyStateWide}
                        disabled={!!editingZoneGroup}
                        onChange={(e) => setApplyStateWide(e.target.checked)}
                        className="accent-[#DC2626] rounded border-muted h-3.5 w-3.5"
                      />
                      Apply state-wide (all cities)
                    </label>

                    {!applyStateWide && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label className="text-xs font-semibold text-foreground">Select Cities</Label>
                          {!editingZoneGroup && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const allEligible = selectedStates.flatMap((s) =>
                                    City.getCitiesOfState('US', s).map((c) => c.name)
                                  );
                                  setSelectedCities(allEligible);
                                }}
                                className="text-xs text-[#DC2626] hover:underline font-bold"
                              >
                                Select All
                              </button>
                              <span className="text-muted-foreground/30 text-xs">|</span>
                              <button
                                type="button"
                                onClick={() => setSelectedCities([])}
                                className="text-xs text-muted-foreground hover:underline font-bold"
                              >
                                Clear All
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="max-h-56 overflow-y-auto border border-border rounded-lg p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-muted/20">
                          {selectedStates
                            .flatMap((s) => {
                              const st = US_STATES.find((state) => state.code === s);
                              return City.getCitiesOfState('US', s).map((c) => ({
                                name: c.name,
                                state: st?.code || s,
                              }));
                            })
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((city, index) => (
                              <label
                                key={`${city.name}-${city.state}-${index}`}
                                className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-muted/40 p-1 rounded transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedCities.includes(city.name)}
                                  disabled={!!editingZoneGroup}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedCities([...selectedCities, city.name]);
                                    } else {
                                      setSelectedCities(selectedCities.filter((c) => c !== city.name));
                                    }
                                  }}
                                  className="accent-[#DC2626] rounded border-muted h-3.5 w-3.5"
                                />
                                <span className="truncate">
                                  {city.name} ({city.state})
                                </span>
                              </label>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="border-t border-border/40 pt-4 space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Pricing Rates (USD)
              </Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className={labelClass}>With Forklift</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rateForklift}
                    onChange={(e) => setRateForklift(e.target.value)}
                    placeholder="500"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Without Forklift</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rateNoForklift}
                    onChange={(e) => setRateNoForklift(e.target.value)}
                    placeholder="700"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Liftgate Delivery</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rateLiftgate}
                    onChange={(e) => setRateLiftgate(e.target.value)}
                    placeholder="850"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={labelClass}>Residential Delivery</Label>
                  <Input
                    type="number"
                    min={0}
                    value={rateResidential}
                    onChange={(e) => setRateResidential(e.target.value)}
                    placeholder="750"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {(() => {
              const overlaps = checkOverlaps();
              if (overlaps.length === 0) return null;
              return (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-[10px] text-amber-400 space-y-1">
                  <span className="font-bold uppercase tracking-wider block">Zone Overlap Warnings:</span>
                  <ul className="list-disc list-inside space-y-0.5 font-medium leading-relaxed">
                    {overlaps.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddZone(false);
                setEditingZoneGroup(null);
                setSelectedStates([]);
                setApplyStateWide(true);
                setSelectedCities([]);
                setRateForklift('');
                setRateNoForklift('');
                setRateLiftgate('');
                setRateResidential('');
              }}
              className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-[#DC2626] text-white hover:bg-[#ef4444]"
              onClick={async () => {
                const forkliftCents = Math.round(Number(rateForklift) * 100);
                const noForkliftCents = Math.round(Number(rateNoForklift) * 100);
                const liftgateCents = Math.round(Number(rateLiftgate) * 100);
                const residentialCents = Math.round(Number(rateResidential) * 100);

                if (
                  isNaN(forkliftCents) || forkliftCents < 0 ||
                  isNaN(noForkliftCents) || noForkliftCents < 0 ||
                  isNaN(liftgateCents) || liftgateCents < 0 ||
                  isNaN(residentialCents) || residentialCents < 0
                ) {
                  toast.error('Please enter valid, non-negative shipping rates');
                  return;
                }

                try {
                  if (editingZoneGroup) {
                    const deleteIds = Object.values(editingZoneGroup.ids).filter(Boolean) as string[];
                    await Promise.all(deleteIds.map((id) => adminApi.delete(`/admin/shipping-zones/${id}`)));
                  }

                  const list: Array<{ state: string | null; city: string | null }> = [];
                  if (newZoneScope === 'default') {
                    list.push({ state: null, city: null });
                  } else {
                    for (const state of selectedStates) {
                      if (applyStateWide) {
                        list.push({ state, city: null });
                      } else {
                        const stateCities = City.getCitiesOfState('US', state).map((c) => c.name);
                        const active = selectedCities.filter((c) => stateCities.includes(c));
                        if (active.length === 0) {
                          list.push({ state, city: null });
                        } else {
                          for (const city of active) {
                            list.push({ state, city });
                          }
                        }
                      }
                    }
                  }

                  const promises: Promise<any>[] = [];
                  for (const item of list) {
                    promises.push(
                      adminApi.post('/admin/shipping-zones', {
                        state_code: item.state,
                        city: item.city,
                        zone_type: 'forklift',
                        rate_cents: forkliftCents,
                      }),
                      adminApi.post('/admin/shipping-zones', {
                        state_code: item.state,
                        city: item.city,
                        zone_type: 'no_forklift',
                        rate_cents: noForkliftCents,
                      }),
                      adminApi.post('/admin/shipping-zones', {
                        state_code: item.state,
                        city: item.city,
                        zone_type: 'liftgate',
                        rate_cents: liftgateCents,
                      }),
                      adminApi.post('/admin/shipping-zones', {
                        state_code: item.state,
                        city: item.city,
                        zone_type: 'residential_delivery',
                        rate_cents: residentialCents,
                      })
                    );
                  }

                  await Promise.all(promises);
                  toast.success(editingZoneGroup ? 'Shipping zone updated successfully' : 'Shipping zone added successfully');
                  setShowAddZone(false);
                  setEditingZoneGroup(null);
                  setSelectedStates([]);
                  setApplyStateWide(true);
                  setSelectedCities([]);
                  setRateForklift('');
                  setRateNoForklift('');
                  setRateLiftgate('');
                  setRateResidential('');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Failed to save shipping zone');
                } finally {
                  loadZones();
                }
              }}
            >
              {editingZoneGroup ? 'Save Changes' : 'Add Zone'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Carrier Dialog */}
      <Dialog
        open={showCarrierDialog}
        onOpenChange={(open) => {
          setShowCarrierDialog(open);
          if (!open) {
            setEditingCarrierIdx(null);
            setCarrierForm({ name: '', tracking_url: '' });
          }
        }}
      >
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingCarrierIdx !== null ? 'Edit Shipping Carrier' : 'Add Shipping Carrier'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className={labelClass}>Carrier Name</Label>
              <Input
                value={carrierForm.name}
                onChange={(e) => setCarrierForm({ ...carrierForm, name: e.target.value })}
                placeholder="e.g. Forward Air"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={labelClass}>Tracking URL Format Template</Label>
              <Input
                value={carrierForm.tracking_url}
                onChange={(e) => setCarrierForm({ ...carrierForm, tracking_url: e.target.value })}
                placeholder="https://forwardair.com/track?num={tracking_number}"
                className={inputClass}
              />
              <p className="text-[10px] text-muted-foreground leading-normal">
                Use <code>{`{tracking_number}`}</code> where the tracking number should be dynamically appended.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCarrierDialog(false);
                  setEditingCarrierIdx(null);
                  setCarrierForm({ name: '', tracking_url: '' });
                }}
                className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#DC2626] text-white hover:bg-[#ef4444]"
                onClick={() => {
                  if (!carrierForm.name.trim()) return;
                  let carriersList: Array<{ name: string; tracking_url: string }> = [];
                  const raw = get('shipping_carriers');
                  if (raw) {
                    try {
                      const parsed = JSON.parse(raw);
                      if (Array.isArray(parsed)) carriersList = parsed;
                    } catch { }
                  }

                  let next: typeof carriersList = [];
                  if (editingCarrierIdx !== null) {
                    next = carriersList.map((c, i) =>
                      i === editingCarrierIdx
                        ? { name: carrierForm.name.trim(), tracking_url: carrierForm.tracking_url.trim() }
                        : c
                    );
                  } else {
                    next = [
                      ...carriersList,
                      { name: carrierForm.name.trim(), tracking_url: carrierForm.tracking_url.trim() },
                    ];
                  }
                  set('shipping_carriers', JSON.stringify(next));
                  setShowCarrierDialog(false);
                  setEditingCarrierIdx(null);
                  setCarrierForm({ name: '', tracking_url: '' });
                }}
              >
                {editingCarrierIdx !== null ? 'Save Changes' : 'Add Carrier'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
