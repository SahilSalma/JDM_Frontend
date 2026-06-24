'use client';

import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import FilteredProductGrid from '@/components/product/FilteredProductGrid';

export default function TransmissionsPage() {
  const t = useTranslations('home');
  const tn = useTranslations('nav');

  const breadcrumbs = [
    { label: tn('home'), href: '/' },
    { label: t('transmissionsPageTitle') },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-none px-4 py-8 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbs} className="mb-6" />

        {/* Page header */}
        <div className="mb-8">
          <div className="mb-1 h-0.5 w-8 bg-[#DC2626]" aria-hidden="true" />
          <h1 className="font-heading text-3xl font-black uppercase tracking-wide text-foreground sm:text-4xl">
            {t('transmissionsPageTitle')}
          </h1>
        </div>

        {/* Filtered product grid — reads make/model/year/price/page from search params */}
        <FilteredProductGrid category="transmission" />
      </div>
    </div>
  );
}
