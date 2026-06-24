import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Separator } from '@/components/ui/separator';
import PolicyContent from '@/components/product/PolicyContent';

export const metadata: Metadata = {
  title: 'Terms of Service | JDM Tokyo Motorsports',
  description: 'Terms and conditions for using JDM Tokyo Motorsports website and purchasing products.',
};

export default async function TermsPage() {
  const t = await getTranslations('terms');

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: t('title') },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={breadcrumbs} className="mb-8" />

      <div className="mb-10">
        <h1 className="font-heading text-5xl font-bold uppercase tracking-wide text-foreground">
          {t('title')}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground/60">{t('lastUpdated')}</p>
      </div>

      <Separator className="mb-10 bg-border" />

      <PolicyContent settingsKey="policy_terms" fallback={
        <>
          <div className="space-y-10">
            {(['acceptance', 'products', 'orders', 'payment', 'shipping', 'returns', 'liability', 'governing'] as const).map(
              (section) => (
                <section key={section}>
                  <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
                    {t(`sections.${section}.title`)}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {t(`sections.${section}.content`)}
                  </p>
                </section>
              )
            )}
          </div>
        </>
      } />
    </div>
  );
}
