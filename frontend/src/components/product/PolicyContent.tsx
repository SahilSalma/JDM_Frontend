'use client';

import * as Lucide from 'lucide-react';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { Separator } from '@/components/ui/separator';

type SectionType = 'text' | 'highlight' | 'bullets' | 'numbered' | 'disclaimer' | 'cards';
type IconType = string;

interface PolicyCardItem {
  title: string;
  value?: string;
  description?: string;
  icon?: IconType;
}

interface PolicySection {
  title: string;
  content: string;
  type?: SectionType;
  icon?: IconType;
  items?: PolicyCardItem[];
}

interface PolicyContentProps {
  /** The settings key (e.g. 'policy_warranty') */
  settingsKey: string;
  /** Fallback content rendered when no admin sections are configured */
  fallback: React.ReactNode;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  check: Lucide.CheckCircle2,
  alert: Lucide.AlertCircle,
  shield: Lucide.Shield,
  clock: Lucide.Clock,
  info: Lucide.Info,
  truck: Lucide.Truck,
  building: Lucide.Building2,
  home: Lucide.Home,
  package: Lucide.Package,
  mail: Lucide.Mail,
  phone: Lucide.Phone,
  map: Lucide.MapPin,
  'map-pin': Lucide.MapPin,
  'rotate-ccw': Lucide.RotateCcw,
  wrench: Lucide.Wrench,
  award: Lucide.Award,
  'thumbs-up': Lucide.ThumbsUp,
  users: Lucide.Users,
  'shopping-bag': Lucide.ShoppingBag,
  'check-circle': Lucide.CheckCircle2,
  'shield-check': Lucide.ShieldCheck,
  'credit-card': Lucide.CreditCard,
  settings2: Lucide.Settings2,
  sparkles: Lucide.Sparkles,
  'help-circle': Lucide.HelpCircle,
  heart: Lucide.Heart,
  'message-square': Lucide.MessageSquare,
  globe: Lucide.Globe,
  star: Lucide.Star,
  zap: Lucide.Zap,
};

const ICON_COLORS: Record<string, string> = {
  check: 'text-green-500',
  alert: 'text-amber-400',
  shield: 'text-[#DC2626]',
  clock: 'text-[#DC2626]',
  info: 'text-blue-400',
  truck: 'text-[#DC2626]',
  building: 'text-blue-400',
  home: 'text-green-500',
  package: 'text-[#DC2626]',
  mail: 'text-[#DC2626]',
  phone: 'text-[#DC2626]',
  map: 'text-[#DC2626]',
  'map-pin': 'text-[#DC2626]',
  'rotate-ccw': 'text-[#DC2626]',
  wrench: 'text-[#DC2626]',
  award: 'text-[#DC2626]',
  'thumbs-up': 'text-[#DC2626]',
  users: 'text-[#DC2626]',
  'shopping-bag': 'text-[#DC2626]',
  'check-circle': 'text-green-500',
  'shield-check': 'text-green-500',
  'credit-card': 'text-[#DC2626]',
  settings2: 'text-[#DC2626]',
  sparkles: 'text-amber-400',
  'help-circle': 'text-muted-foreground',
  heart: 'text-[#DC2626]',
  'message-square': 'text-[#DC2626]',
  globe: 'text-[#DC2626]',
  star: 'text-[#DC2626]',
  zap: 'text-[#DC2626]',
};

const getIcon = (name?: string, fallback: React.ComponentType<{ className?: string }> = Lucide.HelpCircle) => {
  if (!name) return fallback;
  return ICONS[name.toLowerCase().trim()] || fallback;
};

const getIconColor = (name?: string, fallback = 'text-[#DC2626]') => {
  if (!name) return fallback;
  return ICON_COLORS[name.toLowerCase().trim()] || fallback;
};

const parseLinks = (text: string): React.ReactNode[] | string => {
  if (!text) return '';
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore) {
      parts.push(textBefore);
    }
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <a
        key={match.index}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#DC2626] hover:underline font-medium"
      >
        {linkText}
      </a>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

function renderTextSection(section: PolicySection) {
  return (
    <div className="space-y-3">
      {section.content.split('\n\n').map((paragraph, pIdx) => (
        <p key={pIdx} className="text-muted-foreground leading-relaxed whitespace-pre-line">
          {parseLinks(paragraph)}
        </p>
      ))}
    </div>
  );
}

function renderHighlightSection(section: PolicySection) {
  const IconComp = getIcon(section.icon, Lucide.Shield);
  const colorCls = getIconColor(section.icon, 'text-[#DC2626]');
  return (
    <div className="rounded-lg border border-[#DC2626]/30 bg-[#DC2626]/5 p-6">
      <div className="flex items-start gap-4">
        <IconComp className={`mt-1 size-8 shrink-0 ${colorCls}`} />
        <div>
          {section.title && (
            <h2 className="font-heading text-xl font-bold text-foreground">{parseLinks(section.title)}</h2>
          )}
          <p className="mt-2 text-muted-foreground">{parseLinks(section.content)}</p>
        </div>
      </div>
    </div>
  );
}

function renderBulletsSection(section: PolicySection) {
  const IconComp = getIcon(section.icon, Lucide.CheckCircle2);
  const colorCls = getIconColor(section.icon, 'text-green-500');
  const lines = section.content.split('\n').filter((l) => l.trim());
  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <div key={i} className="flex items-start gap-3">
          <IconComp className={`mt-0.5 size-5 shrink-0 ${colorCls}`} />
          <p className="text-muted-foreground">{parseLinks(line)}</p>
        </div>
      ))}
    </div>
  );
}

