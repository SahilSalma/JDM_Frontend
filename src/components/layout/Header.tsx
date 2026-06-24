'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  Loader2,
  ArrowRight,
  ChevronRight,
  Mail,
  Phone,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useCart } from '@/hooks/useCart';
import { useSearch } from '@/hooks/useSearch';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { useVehicleData } from '@/hooks/useVehicleData';
import { cn } from '@/lib/utils';
import { formatCents } from '@/lib/constants';

interface NavSubmenuItem {
  readonly label: string;
  readonly href: string;
  readonly submenu?: readonly NavSubmenuItem[] | null;
}

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly submenu: readonly NavSubmenuItem[] | null;
}

const HEADER_STANDARD_PAGES: Record<string, { label: string; href: string }> = {
  'about': { label: 'About Us', href: '/about' },
  'blog': { label: 'Blog', href: '/blog' },
  'contact': { label: 'Contact Us', href: '/contact' },
  'track-order': { label: 'Track Order', href: '/track-order' },
  'warranty': { label: 'Warranty Policy', href: '/warranty' },
  'shipping': { label: 'Shipping Policy', href: '/shipping' },
  'returns': { label: 'Returns Policy', href: '/returns' },
  'privacy': { label: 'Privacy Policy', href: '/privacy' },
  'terms': { label: 'Terms of Service', href: '/terms' },
};

const DEFAULT_MORE_LINKS = ['about', 'blog', 'contact', 'track-order', 'warranty', 'shipping', 'returns', 'privacy', 'terms'];

// All "More" page paths used for active-state detection
const MORE_PAGE_PATHS = Object.values(HEADER_STANDARD_PAGES).map(p => p.href);

// ---------------------------------------------------------------------------
// Cart count badge with bounce animation
// ---------------------------------------------------------------------------

interface CartBadgeProps {
  count: number;
}

