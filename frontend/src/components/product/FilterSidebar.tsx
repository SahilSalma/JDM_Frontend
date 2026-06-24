'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useVehicleSelector } from '@/hooks/useVehicleSelector';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  /** When set, the category filter is locked to this value */
  lockedCategory?: 'engine' | 'transmission' | 'part';
  /** When set, the make filter is locked to this value */
  lockedMake?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Internal filter form — shared between sidebar and sheet
// ---------------------------------------------------------------------------

interface FilterFormProps {
  lockedCategory?: string;
  lockedMake?: string;
  onApply: (filters: Record<string, string>) => void;
  onClear: () => void;
  initialValues: Record<string, string>;
}

function FilterForm({
  lockedCategory,
  lockedMake,
  onApply,
  onClear,
  initialValues,
}: FilterFormProps) {
  const t = useTranslations('home');
  const tc = useTranslations('common');

  const {
    makes,
    models,
    years,
    selectedMake,
    selectedModel,
    setMake,
    setModel,
    setYear,
    isLoadingModels,
    resetSelection,
  } = useVehicleSelector();

  const [minPrice, setMinPrice] = useState(initialValues.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState(initialValues.maxPrice ?? '');
  const [inStockOnly, setInStockOnly] = useState(
    initialValues.inStock === 'true'
  );
  const [category, setCategory] = useState(
    lockedCategory ?? initialValues.category ?? ''
  );

  // Multi-select makes (comma-separated in URL)
  const [selectedMakes, setSelectedMakes] = useState<Set<string>>(() => {
    const fromUrl = initialValues.make ?? '';
    const urlMakes = fromUrl ? fromUrl.split(',').filter(Boolean) : [];
    const makes = new Set(urlMakes);
    if (lockedMake && makes.size === 0) {
      makes.add(lockedMake);
    }
    return makes;
  });

  // Multi-select models (comma-separated in URL)
  const [selectedModels, setSelectedModels] = useState<Set<string>>(() => {
    const initial = initialValues.model ?? '';
    return new Set(initial ? initial.split(',').filter(Boolean) : []);
  });

  // Multi-select years (comma-separated in URL)
  const [selectedYears, setSelectedYears] = useState<Set<string>>(() => {
    const initial = initialValues.year ?? '';
    return new Set(initial ? initial.split(',').filter(Boolean) : []);
  });

  const toggleMake = (make: string) => {
    setSelectedMakes((prev) => {
      const next = new Set(prev);
      if (next.has(make)) next.delete(make);
      else next.add(make);
      return next;
    });
    // Sync single-select vehicle selector with first selected make for model/year cascade
    const nextMakes = new Set(selectedMakes);
    if (nextMakes.has(make)) nextMakes.delete(make);
    else nextMakes.add(make);
    const first = [...nextMakes][0] ?? '';
    if (first !== selectedMake) setMake(first);
  };

  const toggleModel = (model: string) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(model)) next.delete(model);
      else next.add(model);
      return next;
    });
  };

  const toggleYear = (year: string) => {
    setSelectedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  // Sync selector from initial values or lockedMake on mount
  useEffect(() => {
    const make = initialValues.make;
    const firstMake = make ? make.split(',')[0] : '';
    const targetMake = firstMake || lockedMake || '';
    if (targetMake && !selectedMake) {
      setMake(targetMake);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialValues.model && !selectedModel && models.length > 0) {
      setModel(initialValues.model);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models]);

  useEffect(() => {
    if (initialValues.year && years.length > 0) {
      setYear(Number(initialValues.year));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

  const buildFilters = useCallback(
    (priceMin: string, priceMax: string): Record<string, string> => {
      const filters: Record<string, string> = {};
      if (!lockedCategory && category) filters.category = category;
      const makeStr = [...selectedMakes].join(',');
      if (makeStr) filters.make = makeStr;
      const modelStr = [...selectedModels].join(',');
      if (modelStr) filters.model = modelStr;
      const yearStr = [...selectedYears].join(',');
      if (yearStr) filters.year = yearStr;
      if (priceMin) filters.minPrice = priceMin;
      if (priceMax) filters.maxPrice = priceMax;
      if (inStockOnly) filters.inStock = 'true';
      return filters;
    },
    [lockedCategory, category, selectedMakes, selectedModels, selectedYears, inStockOnly],
  );

  // Auto-apply only for non-price filters. Price uses its own Apply button so
  // typing digits doesn't fire a request on every keystroke.
  const isFirstRender = useRef(true);
  const minPriceRef = useRef(minPrice);
  const maxPriceRef = useRef(maxPrice);
  useEffect(() => {
    minPriceRef.current = minPrice;
    maxPriceRef.current = maxPrice;
  }, [minPrice, maxPrice]);

  const autoApplyDeps = [
    lockedCategory,
    category,
    // Use stable string keys for sets so the effect fires on add/remove only.
    [...selectedMakes].sort().join(','),
    [...selectedModels].sort().join(','),
    [...selectedYears].sort().join(','),
    inStockOnly,
  ];
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const id = setTimeout(() => {
      onApply(buildFilters(minPriceRef.current, maxPriceRef.current));
    }, 200);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, autoApplyDeps);

  const handlePriceApply = () => {
    onApply(buildFilters(minPrice, maxPrice));
  };

  const handleClear = () => {
    resetSelection();
    setSelectedMakes(new Set(lockedMake ? [lockedMake] : []));
    setSelectedModels(new Set());
    setSelectedYears(new Set());
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    if (!lockedCategory) setCategory('');
    onClear();
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Category (hidden when locked) */}
      {!lockedCategory && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {tc('filter')}
          </label>
          <Select
            value={category || undefined}
            onValueChange={(v) => setCategory(v as string)}
          >
            <SelectTrigger className="w-full border-border bg-input text-foreground">
              <span className="capitalize">{category || 'All Categories'}</span>
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value="engine" className="text-foreground">
                Engine
              </SelectItem>
              <SelectItem value="transmission" className="text-foreground">
                Transmission
              </SelectItem>
              <SelectItem value="part" className="text-foreground">
                Part
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Make — multi-select checkboxes */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('allMakes')}
        </label>
        <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-md border border-border bg-input p-2">
          {makes.map((make) => (
            <label key={make} className="flex cursor-pointer items-center gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={selectedMakes.has(make)}
                onClick={() => toggleMake(make)}
                className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  selectedMakes.has(make)
                    ? 'border-[#DC2626] bg-[#DC2626]'
                    : 'border-border bg-input'
                )}
              >
                {selectedMakes.has(make) && (
                  <svg viewBox="0 0 12 12" className="size-2.5 text-white" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className="text-sm text-foreground">{make}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Model — multi-select checkboxes */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('allModels')}
        </label>
        {!selectedMake && selectedMakes.size === 0 ? (
          <p className="text-xs text-muted-foreground/40 py-2">{t('allModels')}</p>
        ) : isLoadingModels ? (
          <p className="text-xs text-muted-foreground/40 py-2">Loading...</p>
        ) : models.length === 0 ? (
          <p className="text-xs text-muted-foreground/40 py-2">No models found</p>
        ) : (
          <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-md border border-border bg-input p-2">
            {models.map((model) => (
              <label key={model} className="flex cursor-pointer items-center gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selectedModels.has(model)}
                  onClick={() => toggleModel(model)}
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    selectedModels.has(model)
                      ? 'border-[#DC2626] bg-[#DC2626]'
                      : 'border-border bg-input'
                  )}
                >
                  {selectedModels.has(model) && (
                    <svg viewBox="0 0 12 12" className="size-2.5 text-white" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-foreground">{model}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Year — multi-select checkboxes */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('allYears')}
        </label>
        {(!selectedMake && selectedMakes.size === 0) || (selectedMake && !selectedModel) ? (
          <p className="text-xs text-muted-foreground/40 py-2">{t('allYears')}</p>
        ) : years.length === 0 ? (
          <p className="text-xs text-muted-foreground/40 py-2">No years found</p>
        ) : (
          <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-md border border-border bg-input p-2">
            {years.map((year) => (
              <label key={year} className="flex cursor-pointer items-center gap-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selectedYears.has(String(year))}
                  onClick={() => toggleYear(String(year))}
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    selectedYears.has(String(year))
                      ? 'border-[#DC2626] bg-[#DC2626]'
                      : 'border-border bg-input'
                  )}
                >
                  {selectedYears.has(String(year)) && (
                    <svg viewBox="0 0 12 12" className="size-2.5 text-white" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-foreground">{String(year)}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price range */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t('priceFrom')} / {t('priceTo')}
        </label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="$0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handlePriceApply();
              }
            }}
            className="border-border bg-input text-foreground placeholder:text-muted-foreground/40"
          />
          <span className="text-muted-foreground/40">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handlePriceApply();
              }
            }}
            className="border-border bg-input text-foreground placeholder:text-muted-foreground/40"
          />
        </div>
        <Button
          type="button"
          onClick={handlePriceApply}
          className="mt-2 w-full bg-[#DC2626] font-heading text-xs font-bold uppercase tracking-widest text-white hover:bg-[#ef4444]"
        >
          {tc('apply')} {t('priceFrom')}
        </Button>
      </div>

      {/* In stock only */}
      <label className="flex cursor-pointer items-center gap-3">
        <button
          role="checkbox"
          aria-checked={inStockOnly}
          onClick={() => setInStockOnly((v) => !v)}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
            inStockOnly
              ? 'border-[#DC2626] bg-[#DC2626]'
              : 'border-border bg-input'
          )}
        >
          {inStockOnly && (
            <svg viewBox="0 0 12 12" className="size-3 text-white" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
        <span className="text-sm text-muted-foreground">{t('inStockOnly')}</span>
      </label>

      {/* Action button — only Clear; filters auto-apply on change */}
      <div className="flex pt-2">
        <Button
          onClick={handleClear}
          variant="outline"
          className="flex-1 border-border font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-foreground/30 hover:text-foreground"
        >
          {tc('clear')}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile sheet trigger + FilterSidebar main export
// ---------------------------------------------------------------------------

export default function FilterSidebar({
  lockedCategory,
  lockedMake,
  className,
}: FilterSidebarProps) {
  const t = useTranslations('home');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sheetOpen, setSheetOpen] = useState(false);

  const getCurrentValues = useCallback(() => {
    const values: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      values[key] = value;
    }
    return values;
  }, [searchParams]);

  const applyFilters = useCallback(
    (filters: Record<string, string>) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        params.set(key, value);
      }
      // If make changed from the locked make, navigate to the new make page
      if (lockedMake && filters.make && !filters.make.split(',').includes(lockedMake)) {
        const newMakes = filters.make.split(',');
        if (lockedCategory) {
          const basePath = lockedCategory === 'engine' ? '/engines' : lockedCategory === 'transmission' ? '/transmissions' : '/parts';
          router.push(`${basePath}?${params.toString()}`);
        } else {
          router.push(`/make?${params.toString()}`);
        }
      } else {
        router.push(`${pathname}?${params.toString()}`);
      }
    },
    [router, pathname, lockedMake, lockedCategory]
  );

  // Clear all filters — wipe URL params completely. If we're on a make-locked
  // listing path (e.g. /engines/honda) there is no way to keep the lock without
  // re-adding a query param the user just removed, so we navigate to the
  // category root instead.
  const clearFilters = useCallback(() => {
    if (lockedMake && lockedCategory) {
      const basePath =
        lockedCategory === 'engine'
          ? '/engines'
          : lockedCategory === 'transmission'
            ? '/transmissions'
            : '/parts';
      router.push(basePath);
    } else {
      router.push(pathname);
    }
    setSheetOpen(false);
  }, [router, pathname, lockedMake, lockedCategory]);

  const initialValues = getCurrentValues();
  const activeFiltersCount = Object.keys(initialValues).filter(
    (k) => k !== 'page'
  ).length;

  return (
    <>
      {/* Mobile: sheet trigger bar */}
      <div className={cn('lg:hidden', className)}>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                className="w-full gap-2 border-border bg-card font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground hover:border-[#DC2626]/40 hover:text-foreground"
              />
            }
          >
            <SlidersHorizontal className="size-4" />
            {t('filtersTitle')}
            {activeFiltersCount > 0 && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white">
                {activeFiltersCount}
              </span>
            )}
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[320px] border-r border-border bg-card p-0"
          >
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle className="font-heading text-sm font-bold uppercase tracking-widest text-foreground">
                {t('filtersTitle')}
              </SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto p-4">
              <FilterForm
                lockedCategory={lockedCategory}
                lockedMake={lockedMake}
                onApply={applyFilters}
                onClear={clearFilters}
                initialValues={initialValues}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: permanent sidebar */}
      <aside
        className={cn(
          'hidden w-72 shrink-0 self-start rounded-xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-[calc(var(--announcement-height,36px)+64px+24px)] lg:block',
          className
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-sm font-bold uppercase tracking-widest text-foreground">
            {t('filtersTitle')}
          </h2>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-[#DC2626]"
            >
              <X className="size-3" />
              {t('clearFilters')}
            </button>
          )}
        </div>
        <FilterForm
          lockedCategory={lockedCategory}
          lockedMake={lockedMake}
          onApply={applyFilters}
          onClear={clearFilters}
          initialValues={initialValues}
        />
      </aside>
    </>
  );
}
