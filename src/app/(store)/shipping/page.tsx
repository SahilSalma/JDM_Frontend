import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Truck, Building2, Home, Clock, Package } from 'lucide-react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Separator } from '@/components/ui/separator';
import PolicyContent from '@/components/product/PolicyContent';

export const metadata: Metadata = {
  title: 'Shipping Information | JDM Tokyo Motorsports',
  description:
    'Shipping rates, carriers, and delivery times for JDM engines and transmissions. Business $500, Residential $700 nationwide.',
};

export default async function ShippingPage() {
  const t = await getTranslations('shippingPage');

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: t('title') },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={breadcrumbs} className="mb-8" />

      <div className="mb-12">
        <h1 className="font-heading text-5xl font-bold uppercase tracking-wide text-foreground">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Separator className="mb-10 bg-border" />

      <PolicyContent settingsKey="policy_shipping" fallback={
        <>
          {/* Rates */}
          <section className="mb-10">
            <h2 className="mb-6 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {t('rates.title')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-blue-500/10">
                  <Building2 className="size-6 text-blue-400" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">{t('rates.business.title')}</h3>
                <p className="mt-1 font-heading text-3xl font-bold text-[#DC2626]">{t('rates.business.price')}</p>
                <p className="mt-3 text-sm text-muted-foreground">{t('rates.business.description')}</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-green-500/10">
                  <Home className="size-6 text-green-400" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground">{t('rates.residential.title')}</h3>
                <p className="mt-1 font-heading text-3xl font-bold text-[#DC2626]">{t('rates.residential.price')}</p>
                <p className="mt-3 text-sm text-muted-foreground">{t('rates.residential.description')}</p>
              </div>
            </div>
          </section>

          <Separator className="mb-10 bg-border" />

          {/* Carriers */}
          <section className="mb-10">
            <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {t('carriers.title')}
            </h2>
            <p className="mb-4 text-muted-foreground">{t('carriers.description')}</p>
            <ul className="space-y-2">
              {(['carrier1', 'carrier2', 'carrier3'] as const).map((key) => (
                <li key={key} className="flex items-center gap-3">
                  <Truck className="size-4 shrink-0 text-[#DC2626]" />
                  <span className="text-muted-foreground">{t(`carriers.${key}`)}</span>
                </li>
              ))}
            </ul>
          </section>

          <Separator className="mb-10 bg-border" />

          {/* Delivery times */}
          <section className="mb-10">
            <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {t('timeline.title')}
            </h2>
            <div className="space-y-4">
              {(['step1', 'step2', 'step3'] as const).map((key, idx) => (
                <div key={key} className="flex items-start gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 border border-[#DC2626]/30">
                    <Clock className="size-5 text-[#DC2626]" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{t(`timeline.${key}.label`)}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{t(`timeline.${key}.description`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Separator className="mb-10 bg-border" />

          {/* Notes */}
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Package className="mt-1 size-6 shrink-0 text-[#DC2626]" />
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">{t('notes.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('notes.description')}</p>
              </div>
            </div>
          </section>
        </>
      } />
    </div>
  );
}
