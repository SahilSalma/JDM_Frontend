'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Save, Loader2, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const SETTINGS_KEYS = [
  'order_confirmation_title',
  'order_confirmation_thank_you',
  'order_confirmation_next_steps_title',
  'order_confirmation_step_1',
  'order_confirmation_step_2',
  'order_confirmation_step_3',
  'order_confirmation_continue_btn_text',
  'order_confirmation_continue_btn_link',
];

const DEFAULT_VALUES: Record<string, string> = {
  order_confirmation_title: 'Order Confirmed!',
  order_confirmation_thank_you: 'Thank you for your purchase. Your order has been confirmed and will be processed shortly.',
  order_confirmation_next_steps_title: "What Happens Next?",
  order_confirmation_step_1: 'Invoice on its way — you\'ll receive a full invoice by email shortly.',
  order_confirmation_step_2: 'Order preparation — we\'ll carefully pick, pack, and prepare your order for shipment.',
  order_confirmation_step_3: 'Tracking info sent — once your order ships, you\'ll receive tracking details by email.',
  order_confirmation_continue_btn_text: 'Continue Shopping',
  order_confirmation_continue_btn_link: '/engines',
};

export default function OrderConfirmationSettingsPage() {
  const t = useTranslations('admin.settingsPage');
  const router = useRouter();

  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    adminApi
      .get<{ success: boolean; data: any[] }>('/admin/settings')
      .then((res) => {
        const map: Record<string, string> = {};
        for (const row of res.data) {
          map[row.rule_key] = row.rule_value;
        }
        for (const key of SETTINGS_KEYS) {
          if (!map[key] || map[key].trim() === '') {
            map[key] = DEFAULT_VALUES[key];
          }
        }
        setSettings(map);
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = SETTINGS_KEYS.map((key) => ({
        key,
        value: settings[key] || DEFAULT_VALUES[key],
      }));
      await adminApi.put('/admin/settings/bulk', { settings: payload });
      toast.success('Order confirmation page settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const update = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/settings')}
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Order Confirmation Page</h1>
            <p className="text-sm text-muted-foreground">Edit the content shown after a customer completes checkout.</p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#DC2626] text-foreground hover:bg-[#ef4444] gap-2"
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Changes
        </Button>
      </div>

      <Card className="border border-border bg-card/60 backdrop-blur-md">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <CheckCircle className="size-4 text-[#DC2626]" />
            Header Section
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Main Title</Label>
            <Input
              value={settings['order_confirmation_title'] || ''}
              onChange={(e) => update('order_confirmation_title', e.target.value)}
              className="bg-muted border-border text-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Thank You Message</Label>
            <Input
              value={settings['order_confirmation_thank_you'] || ''}
              onChange={(e) => update('order_confirmation_thank_you', e.target.value)}
              className="bg-muted border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/60 backdrop-blur-md">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <ArrowRight className="size-4 text-[#DC2626]" />
            "What Happens Next" Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Section Heading</Label>
            <Input
              value={settings['order_confirmation_next_steps_title'] || ''}
              onChange={(e) => update('order_confirmation_next_steps_title', e.target.value)}
              className="bg-muted border-border text-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Step 1</Label>
            <Input
              value={settings['order_confirmation_step_1'] || ''}
              onChange={(e) => update('order_confirmation_step_1', e.target.value)}
              className="bg-muted border-border text-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Step 2</Label>
            <Input
              value={settings['order_confirmation_step_2'] || ''}
              onChange={(e) => update('order_confirmation_step_2', e.target.value)}
              className="bg-muted border-border text-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Step 3</Label>
            <Input
              value={settings['order_confirmation_step_3'] || ''}
              onChange={(e) => update('order_confirmation_step_3', e.target.value)}
              className="bg-muted border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card/60 backdrop-blur-md">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm text-foreground flex items-center gap-2">
            <ArrowRight className="size-4 text-[#DC2626]" />
            "Continue Shopping" Button
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Button Text</Label>
            <Input
              value={settings['order_confirmation_continue_btn_text'] || ''}
              onChange={(e) => update('order_confirmation_continue_btn_text', e.target.value)}
              className="bg-muted border-border text-foreground"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-foreground">Button Link</Label>
            <Input
              value={settings['order_confirmation_continue_btn_link'] || ''}
              onChange={(e) => update('order_confirmation_continue_btn_link', e.target.value)}
              className="bg-muted border-border text-foreground"
            />
            <p className="text-[10px] text-muted-foreground/80">e.g. /engines, /transmissions, or /</p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="border border-border bg-card/60 backdrop-blur-md">
        <CardHeader className="border-b border-border pb-3">
          <CardTitle className="text-sm text-foreground">Preview</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-lg border border-border bg-background p-6 text-center max-w-xl mx-auto">
            <div className="mb-6 flex justify-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10 border-2 border-green-500/30">
                <CheckCircle className="size-8 text-green-500" />
              </div>
            </div>
            <h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-foreground">
              {settings['order_confirmation_title'] || DEFAULT_VALUES['order_confirmation_title']}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {settings['order_confirmation_thank_you'] || DEFAULT_VALUES['order_confirmation_thank_you']}
            </p>
            <div className="mt-6 rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground">Order Number</p>
              <p className="font-mono text-lg font-bold text-[#DC2626]">#JDM-12345</p>
            </div>
            <div className="mt-6 text-left">
              <h3 className="mb-4 font-heading text-base font-bold uppercase tracking-wide text-foreground">
                {settings['order_confirmation_next_steps_title'] || DEFAULT_VALUES['order_confirmation_next_steps_title']}
              </h3>
              <ol className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 text-xs font-bold text-[#DC2626]">1</span>
                  {settings['order_confirmation_step_1'] || DEFAULT_VALUES['order_confirmation_step_1']}
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 text-xs font-bold text-[#DC2626]">2</span>
                  {settings['order_confirmation_step_2'] || DEFAULT_VALUES['order_confirmation_step_2']}
                </li>
                <li className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 text-xs font-bold text-[#DC2626]">3</span>
                  {settings['order_confirmation_step_3'] || DEFAULT_VALUES['order_confirmation_step_3']}
                </li>
              </ol>
            </div>
            <div className="mt-6">
              <span className="inline-flex items-center gap-2 rounded-md bg-[#DC2626] px-4 py-2 text-sm font-medium text-white">
                {settings['order_confirmation_continue_btn_text'] || DEFAULT_VALUES['order_confirmation_continue_btn_text']}
                <ArrowRight className="size-4" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
