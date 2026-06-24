'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Trash2, Save, X, Upload, RefreshCw, MessageSquare, ExternalLink } from 'lucide-react';
import { adminApi, ApiError } from '@/lib/api';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { CATEGORIES } from '@/lib/constants';
import type { Product } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useRef, useCallback } from 'react';
import { SearchableDropdown } from '@/components/admin/SearchableDropdown';
import { useVehicleData } from '@/hooks/useVehicleData';

const FUEL_TYPES = ['gasoline', 'diesel', 'hybrid', 'electric'] as const;
const TRANSMISSION_TYPES = ['manual', 'automatic', 'cvt', 'sequential'] as const;
const STATUSES = ['active', 'draft', 'archived'] as const;



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

export default function ProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations('admin.productForm');
  const router = useRouter();
  const { makes, modelsForMake } = useVehicleData();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [engineCode, setEngineCode] = useState('');
  const [displacement, setDisplacement] = useState('');
  const [cylinders, setCylinders] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [transmissionType, setTransmissionType] = useState('');
  const [productMake, setProductMake] = useState('');
  const [productModel, setProductModel] = useState('');
  const [productYearStart, setProductYearStart] = useState('');
  const [productYearEnd, setProductYearEnd] = useState('');
  const [priceDollars, setPriceDollars] = useState('');
  const [compareAtPriceDollars, setCompareAtPriceDollars] = useState('');
  const [stock, setStock] = useState('');
  const [maxPerOrder, setMaxPerOrder] = useState('1');
  const [slug, setSlug] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [featured, setFeatured] = useState(false);
  // Detail enrichment fields
  const [mileageKm, setMileageKm] = useState('');
  const [condition, setCondition] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [includedItems, setIncludedItems] = useState('');
  const [warrantySummary, setWarrantySummary] = useState('');
  const [compatibility, setCompatibility] = useState<Array<{ make: string; model: string; year_start?: string; year_end?: string; notes?: string }>>([
    { make: '', model: '', year_start: '', year_end: '', notes: '' }
  ]);
  const mainSpecMake = productMake;

  const getSyncedValue = useCallback((label: string): string => {
    const norm = label.toLowerCase().trim();
    switch (norm) {
      case 'part code': return sku;
      case 'brand': return mainSpecMake;
      case 'number of cylinders': return cylinders;
      case 'engine size': return displacement;
      case 'transmission type': return transmissionType;
      case 'engine code': return engineCode;
      case 'year range': {
        const ys = productYearStart;
        const ye = productYearEnd;
        if (ys && ye && ys !== ye) return `${ys}–${ye}`;
        if (ys) return ys;
        return '';
      }
      case 'condition': return condition;
      case 'mileage': return mileageKm ? `${Number(mileageKm).toLocaleString()} miles` : '';
      case 'type': return category;
      case 'warranty': return warrantySummary;
      case 'parts included': return includedItems;
      default: return '';
    }
  }, [sku, mainSpecMake, cylinders, displacement, transmissionType, engineCode, productYearStart, productYearEnd, condition, mileageKm, category, warrantySummary, includedItems]);

  const [specs, setSpecs] = useState<Array<{ label: string; value: string }>>([]);
  const [existingImages, setExistingImages] = useState<Array<{ id: string; url: string }>>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [dbModels, setDbModels] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setSpecs(prev => sortSpecs(prev.map(spec => {
      const key = spec.label;
      let newVal: string | undefined;
      switch (key) {
        case 'Part Code': newVal = sku; break;
        case 'Brand': newVal = mainSpecMake; break;
        case 'Number of Cylinders': newVal = cylinders; break;
        case 'Engine Size': newVal = displacement; break;
        case 'Transmission Type': newVal = transmissionType; break;
        case 'Engine Code': newVal = engineCode; break;
        case 'Year Range': {
          const ys = productYearStart;
          const ye = productYearEnd;
          if (ys && ye && ys !== ye) newVal = `${ys}–${ye}`;
          else if (ys) newVal = ys;
          else newVal = '';
          break;
        }
        case 'Condition': newVal = condition; break;
        case 'Mileage': newVal = mileageKm ? `${Number(mileageKm).toLocaleString()} miles` : ''; break;
        case 'Type': newVal = category; break;
        case 'Warranty': newVal = warrantySummary; break;
        case 'Parts Included': newVal = includedItems; break;
        default: return spec;
      }
      if (newVal !== spec.value) return { ...spec, value: newVal ?? '' };
      return spec;
    })));
  }, [sku, mainSpecMake, cylinders, displacement, transmissionType, engineCode, productYearStart, productYearEnd, condition, mileageKm, category, warrantySummary, includedItems]);

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
          // Filter out the current product to make indices in dropdown sequential
          const filtered = res.data.filter((p) => p.id !== id);
          setRpSearchResults(filtered);
          setRpFocusedIndex(-1);
        }
      } catch {
        // ignore
      } finally {
        setIsRpSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [rpSearch, id]);

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

  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .get<{
        success: boolean;
        data: Product & {
          images?: Array<{ id: string; image_path: string; large_path?: string; medium_path?: string; thumb_path?: string }>;
          compatibility?: Array<{ make: string; model: string; year_start?: number; year_end?: number; notes?: string }>;
        };
      }>(`/admin/products/${id}`)
      .then((res) => {
        if (cancelled) return;
        const p = res.data;
        setTitle(p.title);
        setSku(p.sku);
        setDescription(p.description ?? '');
        setCategory(p.category ?? '');
        setEngineCode(p.engine_code ?? '');
        setDisplacement(p.displacement ?? '');
        setCylinders(p.cylinders?.toString() ?? '');
        setFuelType(p.fuel_type ?? '');
        setTransmissionType(p.transmission_type ?? '');
        setProductMake(p.make ?? '');
        setProductModel(p.model ?? '');
        setProductYearStart(p.year_start?.toString() ?? '');
        setProductYearEnd(p.year_end?.toString() ?? '');
        setPriceDollars((p.price_cents / 100).toFixed(2));
        setCompareAtPriceDollars(
          (p as unknown as { compare_at_price_cents?: number | null }).compare_at_price_cents
            ? (((p as unknown as { compare_at_price_cents: number }).compare_at_price_cents) / 100).toFixed(2)
            : ''
        );
        setStock(((p as unknown as { quantity?: number }).quantity ?? p.stock ?? 0).toString());
        setMaxPerOrder(p.max_per_order?.toString() ?? '1');
        setSlug(p.slug ?? '');
        setMetaTitle(p.meta_title ?? '');
        setMetaDescription(p.meta_description ?? '');
        setStatus(p.status ?? 'draft');
        setFeatured(p.featured ?? false);
        // Detail enrichment fields
        const pp = p as unknown as {
          mileage_km?: number | null;
          condition?: string | null;
          condition_notes?: string | null;
          included_items?: string | null;
          warranty_summary?: string | null;
          specs_json?: string | null;
        };
        setMileageKm(pp.mileage_km != null ? String(pp.mileage_km) : '');
        setCondition(pp.condition ?? '');
        setConditionNotes(pp.condition_notes ?? '');
        setIncludedItems(pp.included_items ?? '');
        setWarrantySummary(pp.warranty_summary ?? '');
        let parsedSpecs: Array<{ label: string; value: string }> = [];
        if (pp.specs_json) {
          try {
            const parsed = JSON.parse(pp.specs_json);
            if (Array.isArray(parsed)) parsedSpecs = parsed.filter((s) => s && typeof s.label === 'string');
          } catch {
            // ignore
          }
        }
        const standardLabels = [
          'Part Code', 'Brand', 'Number of Cylinders', 'Engine Size',
          'Transmission Type', 'Engine Code', 'Year Range', 'Condition',
          'Mileage', 'Type', 'Part Number', 'Country/Region of Manufacture',
          'Warranty', 'Parts Included', 'Modification Notes'
        ];
        const finalSpecs = [...parsedSpecs];
        for (const label of standardLabels) {
          if (!finalSpecs.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
            let val = '';
            if (label === 'Part Code') val = p.sku ?? '';
            else if (label === 'Brand') val = p.make ?? '';
            else if (label === 'Number of Cylinders') val = p.cylinders?.toString() ?? '';
            else if (label === 'Engine Size') val = p.displacement ?? '';
            else if (label === 'Transmission Type') val = p.transmission_type ?? '';
            else if (label === 'Engine Code') val = p.engine_code ?? '';
            else if (label === 'Year Range') {
              const ys = p.year_start;
              const ye = p.year_end;
              if (ys && ye && ys !== ye) val = `${ys}–${ye}`;
              else if (ys) val = String(ys);
            }
            else if (label === 'Condition') val = pp.condition ?? '';
            else if (label === 'Mileage') val = pp.mileage_km ? `${pp.mileage_km} miles` : '';
            else if (label === 'Type') val = p.category ?? '';
            else if (label === 'Country/Region of Manufacture') val = 'Japan';
            else if (label === 'Warranty') val = pp.warranty_summary ?? '';
            else if (label === 'Parts Included') val = pp.included_items ?? '';
            
            finalSpecs.push({ label, value: val });
          }
        }
        setSpecs(sortSpecs(finalSpecs));

        if (p.compatibility && Array.isArray(p.compatibility) && p.compatibility.length > 0) {
          setCompatibility(p.compatibility.map((c) => ({
            make: c.make ?? '',
            model: c.model ?? '',
            year_start: c.year_start?.toString() ?? '',
            year_end: c.year_end?.toString() ?? '',
            notes: c.notes ?? '',
          })));
        } else {
          setCompatibility([{ make: '', model: '', year_start: '', year_end: '', notes: '' }]);
        }

        // Load existing images from DB
        if (p.images && Array.isArray(p.images)) {
          setExistingImages(p.images.map((img) => ({
            id: img.id,
            url: img.medium_path || img.large_path || img.image_path,
          })));
        }

        // Load related products
        let rpIds: string[] = [];
        if (p.related_product_ids) {
          try {
            const parsed = JSON.parse(p.related_product_ids);
            if (Array.isArray(parsed)) rpIds = parsed.filter(Boolean);
          } catch {}
        }
        if (rpIds.length > 0) {
          adminApi
            .get<{ data: Product[] }>('/products', { ids: rpIds.join(','), limit: 50 })
            .then((res) => {
              if (!cancelled && res.data) setRelatedProducts(res.data);
            })
            .catch(() => {});
        }

        // Load product reviews
        adminApi
          .get<{ success: boolean; data: any[] }>(`/admin/reviews?product_id=${id}&limit=100`)
          .then((res) => {
            if (!cancelled) setProductReviews(res.data);
          })
          .catch(() => {});
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load product');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleFileDrop = useCallback((files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setImageFiles((prev) => [...prev, ...arr]);
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => setImages((prev) => [...prev, e.target?.result as string]);
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
        'Part Code': sku,
        'Brand': productMake,
        'Number of Cylinders': cylinders,
        'Engine Size': displacement,
        'Transmission Type': transmissionType,
        'Engine Code': engineCode,
        'Year Range': (() => {
          const ys = productYearStart;
          const ye = productYearEnd;
          if (ys && ye && ys !== ye) return `${ys}–${ye}`;
          if (ys) return ys;
          return '';
        })(),
        'Condition': condition,
        'Mileage': mileageKm ? `${Number(mileageKm).toLocaleString()} miles` : '',
        'Type': category,
        'Warranty': warrantySummary,
        'Parts Included': includedItems,
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
        title, sku, description, category,
        make: productMake || null,
        model: productModel || null,
        year_start: productYearStart ? parseInt(productYearStart) : null,
        year_end: productYearEnd ? parseInt(productYearEnd) : null,
        engine_code: engineCode || null,
        displacement: displacement || null,
        cylinders: cylinders ? parseInt(cylinders) : null,
        fuel_type: fuelType || null,
        transmission_type: transmissionType || null,
        price_cents: Math.round(parseFloat(priceDollars) * 100),
        compare_at_price_cents: compareAtPriceDollars ? Math.round(parseFloat(compareAtPriceDollars) * 100) : null,
        quantity: parseInt(stock) || 0,
        max_per_order: maxPerOrder ? Math.max(1, parseInt(maxPerOrder)) : 1,
        slug, meta_title: metaTitle || null, meta_description: metaDescription || null,
        status, featured,
        mileage_km: mileageKm ? parseInt(mileageKm) : null,
        condition: condition || null,
        condition_notes: conditionNotes || null,
        included_items: includedItems || null,
        warranty_summary: warrantySummary || null,
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
      await adminApi.patch(`/admin/products/${id}`, payload);
      // Delete removed images
      if (deletedImageIds.length > 0) {
        for (const imgId of deletedImageIds) {
          await adminApi.delete(`/admin/products/${id}/images/${imgId}`);
        }
      }
      if (imageFiles.length > 0) {
        for (const file of imageFiles) {
          const fd = new FormData();
          fd.append('images', file);
          await adminApi.upload(`/admin/products/${id}/images`, fd);
        }
      }
      router.push('/admin/products');
      toast.success('Product saved successfully');
    } catch (err) {
      let msg = err instanceof Error ? err.message : 'Failed to save';
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await adminApi.delete(`/admin/products/${id}`);
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const inputClass = 'bg-muted border-border text-foreground placeholder:text-muted-foreground/60 h-12 text-sm';
  const selectClass = 'h-12 w-full rounded-lg border border-border bg-muted px-2 text-sm text-foreground focus:border-[#DC2626] focus:outline-none';
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t('editProduct')}</h1>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="gap-1.5"
        >
          <Trash2 className="size-4" />
          {t('deleteProduct')}
        </Button>
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
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>{t('sku')}</Label>
                <Input value={sku} onChange={(e) => setSku(e.target.value)} required className={`${inputClass} font-mono`} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('fullDescription')}</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-muted border-border text-foreground text-sm resize-none min-h-[100px]" />
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
                  <input type="radio" name="category" value={cat} checked={category === cat} onChange={() => setCategory(cat)} className="accent-[#DC2626]" />
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
                value={productMake}
                onChange={(val) => {
                  setProductMake(val);
                  setProductModel('');
                }}
                options={makes}
                placeholder="e.g. Honda"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Model</Label>
              <SearchableDropdown
                value={productModel}
                onChange={(val) => setProductModel(val)}
                options={modelsForMake(productMake)}
                placeholder="e.g. Civic"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Year Start</Label>
              <Input
                type="number"
                value={productYearStart}
                onChange={(e) => setProductYearStart(e.target.value)}
                placeholder="Start"
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Year End</Label>
              <Input
                type="number"
                value={productYearEnd}
                onChange={(e) => setProductYearEnd(e.target.value)}
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
              <Input value={engineCode} onChange={(e) => setEngineCode(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('displacement')}</Label>
              <Input value={displacement} onChange={(e) => setDisplacement(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('cylinders')}</Label>
              <Input type="number" value={cylinders} onChange={(e) => setCylinders(e.target.value)} min={1} max={16} className={inputClass} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('fuelType')}</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/30 p-2.5 min-h-12 items-center">
                {FUEL_TYPES.map((f) => {
                  const selectedList = fuelType
                    ? fuelType.split(',').map((x) => x.trim().toLowerCase())
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
                          setFuelType(nextList.join(', '));
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
                value={transmissionType}
                onChange={(val) => setTransmissionType(val)}
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
              <Input type="number" step="0.01" min="0" value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Old Price (Compare at)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={compareAtPriceDollars}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCompareAtPriceDollars(val);
                  }}
                  placeholder="Leave empty for no strikethrough"
                  className={inputClass + ' flex-1'}
                />
                {compareAtPriceDollars && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setCompareAtPriceDollars('')}
                    className="border-border text-muted-foreground hover:bg-[#DC2626]/10 hover:text-[#DC2626] h-12 w-12 shrink-0"
                    title="Unset old price"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
              {compareAtPriceDollars && priceDollars && parseFloat(compareAtPriceDollars) <= parseFloat(priceDollars) && (
                <p className="text-[10px] text-[#DC2626]">Old price must be greater than current price</p>
              )}
              {compareAtPriceDollars && priceDollars && parseFloat(compareAtPriceDollars) > parseFloat(priceDollars) && (
                <p className="text-[10px] text-emerald-500">
                  {Math.round(((parseFloat(compareAtPriceDollars) - parseFloat(priceDollars)) / parseFloat(compareAtPriceDollars)) * 100)}% discount
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>{t('quantity')}</Label>
              <Input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Max items per order</Label>
              <Input
                type="number"
                min="1"
                value={maxPerOrder}
                onChange={(e) => setMaxPerOrder(e.target.value)}
                className={inputClass}
                placeholder="1"
              />
              <p className="text-[10px] text-muted-foreground/60">Set to greater than 1 to show +/− quantity controls in the cart.</p>
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Mileage (miles)</Label>
              <Input
                type="number"
                min="0"
                value={mileageKm}
                onChange={(e) => setMileageKm(e.target.value)}
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
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className={inputClass}
                  placeholder="JDM Used – Inspected & Tested"
                />
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>Warranty summary</Label>
                <Input
                  value={warrantySummary}
                  onChange={(e) => setWarrantySummary(e.target.value)}
                  className={inputClass}
                  placeholder="30-day warranty against major defects."
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>Additional Information</Label>
              <Textarea
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                className="bg-muted border-border text-foreground text-sm resize-none min-h-[90px]"
                placeholder="Visual inspection, oil leak check, compression test results..."
              />
            </div>
            <div className="space-y-1">
              <Label className={labelClass}>What&rsquo;s included (one bullet per line)</Label>
              <Textarea
                value={includedItems}
                onChange={(e) => setIncludedItems(e.target.value)}
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
                      } items-start flex-1 transition-colors duration-155`}>
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
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileDrop(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragging ? 'border-[#DC2626] bg-[#DC2626]/5' : 'border-border hover:border-muted-foreground/60'}`}
            >
              <Upload className="size-6 text-muted-foreground/60 mb-2" />
              <p className="text-sm text-muted-foreground">{t('dragDropImages')}</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileDrop(e.target.files)} />
            </div>
            {/* Existing images from DB */}
            {existingImages.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Current Images</p>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative size-20 overflow-hidden rounded-lg border border-border">
                      <img src={`/api${img.url}`} alt="" className="size-full object-cover" />
                      <button type="button" onClick={() => {
                        setDeletedImageIds((prev) => [...prev, img.id]);
                        setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
                      }} className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/70 text-foreground hover:bg-[#DC2626]">
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* New uploads (previews) */}
            {images.length > 0 && (
              <div>
                {existingImages.length > 0 && <p className="text-xs text-muted-foreground mb-2">New Uploads</p>}
                <div className="flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <div key={i} className="relative size-20 overflow-hidden rounded-lg border border-border">
                      <img src={src} alt="" className="size-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-background/70 text-foreground hover:bg-[#DC2626]">
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
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
              <Label className={labelClass}>{t('slug')}</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputClass} font-mono`} />
            </div>
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
          <CardHeader className="border-b border-border pb-3">
            <CardTitle className="text-sm text-foreground">{t('statusSection')}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-1">
              <Label className={labelClass}>{t('status')}</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                {STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={featured} onCheckedChange={setFeatured} />
              <Label className="text-sm text-foreground">{t('featured')}</Label>
            </div>
          </CardContent>
        </Card>

        {/* Product Reviews */}
        <Card className="bg-card border-border">
          <CardHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-[#DC2626]" />
              <CardTitle className="text-sm text-foreground">Reviews ({productReviews.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {productReviews.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No reviews for this product yet.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {productReviews.map((review: any) => (
                  <div key={review.id} className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">{review.customer_name}</span>
                      <span className="text-xs text-muted-foreground">{review.rating}/5</span>
                    </div>
                    {review.title && <p className="mt-0.5 text-xs font-medium text-foreground">{review.title}</p>}
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{review.content}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open('/admin/reviews', '_blank')}
              className="mt-3 w-full text-xs text-[#DC2626] hover:bg-[#DC2626]/10 gap-1"
            >
              <ExternalLink className="size-3" />
              View All Reviews
            </Button>
          </CardContent>
        </Card>

        {error && (
          <p className="rounded-lg bg-[#DC2626]/10 border border-[#DC2626]/30 px-3 py-2 text-sm text-[#DC2626]">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={isSaving} className="bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50 gap-1.5">
            <Save className="size-4" />
            {isSaving ? t('saving') : t('save')}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="border-border text-muted-foreground hover:text-foreground hover:bg-muted">
            Cancel
          </Button>
        </div>
      </form>

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => setShowDeleteDialog(open)}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('deleteProduct')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('deleteConfirm')}</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(false)} className="border-border text-muted-foreground hover:text-foreground hover:bg-muted">
              Cancel
            </Button>
            <Button size="sm" onClick={handleDelete} disabled={isDeleting} className="bg-[#DC2626] text-white hover:bg-[#ef4444]">
              {isDeleting ? '...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
