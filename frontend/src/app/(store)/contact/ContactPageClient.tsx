'use client';

import { useTranslations } from 'next-intl';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { ContactForm } from '@/components/contact/ContactForm';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : '#';
}

export default function ContactPage() {
  const t = useTranslations('contact');
  const tFooter = useTranslations('footer');
  const { get } = useSiteSettings();

  // Pull all values from DB settings, fall back to i18n strings.
  const phone = get('contact_phone', t('info.phone'));
  const email = get('contact_email', t('info.email'));
  const address = get('contact_address', t('info.address'));
  const hoursWeekdays = get('hours_weekdays', tFooter('contact.businessHours.weekdays'));
  const hoursSaturday = get('hours_saturday', tFooter('contact.businessHours.saturday'));
  const hoursSunday = get('hours_sunday', tFooter('contact.businessHours.sunday'));

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: t('title') },
  ];

  return (
    <div className="mx-auto max-w-none px-4 py-10 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
      <Breadcrumbs items={breadcrumbs} className="mb-8" />

      <div className="mb-12">
        <h1 className="font-heading text-5xl font-bold uppercase tracking-wide text-foreground">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Contact form */}
        <section>
          <ContactForm />
        </section>

        {/* Contact info */}
        <section>
          <h2 className="mb-6 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
            {t('info.title')}
          </h2>
          <div className="space-y-6">
            <a
              href={telHref(phone)}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-[#DC2626]/40"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-[#DC2626]/10">
                <Phone className="size-5 text-[#DC2626]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Phone</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{phone}</p>
              </div>
            </a>
            <a
              href={`mailto:${email}`}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-[#DC2626]/40"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-[#DC2626]/10">
                <Mail className="size-5 text-[#DC2626]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Email</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{email}</p>
              </div>
            </a>
            <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-full bg-[#DC2626]/10">
                <MapPin className="size-5 text-[#DC2626]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Address</p>
                <p className="mt-0.5 text-sm text-muted-foreground whitespace-pre-line">{address}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-full bg-[#DC2626]/10">
                <Clock className="size-5 text-[#DC2626]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Business Hours</p>
                <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground/80">MON – FRI:</span> {hoursWeekdays}
                  </p>
                  {hoursSaturday && (
                    <p>
                      <span className="font-medium text-foreground/80">SAT:</span> {hoursSaturday}
                    </p>
                  )}
                  {hoursSunday && (
                    <p>
                      <span className="font-medium text-foreground/80">SUN:</span> {hoursSunday}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