function renderNumberedSection(section: PolicySection) {
  const lines = section.content.split('\n').filter((l) => l.trim());
  return (
    <ol className="space-y-4">
      {lines.map((line, idx) => (
        <li key={idx} className="flex items-start gap-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 border border-[#DC2626]/30 text-sm font-bold text-[#DC2626]">
            {idx + 1}
          </div>
          <p className="pt-1 text-muted-foreground">{parseLinks(line)}</p>
        </li>
      ))}
    </ol>
  );
}

function renderDisclaimerSection(section: PolicySection) {
  const IconComp = getIcon(section.icon, Lucide.Clock);
  const colorCls = getIconColor(section.icon, 'text-[#DC2626]');
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <IconComp className={`mt-1 size-6 shrink-0 ${colorCls}`} />
        <div>
          {section.title && (
            <h2 className="font-heading text-lg font-semibold text-foreground">{parseLinks(section.title)}</h2>
          )}
          <p className="mt-2 text-muted-foreground">{parseLinks(section.content)}</p>
        </div>
      </div>
    </div>
  );
}

function renderCardsSection(section: PolicySection) {
  const items = section.items ?? [];
  if (items.length === 0) return null;
  // 1 item → full width, 2+ → responsive grid (sm:2 cols)
  const gridCls = items.length === 1
    ? 'grid grid-cols-1 gap-4'
    : 'grid grid-cols-1 gap-4 sm:grid-cols-2';
  return (
    <div className={gridCls}>
      {items.map((item, i) => {
        const IconComp = getIcon(item.icon, Lucide.Info);
        const colorCls = getIconColor(item.icon, 'text-blue-400');
        return (
          <div
            key={i}
            className="flex flex-col rounded-lg border border-border bg-card p-6 shadow-sm transition-colors hover:border-[#DC2626]/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-[#DC2626]/10">
                <IconComp className={`size-5 ${colorCls}`} />
              </div>
              <h3 className="font-heading text-base font-bold text-foreground">{parseLinks(item.title)}</h3>
            </div>
            {item.value && (
              <p className="mt-4 font-heading text-3xl font-black text-[#DC2626]">{parseLinks(item.value)}</p>
            )}
            {item.description && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{parseLinks(item.description)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderSection(section: PolicySection, idx: number) {
  const type = section.type ?? 'text';

  const needsTitle = type !== 'highlight' && type !== 'disclaimer';

  return (
    <section key={idx}>
      {needsTitle && section.title && (
        <h2 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
          {parseLinks(section.title)}
        </h2>
      )}
      {section.type === 'cards' && section.content && (
        <p className="mb-4 text-muted-foreground leading-relaxed">{parseLinks(section.content)}</p>
      )}
      {type === 'text' && renderTextSection(section)}
      {type === 'highlight' && renderHighlightSection(section)}
      {type === 'bullets' && renderBulletsSection(section)}
      {type === 'numbered' && renderNumberedSection(section)}
      {type === 'disclaimer' && renderDisclaimerSection(section)}
      {type === 'cards' && renderCardsSection(section)}
    </section>
  );
}

/**
 * Standalone preview component for admin settings page.
 * Renders structured sections without needing SiteSettingsProvider.
 */
export function PolicyContentPreview({ sections }: { sections: Array<{ title: string; content: string; type?: string; icon?: string; items?: PolicyCardItem[] }> }) {
  return (
    <div className="space-y-8">
      {sections.map((section, idx) => {
        const elements = [renderSection(section as PolicySection, idx)];
        if (idx < sections.length - 1) {
          const nextType = (sections[idx + 1].type ?? 'text') as SectionType;
          const currentType = (section.type ?? 'text') as SectionType;
          if (currentType !== 'highlight' && nextType !== 'highlight' && currentType !== 'disclaimer') {
            elements.push(<Separator key={`sep-${idx}`} className="bg-border" />);
          }
        }
        return elements;
      })}
    </div>
  );
}

/**
 * Renders admin-defined policy sections from site settings.
 * Falls back to the provided children when no sections are configured.
 */
export default function PolicyContent({ settingsKey, fallback }: PolicyContentProps) {
  const { get, isLoading } = useSiteSettings();

  if (isLoading) return <>{fallback}</>;

  const raw = get(settingsKey);
  if (!raw) return <>{fallback}</>;

  let sections: PolicySection[] = [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      sections = parsed;
    }
  } catch {
    // Not valid JSON — could be old plain text, show it as-is
    if (raw.trim()) {
      return (
        <div className="space-y-4">
          {raw.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed whitespace-pre-line">{paragraph}</p>
          ))}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  if (sections.length === 0) return <>{fallback}</>;

  return (
    <div className="space-y-8">
      {sections.map((section, idx) => {
        const elements = [renderSection(section, idx)];
        // Add separator between non-highlight/non-disclaimer sections
        if (idx < sections.length - 1) {
          const nextType = sections[idx + 1].type ?? 'text';
          const currentType = section.type ?? 'text';
          if (currentType !== 'highlight' && nextType !== 'highlight' && currentType !== 'disclaimer') {
            elements.push(<Separator key={`sep-${idx}`} className="bg-border" />);
          }
        }
        return elements;
      })}
    </div>
  );
}
