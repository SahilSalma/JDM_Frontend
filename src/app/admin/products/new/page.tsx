'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, X, Upload, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi, ApiError } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import type { Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { SearchableDropdown } from '@/components/admin/SearchableDropdown';
import { useVehicleData } from '@/hooks/useVehicleData';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

const FUEL_TYPES = ['gasoline', 'diesel', 'hybrid', 'electric'] as const;
const TRANSMISSION_TYPES = ['manual', 'automatic', 'cvt', 'sequential'] as const;
const STATUSES = ['active', 'draft', 'archived'] as const;

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function skuify(str: string): string {
  return str
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
}

interface ProductFormData {
  title: string;
  sku: string;
  description: string;
  category: string;
  make: string;
  model: string;
  year_start: string;
  year_end: string;
  engine_code: string;
  displacement: string;
  cylinders: string;
  fuel_type: string;
  transmission_type: string;
  price_dollars: string;
  compare_at_price_dollars: string;
  stock: string;
  max_per_order: string;
  slug: string;
  meta_title: string;
  meta_description: string;
  status: string;
  featured: boolean;
  mileage_km: string;
  condition: string;
  condition_notes: string;
  included_items: string;
  warranty_summary: string;
}

const SYNCED_SPEC_SOURCES: Record<string, string> = {
  'Part Code': 'SKU field above',
  'Brand': 'Product Brand section',
  'Number of Cylinders': 'Technical Specifications > Cylinders',
  'Engine Size': 'Technical Specifications > Displacement',
  'Transmission Type': 'Technical Specifications > Transmission Type',
  'Engine Code': 'Technical Specifications > Engine Code',
  'Year Range': 'Product Brand section',
  'Condition': 'Product Detail Content > Condition',
  'Mileage': 'Mileage field in Pricing & Inventory',
  'Type': 'Category selector',
  'Warranty': 'Warranty summary field above',
  'Parts Included': 'What\'s Included field above',
};

function sortSpecs(arr: Array<{ label: string; value: string }>) {
  return [...arr].sort((a, b) => {
    const aSynced = SYNCED_SPEC_SOURCES[a.label] !== undefined;
    const bSynced = SYNCED_SPEC_SOURCES[b.label] !== undefined;
    if (aSynced && !bSynced) return -1;
    if (!aSynced && bSynced) return 1;
    return 0;
  });
}

interface ProductFormProps {
  initial?: Product;
  isEdit?: boolean;
}

