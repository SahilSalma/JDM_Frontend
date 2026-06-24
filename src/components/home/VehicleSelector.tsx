'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchableDropdown } from '@/components/admin/SearchableDropdown';
import { useVehicleSelector } from '@/hooks/useVehicleSelector';
import { cn } from '@/lib/utils';

export default function VehicleSelector() {
  const t = useTranslations('home');
  const router = useRouter();
  const {
    makes,
    models,
    years,
    selectedMake,
    selectedModel,
    selectedYear,
    setMake,
    setModel,
    setYear,
    isLoadingModels,
  } = useVehicleSelector();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedMake) params.set('make', selectedMake);
    if (selectedModel) params.set('model', selectedModel);
    if (selectedYear) params.set('year', String(selectedYear));
    router.push(`/make?${params.toString()}`);
  };

  return (
    <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
      <div className="rounded-2xl border border-border bg-card/80 px-4 py-3 shadow-2xl backdrop-blur-md sm:px-6 sm:py-4">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          {/* Label */}
          <span className="hidden shrink-0 font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground lg:block">
            {t('vehicleSelector.search')}
          </span>

          {/* Divider */}
          <div className="hidden h-6 w-px bg-border lg:block" />

          {/* Make */}
          <div className="flex-1">
            <SearchableDropdown
              value={selectedMake}
              onChange={(v) => {}}
              onSelect={(v) => setMake(v)}
              options={makes}
              placeholder={t('vehicleSelector.make')}
              className={cn(
                'w-full border-border bg-input text-foreground hover:border-[#DC2626]/40 focus-visible:border-[#DC2626] focus-visible:ring-[#DC2626]/20 h-12 text-sm',
                !selectedMake && 'text-muted-foreground/60'
              )}
            />
          </div>

          {/* Model */}
          <div className="flex-1">
            <SearchableDropdown
              value={selectedModel}
              onChange={(v) => {}}
              onSelect={(v) => setModel(v)}
              options={!selectedMake || isLoadingModels ? [] : models}
              placeholder={isLoadingModels ? 'Loading...' : t('vehicleSelector.model')}
              disabled={!selectedMake}
              className={cn(
                'w-full border-border bg-input text-foreground hover:border-[#DC2626]/40 focus-visible:border-[#DC2626] focus-visible:ring-[#DC2626]/20 h-9 text-sm',
                !selectedModel && 'text-muted-foreground/60'
              )}
            />
          </div>

          {/* Year */}
          <div className="flex-1">
            <SearchableDropdown
              value={selectedYear ? String(selectedYear) : ''}
              onChange={(v) => {}}
              onSelect={(v) => setYear(v ? Number(v) : null)}
              options={!selectedModel ? [] : years.map(String)}
              placeholder={t('vehicleSelector.year')}
              disabled={!selectedModel}
              className={cn(
                'w-full border-border bg-input text-foreground hover:border-[#DC2626]/40 focus-visible:border-[#DC2626] focus-visible:ring-[#DC2626]/20 h-9 text-sm',
                !selectedYear && 'text-muted-foreground/60'
              )}
            />
          </div>

          {/* Search button */}
          <Button
            onClick={handleSearch}
            disabled={!selectedMake}
            className="shrink-0 gap-2 bg-[#DC2626] font-heading text-xs font-bold uppercase tracking-widest text-white hover:bg-[#ef4444] disabled:opacity-40 h-12 px-6"
          >
            <Search className="size-4" />
            {t('vehicleSelector.search')}
          </Button>
        </div>
      </div>
    </div>
  );
}
