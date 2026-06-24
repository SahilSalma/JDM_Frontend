import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RefreshCw, Phone, Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { Separator } from '@/components/ui/separator';
import PolicyContent from '@/components/product/PolicyContent';

export const metadata: Metadata = {
  title: 'Returns & Refunds | JDM Tokyo Motorsports',
  description:
    'Return policy for JDM engines and transmissions. Contact us by phone or email, refunds processed through Stripe.',
};

export default async function ReturnsPage() {
  const t = await getTranslations('returns');

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

      <PolicyContent settingsKey="policy_returns" fallback={
        <>
          {/* Overview */}
          <section className="mb-10">
            <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {t('policy.title')}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('policy.p1')}</p>
              <p>{t('policy.p2')}</p>
            </div>
          </section>

          <Separator className="mb-10 bg-border" />

          {/* Eligible returns */}
          <section className="mb-10">
            <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {t('eligible.title')}
            </h2>
            <div className="space-y-3">
              {(['item1', 'item2', 'item3'] as const).map((key) => (
                <div key={key} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 size-5 shrink-0 text-green-500" />
                  <p className="text-muted-foreground">{t(`eligible.${key}`)}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Non-eligible */}
          <section className="mb-10">
            <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {t('nonEligible.title')}
            </h2>
            <div className="space-y-3">
              {(['item1', 'item2', 'item3'] as const).map((key) => (
                <div key={key} className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" />
                  <p className="text-muted-foreground">{t(`nonEligible.${key}`)}</p>
                </div>
              ))}
            </div>
          </section>

          <Separator className="mb-10 bg-border" />

          {/* Process */}
          <section className="mb-10">
            <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {t('process.title')}
            </h2>
            <ol className="space-y-4">
              {(['step1', 'step2', 'step3', 'step4'] as const).map((key, idx) => (
                <li key={key} className="flex items-start gap-4">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 border border-[#DC2626]/30 text-sm font-bold text-[#DC2626]">
                    {idx + 1}
                  </div>
                  <p className="pt-1 text-muted-foreground">{t(`process.${key}`)}</p>
                </li>
              ))}
            </ol>
          </section>

          <Separator className="mb-10 bg-border" />

          {/* Contact */}
          <section className="grid gap-4 sm:grid-cols-2">
            <a
              href="tel:+18005368669"
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 shadow-sm transition-colors hover:border-[#DC2626]/40"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-[#DC2626]/10">
                <Phone className="size-6 text-[#DC2626]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t('contact.phone')}</p>
                <p className="text-sm text-muted-foreground">+1 (800) 536-8669</p>
              </div>
            </a>
            <a
              href="mailto:sales@jdmtokyomotors.com"
              className="flex items-center gap-4 rounded-lg border border-border bg-card p-6 shadow-sm transition-colors hover:border-[#DC2626]/40"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-[#DC2626]/10">
                <Mail className="size-6 text-[#DC2626]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{t('contact.email')}</p>
                <p className="text-sm text-muted-foreground">sales@jdmtokyomotors.com</p>
              </div>
            </a>
          </section>
        </>
      } />
    </div>
  );
}
