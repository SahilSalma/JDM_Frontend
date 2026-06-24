'use client';

import * as Lucide from 'lucide-react';

export const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Lucide.Shield,
  truck: Lucide.Truck,
  'rotate-ccw': Lucide.RotateCcw,
  wrench: Lucide.Wrench,
  award: Lucide.Award,
  clock: Lucide.Clock,
  'thumbs-up': Lucide.ThumbsUp,
  users: Lucide.Users,
  'shopping-bag': Lucide.ShoppingBag,
  'check-circle': Lucide.CheckCircle2,
  'shield-check': Lucide.ShieldCheck,
  'credit-card': Lucide.CreditCard,
  settings2: Lucide.Settings2,
  sparkles: Lucide.Sparkles,
  'help-circle': Lucide.HelpCircle,
  info: Lucide.Info,
  heart: Lucide.Heart,
  'map-pin': Lucide.MapPin,
  phone: Lucide.Phone,
  mail: Lucide.Mail,
  'message-square': Lucide.MessageSquare,
  globe: Lucide.Globe,
  star: Lucide.Star,
  zap: Lucide.Zap,

};

interface IconRendererProps {
  name: string;
  className?: string;
  fallback?: React.ComponentType<{ className?: string }>;
}

export function IconRenderer({ name, className, fallback = Lucide.HelpCircle }: IconRendererProps) {
  const IconComponent = ICON_MAP[name.toLowerCase().trim()] || fallback;
  return <IconComponent className={className} />;
}
