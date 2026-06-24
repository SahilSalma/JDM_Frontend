import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Shield, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Separator } from '@/components/ui/separator';
import PolicyContent from '@/components/product/PolicyContent';

export const metadata: Metadata = {
  title: 'Warranty Policy | JDM Tokyo Motorsports',
  description:
    '30-day warranty on all JDM engines and transmissions. Learn what is covered and how to make a claim.',
};

export default async function WarrantyPage() {
  const t = await getTranslations('warranty');

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

      <PolicyContent settingsKey="policy_warranty" fallback={
        <>
          {/* Overview */}
          <section className="mb-10 rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 p-6">
            <div className="flex items-start gap-4">
              <Shield className="mt-1 size-8 shrink-0 text-[#DC2626]" />
              <div>
                <h2 className="font-heading text-xl font-bold text-foreground">{t('overview.title')}</h2>
                <p className="mt-2 text-muted-foreground">{t('overview.description')}</p>
              </div>
            </div>
          </section>

          {/* Coverage */}
          <section className="mb-10">
            <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {t('coverage.title')}
            </h2>
            <div className="space-y-3">
              {(['item1', 'item2', 'item3', 'item4', 'item5'] as const).map((key) => (
                <div key={key} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-green-500" />
                  <p className="text-muted-foreground">{t(`coverage.${key}`)}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator className="mb-10 bg-border" />

          {/* Exclusions */}
          <section className="mb-10">
            <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {t('exclusions.title')}
            </h2>
            <div className="space-y-3">
              {(['item1', 'item2', 'item3', 'item4'] as const).map((key) => (
                <div key={key} className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-400" />
                  <p className="text-muted-foreground">{t(`exclusions.${key}`)}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator className="mb-10 bg-border" />

          {/* Claim process */}
          <section className="mb-10">
            <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {t('claims.title')}
            </h2>
            <ol className="space-y-4">
              {(['step1', 'step2', 'step3', 'step4'] as const).map((key, idx) => (
                <li key={key} className="flex items-start gap-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 border border-[#DC2626]/30 text-sm font-bold text-[#DC2626]">
                    {idx + 1}
                  </div>
                  <p className="pt-1 text-muted-foreground">{t(`claims.${key}`)}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* Duration */}
          <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <Clock className="mt-1 size-6 shrink-0 text-[#DC2626]" />
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground">{t('duration.title')}</h2>
                <p className="mt-2 text-muted-foreground">{t('duration.description')}</p>
              </div>
            </div>
          </section>
        </>
      } />
    </div>
  );
}
