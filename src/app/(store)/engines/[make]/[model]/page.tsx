import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import FilteredProductGrid from '@/components/product/FilteredProductGrid';
import { getMakes } from '@/lib/getVehicleDataServer';

type PageProps = { params: Promise<{ make: string; model: string }> };

/** Convert a URL slug ("civic-type-r") to a display string ("Civic Type R") */
function formatModelSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { make, model } = await params;
  const makes = await getMakes();
  const matchedMake = makes.find((m) => m.toLowerCase() === make.toLowerCase());

  if (!matchedMake) {
    return { title: 'Not Found | JDM Tokyo Motorsports' };
  }

  const t = await getTranslations('home');
  const displayModel = formatModelSlug(model);
  const title = t('makeModelEnginesTitle', { make: matchedMake, model: displayModel });

  return {
    title: `${title} | JDM Tokyo Motorsports`,
    description: `Shop JDM ${matchedMake} ${displayModel} engines. Low mileage units sourced directly from Japan, backed by a 30-day warranty. Perfect for engine swaps and replacements.`,
    openGraph: {
      title,
      description: `Shop JDM ${matchedMake} ${displayModel} engines. Low mileage, direct from Japan, with 30-day warranty.`,
    },
  };
}

export default async function EngineMakeModelPage({ params }: PageProps) {
  const { make, model } = await params;
  const makes = await getMakes();
  const matchedMake = makes.find((m) => m.toLowerCase() === make.toLowerCase());

  if (!matchedMake) notFound();

  const displayModel = formatModelSlug(model);

  const t = await getTranslations('home');
  const tn = await getTranslations('nav');

  const breadcrumbs = [
    { label: tn('home'), href: '/' },
    { label: tn('engines'), href: '/engines' },
    { label: matchedMake, href: `/engines/${make.toLowerCase()}` },
    { label: displayModel },
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
            {t('makeModelEnginesTitle', { make: matchedMake, model: displayModel })}
          </h1>
        </div>

        {/* Filtered product grid */}
        <FilteredProductGrid category="engine" make={matchedMake} model={displayModel} />
      </div>
    </div>
  );
}
