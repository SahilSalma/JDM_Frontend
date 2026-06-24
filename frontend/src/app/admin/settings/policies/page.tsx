'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Save, Loader2, Plus, Trash2, ArrowLeft, ShieldCheck, Eye, Sparkles, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { IconRenderer, ICON_MAP } from '@/components/admin/IconRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/ThemeProvider';
import { toast } from 'sonner';

interface PolicySection {
  title: string;
  content: string;
  type?: string;
  icon?: string;
  items?: Array<{
    title: string;
    value?: string;
    description?: string;
    icon?: string;
  }>;
}

const POLICIES = [
  { key: 'policy_warranty', label: 'Warranty Policy' },
  { key: 'policy_shipping', label: 'Shipping Policy' },
  { key: 'policy_privacy', label: 'Privacy Policy' },
  { key: 'policy_terms', label: 'Terms of Service' },
  { key: 'policy_returns', label: 'Returns & Refunds' },
];

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

export default function PoliciesSettingsPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const t = useTranslations('admin.settingsPage');
  const router = useRouter();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activePolicy, setActivePolicy] = useState('policy_warranty');

  // Load Settings
  useEffect(() => {
    adminApi
      .get<{ success: boolean; data: any[] }>('/admin/settings')
      .then((res) => {
        const map: Record<string, string> = {};
        for (const row of res.data) {
          map[row.rule_key] = row.rule_value;
        }

        // Prefill default settings when not available from DB
        if (map['policy_warranty'] === undefined || map['policy_warranty'].trim() === '' || map['policy_warranty'].trim() === '[]') {
          map['policy_warranty'] = JSON.stringify([
            {
              title: "30-Day Warranty on All Units",
              content: "JDM Tokyo Motorsports warrants all engines and transmissions against defects in materials and workmanship for 30 days from the date of delivery. If your unit fails within this period due to a covered defect, we will replace it or provide a full refund.",
              type: "highlight",
              icon: "shield"
            },
            {
              title: "What Is Covered",
              content: "Compression failures not disclosed at time of sale\nInternal mechanical defects present at time of shipment\nIncorrect unit shipped (wrong engine code or model)\nUnits with undisclosed damage discovered upon inspection\nSignificant mileage discrepancy from listed specification",
              type: "bullets",
              icon: "check"
            },
            {
              title: "What Is Not Covered (Exclusions)",
              content: "Labor costs for engine installation or removal\nDamage caused by improper installation, misuse, or abuse\nAccessories, sensors, manifolds, and wiring harnesses (left on for convenience only)\nEngines used for racing, competition, or off-road purposes\nLoss of time, road service, towing, or rental car charges",
              type: "bullets",
              icon: "alert"
            },
            {
              title: "How to File a Claim",
              content: "Contact JDM Tokyo Motorsports customer support immediately upon discovering an issue.\nProvide the original purchase invoice and a certified mechanic diagnostic report.\nSend photos or video evidence of any mechanical or structural damage.\nObtain a return authorization number prior to returning any merchandise.",
              type: "numbered"
            },
            {
              title: "Warranty Duration & Timing",
              content: "The warranty period begins on the day the item is delivered. Any claims must be made within the 30-day window. Returns must be shipped back within 7 days of receiving authorization.",
              type: "disclaimer",
              icon: "clock"
            }
          ]);
        }

        if (map['policy_shipping'] === undefined || map['policy_shipping'].trim() === '' || map['policy_shipping'].trim() === '[]') {
          map['policy_shipping'] = JSON.stringify([
            {
              title: "Flat Shipping Rates",
              content: "We offer flat-rate freight shipping to the continental United States. Choose the option that fits your delivery destination.",
              type: "cards",
              items: [
                { title: "Commercial Address", value: "$500", description: "Delivered to a commercial facility with a loading dock or forklift.", icon: "building" },
                { title: "Residential Address", value: "$700", description: "Delivered to your home address with liftgate service included.", icon: "home" }
              ]
            },
            {
              title: "Our Logistics Partners & Carriers",
              content: "Estes Express Lines Freight Delivery\nR&L Carriers Freight Sourcing\nTForce Freight & Roadrunner Transportation",
              type: "bullets",
              icon: "truck"
            },
            {
              title: "Shipping Process & Delivery Timeline",
              content: "Processing: Orders are prepped, palleted, and strapped within 1-2 business days.\nTransit: Shipping transit takes between 3 to 7 business days depending on location.\nDelivery: The carrier will contact you to schedule a delivery appointment window.",
              type: "numbered"
            },
            {
              title: "Important Delivery Inspections",
              content: "Please inspect the package thoroughly before signing the delivery receipt. Note any damage to the crate or unit on the driver's bill of lading before accepting delivery.",
              type: "disclaimer",
              icon: "package"
            }
          ]);
        }

        if (map['policy_privacy'] === undefined || map['policy_privacy'].trim() === '' || map['policy_privacy'].trim() === '[]') {
          map['policy_privacy'] = JSON.stringify([
            {
              title: "Information Collection",
              content: "We collect information you provide directly to us, including your name, email address, phone number, shipping address, and payment information when you place an order. We also collect technical information about your device and browsing behavior to improve our website.",
              type: "text"
            },
            {
              title: "How We Use Your Information",
              content: "We use the information we collect to process your orders, communicate with you about your purchases, improve our products and services, and personalize your experience on our website.",
              type: "text"
            },
            {
              title: "Information Sharing",
              content: "We do not sell your personal information. We share your information with trusted third-party service providers who assist us in operating our website, processing payments, and shipping products to you.",
              type: "text"
            },
            {
              title: "Cookies and Tracking",
              content: "We use cookies and similar tracking technologies to analyze website traffic, remember your preferences, and provide a more personalized browsing experience.",
              type: "text"
            },
            {
              title: "Data Security",
              content: "We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or alteration.",
              type: "text"
            },
            {
              title: "Your Rights",
              content: "You have the right to access, correct, or delete your personal information that we collect. Contact us to make requests regarding your personal data.",
              type: "text"
            },
            {
              title: "Contact Us",
              content: "If you have questions about this Privacy Policy, please contact us at sales@jdmtokyomotors.com or call +1 (800) 536-8669. We are available Monday through Friday, 9:00 AM to 5:00 PM PST.",
              type: "highlight",
              icon: "info"
            }
          ]);
        }

        if (map['policy_terms'] === undefined || map['policy_terms'].trim() === '' || map['policy_terms'].trim() === '[]') {
          map['policy_terms'] = JSON.stringify([
            {
              title: "Acceptance of Terms",
              content: "By accessing or using our website, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use our services.",
              type: "text"
            },
            {
              title: "Product Pricing and Availability",
              content: "All products are subject to availability. Sourced directly from Japan, our engines and transmissions are low-mileage units and listed prices are subject to change without notice.",
              type: "text"
            },
            {
              title: "Orders and Sourcing",
              content: "We reserve the right to cancel or refuse any order. Sourcing contracts are initiated upon payment confirmation, and cancellation policies apply.",
              type: "text"
            },
            {
              title: "Payment Terms",
              content: "Payments must be made through approved channels. All transactions are securely processed and subject to fraud prevention checks.",
              type: "text"
            },
            {
              title: "Shipping and Logistics",
              content: "Freight shipping rates apply. You must inspect all shipments on arrival before signing carrier receipt slips.",
              type: "text"
            },
            {
              title: "Returns and Cancellations",
              content: "Returns are subject to approval. Certified mechanics diagnoses must be presented. Freight returns are paid by the customer unless due to incorrect delivery.",
              type: "text"
            },
            {
              title: "Limitation of Liability",
              content: "JDM Tokyo Motorsports is not liable for installation failures, labor fees, loss of time, or towing charges resulting from part defects.",
              type: "text"
            },
            {
              title: "Governing Law",
              content: "These Terms of Service are governed by and construed in accordance with the laws of the State of California.",
              type: "text"
            }
          ]);
        }

        if (map['policy_returns'] === undefined || map['policy_returns'].trim() === '' || map['policy_returns'].trim() === '[]') {
          map['policy_returns'] = JSON.stringify([
            {
              title: "Returns & Refunds Policy Overview",
              content: "We offer a 30-day return policy for select JDM engines and transmissions. Sourced directly from Japan, we strive for high customer satisfaction, but certain rules apply to returns.",
              type: "text"
            },
            {
              title: "Eligible Returns",
              content: "Unused products in their original packaging and shipping crates.\nIncorrectly shipped parts that do not match the purchased specification.\nDefective units covered by our 30-day warranty policy.",
              type: "bullets",
              icon: "check"
            },
            {
              title: "Non-Eligible Returns",
              content: "Items damaged due to installation errors, misuse, or race usage.\nProducts returned without prior written authorization.\nParts disassembled or modified without our consent.",
              type: "bullets",
              icon: "alert"
            },
            {
              title: "Return Process Steps",
              content: "Request: Submit a return request via email or phone within the 30-day window.\nInspection: Provide mechanic diagnostic reports and photos of the unit crate.\nSourcing Return: Ship the unit back via our approved freight carrier.\nRefund: Once inspected and approved, a refund is processed to the original payment method.",
              type: "numbered"
            },
            {
              title: "Contact for Returns",
              content: "Call +1 (800) 536-8669 or email sales@jdmtokyomotors.com to initiate a return request.",
              type: "highlight",
              icon: "mail"
            }
          ]);
        }

        setSettings(map);
      })
      .catch((err) => console.error('Failed to load settings', err))
      .finally(() => setIsLoading(false));
  }, []);

  const get = useCallback((key: string, fallback = '') => settings[key] ?? fallback, [settings]);
  const set = useCallback((key: string, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
  }, []);

  const getPolicySections = (policyKey: string): PolicySection[] => {
    const raw = get(policyKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Fallback simple parsing
      return [{ title: 'Overview', content: raw, type: 'text' }];
    }
  };

  const savePolicySections = (policyKey: string, next: PolicySection[]) => {
    set(policyKey, JSON.stringify(next));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const entries = POLICIES.map((p) => ({ key: p.key, value: get(p.key) }));
      await adminApi.put('/admin/settings/bulk', { settings: entries });
      toast.success(t('savedSuccess'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const sections = getPolicySections(activePolicy);
  const activeLabel = POLICIES.find((p) => p.key === activePolicy)?.label ?? '';

  const inputClass = 'bg-muted border-border text-foreground placeholder:text-muted-foreground/60 text-sm';
  const labelClass = 'text-xs text-muted-foreground';
  const textareaClass = 'bg-muted border-border text-foreground placeholder:text-muted-foreground/60 text-sm min-h-[90px] w-full rounded-md border px-3 py-2 resize-y focus:outline-none focus:ring-1 focus:ring-[#DC2626]';

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header breadcrumb */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => router.push('/admin/settings')}
          className="border-border hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-heading text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-5 text-[#DC2626]" />
            Legal & Policy Pages Editor
          </h1>
          <p className="text-xs text-muted-foreground">Draft and configure comprehensive policies (warranty, returns, terms, privacy, shipping).</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Forms Side */}
        <div className="xl:col-span-7 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm text-foreground">Select Active Policy to Edit</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-1.5">
                {POLICIES.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActivePolicy(p.key)}
                    className={`rounded px-3 py-1.5 text-xs font-semibold transition-all border ${
                      activePolicy === p.key
                        ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-sm shadow-red-950/40'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted border-border'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-foreground flex items-center gap-2">
                <Eye className="size-4 text-[#DC2626]" />
                {activeLabel} Content Outline
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const updated = [...sections, { title: 'New Section', content: '', type: 'text' }];
                  savePolicySections(activePolicy, updated);
                }}
                className="gap-1 text-xs text-[#DC2626] hover:bg-[#DC2626]/10"
              >
                <Plus className="size-3.5" /> Add Section
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-6">
              {sections.length === 0 && (
                <p className="text-xs italic text-muted-foreground py-2 text-center">No sections drafted yet. Click "Add Section" above.</p>
              )}
              {sections.map((sec, idx) => (
                <div key={idx} className="relative rounded-lg border border-border bg-muted/20 p-4 space-y-4">
                  <div className="absolute right-3 top-3 flex items-center gap-1.5">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...sections];
                          const temp = updated[idx];
                          updated[idx] = updated[idx - 1];
                          updated[idx - 1] = temp;
                          savePolicySections(activePolicy, updated);
                        }}
                        className="text-muted-foreground hover:text-[#DC2626] transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                    )}
                    {idx < sections.length - 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...sections];
                          const temp = updated[idx];
                          updated[idx] = updated[idx + 1];
                          updated[idx + 1] = temp;
                          savePolicySections(activePolicy, updated);
                        }}
                        className="text-muted-foreground hover:text-[#DC2626] transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="size-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const updated = sections.filter((_, i) => i !== idx);
                        savePolicySections(activePolicy, updated);
                      }}
                      className="text-muted-foreground hover:text-[#DC2626] transition-colors"
                      title="Delete Section"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Section Type Style</Label>
                      <select
                        value={sec.type ?? 'text'}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx] = { ...updated[idx], type: e.target.value };
                          savePolicySections(activePolicy, updated);
                        }}
                        className="h-9 bg-muted border border-border text-foreground text-xs rounded px-2 w-full focus:ring-1 focus:ring-[#DC2626]"
                      >
                        <option value="text">Standard Paragraph text</option>
                        <option value="highlight">Callout Highlight block</option>
                        <option value="bullets">Icon Bullets List</option>
                        <option value="numbered">Numbered Process list</option>
                        <option value="disclaimer">Cautionary Disclaimer banner</option>
                        <option value="cards">Card Grid (Rates/Features)</option>
                      </select>
                    </div>

                    {(sec.type === 'highlight' || sec.type === 'bullets' || sec.type === 'disclaimer') && (
                      <div className="space-y-1.5">
                        <Label className={labelClass}>Icon Indicator</Label>
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded bg-muted border border-border flex items-center justify-center text-[#DC2626] shrink-0">
                            <IconRenderer name={sec.icon || 'shield'} className="size-4" />
                          </div>
                          <select
                            value={sec.icon || 'shield'}
                            onChange={(e) => {
                              const updated = [...sections];
                              updated[idx] = { ...updated[idx], icon: e.target.value };
                              savePolicySections(activePolicy, updated);
                            }}
                            className="h-9 bg-muted border border-border text-foreground text-xs rounded px-2 w-full focus:ring-1 focus:ring-[#DC2626]"
                          >
                            {Object.keys(ICON_MAP).map((k) => (
                              <option key={k} value={k}>
                                {k.charAt(0).toUpperCase() + k.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className={labelClass}>Section Header Title</Label>
                    <Input
                      value={sec.title || ''}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        savePolicySections(activePolicy, updated);
                      }}
                      className="h-9 bg-muted border-border"
                      placeholder="e.g. 1. Terms of Coverage"
                    />
                  </div>

                  {sec.type !== 'cards' ? (
                    <div className="space-y-1.5">
                      <Label className={labelClass}>
                        Body Content
                        {(sec.type === 'bullets' || sec.type === 'numbered') && (
                          <span className="text-[10px] text-muted-foreground/60 ml-1">(Enter one item per line)</span>
                        )}
                        <span className="text-[10px] text-muted-foreground/60 ml-2">| Tip: Use [Text](URL) for links</span>
                      </Label>
                      <textarea
                        value={sec.content || ''}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx] = { ...updated[idx], content: e.target.value };
                          savePolicySections(activePolicy, updated);
                        }}
                        className={textareaClass}
                        placeholder={
                          sec.type === 'bullets' || sec.type === 'numbered'
                            ? 'Bullet 1\nBullet 2\nBullet 3'
                            : 'Enter the body copy here...'
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-3.5 border-t border-border/40 pt-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-foreground font-semibold">Grid Cards Editor</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updated = [...sections];
                            const items = [...(updated[idx].items ?? []), { title: 'Card Title', description: 'Description', icon: 'info' }];
                            updated[idx] = { ...updated[idx], items };
                            savePolicySections(activePolicy, updated);
                          }}
                          className="h-7 text-[10px] gap-1 hover:bg-muted"
                        >
                          <Plus className="size-3" /> Add Card item
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        <Label className={labelClass}>Intro Header Content Paragraph</Label>
                        <textarea
                          value={sec.content || ''}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[idx] = { ...updated[idx], content: e.target.value };
                            savePolicySections(activePolicy, updated);
                          }}
                          className={cn(textareaClass, 'min-h-[50px]')}
                        />
                      </div>

                      <div className="grid gap-2">
                        {(sec.items ?? []).map((cardItem, cardIdx) => (
                          <div key={cardIdx} className="relative rounded border border-border/80 bg-muted/40 p-3 space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...sections];
                                const items = (updated[idx].items ?? []).filter((_, i) => i !== cardIdx);
                                updated[idx] = { ...updated[idx], items };
                                savePolicySections(activePolicy, updated);
                              }}
                              className="absolute right-2 top-2 text-muted-foreground/60 hover:text-[#DC2626] transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Card Title</Label>
                                <Input
                                  value={cardItem.title || ''}
                                  onChange={(e) => {
                                    const updated = [...sections];
                                    const items = [...(updated[idx].items ?? [])];
                                    items[cardIdx] = { ...items[cardIdx], title: e.target.value };
                                    updated[idx] = { ...updated[idx], items };
                                    savePolicySections(activePolicy, updated);
                                  }}
                                  className="h-8 text-xs bg-muted border-border"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Card Value/Highlight (optional)</Label>
                                <Input
                                  value={cardItem.value || ''}
                                  onChange={(e) => {
                                    const updated = [...sections];
                                    const items = [...(updated[idx].items ?? [])];
                                    items[cardIdx] = { ...items[cardIdx], value: e.target.value };
                                    updated[idx] = { ...updated[idx], items };
                                    savePolicySections(activePolicy, updated);
                                  }}
                                  className="h-8 text-xs bg-muted border-border"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Icon</Label>
                                <select
                                  value={cardItem.icon || 'info'}
                                  onChange={(e) => {
                                    const updated = [...sections];
                                    const items = [...(updated[idx].items ?? [])];
                                    items[cardIdx] = { ...items[cardIdx], icon: e.target.value };
                                    updated[idx] = { ...updated[idx], items };
                                    savePolicySections(activePolicy, updated);
                                  }}
                                  className="h-8 bg-muted border border-border text-foreground text-[10px] rounded px-1.5 w-full focus:ring-1 focus:ring-[#DC2626]"
                                >
                                  {Object.keys(ICON_MAP).map((k) => (
                                    <option key={k} value={k}>
                                      {k}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground">Description <span className="text-[9px] text-muted-foreground/50 font-normal">(supports [Text](URL))</span></Label>
                                <Input
                                  value={cardItem.description || ''}
                                  onChange={(e) => {
                                    const updated = [...sections];
                                    const items = [...(updated[idx].items ?? [])];
                                    items[cardIdx] = { ...items[cardIdx], description: e.target.value };
                                    updated[idx] = { ...updated[idx], items };
                                    savePolicySections(activePolicy, updated);
                                  }}
                                  className="h-8 text-xs bg-muted border-border"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Action Bar */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#DC2626] text-white hover:bg-[#ef4444] ml-auto gap-2"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save Sourcing Settings
            </Button>
          </div>
        </div>

        {/* Live Storefront Mockup Side */}
        <div className="xl:col-span-5 xl:sticky xl:top-6 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold px-1">
            <Sparkles className="size-3.5 text-[#DC2626]" />
            Live Storefront Policy Document Preview
          </div>

          <Card className={cn(
            "border border-border/80 overflow-hidden shadow-2xl rounded-xl transition-colors",
            isDark ? "bg-zinc-950" : "bg-white"
          )}>
            <div className={cn(
              "px-4 py-2.5 border-b flex items-center justify-between text-[10px] transition-colors",
              isDark ? "bg-zinc-900 border-border/40" : "bg-zinc-50 border-zinc-200"
            )}>
              <span className={cn(
                "font-heading font-black transition-colors",
                isDark ? "text-white" : "text-zinc-950"
              )}>{activeLabel.toUpperCase()}</span>
              <Badge variant="outline" className={cn(
                "text-[7px] font-mono tracking-wider uppercase px-2 py-0.5 transition-colors",
                isDark ? "border-border/40 text-muted-foreground" : "border-zinc-200 text-zinc-500"
              )}>
                LIVE PREVIEW
              </Badge>
            </div>

            <ScrollArea className="h-[520px] p-5">
              <div className="space-y-6 pb-6 text-left">
                {/* Breadcrumbs Mockup */}
                <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                  <span>Home</span>
                  <span>/</span>
                  <span>{activeLabel}</span>
                </div>

                {/* Page Title & Subtitle */}
                <div className="space-y-2 py-4">
                  <h1 className={cn(
                    "font-heading text-2xl font-bold uppercase tracking-wide transition-colors",
                    isDark ? "text-white" : "text-zinc-950"
                  )}>
                    {activeLabel}
                  </h1>
                  <p className={cn(
                    "text-[10px] leading-relaxed transition-colors",
                    isDark ? "text-muted-foreground" : "text-zinc-500"
                  )}>
                    Official JDM Tokyo Motorsports policy and guidelines regarding {activeLabel.toLowerCase()}.
                  </p>
                </div>

                <div className={cn("h-[1px] w-full transition-colors", isDark ? "bg-border/30" : "bg-zinc-200")} />

                {/* Document Content sections */}
                <div className={cn(
                  "space-y-8 text-[10px] leading-relaxed transition-colors",
                  isDark ? "text-muted-foreground" : "text-zinc-600"
                )}>
                  {sections.length === 0 ? (
                    <p className="italic text-center text-muted-foreground/40 py-8">Empty policy document</p>
                  ) : (
                    sections.map((sec, idx) => {
                      const iconName = sec.icon || 'shield';
                      const hasIcon = ['highlight', 'bullets', 'disclaimer'].includes(sec.type || 'text');

                      const currentType = sec.type ?? 'text';
                      const needsTitle = currentType !== 'highlight' && currentType !== 'disclaimer';

                      const elements = [];

                      elements.push(
                        <div key={`sec-${idx}`} className="space-y-3">
                          {needsTitle && sec.title && (
                            <h2 className={cn(
                              "font-heading text-xs font-bold uppercase tracking-wide transition-colors",
                              isDark ? "text-white" : "text-zinc-950"
                            )}>
                              {parseLinks(sec.title)}
                            </h2>
                          )}

                          {currentType === 'cards' && sec.content && (
                            <p className="mb-3 leading-relaxed">{parseLinks(sec.content)}</p>
                          )}

                          {currentType === 'text' || !currentType ? (
                            <p className="whitespace-pre-line leading-relaxed">{parseLinks(sec.content)}</p>
                          ) : currentType === 'highlight' ? (
                            <div className={cn(
                              "flex gap-2.5 p-4 rounded-lg border font-medium italic transition-colors",
                              isDark ? "bg-[#DC2626]/5 border-[#DC2626]/30 text-white" : "bg-[#DC2626]/5 border-[#DC2626]/20 text-zinc-950"
                            )}>
                              {hasIcon && <IconRenderer name={iconName} className="size-5 text-[#DC2626] shrink-0 mt-0.5" />}
                              <div>
                                {sec.title && <h3 className="font-heading text-sm font-bold not-italic mb-1">{parseLinks(sec.title)}</h3>}
                                <p className="flex-1 leading-relaxed">{parseLinks(sec.content)}</p>
                              </div>
                            </div>
                          ) : currentType === 'disclaimer' ? (
                            <div className={cn(
                              "flex gap-2.5 p-4 rounded-lg border shadow-xs transition-colors",
                              isDark ? "bg-card border-border text-muted-foreground" : "bg-white border-zinc-200 text-zinc-600"
                            )}>
                              {hasIcon && <IconRenderer name={iconName} className="size-4 text-[#DC2626] shrink-0 mt-0.5" />}
                              <div>
                                {sec.title && <h3 className={cn("font-heading text-xs font-semibold mb-1 transition-colors", isDark ? "text-white" : "text-zinc-900")}>{parseLinks(sec.title)}</h3>}
                                <p className="flex-1 text-[9px] leading-relaxed">{parseLinks(sec.content)}</p>
                              </div>
                            </div>
                          ) : currentType === 'bullets' ? (
                            <ul className="space-y-1.5">
                              {sec.content.split('\n').filter(Boolean).map((bullet, bIdx) => (
                                <li key={bIdx} className="flex gap-2 items-start leading-normal">
                                  <IconRenderer name={iconName} className="size-3 text-[#DC2626] shrink-0 mt-0.5" />
                                  <span>{parseLinks(bullet)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : currentType === 'numbered' ? (
                            <ol className="space-y-2">
                              {sec.content.split('\n').filter(Boolean).map((step, sIdx) => (
                                <li key={sIdx} className="flex gap-3 items-start leading-normal">
                                  <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 border border-[#DC2626]/30 text-[8px] font-bold text-[#DC2626]">
                                    {sIdx + 1}
                                  </div>
                                  <span className="pt-0.5">{parseLinks(step)}</span>
                                </li>
                              ))}
                            </ol>
                          ) : currentType === 'cards' ? (
                            <div className="grid grid-cols-2 gap-3">
                              {(sec.items ?? []).map((cardItem, cIdx) => (
                                <div key={cIdx} className={cn(
                                  "flex flex-col p-3 rounded-lg border shadow-xs transition-colors",
                                  isDark ? "border-border bg-card" : "border-zinc-200 bg-white"
                                )}>
                                  <div className="flex items-center gap-2">
                                    <div className="flex size-7 items-center justify-center rounded-full bg-[#DC2626]/10">
                                      <IconRenderer name={cardItem.icon || 'info'} className="size-3.5 text-[#DC2626]" />
                                    </div>
                                    <h3 className={cn("font-heading text-[9px] font-bold transition-colors", isDark ? "text-white" : "text-zinc-950")}>{parseLinks(cardItem.title)}</h3>
                                  </div>
                                  {cardItem.value && (
                                    <p className="mt-2 font-heading text-base font-black text-[#DC2626]">{parseLinks(cardItem.value)}</p>
                                  )}
                                  {cardItem.description && (
                                    <p className="mt-1 text-[7px] text-muted-foreground leading-normal">{parseLinks(cardItem.description)}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );

                      // Separator logic
                      if (idx < sections.length - 1) {
                        const nextType = sections[idx + 1].type ?? 'text';
                        if (currentType !== 'highlight' && nextType !== 'highlight' && currentType !== 'disclaimer') {
                          elements.push(
                            <div key={`sep-${idx}`} className={cn("h-[1px] w-full transition-colors", isDark ? "bg-border/20" : "bg-zinc-200")} />
                          );
                        }
                      }

                      return elements;
                    })
                  )}
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