function CartBadge({ count }: CartBadgeProps) {
  const [mounted, setMounted] = useState(false);
  const [bounce, setBounce] = useState(false);
  const prev = useRef(count);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (count !== prev.current) {
      setBounce(true);
      const id = setTimeout(() => setBounce(false), 400);
      prev.current = count;
      return () => clearTimeout(id);
    }
  }, [count]);

  if (count === 0 || !mounted) return null;

  return (
    <motion.span
      animate={bounce ? { scale: [1, 1.4, 1] } : {}}
      transition={{ duration: 0.3 }}
      className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#DC2626] text-[10px] font-bold text-white"
    >
      {count > 9 ? '9+' : count}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Main Header
// ---------------------------------------------------------------------------

export default function Header() {
  const t = useTranslations('nav');
  const tSearch = useTranslations('search');
  const tFooter = useTranslations('footer');
  const { itemCount, total, setIsOpen: openCart } = useCart();
  const { get } = useSiteSettings();
  const { makes } = useVehicleData();
  const pathname = usePathname();

  const [phone, setPhone] = useState(tFooter('contact.phone'));
  const [email, setEmail] = useState(tFooter('contact.email'));

  useEffect(() => {
    setPhone(get('contact_phone', tFooter('contact.phone')));
    setEmail(get('contact_email', tFooter('contact.email')));
  }, [get, tFooter]);

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const toggleExpand = useCallback((label: string) => {
    setExpandedItems(prev => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const brandNav = useMemo(() => {
    const rawNavSetting = get('navbar_navbar_links');
    if (!rawNavSetting) {
      return [
        { label: 'Home', href: '/', submenu: null } as NavItem,
        { label: 'More', href: '#', submenu: Object.values(HEADER_STANDARD_PAGES) } as NavItem,
      ];
    }

    try {
      const navConfig = JSON.parse(rawNavSetting);

      // Only include brands that exist in current vehicle data
      const validBrands = new Set(makes.map(m => m.toLowerCase()));
      const filterBrands = (brands: string[]) =>
        (Array.isArray(brands) ? brands : []).filter(b => validBrands.has(b.toLowerCase()));

      const items: NavItem[] = [
        { label: 'Home', href: '/', submenu: null }
      ];

      // 1. Add main brands
      const mainBrands = filterBrands(navConfig.mainBrands);
      mainBrands.forEach((brand: string) => {
        const brandSlug = brand.toLowerCase();
        const capitalized = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
        items.push({
          label: capitalized,
          href: `/make?make=${brandSlug}`,
          submenu: [
            { label: 'Engines', href: `/engines/${brandSlug}` },
            { label: 'Transmissions', href: `/transmissions/${brandSlug}` },
            { label: 'Parts', href: `/parts?make=${brandSlug}` },
          ]
        });
      });

      // 2. Add other brands
      const otherBrands = filterBrands(navConfig.otherBrands);
      if (otherBrands.length > 0) {
        items.push({
          label: 'Other Brands',
          href: '/parts',
          submenu: otherBrands.map((brand: string) => {
            const brandSlug = brand.toLowerCase();
            const capitalized = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
            return {
              label: capitalized,
              href: `/make?make=${brandSlug}`,
              submenu: [
                { label: 'Engines', href: `/engines/${brandSlug}` },
                { label: 'Transmissions', href: `/transmissions/${brandSlug}` },
                { label: 'Parts', href: `/parts?make=${brandSlug}` },
              ]
            };
          })
        });
      }

      // 3. Add Parts
      const allBrands = [...mainBrands, ...otherBrands];
      if (allBrands.length > 0) {
        items.push({
          label: 'Parts',
          href: '/parts',
          submenu: allBrands.map((brand: string) => {
            const capitalized = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
            return {
              label: capitalized,
              href: `/parts?make=${brand.toLowerCase()}`
            };
          })
        });
      }

      // 4. Add custom links
      if (Array.isArray(navConfig.customLinks)) {
        navConfig.customLinks.forEach((link: any) => {
          if (link && link.label && link.href) {
            items.push({
              label: link.label,
              href: link.href,
              submenu: null
            });
          }
        });
      }

      // 5. Add "More" dropdown from moreLinks config
      const moreIds: string[] = Array.isArray(navConfig.moreLinks)
        ? navConfig.moreLinks
        : DEFAULT_MORE_LINKS;
      if (moreIds.length > 0) {
        const moreSubmenu: NavSubmenuItem[] = [];
        moreIds.forEach((id: string) => {
          const page = HEADER_STANDARD_PAGES[id];
          if (page) {
            moreSubmenu.push({ label: page.label, href: page.href });
          }
        });
        if (moreSubmenu.length > 0) {
          items.push({
            label: 'More',
            href: '#',
            submenu: moreSubmenu
          });
        }
      }

      return items;
    } catch (e) {
      console.error('Failed to parse dynamic navbar settings', e);
      return [
        { label: 'Home', href: '/', submenu: null } as NavItem,
        { label: 'More', href: '#', submenu: Object.values(HEADER_STANDARD_PAGES) } as NavItem,
      ];
    }
  }, [get, makes]);
  const searchParams = useSearchParams();
  const currentMake = searchParams.get('make')?.toLowerCase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Inline search
  const { query, setQuery, clearQuery, results, isLoading } = useSearch();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track scroll for background opacity
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close search dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd/Ctrl+K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = useCallback(() => {
    setSearchFocused(false);
    clearQuery();
  }, [clearQuery]);

  const showDropdown = searchFocused && query.length > 0;

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 z-40 transition-all duration-200',
        scrolled
          ? 'border-b border-border bg-background/95 shadow-sm backdrop-blur-md'
          : 'bg-background/95 backdrop-blur-sm'
      )}
    >
      {/* Announcement bar */}
      {get('announcement_enabled') === '1' && get('announcement_message') && (
        <AnnouncementBar message={get('announcement_message')} />
      )}

      {/* ── Row 1: Logo + Search + Contact + Actions ── */}
      <div className="mx-auto flex h-16 w-full max-w-none items-center gap-4 px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/logo/finallogo-blacklettering-transparent.png"
            alt="JDM Tokyo Motorsports"
            width={520}
            height={244}
            className="h-[120px] w-auto dark:hidden"
            priority
          />
          <Image
            src="/logo/finallogo-whitelettering-transparent.png"
            alt="JDM Tokyo Motorsports"
            width={520}
            height={244}
            className="hidden h-[120px] w-auto dark:block"
            priority
          />
        </Link>

        {/* Inline search bar — desktop */}
        <div ref={searchRef} className="relative hidden flex-1 max-w-xl mx-auto lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder={tSearch('placeholder')}
              className="h-10 w-full rounded-lg border border-border bg-muted pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#DC2626] focus:outline-none focus:ring-1 focus:ring-[#DC2626]/30"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
            {query && !isLoading && (
              <button
                type="button"
                onClick={() => { clearQuery(); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 z-50 mt-1 flex max-h-[420px] flex-col rounded-lg border border-border bg-card shadow-xl"
              >
                {isLoading && results.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {tSearch('loading')}
                  </p>
                )}

                {!isLoading && results.length === 0 && (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {tSearch('noResults', { query })}
                  </p>
                )}

                {results.length > 0 && (
                  <ul className="flex-1 overflow-y-auto p-2 space-y-1">
                    {results.map((result) => (
                      <li key={result.id}>
                        <Link
                          href={result.href}
                          onClick={handleResultClick}
                          className="group flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-muted-foreground/20">
                            {result.image ? (
                              <img
                                src={result.image}
                                alt={result.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Search className="size-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground group-hover:text-[#DC2626]">
                              {result.title}
                            </p>
                            <div className="mt-0.5 flex items-center gap-2">
                              {(() => {
                                const cat = result.category.toLowerCase();
                                const isEngine = cat === 'engine';
                                const isTransmission = cat === 'transmission';
                                const text = isEngine ? 'Engine' : isTransmission ? 'Transmission' : 'Part';
                                const badgeClass = isEngine
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                  : isTransmission
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                                return (
                                  <Badge
                                    variant="outline"
                                    className={cn('text-[10px] font-medium border px-1.5 py-0', badgeClass)}
                                  >
                                    {text}
                                  </Badge>
                                );
                              })()}
                              {result.make && (
                                <span className="text-xs text-muted-foreground">
                                  {result.make}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-[#DC2626]">
                            ${result.price.toLocaleString()}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {results.length > 0 && (
                  <div className="shrink-0 border-t border-border">
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}`}
                      onClick={handleResultClick}
                      className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[#DC2626] transition-colors hover:bg-muted hover:text-[#ef4444]"
                    >
                      View all results
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right side actions ── */}
        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          {/* Contact Details (Desktop) */}
          <div className="hidden items-center gap-3 text-[13px] font-semibold text-muted-foreground mr-2 md:flex shrink-0">
            <a
              href={`tel:${phone.replace(/\s/g, '')}`}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Phone className="size-3.5 text-[#DC2626]" />
              <span>{phone}</span>
            </a>
            <span className="text-border">|</span>
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Mail className="size-3.5 text-[#DC2626]" />
              <span>{email}</span>
            </a>
          </div>

          {/* Mobile search icon */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchFocused((v) => !v)}
            aria-label={t('openSearch')}
            className="text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
          >
            <Search className="size-4" />
          </Button>

          {/* Cart with Total */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openCart(true)}
            aria-label={t('openCart')}
            className="relative flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground shadow-sm shrink-0 h-9"
          >
            <div className="relative">
              <ShoppingCart className="size-4" />
              <CartBadge count={itemCount} />
            </div>
            <span className="hidden sm:inline-block text-foreground font-semibold">
              {formatCents(itemCount > 0 ? total : 0)}
            </span>
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Mobile/Scrolled Hamburger Sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
                  className={cn(
                    "text-muted-foreground hover:bg-accent hover:text-foreground",
                    scrolled ? "flex" : "lg:hidden flex"
                  )}
                />
              }
            >
              {mobileOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] border-l border-border bg-card p-0 sm:max-w-[300px] flex flex-col"
            >
              <SheetHeader className="border-b border-border p-4 shrink-0">
                <SheetTitle className="font-heading text-base font-bold text-foreground">
                  <Image
                    src="/logo/finallogo-blacklettering-transparent.png"
                    alt="JDM Tokyo Motorsports"
                    width={650}
                    height={305}
                    className="h-24 w-auto dark:hidden"
                  />
                  <Image
                    src="/logo/finallogo-whitelettering-transparent.png"
                    alt="JDM Tokyo Motorsports"
                    width={650}
                    height={305}
                    className="hidden h-24 w-auto dark:block"
                  />
                </SheetTitle>
              </SheetHeader>

              <nav className="flex-1 flex flex-col p-4 overflow-y-auto" aria-label="Mobile navigation">
                <div className="flex-1 space-y-1">
                  {brandNav.map((item, idx) => {
                    const hasSub = item.submenu && item.submenu.length > 0;
                    const isExpanded = !!expandedItems[item.label];
                    return (
                      <div key={item.label} className="flex flex-col">
                        {hasSub ? (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.label)}
                              className="flex items-center justify-between w-full rounded px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground text-left"
                            >
                              <span>{item.label}</span>
                              <ChevronRight className={cn("size-4 text-muted-foreground/60 transition-transform", isExpanded && "rotate-90")} />
                            </button>
                            {isExpanded && (
                              <div className="pl-6 bg-muted/20 border-l border-border py-1 space-y-1 my-0.5">
                                {item.submenu!.map((sub) => {
                                  const hasNestedSub = sub.submenu && sub.submenu.length > 0;
                                  const isNestedExpanded = !!expandedItems[item.label + '_' + sub.label];
                                  return (
                                    <div key={sub.href} className="flex flex-col">
                                      {hasNestedSub ? (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => toggleExpand(item.label + '_' + sub.label)}
                                            className="flex items-center justify-between w-full rounded px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground text-left"
                                          >
                                            <span>{sub.label}</span>
                                            <ChevronRight className={cn("size-3.5 text-muted-foreground/60 transition-transform", isNestedExpanded && "rotate-90")} />
                                          </button>
                                          {isNestedExpanded && (
                                            <div className="pl-4 bg-muted/10 border-l border-border/50 py-0.5 space-y-0.5 my-0.5">
                                              {sub.submenu!.map((nested) => (
                                                <Link
                                                  key={nested.href}
                                                  href={nested.href}
                                                  onClick={() => setMobileOpen(false)}
                                                  className="block rounded px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                >
                                                  {nested.label}
                                                </Link>
                                              ))}
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <Link
                                          href={sub.href}
                                          onClick={() => setMobileOpen(false)}
                                          className="block rounded px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        >
                                          {sub.label}
                                        </Link>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="block rounded px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {item.label}
                          </Link>
                        )}
                        {idx < brandNav.length - 1 && (
                          <Separator className="my-1 bg-border/60" />
                        )}
                      </div>
                    );
                  })}
                </div>


              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* ── Row 2: Brand Navigation ── */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out border-t border-border/5 bg-background/95 backdrop-blur-sm",
          scrolled ? "h-0 opacity-0 overflow-hidden" : "h-11 opacity-100"
        )}
      >
        <div className="mx-auto flex h-11 w-full max-w-none items-center justify-center gap-6 px-4 sm:px-6 lg:px-8 xl:px-24 2xl:px-48">
          <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Brand navigation">
            {brandNav.map((item) => {
              const slug = item.label.toLowerCase();
              const inBrandContext =
                !!currentMake ||
                brandNav.some(
                  (b) =>
                    b.submenu !== null &&
                    (
                      pathname.startsWith('/engines/' + b.label.toLowerCase()) ||
                      pathname.startsWith('/transmissions/' + b.label.toLowerCase()) ||
                      pathname.startsWith('/parts/' + b.label.toLowerCase())
                    )
                );
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : slug === 'more'
                  ? MORE_PAGE_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
                  : item.submenu !== null
                  ? pathname.startsWith('/engines/' + slug) ||
                    pathname.startsWith('/transmissions/' + slug) ||
                    pathname.startsWith('/parts/' + slug) ||
                    currentMake === slug
                  : pathname.startsWith(item.href) && !inBrandContext;
              return (
                <div key={item.label} className="group relative">
                  {item.href === '#' ? (
                    <span
                      className={cn(
                        'relative block px-3 py-1.5 text-sm font-semibold uppercase tracking-wider transition-colors cursor-pointer select-none',
                        isActive
                          ? 'text-[#DC2626]'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <motion.span
                          layoutId="brand-underline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DC2626]"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'relative block px-3 py-1.5 text-sm font-semibold uppercase tracking-wider transition-colors',
                        isActive
                          ? 'text-[#DC2626]'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {item.label}
                      {isActive && (
                        <motion.span
                          layoutId="brand-underline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DC2626]"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </Link>
                  )}
                  {item.submenu && (
                    <div className="invisible absolute left-0 top-full z-50 min-w-[150px] rounded-md border border-border bg-card py-1 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                      {item.submenu.map((sub) => (
                        <div key={sub.href} className="group/sub relative">
                          {sub.submenu ? (
                            <>
                              <Link
                                href={sub.href}
                                className="flex items-center justify-between px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              >
                                <span>{sub.label}</span>
                                <ChevronRight className="size-3.5 text-muted-foreground/60 transition-transform group-hover/sub:translate-x-0.5" />
                              </Link>
                              <div className="invisible absolute left-full top-0 z-50 min-w-[140px] rounded-md border border-border bg-card py-1 shadow-lg opacity-0 transition-all group-hover/sub:visible group-hover/sub:opacity-100">
                                {sub.submenu.map((nestedSub) => (
                                  <Link
                                    key={nestedSub.href}
                                    href={nestedSub.href}
                                    className="block px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  >
                                    {nestedSub.label}
                                  </Link>
                                ))}
                              </div>
                            </>
                          ) : (
                            <Link
                              href={sub.href}
                              className="block px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              {sub.label}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Mobile search overlay ── */}
      <AnimatePresence>
        {searchFocused && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-background lg:hidden"
          >
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tSearch('placeholder')}
                  className="h-10 w-full rounded-lg border border-border bg-muted pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[#DC2626] focus:outline-none"
                  autoComplete="off"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { clearQuery(); setSearchFocused(false); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Mobile search results */}
              {query && (
                <div className="mt-2 max-h-[60vh] overflow-y-auto">
                  {isLoading && results.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">{tSearch('loading')}</p>
                  )}
                  {!isLoading && results.length === 0 && query && (
                    <p className="py-4 text-center text-sm text-muted-foreground">{tSearch('noResults', { query })}</p>
                  )}
                  {results.length > 0 && (
                    <ul className="space-y-1">
                      {results.map((result) => (
                        <li key={result.id}>
                          <Link
                            href={result.href}
                            onClick={() => { handleResultClick(); setSearchFocused(false); }}
                            className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                              {result.image ? (
                                <img src={result.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <Search className="size-3 text-muted-foreground/30" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{result.title}</p>
                              <div className="mt-0.5 flex items-center gap-2">
                                {(() => {
                                  const cat = result.category.toLowerCase();
                                  const isEngine = cat === 'engine';
                                  const isTransmission = cat === 'transmission';
                                  const text = isEngine ? 'Engine' : isTransmission ? 'Transmission' : 'Part';
                                  const badgeClass = isEngine
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                    : isTransmission
                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                                  return (
                                    <Badge
                                      variant="outline"
                                      className={cn('text-[10px] font-medium border px-1.5 py-0', badgeClass)}
                                    >
                                      {text}
                                    </Badge>
                                  );
                                })()}
                                {result.make && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {result.make}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-bold text-[#DC2626]">${result.price.toLocaleString()}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
