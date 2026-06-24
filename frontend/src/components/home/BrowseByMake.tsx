'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import ScrollReveal from '@/components/animations/ScrollReveal';
import { useVehicleData } from '@/hooks/useVehicleData';

function MakeCard({ make }: { make: string }) {
  const logoSrc = `/images/makes/${make.toLowerCase()}.avif`;

  return (
    <Link
      href={`/make?make=${encodeURIComponent(make)}`}
      className="group flex h-32 w-44 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#DC2626]/60 hover:shadow-[0_0_20px_rgba(220,38,38,0.18)]"
      aria-label={`Browse ${make}`}
    >
      <div className="relative h-14 w-28 opacity-70 transition-all duration-200 group-hover:opacity-100 dark:invert">
        <Image
          src={logoSrc}
          alt={make}
          fill
          sizes="112px"
          className="object-contain"
        />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 transition-colors duration-200 group-hover:text-[#DC2626]">
        {make}
      </span>
    </Link>
  );
}

export default function BrowseByMake() {
  const t = useTranslations('home');
  const { makes } = useVehicleData();

  // Duplicate the list so the marquee animation loops seamlessly.
  const loop = [...makes, ...makes];

  return (
    <section className="w-full">
      <div className="mx-auto max-w-none px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        <ScrollReveal>
          <div className="mb-8">
            <div className="mb-1 h-0.5 w-8 bg-[#DC2626]" aria-hidden="true" />
            <h2 className="font-heading text-2xl font-black uppercase tracking-wide text-foreground sm:text-3xl">
              {t('browseByMake')}
            </h2>
          </div>
        </ScrollReveal>
      </div>

      {/* Marquee — constrained to max-w-none, auto-scroll, pauses on hover */}
      <div
        className="group/marquee relative mx-auto max-w-none overflow-hidden px-4 sm:px-6 lg:px-8"
        style={{
          maskImage:
            'linear-gradient(to right, transparent 0, black 5%, black 95%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent 0, black 5%, black 95%, transparent 100%)',
        }}
      >
        <div className="flex w-max gap-4 py-2 animate-[marquee_40s_linear_infinite] group-hover/marquee:[animation-play-state:paused]">
          {loop.map((make, i) => (
            <MakeCard key={`${make}-${i}`} make={make} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
