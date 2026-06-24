'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Zap, Settings2, Wrench, ArrowRight, Package, Cog, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

interface CategoryCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  browseLabel: string;
  count?: number;
  productsLabel: string;
  gradient: string;
}

function CategoryCard({
  title,
  description,
  icon,
  href,
  browseLabel,
  count,
  productsLabel,
  gradient,
}: CategoryCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group relative h-full"
    >
      <Link
        href={href}
        className="relative block h-[320px] overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 group-hover:border-[#DC2626]/60 group-hover:shadow-[0_0_24px_rgba(220,38,38,0.15)] sm:h-[380px]"
        aria-label={`${browseLabel} ${title}`}
      >
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-20 transition-opacity duration-300 group-hover:opacity-30"
          style={{ background: gradient }}
          aria-hidden="true"
        />

        {/* Red corner accent */}
        <div
          className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#DC2626]/10 transition-all duration-300 group-hover:bg-[#DC2626]/20"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
          {/* Icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/10 transition-all duration-300 group-hover:border-[#DC2626]/60 group-hover:bg-[#DC2626]/20">
            <div className="text-[#DC2626]">{icon}</div>
          </div>

          {/* Text */}
          <div>
            {count !== undefined && (
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-[#DC2626]/80">
                {count > 0
                  ? count.toString() + ' ' + productsLabel
                  : productsLabel}
              </p>
            )}
            <h3 className="font-heading text-2xl font-black uppercase tracking-wide text-foreground sm:text-3xl">
              {title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>

            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#DC2626] transition-colors group-hover:text-[#ef4444]">
              {browseLabel}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CategoryCards() {
  const t = useTranslations('home');
  const { get } = useSiteSettings();

  const ICON_MAP: Record<string, LucideIcon> = {
    engine: Zap,
    zap: Zap,
    transmission: Settings2,
    cog: Cog,
    parts: Wrench,
    wrench: Wrench,
    package: Package,
    truck: Truck,
  };

  const FALLBACK_GRADIENTS = [
    'radial-gradient(ellipse at top right, #DC2626 0%, transparent 60%)',
    'radial-gradient(ellipse at bottom left, #DC2626 0%, transparent 60%)',
    'radial-gradient(ellipse at bottom right, #DC2626 0%, transparent 60%)',
  ];

  // Try to load from settings — JSON array of {title, description, href, icon}
  let categories: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    count: number | undefined;
    gradient: string;
  }> = [];

  const raw = get('home_categories', '');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        categories = parsed
          .filter((c) => c && typeof c.title === 'string' && typeof c.href === 'string')
          .map((c, i) => {
            const Icon = (c.icon && ICON_MAP[String(c.icon).toLowerCase()]) || Zap;
            return {
              title: c.title,
              description: c.description ?? '',
              icon: <Icon className="size-7" />,
              href: c.href,
              count: undefined as number | undefined,
              gradient: FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length],
            };
          });
      }
    } catch {
      // ignore
    }
  }

  if (categories.length === 0) {
    categories = [
      {
        title: t('categoryEngines'),
        description: t('heroSubtitle'),
        icon: <Zap className="size-7" />,
        href: '/engines',
        count: undefined,
        gradient: FALLBACK_GRADIENTS[0],
      },
      {
        title: t('categoryTransmissions'),
        description: t('heroSubtitle'),
        icon: <Settings2 className="size-7" />,
        href: '/transmissions',
        count: undefined,
        gradient: FALLBACK_GRADIENTS[1],
      },
      {
        title: t('categoryParts'),
        description: t('partsDescription'),
        icon: <Wrench className="size-7" />,
        href: '/parts',
        count: undefined,
        gradient: FALLBACK_GRADIENTS[2],
      },
    ];
  }

  return (
    <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat, i) => (
          <ScrollReveal key={cat.href} delay={i * 0.1} direction="up" className="h-full">
            <CategoryCard
              title={cat.title}
              description={cat.description}
              icon={cat.icon}
              href={cat.href}
              browseLabel={t('browse')}
              count={cat.count}
              productsLabel={t('productsCount', { count: 0 })}
              gradient={cat.gradient}
            />
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
