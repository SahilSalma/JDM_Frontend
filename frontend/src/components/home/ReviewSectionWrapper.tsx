'use client';

import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { ReviewSection } from './ReviewSection';

export function ReviewSectionWrapper() {
  const settings = useSiteSettings();
  const enabled = settings.get('reviews_enabled', '0') === '1';

  if (!enabled) return null;

  return <ReviewSection />;
}
