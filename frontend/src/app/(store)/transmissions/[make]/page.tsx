import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import FilteredProductGrid from '@/components/product/FilteredProductGrid';
import { TRANSMISSION_TYPES } from '@/lib/constants';
import { getMakes } from '@/lib/getVehicleDataServer';

type PageProps = { params: Promise<{ make: string }> };

export async function generateStaticParams() {
  const makes = await getMakes();
  return [
    ...makes.map((make) => ({ make: make.toLowerCase() })),
    ...TRANSMISSION_TYPES.map((type) => ({ make: type })),
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { make } = await params;
  const makes = await getMakes();
  const matchedMake = makes.find((m) => m.toLowerCase() === make.toLowerCase());
  const matchedType = TRANSMISSION_TYPES.find((t) => t === make.toLowerCase());

  if (!matchedMake && !matchedType) {
    return { title: 'Not Found | JDM Tokyo Motorsports' };
  }

  if (matchedType) {
    const label = matchedType.charAt(0).toUpperCase() + matchedType.slice(1);
    const title = `JDM ${label} Transmissions`;
    return {
      title: `${title} | JDM Tokyo Motorsports`,
      description: `Shop our selection of JDM ${label} transmissions. All units are low mileage, sourced directly from Japan, and backed by a 30-day warranty.`,
      openGraph: { title, description: `Shop JDM ${label} transmissions. Low mileage, direct from Japan.` },
    };
  }

  const t = await getTranslations('home');
  const title = t('makeTransmissionsTitle', { make: matchedMake! });

  return {
    title: `${title} | JDM Tokyo Motorsports`,
    description: `Shop our selection of JDM ${matchedMake} transmissions. All units are low mileage, sourced directly from Japan, and backed by a 30-day warranty. Browse ${matchedMake} manual and automatic transmissions.`,
    openGraph: {
      title,
      description: `Shop JDM ${matchedMake} transmissions. Low mileage, direct from Japan, with 30-day warranty.`,
    },
  };
}

export default async function TransmissionMakePage({ params }: PageProps) {
  const { make } = await params;
  const makes = await getMakes();
  const matchedMake = makes.find((m) => m.toLowerCase() === make.toLowerCase());
  const matchedType = TRANSMISSION_TYPES.find((t) => t === make.toLowerCase());

  if (!matchedMake && !matchedType) notFound();

  const tn = await getTranslations('nav');

  if (matchedType) {
    const label = matchedType.charAt(0).toUpperCase() + matchedType.slice(1);
    const breadcrumbs = [
      { label: tn('home'), href: '/' },
      { label: tn('transmissions'), href: '/transmissions' },
      { label: `${label}` },
    ];

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-none px-4 py-8 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
          <Breadcrumbs items={breadcrumbs} className="mb-6" />
          <div className="mb-8">
            <div className="mb-1 h-0.5 w-8 bg-[#DC2626]" aria-hidden="true" />
            <h1 className="font-heading text-3xl font-black uppercase tracking-wide text-foreground sm:text-4xl">
              JDM {label} Transmissions
            </h1>
          </div>
          <FilteredProductGrid category="transmission" transmissionType={matchedType} />
        </div>
      </div>
    );
  }

  const t = await getTranslations('home');
  const breadcrumbs = [
    { label: tn('home'), href: '/' },
    { label: tn('transmissions'), href: '/transmissions' },
    { label: matchedMake! },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-none px-4 py-8 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        <Breadcrumbs items={breadcrumbs} className="mb-6" />
        <div className="mb-8">
          <div className="mb-1 h-0.5 w-8 bg-[#DC2626]" aria-hidden="true" />
          <h1 className="font-heading text-3xl font-black uppercase tracking-wide text-foreground sm:text-4xl">
            {t('makeTransmissionsTitle', { make: matchedMake! })}
          </h1>
        </div>
        <FilteredProductGrid category="transmission" make={matchedMake!} />
      </div>
    </div>
  );
}
