import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Separator } from '@/components/ui/separator';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'About Us | JDM Tokyo Motorsports',
  description:
    'Learn about JDM Tokyo Motorsports — direct importers of premium Japanese engines and transmissions with nationwide shipping and expert support.',
};

export default async function AboutPage() {
  const t = await getTranslations('about');

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: t('title') },
  ];

  // Build i18n fallbacks; client component overrides any with admin settings.
  const valueKeys = ['quality', 'warranty', 'source', 'mileage', 'support', 'shipping'] as const;
  const values = valueKeys.map((key) => {
    try {
      return {
        title: t(`values.${key}.title`),
        description: t(`values.${key}.description`),
      };
    } catch {
      return { title: '', description: '' };
    }
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumbs items={breadcrumbs} className="mb-8" />

      <div className="mb-12 text-center">
        <h1 className="font-heading text-5xl font-bold uppercase tracking-wide text-foreground">
          {t('title')}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Separator className="mb-12 bg-border" />

      <AboutContent
        fallback={{
          storyTitle: t('story.title'),
          storyP1: t('story.p1'),
          storyP2: t('story.p2'),
          storyP3: t('story.p3'),
          valuesTitle: t('values.title'),
          values,
        }}
      />

      <Separator className="mb-12 bg-border" />

      <section>
        <h2 className="mb-6 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
          {t('whyUs.title')}
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>{t('whyUs.p1')}</p>
          <p>{t('whyUs.p2')}</p>
        </div>
      </section>
    </div>
  );
}