export default function ProductFormPage({ initial, isEdit }: ProductFormProps) {
  const t = useTranslations('admin.productForm');
  const router = useRouter();
  const { makes, modelsForMake } = useVehicleData();

  const [form, setForm] = useState<ProductFormData>({
    title: initial?.title ?? '',
    sku: initial?.sku ?? '',
    description: initial?.description ?? '',
    category: initial?.category ?? '',
    make: initial?.make ?? '',
    model: initial?.model ?? '',
    year_start: initial?.year_start?.toString() ?? '',
    year_end: initial?.year_end?.toString() ?? '',
    engine_code: initial?.engine_code ?? '',
    displacement: initial?.displacement ?? '',
    cylinders: initial?.cylinders?.toString() ?? '',
    fuel_type: initial?.fuel_type ?? '',
    transmission_type: '',
    price_dollars: initial ? (initial.price_cents / 100).toFixed(2) : '',
    compare_at_price_dollars: '',
    stock: initial?.stock?.toString() ?? '',
    max_per_order: '1',
    slug: initial?.slug ?? '',
    meta_title: '',
    meta_description: '',
    status: initial?.status ?? 'draft',
    featured: initial?.featured ?? false,
    mileage_km: '',
    condition: '',
    condition_notes: '',
    included_items: '',
    warranty_summary: '',
  });

  const [compatibility, setCompatibility] = useState<Array<{ make: string; model: string; year_start?: string; year_end?: string; notes?: string }>>([
    { make: '', model: '', year_start: '', year_end: '', notes: '' }
  ]);
  const mainSpecMake = form.make;

  const getSyncedValue = useCallback((label: string): string => {
    const norm = label.toLowerCase().trim();
    switch (norm) {
      case 'part code': return form.sku;
      case 'brand': return mainSpecMake;
      case 'number of cylinders': return form.cylinders;
      case 'engine size': return form.displacement;
      case 'transmission type': return form.transmission_type;
      case 'engine code': return form.engine_code;
      case 'year range': {
        const ys = form.year_start;
        const ye = form.year_end;
        if (ys && ye && ys !== ye) return `${ys}–${ye}`;
        if (ys) return ys;
        return '';
      }
      case 'condition': return form.condition;
      case 'mileage': return form.mileage_km ? `${Number(form.mileage_km).toLocaleString()} miles` : '';
      case 'type': return form.category;
      case 'warranty': return form.warranty_summary;
      case 'parts included': return form.included_items;
      default: return '';
    }
  }, [form.sku, mainSpecMake, form.cylinders, form.displacement, form.transmission_type, form.engine_code, form.year_start, form.year_end, form.condition, form.mileage_km, form.category, form.warranty_summary, form.included_items]);

  const [specs, setSpecs] = useState<Array<{ label: string; value: string }>>(() => sortSpecs([
    { label: 'Part Code', value: '' },
    { label: 'Brand', value: '' },
    { label: 'Number of Cylinders', value: '' },
    { label: 'Engine Size', value: '' },
    { label: 'Transmission Type', value: '' },
    { label: 'Engine Code', value: '' },
    { label: 'Year Range', value: '' },
    { label: 'Condition', value: '' },
    { label: 'Mileage', value: '' },
    { label: 'Type', value: '' },
    { label: 'Part Number', value: '' },
    { label: 'Country/Region of Manufacture', value: 'Japan' },
    { label: 'Warranty', value: '' },
    { label: 'Parts Included', value: '' },
    { label: 'Modification Notes', value: '' },
  ]));
  const [dbModels, setDbModels] = useState<Record<string, string[]>>({});

  const fetchModelsForMake = useCallback(async (makeName: string) => {
    if (!makeName) return;
    const normalized = makeName.charAt(0).toUpperCase() + makeName.slice(1).toLowerCase();
    if (dbModels[normalized]) return;
    try {
      const res = await adminApi.get<{ data: string[] }>(`/products/models/${normalized}`);
      if (res.data) {
        setDbModels(prev => ({ ...prev, [normalized]: res.data }));
      }
    } catch {
      // ignore
    }
  }, [dbModels]);

  const getModelOptions = useCallback((makeName: string) => {
    if (!makeName) return [];
    const normalized = makeName.charAt(0).toUpperCase() + makeName.slice(1).toLowerCase();
    const configModels = modelsForMake(normalized);
    const dynamicList = dbModels[normalized] || [];
    return Array.from(new Set([...configModels, ...dynamicList]));
  }, [dbModels, modelsForMake]);

  useEffect(() => {
    setSpecs(prev => sortSpecs(prev.map(spec => {
      const key = spec.label;
      let newVal: string | undefined;
      switch (key) {
        case 'Part Code': newVal = form.sku; break;
        case 'Brand': newVal = mainSpecMake; break;
        case 'Number of Cylinders': newVal = form.cylinders; break;
        case 'Engine Size': newVal = form.displacement; break;
        case 'Transmission Type': newVal = form.transmission_type; break;
        case 'Engine Code': newVal = form.engine_code; break;
        case 'Year Range': {
          const ys = form.year_start;
          const ye = form.year_end;
          if (ys && ye && ys !== ye) newVal = `${ys}–${ye}`;
          else if (ys) newVal = ys;
          else newVal = '';
          break;
        }
        case 'Condition': newVal = form.condition; break;
        case 'Mileage': newVal = form.mileage_km ? `${Number(form.mileage_km).toLocaleString()} miles` : ''; break;
        case 'Type': newVal = form.category; break;
        case 'Warranty': newVal = form.warranty_summary; break;
        case 'Parts Included': newVal = form.included_items; break;
        default: return spec;
      }
      if (newVal !== spec.value) return { ...spec, value: newVal ?? '' };
      return spec;
    })));
  }, [form.sku, mainSpecMake, form.cylinders, form.displacement, form.transmission_type, form.engine_code, form.year_start, form.year_end, form.condition, form.mileage_km, form.category, form.warranty_summary, form.included_items]);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [rpSearch, setRpSearch] = useState('');
  const [rpSearchResults, setRpSearchResults] = useState<Product[]>([]);
  const [isRpSearching, setIsRpSearching] = useState(false);
  const [rpFocusedIndex, setRpFocusedIndex] = useState<number>(-1);

  useEffect(() => {
    if (!rpSearch.trim()) {
      setRpSearchResults([]);
      setRpFocusedIndex(-1);
      return;
    }
    const timer = setTimeout(async () => {
      setIsRpSearching(true);
      try {
        const res = await adminApi.get<{ data: Product[] }>('/products', { search: rpSearch, limit: 8 });
        if (res.data) {
          setRpSearchResults(res.data);
          setRpFocusedIndex(-1);
        }
      } catch {
        // ignore
      } finally {
        setIsRpSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [rpSearch]);

  const addRelatedProduct = (p: Product) => {
    const isAlreadySelected = relatedProducts.some((item) => item.id === p.id);
    if (!isAlreadySelected) {
      setRelatedProducts((prev) => [...prev, p]);
      setRpSearch('');
      setRpSearchResults([]);
      setRpFocusedIndex(-1);
    }
  };

  useEffect(() => {
    if (rpFocusedIndex >= 0) {
      const el = document.querySelector(`[data-rp-item="${rpFocusedIndex}"]`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [rpFocusedIndex]);

  const getProductImgUrl = (p: Product) => {
    const path = p.primary_image_path || p.images?.[0]?.thumb_path || p.images?.[0]?.image_path;
    if (!path) return '';
    return path.startsWith('http') ? path : `/api${path}`;
  };

  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(
    (field: keyof ProductFormData, value: string | boolean) => {
      setForm((prev) => {
        const next = { ...prev, [field]: value };
        // Auto-generate slug and SKU from title
        if (field === 'title' && typeof value === 'string') {
          if (!isEdit || !prev.slug) {
            next.slug = slugify(value);
          }
          if (!isEdit || !prev.sku) {
            next.sku = skuify(value);
          }
        }
        return next;
      });
    },
    [isEdit],
  );

  const handleFileDrop = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setImageFiles((prev) => [...prev, ...arr]);
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Sync standard specs from form fields
      const finalSpecs = [...specs];
      const syncMap: Record<string, string> = {
        'Part Code': form.sku,
        'Brand': form.make,
        'Number of Cylinders': form.cylinders,
        'Engine Size': form.displacement,
        'Transmission Type': form.transmission_type,
        'Engine Code': form.engine_code,
        'Year Range': (() => {
          const ys = form.year_start;
          const ye = form.year_end;
          if (ys && ye && ys !== ye) return `${ys}–${ye}`;
          if (ys) return ys;
          return '';
        })(),
        'Condition': form.condition,
        'Mileage': form.mileage_km ? `${Number(form.mileage_km).toLocaleString()} miles` : '',
        'Type': form.category,
        'Warranty': form.warranty_summary,
        'Parts Included': form.included_items,
      };

      for (const [label, val] of Object.entries(syncMap)) {
        const idx = finalSpecs.findIndex((s) => s.label.toLowerCase() === label.toLowerCase());
        if (idx !== -1) {
          if (!finalSpecs[idx].value || finalSpecs[idx].value.trim() === '') {
            finalSpecs[idx].value = val;
          }
        }
      }

      const filteredSpecs = finalSpecs.filter((s) => s.label && s.value && s.value.trim() !== '');

      const payload = {
        title: form.title,
        sku: form.sku,
        description: form.description,
        category: form.category,
        make: form.make || null,
        model: form.model || null,
        year_start: form.year_start ? parseInt(form.year_start) : null,
        year_end: form.year_end ? parseInt(form.year_end) : null,
        engine_code: form.engine_code || null,
        displacement: form.displacement || null,
        cylinders: form.cylinders ? parseInt(form.cylinders) : null,
        fuel_type: form.fuel_type || null,
        transmission_type: form.transmission_type || null,
        price_cents: Math.round(parseFloat(form.price_dollars) * 100),
        compare_at_price_cents: form.compare_at_price_dollars ? Math.round(parseFloat(form.compare_at_price_dollars) * 100) : null,
        quantity: parseInt(form.stock) || 0,
        max_per_order: form.max_per_order ? Math.max(1, parseInt(form.max_per_order)) : 1,
        slug: form.slug,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        status: form.status,
        featured: form.featured,
        mileage_km: form.mileage_km ? parseInt(form.mileage_km) : null,
        condition: form.condition || null,
        condition_notes: form.condition_notes || null,
        included_items: form.included_items || null,
        warranty_summary: form.warranty_summary || null,
        specs_json: filteredSpecs.length > 0
          ? JSON.stringify(filteredSpecs)
          : null,
        related_product_ids: relatedProducts.length > 0
          ? JSON.stringify(relatedProducts.map((p) => p.id))
          : null,
        compatibility: compatibility.filter((c) => c.make && c.model).map((c) => ({
          make: c.make,
          model: c.model,
          year_start: c.year_start ? parseInt(c.year_start) : undefined,
          year_end: c.year_end ? parseInt(c.year_end) : undefined,
          notes: c.notes || undefined,
        })),
      };

      let productId: string;

      if (isEdit && initial) {
        await adminApi.patch(`/admin/products/${initial.id}`, payload);
        productId = initial.id;
      } else {
        const created = await adminApi.post<{ id: string }>('/admin/products', payload);
        productId = created.id;
      }

      // Upload new image files
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fd = new FormData();
          fd.append('images', file);
          await adminApi.upload(`/admin/products/${productId}/images`, fd);
        }
      }

      router.push('/admin/products');
      toast.success('Product created successfully');
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Failed to save product';
      if (err instanceof ApiError && err.details) {
        const lines = Object.entries(err.details)
          .map(([field, errors]) => `${field}: ${errors.join(', ')}`);
        msg = `${msg}\n${lines.join('\n')}`;
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus:border-[#DC2626] h-12 text-sm';
  const selectClass =
    'h-12 w-full rounded-lg border border-border bg-muted px-2 text-sm text-foreground focus:border-[#DC2626] focus:outline-none';
  const labelClass = 'text-xs text-muted-foreground';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {isEdit ? t('editProduct') : t('newProduct')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">{t('basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className={labelClass}>{t('title')}</Label>
                <Input
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>{t('sku')} <span className="text-muted-foreground/60">({t('skuHint')})</span></Label>
                <Input
                  value={form.sku}
                  onChange={(e) => set('sku', e.target.value)}
                  required
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('fullDescription')}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 text-sm resize-none min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Category */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">{t('category')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex gap-4">
              {CATEGORIES.map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={form.category === cat}
                    onChange={() => set('category', cat)}
                    className="accent-[#DC2626]"
                  />
                  <span className="text-sm text-foreground capitalize">{cat}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Product Brand */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">Product Brand</CardTitle>
            <p className="text-xs text-muted-foreground">
              The brand, model, and year of this product itself.
            </p>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className={labelClass}>Brand</Label>
              <SearchableDropdown
                value={form.make}
                onChange={(val) => {
                  set('make', val);
                  set('model', '');
                }}
                options={makes}
                placeholder="e.g. Honda"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Model</Label>
              <SearchableDropdown
                value={form.model}
                onChange={(val) => set('model', val)}
                options={modelsForMake(form.make)}
                placeholder="e.g. Civic"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Year Start</Label>
              <Input
                type="number"
                value={form.year_start}
                onChange={(e) => set('year_start', e.target.value)}
                placeholder="Start"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Year End</Label>
              <Input
                type="number"
                value={form.year_end}
                onChange={(e) => set('year_end', e.target.value)}
                placeholder="End"
                className={inputClass}
              />
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Fitment */}
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm font-bold text-foreground">{t('vehicleFitment')}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Define which vehicle makes and models this product fits. If fitment applies to multiple models, add additional rows.
            </p>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-3">
              {compatibility.map((fit, i) => (
                <div key={i} className="flex flex-wrap sm:flex-nowrap gap-3 items-end bg-muted/30 p-3 rounded-xl border border-border relative">
                  <div className="flex-1 min-w-[140px] space-y-1">
                    <Label className={labelClass}>Make</Label>
                    <SearchableDropdown
                      value={fit.make}
                      onChange={(val) => {
                        const next = [...compatibility];
                        next[i] = { ...next[i], make: val };
                        setCompatibility(next);
                        fetchModelsForMake(val);
                      }}
                      options={makes}
                      placeholder="e.g. Honda"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex-1 min-w-[140px] space-y-1">
                    <Label className={labelClass}>Model</Label>
                    <SearchableDropdown
                      value={fit.model}
                      onChange={(val) => {
                        const next = [...compatibility];
                        next[i] = { ...next[i], model: val };
                        setCompatibility(next);
                      }}
                      options={getModelOptions(fit.make)}
                      onFocus={() => fetchModelsForMake(fit.make)}
                      placeholder="e.g. Civic"
                      className={inputClass}
                    />
                  </div>
                  <div className="w-24 shrink-0 space-y-1">
                    <Label className={labelClass}>Year Start</Label>
                    <Input
                      type="number"
                      value={fit.year_start}
                      onChange={(e) => {
                        const next = [...compatibility];
                        next[i] = { ...next[i], year_start: e.target.value };
                        setCompatibility(next);
                      }}
                      placeholder="Start"
                      className={inputClass}
                    />
                  </div>
                  <div className="w-24 shrink-0 space-y-1">
                    <Label className={labelClass}>Year End</Label>
                    <Input
                      type="number"
                      value={fit.year_end}
                      onChange={(e) => {
                        const next = [...compatibility];
                        next[i] = { ...next[i], year_end: e.target.value };
                        setCompatibility(next);
                      }}
                      placeholder="End"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex-[2] min-w-[180px] space-y-1">
                    <Label className={labelClass}>Notes</Label>
                    <Input
                      value={fit.notes}
                      onChange={(e) => {
                        const next = [...compatibility];
                        next[i] = { ...next[i], notes: e.target.value };
                        setCompatibility(next);
                      }}
                      placeholder="Notes (optional)"
                      className={inputClass}
                    />
                  </div>
                  {compatibility.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setCompatibility((prev) => prev.filter((_, j) => j !== i))}
                      className="border-border text-muted-foreground hover:bg-[#DC2626]/10 hover:text-[#DC2626] shrink-0 h-12 w-12"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCompatibility((prev) => [...prev, { make: '', model: '', year_start: '', year_end: '', notes: '' }])}
                className="border-border text-muted-foreground hover:text-foreground"
              >
                + Add fitment row
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Technical Specs */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className={labelClass}>{t('engineCode')}</Label>
              <Input
                value={form.engine_code}
                onChange={(e) => set('engine_code', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('displacement')}</Label>
              <Input
                value={form.displacement}
                onChange={(e) => set('displacement', e.target.value)}
                placeholder="e.g. 2.0L"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('cylinders')}</Label>
              <Input
                type="number"
                value={form.cylinders}
                onChange={(e) => set('cylinders', e.target.value)}
                min={1}
                max={16}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('fuelType')}</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/30 p-2.5 min-h-12 items-center">
                {FUEL_TYPES.map((f) => {
                  const selectedList = form.fuel_type
                    ? form.fuel_type.split(',').map((x) => x.trim().toLowerCase())
                    : [];
                  const isChecked = selectedList.includes(f);
                  return (
                    <label key={f} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let nextList;
                          if (e.target.checked) {
                            nextList = [...selectedList, f];
                          } else {
                            nextList = selectedList.filter((x) => x !== f);
                          }
                          set('fuel_type', nextList.join(', '));
                        }}
                        className="accent-[#DC2626] rounded border-border"
                      />
                      <span className="text-sm text-foreground capitalize">{t(f)}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('transmissionType')}</Label>
              <SearchableDropdown
                value={form.transmission_type}
                onChange={(val) => set('transmission_type', val)}
                options={[...TRANSMISSION_TYPES]}
                placeholder={t('selectTransmissionType')}
                className={inputClass}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">{t('pricingSection')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={labelClass}>{t('price')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.price_dollars}
                onChange={(e) => set('price_dollars', e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('compareAtPrice')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.compare_at_price_dollars}
                onChange={(e) => set('compare_at_price_dollars', e.target.value)}
                className={inputClass}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inventory & Mileage */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">{t('inventorySection')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className={labelClass}>{t('quantity')}</Label>
              <Input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('maxPerOrder')}</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={form.max_per_order}
                onChange={(e) => set('max_per_order', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Mileage (miles)</Label>
              <Input
                type="number"
                min="0"
                value={form.mileage_km}
                onChange={(e) => set('mileage_km', e.target.value)}
                className={inputClass}
                placeholder="50000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Detail content (admin-rich product detail page) */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">Product Detail Content</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className={labelClass}>Condition (short label)</Label>
                <Input
                  value={form.condition}
                  onChange={(e) => set('condition', e.target.value)}
                  className={inputClass}
                  placeholder="JDM Used – Inspected & Tested"
                />
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>Warranty summary</Label>
                <Input
                  value={form.warranty_summary}
                  onChange={(e) => set('warranty_summary', e.target.value)}
                  className={inputClass}
                  placeholder="30-day warranty against major defects."
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Additional Information</Label>
              <Textarea
                value={form.condition_notes}
                onChange={(e) => set('condition_notes', e.target.value)}
                className="bg-muted border-border text-foreground text-sm resize-none min-h-[90px]"
                placeholder="Visual inspection, oil leak check, compression test results..."
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>What&rsquo;s included (one bullet per line)</Label>
              <Textarea
                value={form.included_items}
                onChange={(e) => set('included_items', e.target.value)}
                className="bg-muted border-border text-foreground text-sm resize-none min-h-[110px]"
                placeholder={'Long block engine assembly\nIntake & exhaust manifolds\n30-day warranty coverage'}
              />
            </div>

            {/* Specs editor */}
            <div className="space-y-2">
              <Label className={labelClass}>Specifications (key/value rows)</Label>
              <TooltipProvider>
                <div className="space-y-2">
                  {specs.map((spec, i) => {
                    const isSynced = SYNCED_SPEC_SOURCES[spec.label] !== undefined;
                    const source = SYNCED_SPEC_SOURCES[spec.label] ?? '';
                    const isPartsIncluded = spec.label.toLowerCase() === 'parts included';

                    const rowContent = (
                      <div className={`flex gap-2 p-2 rounded-lg border ${
                        isSynced 
                          ? 'border-border/60 bg-muted/40' 
                          : 'border-border bg-transparent'
                      } items-start flex-1 transition-colors duration-150`}>
                        {isSynced && (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/5 border border-blue-500/10 rounded-md text-[10px] text-blue-500 font-semibold shrink-0 self-center">
                            <RefreshCw className="size-3" />
                            <span>Synced</span>
                          </div>
                        )}
                        <Input
                          value={spec.label}
                          onChange={(e) => {
                            const inputVal = e.target.value;
                            const next = [...specs];
                            const matchedKey = Object.keys(SYNCED_SPEC_SOURCES).find(
                              (k) => k.toLowerCase() === inputVal.toLowerCase().trim()
                            );
                            if (matchedKey) {
                              next[i] = {
                                label: matchedKey,
                                value: getSyncedValue(matchedKey),
                              };
                            } else {
                              next[i] = { ...next[i], label: inputVal };
                            }
                            setSpecs(sortSpecs(next));
                          }}
                          disabled={isSynced}
                          placeholder="Label"
                          className={`${inputClass} flex-1 ${
                            isSynced ? 'opacity-65 border-transparent bg-transparent text-muted-foreground/80 cursor-not-allowed' : ''
                          }`}
                        />
                        {isPartsIncluded ? (
                          <Textarea
                            value={spec.value}
                            disabled={isSynced}
                            rows={3}
                            className={`bg-muted border-border text-foreground text-sm resize-none flex-1 min-h-[80px] ${
                              isSynced ? 'opacity-65 border-transparent bg-transparent text-muted-foreground/80 cursor-not-allowed' : ''
                            }`}
                            placeholder="Value"
                          />
                        ) : (
                          <Input
                            value={spec.value}
                            onChange={(e) => {
                              const next = [...specs];
                              next[i] = { ...next[i], value: e.target.value };
                              setSpecs(sortSpecs(next));
                            }}
                            disabled={isSynced}
                            placeholder="Value"
                            className={`${inputClass} flex-1 ${
                              isSynced ? 'opacity-65 border-transparent bg-transparent text-muted-foreground/80 cursor-not-allowed' : ''
                            }`}
                          />
                        )}
                      </div>
                    );

                    return (
                      <div key={i} className="flex gap-2 items-start">
                        {isSynced ? (
                          <Tooltip>
                            <TooltipTrigger render={<div className="flex-1 cursor-not-allowed" />}>
                              {rowContent}
                            </TooltipTrigger>
                            <TooltipContent>
                              <span>Auto-synced. To change, update the {source}.</span>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          rowContent
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => setSpecs((prev) => prev.filter((_, j) => j !== i))}
                          className="border-border text-muted-foreground hover:bg-[#DC2626]/10 hover:text-[#DC2626] h-12 w-12 shrink-0 self-center"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSpecs((prev) => sortSpecs([...prev, { label: '', value: '' }]))}
                    className="border-border text-muted-foreground hover:text-foreground mt-2"
                  >
                    + Add spec
                  </Button>
                </div>
              </TooltipProvider>
            </div>


          </CardContent>
        </Card>

        {/* Images */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">{t('imagesSection')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileDrop(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging ? 'border-[#DC2626] bg-[#DC2626]/5' : 'border-border hover:border-muted-foreground'}`}
            >
              <Upload className="size-8 text-muted-foreground/60 mb-2" />
              <p className="text-sm text-muted-foreground">{t('dragDropImages')}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileDrop(e.target.files)}
              />
            </div>

            {/* Preview */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((src, i) => (
                  <div key={i} className="relative size-20 overflow-hidden rounded-lg border border-border">
                    <img src={src} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/70 text-foreground hover:bg-[#DC2626]"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Products */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">Related Products</CardTitle>
            <p className="text-xs text-muted-foreground">
              Optionally select specific products to show as recommendations on the product page.
            </p>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="relative space-y-1">
              <Label className={labelClass}>Search Products</Label>
              <Input
                type="text"
                placeholder="Search by SKU, title, or make..."
                value={rpSearch}
                onChange={(e) => setRpSearch(e.target.value)}
                className={inputClass}
                onKeyDown={(e) => {
                  if (rpSearchResults.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setRpFocusedIndex((prev) => (prev + 1) % rpSearchResults.length);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setRpFocusedIndex((prev) => (prev - 1 + rpSearchResults.length) % rpSearchResults.length);
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      let targetProduct: Product | undefined;
                      if (rpFocusedIndex >= 0 && rpFocusedIndex < rpSearchResults.length) {
                        targetProduct = rpSearchResults[rpFocusedIndex];
                      } else {
                        targetProduct = rpSearchResults.find(
                          (p) => !relatedProducts.some((item) => item.id === p.id)
                        );
                      }
                      if (targetProduct) {
                        addRelatedProduct(targetProduct);
                      }
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setRpSearchResults([]);
                      setRpFocusedIndex(-1);
                    }
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              />
              {isRpSearching && (
                <div className="absolute right-3 top-9 flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
                </div>
              )}

              {/* Search Results Dropdown */}
              {rpSearchResults.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
                  {rpSearchResults.map((p, idx) => {
                    const isAlreadySelected = relatedProducts.some((item) => item.id === p.id);
                    const isFocused = idx === rpFocusedIndex;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        data-rp-item={idx}
                        disabled={isAlreadySelected}
                        onClick={() => addRelatedProduct(p)}
                        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-foreground disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer transition-colors ${
                          isFocused ? 'bg-muted/80' : 'hover:bg-muted/80'
                        }`}
                      >
                        {p.primary_image_path ? (
                          <img
                            src={p.primary_image_path.startsWith('http') ? p.primary_image_path : `/api${p.primary_image_path}`}
                            alt=""
                            className="h-8 w-8 object-cover rounded border border-border"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted border border-border flex items-center justify-center text-[10px] text-muted-foreground">No img</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium">{p.title}</div>
                          <div className="text-xs text-muted-foreground font-mono">{p.sku}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected Related Products List */}
            {relatedProducts.length > 0 ? (
              <div className="space-y-2 mt-3">
                <Label className={labelClass}>Selected Related Products ({relatedProducts.length})</Label>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {relatedProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {p.primary_image_path ? (
                          <img
                            src={p.primary_image_path.startsWith('http') ? p.primary_image_path : `/api${p.primary_image_path}`}
                            alt=""
                            className="h-10 w-10 object-cover rounded-md border border-border shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground shrink-0">No img</div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{p.title}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {p.sku} · ${(p.price_cents / 100).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setRelatedProducts((prev) => prev.filter((item) => item.id !== p.id))}
                        className="border-border text-muted-foreground hover:bg-[#DC2626]/10 hover:text-[#DC2626] shrink-0"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic mt-2">
                No custom related products selected. Will fallback to default make/category recommendation.
              </p>
            )}
          </CardContent>
        </Card>

        {/* SEO */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">{t('seoSection')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1">
              <Label className={labelClass}>
                {t('slug')} <span className="text-muted-foreground/60">({t('slugHint')})</span>
              </Label>
              <Input
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('metaTitle')}</Label>
              <Input
                value={form.meta_title}
                onChange={(e) => set('meta_title', e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('metaDescription')}</Label>
              <Textarea
                value={form.meta_description}
                onChange={(e) => set('meta_description', e.target.value)}
                className="bg-muted border-border text-foreground text-sm resize-none min-h-[70px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Status & Visibility */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">{t('statusSection')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1">
              <Label className={labelClass}>{t('status')}</Label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className={selectClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(s)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.featured}
                onCheckedChange={(checked) => set('featured', checked)}
              />
              <Label className="text-sm text-foreground cursor-pointer">{t('featured')}</Label>
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 px-3 py-2 text-sm text-[#DC2626]">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#DC2626] text-foreground hover:bg-[#ef4444] disabled:opacity-50"
          >
            {isSaving ? t('saving') : t('save')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
