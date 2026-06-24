import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Separator } from '@/components/ui/separator';
import PolicyContent from '@/components/product/PolicyContent';

export const metadata: Metadata = {
  title: 'Privacy Policy | JDM Tokyo Motorsports',
  description: 'Privacy policy for JDM Tokyo Motorsports. How we collect, use, and protect your personal information.',
};

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');

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

      <PolicyContent settingsKey="policy_privacy" fallback={
        <>
          <div className="prose-jdm space-y-10">
            {(['collection', 'use', 'sharing', 'cookies', 'security', 'rights', 'contact'] as const).map(
              (section) => (
                <section key={section}>
                  <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
                    {t(`sections.${section}.title`)}
                  </h2>
                  <div className="space-y-3 text-muted-foreground leading-relaxed">
                    <p>{t(`sections.${section}.content`)}</p>
                  </div>
                </section>
              )
            )}
          </div>
        </>
      } />
    </div>
  );
}
