import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import FilteredProductGrid from '@/components/product/FilteredProductGrid';
import { getMakes } from '@/lib/getVehicleDataServer';

type PageProps = { searchParams: Promise<{ make?: string }> };

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { make } = await searchParams;
  if (make) {
    const makes = await getMakes();
    const matchedMake = makes.find((m) => m.toLowerCase() === make.toLowerCase());
    if (matchedMake) {
      return {
        title: `Shop All JDM ${matchedMake} Products | JDM Tokyo Motorsports`,
        description: `Browse our full selection of JDM ${matchedMake} engines, transmissions, and performance parts. All units are low mileage, sourced directly from Japan, and backed by a 30-day warranty.`,
        openGraph: {
          title: `Shop All JDM ${matchedMake} Products`,
          description: `Browse JDM ${matchedMake} engines, transmissions, and parts. Low mileage, direct from Japan, with 30-day warranty.`,
        },
      };
    }
  }
  return { title: 'Shop All JDM Products | JDM Tokyo Motorsports' };
}

export default async function MakePage({ searchParams }: PageProps) {
  const { make } = await searchParams;
  const makes = await getMakes();
  const matchedMake = make ? makes.find((m) => m.toLowerCase() === make.toLowerCase()) : null;
  const displayName = matchedMake || 'All Makes';
  const tn = await getTranslations('nav');

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-[calc(var(--announcement-height,36px)+64px)] z-10 bg-background">
        <div className="mx-auto max-w-none px-4 pt-8 pb-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
          <Breadcrumbs items={[{ label: tn('home'), href: '/' }, { label: displayName }]} className="mb-6" />
          <div className="mb-8">
            <div className="mb-1 h-0.5 w-8 bg-[#DC2626]" aria-hidden="true" />
            <h1 className="font-heading text-3xl font-black uppercase tracking-wide text-foreground sm:text-4xl">
              {displayName}
            </h1>
            {matchedMake && (
              <p className="mt-2 text-sm text-muted-foreground/70">
                All JDM {matchedMake} engines, transmissions, and parts
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-none px-4 pb-8 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        <FilteredProductGrid />
      </div>
    </div>
  );
}
