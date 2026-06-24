'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  Menu, 
  Link2,
  Sliders
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useVehicleData } from '@/hooks/useVehicleData';

interface CustomLink {
  label: string;
  href: string;
}

interface NavbarConfig {
  mainBrands: string[];
  otherBrands: string[];
  customLinks: CustomLink[];
  moreLinks?: string[];
}

const STANDARD_PAGES = [
  { id: 'about', label: 'About Us', href: '/about' },
  { id: 'blog', label: 'Blog', href: '/blog' },
  { id: 'contact', label: 'Contact Us', href: '/contact' },
  { id: 'track-order', label: 'Track Order', href: '/track-order' },
  { id: 'warranty', label: 'Warranty Policy', href: '/warranty' },
  { id: 'shipping', label: 'Shipping Policy', href: '/shipping' },
  { id: 'returns', label: 'Returns Policy', href: '/returns' },
  { id: 'privacy', label: 'Privacy Policy', href: '/privacy' },
  { id: 'terms', label: 'Terms of Service', href: '/terms' },
];

const insertBrandInOrder = (list: string[], brand: string, orderedMakes: string[]): string[] => {
  const brandIndex = orderedMakes.indexOf(brand);
  if (brandIndex === -1) return [...list, brand];

  const insertIdx = list.findIndex(item => {
    const itemIdx = orderedMakes.indexOf(item);
    return itemIdx > brandIndex;
  });

  if (insertIdx === -1) {
    return [...list, brand];
  }

  const next = [...list];
  next.splice(insertIdx, 0, brand);
  return next;
};

const defaultConfig = (makes: string[]): NavbarConfig => ({
  mainBrands: makes.slice(0, 6),
  otherBrands: makes.slice(6),
  customLinks: [],
  moreLinks: ['about', 'blog', 'contact', 'track-order', 'warranty', 'shipping', 'returns', 'privacy', 'terms']
});

