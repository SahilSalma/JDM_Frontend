'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import NewsletterForm from '@/components/layout/NewsletterForm';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

const QUICK_LINKS = [
  { key: 'engines', href: '/engines' },
  { key: 'transmissions', href: '/transmissions' },
  { key: 'trackOrder', href: '/track-order' },
  { key: 'about', href: '/about' },
  { key: 'contact', href: '/contact' },
  { key: 'blog', href: '/blog' },
] as const;

const POLICY_LINKS = [
  { key: 'warranty', href: '/warranty' },
  { key: 'shipping', href: '/shipping' },
  { key: 'returns', href: '/returns' },
  { key: 'privacy', href: '/privacy' },
  { key: 'terms', href: '/terms' },
] as const;

// SVG social icons — lucide-react doesn't include brand icons
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.7 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.3 0 .59.04.86.12v-3.5a6.37 6.37 0 0 0-.86-.06A6.34 6.34 0 0 0 3.23 15.5a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.24 8.24 0 0 0 4.77 1.5v-3.4a4.88 4.88 0 0 1-1.09-.16z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer() {
  const t = useTranslations('footer');
  const { get } = useSiteSettings();
  const year = new Date().getFullYear();

  const phone = get('contact_phone', t('contact.phone'));
  const email = get('contact_email', t('contact.email'));
  const address = get('contact_address', t('contact.address'));
  const hoursWeekdays = get('hours_weekdays', '');
  const hoursSaturday = get('hours_saturday', '');
  const hoursSunday = get('hours_sunday', '');
  const description = get('footer_description', t('company.description'));

  const socialLinks = [
    { Icon: InstagramIcon, href: get('social_instagram'), label: 'Instagram' },
    { Icon: FacebookIcon, href: get('social_facebook'), label: 'Facebook' },
    { Icon: TikTokIcon, href: get('social_tiktok'), label: 'TikTok' },
    { Icon: XIcon, href: get('social_x'), label: 'X / Twitter' },
  ].filter((s) => s.href);

  return (
    <footer className="border-t border-border bg-background">
      {/* Main footer grid */}
      <div className="mx-auto w-full max-w-none px-4 py-12 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* ── Column 1: Company ── */}
          <div className="flex flex-col gap-4">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/logo/finallogo-blacklettering-transparent.png"
                alt="JDM Tokyo Motorsports"
                width={520}
                height={244}
                className="h-24 w-auto dark:hidden"
              />
              <Image
                src="/logo/finallogo-whitelettering-transparent.png"
                alt="JDM Tokyo Motorsports"
                width={520}
                height={244}
                className="hidden h-24 w-auto dark:block"
              />
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>

            {/* Social media */}
            {socialLinks.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                {t('company.followUs')}
              </p>
              <div className="flex gap-3">
                {socialLinks.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex size-8 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-[#DC2626]/50 hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
                  >
                    <Icon className="size-3.5" />
                  </a>
                ))}
              </div>
            </div>
            )}
          </div>

          {/* ── Column 2: Quick Links ── */}
          <div>
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-foreground">
              {t('quickLinks.title')}
            </h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-[#DC2626]"
                  >
                    {t(`quickLinks.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 3: Policies ── */}
          <div>
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-foreground">
              {t('policies')}
            </h3>
            <ul className="space-y-2">
              {POLICY_LINKS.map(({ key, href }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground transition-colors hover:text-[#DC2626]"
                  >
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Column 4: Contact ── */}
          <div>
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-widest text-foreground">
              {t('contact.title')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href={`tel:${phone.replace(/\s/g, '')}`}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Phone className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
                  <span>{phone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${email}`}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Mail className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
                  <span>{email}</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
                <span>{address}</span>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Clock className="mt-0.5 size-4 shrink-0 text-[#DC2626]" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground/80">
                    {t('contact.businessHours.title')}
                  </span>
                  <span>{t('contact.businessHours.weekdays', { hours: hoursWeekdays })}</span>
                  <span>{t('contact.businessHours.saturday', { hours: hoursSaturday })}</span>
                  <span>{t('contact.businessHours.sunday', { hours: hoursSunday })}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Separator className="bg-border" />

      {/* ── Newsletter ── */}
      <div className="mx-auto w-full max-w-none px-4 py-10 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-sm">
            <h3 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
              {t('newsletter.title')}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('newsletter.description')}
            </p>
          </div>
          <NewsletterForm
            placeholder={t('newsletter.placeholder')}
            buttonLabel={t('newsletter.button')}
            successMessage={t('newsletter.success')}
            errorMessage={t('newsletter.error')}
          />
        </div>
      </div>

      <Separator className="bg-border" />

      {/* ── Copyright bar ── */}
      <div className="mx-auto w-full max-w-none px-4 py-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground/60">
            {t('copyright', { year })} {t('allRightsReserved')}
          </p>
          <p className="text-xs text-muted-foreground/40">
            Built with love by{' '}
            <a
              href="https://consultancy.ltiora.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#DC2626] hover:underline"
            >
              Ltiora
            </a>
          </p>
          <p className="text-xs text-muted-foreground/40">{t('builtWith')}</p>
        </div>
      </div>
    </footer>
  );
}
