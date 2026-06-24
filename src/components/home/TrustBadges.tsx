'use client';

import { useTranslations } from 'next-intl';
import {
  Shield,
  Truck,
  Gauge,
  Headset,
  Award,
  Wrench,
  Package,
  Clock,
  Star,
  CheckCircle2,
  Globe,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

interface TrustBadge {
  icon?: string;
  title: string;
  description: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  shield: Shield,
  truck: Truck,
  gauge: Gauge,
  headset: Headset,
  award: Award,
  wrench: Wrench,
  package: Package,
  clock: Clock,
  star: Star,
  check: CheckCircle2,
  globe: Globe,
};

const FALLBACK_KEYS = ['warranty', 'shipping', 'quality', 'support'] as const;
const FALLBACK_ICONS = [Shield, Truck, Gauge, Headset];

export default function TrustBadges() {
  const t = useTranslations('home');
  const { get } = useSiteSettings();

  // Try to load badges from settings (JSON array); fall back to i18n.
  let badges: TrustBadge[] = [];
  const raw = get('trust_badges', '');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        badges = parsed.filter(
          (b): b is TrustBadge =>
            !!b && typeof b.title === 'string' && typeof b.description === 'string',
        );
      }
    } catch {
      // ignore — fall through to i18n
    }
  }

  if (badges.length === 0) {
    badges = FALLBACK_KEYS.map((key, i) => ({
      title: t(`trustBadges.${key}`),
      description: t(`trustBadges.${key}Desc`),
      icon: ['shield', 'truck', 'gauge', 'headset'][i],
    }));
  }

  return (
    <section className="w-full">
      <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {badges.map((badge, i) => {
            const Icon =
              (badge.icon && ICON_MAP[badge.icon.toLowerCase()]) ||
              FALLBACK_ICONS[i % FALLBACK_ICONS.length];
            return (
              <div
                key={i}
                className="flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-[#DC2626]/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DC2626]/10">
                  <Icon className="size-5 text-[#DC2626]" />
                </div>
                <div>
                  <p className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">
                    {badge.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {badge.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
