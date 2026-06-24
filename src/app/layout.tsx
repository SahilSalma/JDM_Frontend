import type { Metadata, Viewport } from 'next';
import { Rajdhani, Inter, JetBrains_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SiteSettingsProvider } from '@/components/providers/SiteSettingsProvider';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const rajdhani = Rajdhani({
  weight: '700',
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'JDM Tokyo Motorsports | Premium JDM Engines & Transmissions',
  description:
    'Shop premium JDM engines and transmissions sourced directly from Japan. Under 65K miles, nationwide shipping, and 30-day warranty on every unit.',
  keywords: [
    'JDM engines',
    'JDM transmissions',
    'Japanese domestic market',
    'used JDM engines',
    'Honda engine',
    'Toyota engine',
    'Subaru engine',
    'Nissan engine',
  ],
  authors: [{ name: 'JDM Tokyo Motorsports' }],
  creator: 'JDM Tokyo Motorsports',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'JDM Tokyo Motorsports',
    title: 'JDM Tokyo Motorsports | Premium JDM Engines & Transmissions',
    description:
      'Direct from Japan. Under 65K Miles. Nationwide Shipping. Shop premium JDM engines and transmissions.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JDM Tokyo Motorsports | Premium JDM Engines & Transmissions',
    description:
      'Direct from Japan. Under 65K Miles. Nationwide Shipping.',
  },
  verification: {
    google: '_T5ofHyrJnUlNj6BpABdWGN7SmZnMpwdUcBwu0usQYQ',
  },
};

export const viewport: Viewport = {
  themeColor: '#DC2626',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${rajdhani.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Preconnect to Google Fonts origin for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload critical fonts — Rajdhani 700 is used for all headings above the fold */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&family=Inter:wght@400;500;600&display=swap"
        />

        {/* Preload first hero animation frame (half-res works for all connection tiers) */}
        <link rel="preload" as="image" href="/images/hero-animation/half/frame-0001.webp" type="image/webp" />
        <link rel="preload" as="image" href="/images/hero-animation-light/half/frame-0001.webp" type="image/webp" />
        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://jdmtokyomotorsports.com/#organization',
                  name: 'JDM Tokyo Motorsports',
                  url: 'https://jdmtokyomotorsports.com',
                  logo: 'https://jdmtokyomotorsports.com/logo/finallogo-blacklettering-transparent.png',
                  sameAs: [],
                  contactPoint: {
                    '@type': 'ContactPoint',
                    telephone: '+1-',
                    contactType: 'sales',
                    availableLanguage: ['English'],
                  },
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://jdmtokyomotorsports.com/#website',
                  url: 'https://jdmtokyomotorsports.com',
                  name: 'JDM Tokyo Motorsports',
                  description:
                    'Shop premium JDM engines and transmissions sourced directly from Japan. Under 65K miles, nationwide shipping, and 30-day warranty on every unit.',
                  publisher: { '@id': 'https://jdmtokyomotorsports.com/#organization' },
                },
              ],
            }),
          }}
        />
        {/* Blocking script — runs before React hydration to restore saved theme and prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('jdm-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(t==='system'&&d)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="relative min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider defaultTheme="light">
            <SiteSettingsProvider>
              {children}
              <CookieConsent />
              <Toaster position="bottom-left" richColors />
            </SiteSettingsProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
