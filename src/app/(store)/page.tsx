import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import HeroAnimation from '@/components/home/HeroAnimation';
import VehicleSelector from '@/components/home/VehicleSelector';
import CategoryCards from '@/components/home/CategoryCards';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import TrustBadges from '@/components/home/TrustBadges';
import BrowseByMake from '@/components/home/BrowseByMake';
import { ReviewSectionWrapper } from '@/components/home/ReviewSectionWrapper';
import Preloader from '@/components/layout/Preloader';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('home');
  return {
    title: 'JDM Tokyo Motorsports | Premium JDM Engines & Transmissions',
    description: t('heroSubtitle'),
    openGraph: {
      title: 'JDM Tokyo Motorsports | Premium JDM Engines & Transmissions',
      description: t('heroSubtitle'),
    },
  };
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-4 bg-background">
      <Preloader />
      {/* 1. Hero — full viewport */}
      <HeroAnimation />

      {/* 2. Vehicle selector — overlaps hero bottom edge */}
      <section className="-mt-8 relative z-10 py-8">
        <VehicleSelector />
      </section>

      {/* 3. Trust badges */}
      <section className="py-16">
        <TrustBadges />
      </section>

      {/* 4. Category cards */}
      <section className="py-16">
        <CategoryCards />
      </section>

      {/* 5. Featured products */}
      <section className="py-16">
        <FeaturedProducts />
      </section>

      {/* 6. Browse by make */}
      <section className="py-16 pb-24">
        <BrowseByMake />
      </section>
      {/* 7. Customer Reviews */}
      <ReviewSectionWrapper />
    </div>
  );
}
