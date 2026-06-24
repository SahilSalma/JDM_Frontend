'use client';

import { Shield, Truck, Star, Users, Zap, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

interface AboutContentProps {
  fallback: {
    storyP1: string;
    storyP2: string;
    storyP3: string;
    values: {
      title: string;
      description: string;
    }[];
    storyTitle: string;
    valuesTitle: string;
  };
}

const VALUE_KEYS = ['quality', 'warranty', 'source', 'mileage', 'support', 'shipping'] as const;
const VALUE_ICONS: Record<(typeof VALUE_KEYS)[number], LucideIcon> = {
  quality: Shield,
  warranty: Star,
  source: Globe,
  mileage: Zap,
  support: Users,
  shipping: Truck,
};

export default function AboutContent({ fallback }: AboutContentProps) {
  const { get } = useSiteSettings();

  const p1 = get('about_story_p1', fallback.storyP1) || fallback.storyP1;
  const p2 = get('about_story_p2', fallback.storyP2) || fallback.storyP2;
  const p3 = get('about_story_p3', fallback.storyP3) || fallback.storyP3;

  return (
    <>
      <section className="mb-12">
        <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
          {fallback.storyTitle}
        </h2>
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>{p1}</p>
          <p>{p2}</p>
          <p>{p3}</p>
        </div>
      </section>

      <hr className="mb-12 border-border" />

      <section className="mb-12">
        <h2 className="mb-8 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
          {fallback.valuesTitle}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VALUE_KEYS.map((key, i) => {
            const Icon = VALUE_ICONS[key];
            const title = get(`about_value_${key}_title`, fallback.values[i]?.title ?? '') || fallback.values[i]?.title || '';
            const description = get(`about_value_${key}_desc`, fallback.values[i]?.description ?? '') || fallback.values[i]?.description || '';
            return (
              <div
                key={key}
                className="rounded-lg border border-border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#DC2626]/10">
                  <Icon className="size-6 text-[#DC2626]" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