export default function AdminNavbarSettingsPage() {
  const router = useRouter();
  const { makes } = useVehicleData();
  const orderedMakes = makes.map((m) => m.toLowerCase());
  const [config, setConfig] = useState<NavbarConfig>(defaultConfig(makes));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Custom link composer state
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkHref, setNewLinkHref] = useState('');

  // Fetch current settings
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.get<{ success: boolean; data: Record<string, string> }>('/admin/navbar-settings');
      if (res.data && res.data.navbar_links) {
        try {
          const parsed = JSON.parse(res.data.navbar_links);
          setConfig({
            mainBrands: Array.isArray(parsed.mainBrands) ? parsed.mainBrands.filter((b: string) => orderedMakes.includes(b)) : defaultConfig(makes).mainBrands,
            otherBrands: Array.isArray(parsed.otherBrands) ? parsed.otherBrands.filter((b: string) => orderedMakes.includes(b)) : defaultConfig(makes).otherBrands,
            customLinks: Array.isArray(parsed.customLinks) ? parsed.customLinks : defaultConfig(makes).customLinks,
            moreLinks: Array.isArray(parsed.moreLinks) ? parsed.moreLinks : defaultConfig(makes).moreLinks,
          });
        } catch {
          setConfig(defaultConfig(makes));
        }
      } else {
        setConfig(defaultConfig(makes));
      }
    } catch {
      toast.error('Failed to load navbar settings');
      setConfig(defaultConfig(makes));
    } finally {
      setIsLoading(false);
    }
  }, [makes]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle active status toggle for a brand
  const handleToggleBrand = (make: string, checked: boolean) => {
    setConfig(prev => {
      let main = [...prev.mainBrands];
      let other = [...prev.otherBrands];

      if (checked) {
        // Move from other to main, maintaining relative position from orderedMakes
        if (!main.includes(make)) {
          main = insertBrandInOrder(main, make, orderedMakes);
        }
        other = other.filter(m => m !== make);
      } else {
        // Move from main to other, maintaining relative position from orderedMakes
        if (!other.includes(make)) {
          other = insertBrandInOrder(other, make, orderedMakes);
        }
        main = main.filter(m => m !== make);
      }

      // Keep otherBrands strictly ordered by orderedMakes since they are not manually reordered
      other.sort((a, b) => orderedMakes.indexOf(a) - orderedMakes.indexOf(b));

      return {
        ...prev,
        mainBrands: main,
        otherBrands: other
      };
    });
  };

  // Reorder active brands
  const moveBrand = (index: number, direction: 'up' | 'down') => {
    setConfig(prev => {
      const list = [...prev.mainBrands];
      if (direction === 'up' && index > 0) {
        const temp = list[index];
        list[index] = list[index - 1];
        list[index - 1] = temp;
      } else if (direction === 'down' && index < list.length - 1) {
        const temp = list[index];
        list[index] = list[index + 1];
        list[index + 1] = temp;
      }
      return { ...prev, mainBrands: list };
    });
  };

  // Add custom links
  const handleAddCustomLink = () => {
    if (!newLinkLabel || !newLinkHref) {
      toast.warning('Please enter both a label and a URL path');
      return;
    }
    setConfig(prev => ({
      ...prev,
      customLinks: [...prev.customLinks, { label: newLinkLabel, href: newLinkHref }]
    }));
    setNewLinkLabel('');
    setNewLinkHref('');
    toast.success('Custom link added to layout draft!');
  };

  // Delete custom link
  const handleDeleteCustomLink = (index: number) => {
    setConfig(prev => ({
      ...prev,
      customLinks: prev.customLinks.filter((_, i) => i !== index)
    }));
  };

  // Move custom link order
  const moveCustomLink = (index: number, direction: 'up' | 'down') => {
    setConfig(prev => {
      const list = [...prev.customLinks];
      if (direction === 'up' && index > 0) {
        const temp = list[index];
        list[index] = list[index - 1];
        list[index - 1] = temp;
      } else if (direction === 'down' && index < list.length - 1) {
        const temp = list[index];
        list[index] = list[index + 1];
        list[index + 1] = temp;
      }
      return { ...prev, customLinks: list };
    });
  };

  // Handle active status toggle for a "More" link
  const handleToggleMoreLink = (pageId: string, checked: boolean) => {
    setConfig(prev => {
      const more = prev.moreLinks ? [...prev.moreLinks] : [];
      if (checked) {
        if (!more.includes(pageId)) {
          more.push(pageId);
        }
      } else {
        return {
          ...prev,
          moreLinks: more.filter(id => id !== pageId)
        };
      }
      return {
        ...prev,
        moreLinks: more
      };
    });
  };

  // Reorder "More" links
  const moveMoreLink = (index: number, direction: 'up' | 'down') => {
    setConfig(prev => {
      const list = prev.moreLinks ? [...prev.moreLinks] : [];
      if (direction === 'up' && index > 0) {
        const temp = list[index];
        list[index] = list[index - 1];
        list[index - 1] = temp;
      } else if (direction === 'down' && index < list.length - 1) {
        const temp = list[index];
        list[index] = list[index + 1];
        list[index + 1] = temp;
      }
      return { ...prev, moreLinks: list };
    });
  };

  // Save settings to backend
  const handleSave = async () => {
    setIsSaving(true);
    const cleanConfig = {
      ...config,
      mainBrands: config.mainBrands.filter(b => orderedMakes.includes(b)),
      otherBrands: config.otherBrands.filter(b => orderedMakes.includes(b)),
    };
    try {
      await adminApi.put('/admin/navbar-settings', {
        settings: [
          {
            key: 'navbar_links',
            value: JSON.stringify(cleanConfig)
          }
        ]
      });
      toast.success('Navbar settings updated successfully! Public page layouts refreshed.');
      fetchSettings();
    } catch {
      toast.error('Failed to save navbar settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = 'bg-muted border-border text-foreground placeholder:text-muted-foreground/60 h-9 text-sm';
  const labelClass = 'text-xs text-muted-foreground font-semibold';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => router.push('/admin/settings')}
          className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
            Navbar Configuration
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure which brands appear on the main navigation bar vs the dropdown, reorder items, and manage custom links.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Brand Visibility Selectors */}
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-base font-bold text-foreground">Main Nav Brand Selector</CardTitle>
                <CardDescription className="text-xs">
                  Check which JDM makes should show directly on the top header. Unchecked brands automatically move to the "Other Brands" hover dropdown.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {orderedMakes.map((make: string) => {
                  const friendlyName = make.charAt(0).toUpperCase() + make.slice(1);
                  const isChecked = config.mainBrands.includes(make);

                  return (
                    <div key={make} className="flex items-center space-x-3 py-1">
                      <Checkbox
                        id={`make-${make}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleToggleBrand(make, !!checked)}
                        className="border-border text-[#DC2626] data-[state=checked]:bg-[#DC2626] data-[state=checked]:border-[#DC2626]"
                      />
                      <Label
                        htmlFor={`make-${make}`}
                        className="text-sm font-medium text-foreground cursor-pointer capitalize"
                      >
                        {friendlyName}
                      </Label>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* More Dropdown Pages Selector */}
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-base font-bold text-foreground">More Dropdown Pages</CardTitle>
                <CardDescription className="text-xs">
                  Select which pages should show under the "More" navigation dropdown item.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {STANDARD_PAGES.map((page) => {
                  const isChecked = config.moreLinks?.includes(page.id) ?? false;

                  return (
                    <div key={page.id} className="flex items-center space-x-3 py-1">
                      <Checkbox
                        id={`page-${page.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleToggleMoreLink(page.id, !!checked)}
                        className="border-border text-[#DC2626] data-[state=checked]:bg-[#DC2626] data-[state=checked]:border-[#DC2626]"
                      />
                      <Label
                        htmlFor={`page-${page.id}`}
                        className="text-sm font-medium text-foreground cursor-pointer"
                      >
                        {page.label}
                      </Label>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Brand Reordering & Custom Links */}
          <div className="md:col-span-2 space-y-6">
            {/* Reordering List */}
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Menu className="size-4 text-[#DC2626]" />
                  Main Nav Brand Order
                </CardTitle>
                <CardDescription className="text-xs">
                  Reorder the brands appearing on the main navigation bar.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {config.mainBrands.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No brands selected for main navigation.</p>
                ) : (
                  <div className="space-y-2">
                    {config.mainBrands.map((make, idx) => (
                      <div 
                        key={make} 
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <span className="text-sm font-semibold capitalize text-foreground">{make}</span>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={idx === 0}
                            onClick={() => moveBrand(idx, 'up')}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={idx === config.mainBrands.length - 1}
                            onClick={() => moveBrand(idx, 'down')}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* More Dropdown Pages Order */}
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sliders className="size-4 text-[#DC2626]" />
                  More Dropdown Pages Order
                </CardTitle>
                <CardDescription className="text-xs">
                  Reorder the pages appearing inside the "More" dropdown.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {(!config.moreLinks || config.moreLinks.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pages selected for the "More" dropdown.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {config.moreLinks.map((pageId, idx) => {
                      const page = STANDARD_PAGES.find(p => p.id === pageId);
                      if (!page) return null;

                      return (
                        <div 
                          key={pageId} 
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-foreground">{page.label}</span>
                            <span className="text-xs text-muted-foreground font-mono">{page.href}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={idx === 0}
                              onClick={() => moveMoreLink(idx, 'up')}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowUp className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={idx === (config.moreLinks?.length ?? 0) - 1}
                              onClick={() => moveMoreLink(idx, 'down')}
                              className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ArrowDown className="size-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Custom Links Management */}
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Link2 className="size-4 text-[#DC2626]" />
                  Custom Menu Links
                </CardTitle>
                <CardDescription className="text-xs">
                  Add additional menu items (like 'Blog', 'Contact Us', or external landing pages).
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Form to add link */}
                <div className="grid gap-3 sm:grid-cols-3 items-end">
                  <div className="space-y-1">
                    <Label className={labelClass}>Link Title / Name</Label>
                    <Input
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      placeholder="e.g. Blog"
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className={labelClass}>URL / Path</Label>
                    <Input
                      value={newLinkHref}
                      onChange={(e) => setNewLinkHref(e.target.value)}
                      placeholder="e.g. /blog or https://..."
                      className={inputClass}
                    />
                  </div>
                  <Button
                    onClick={handleAddCustomLink}
                    disabled={!newLinkLabel || !newLinkHref}
                    className="bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50 gap-2 h-9"
                  >
                    <Plus className="size-4" />
                    Add Link
                  </Button>
                </div>

                {/* Custom Links List */}
                {config.customLinks.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/40">
                    <Label className="text-xs text-muted-foreground font-semibold mb-1 block">Custom Links Order</Label>
                    {config.customLinks.map((link, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-foreground">{link.label}</span>
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[250px]">{link.href}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={idx === 0}
                            onClick={() => moveCustomLink(idx, 'up')}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={idx === config.customLinks.length - 1}
                            onClick={() => moveCustomLink(idx, 'down')}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowDown className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteCustomLink(idx)}
                            className="h-8 w-8 text-muted-foreground hover:text-[#DC2626]"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50 gap-2 px-6 h-10 shadow-md font-bold text-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving Configuration...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Save Navbar Layout
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
