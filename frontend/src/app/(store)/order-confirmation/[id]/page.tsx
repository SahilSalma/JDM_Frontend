import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { CheckCircle, Package, Truck, Mail, ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

interface OrderData {
  id: string;
  order_number: string;
  status: string;
  customer_email: string;
  customer_name: string;
  total_cents: number;
  shipping_cents: number;
  items: {
    product_id: string;
    title: string;
    sku: string;
    price_cents: number;
    quantity: number;
  }[];
}

async function getOrder(id: string): Promise<OrderData | null> {
  try {
    const res = await fetch(`${API_URL}/orders/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_URL}/admin/settings/public`, {
      cache: 'no-store',
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data ?? {};
  } catch {
    return {};
  }
}

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata(_props: PageProps): Promise<Metadata> {
  return { title: 'Order Confirmed | JDM Tokyo Motorsports' };
}

const NEXT_STEPS = [
  { Icon: Mail },
  { Icon: Package },
  { Icon: Truck },
];

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { id } = await params;
  const [order, settings] = await Promise.all([getOrder(id), getSettings()]);
  const t = await getTranslations('orders.confirmation');

  const orderNumber = order?.order_number ?? id;
  const customerEmail = order?.customer_email ?? '';

  const getVal = (key: string, fallbackKey: string) =>
    settings[key] || t(fallbackKey);

  const title = getVal('order_confirmation_title', 'title');
  const thankYou = getVal('order_confirmation_thank_you', 'thankYou');
  const nextStepsTitle = getVal('order_confirmation_next_steps_title', 'nextSteps');
  const stepTexts = [
    getVal('order_confirmation_step_1', 'step1'),
    getVal('order_confirmation_step_2', 'step2'),
    getVal('order_confirmation_step_3', 'step3'),
  ];
  const btnText = settings['order_confirmation_continue_btn_text'] || 'Continue Shopping';
  const btnLink = settings['order_confirmation_continue_btn_link'] || '/engines';

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="mb-8 flex justify-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-green-500/10 border-2 border-green-500/30">
          <CheckCircle className="size-12 text-green-500" />
        </div>
      </div>

      <h1 className="font-heading text-4xl font-bold uppercase tracking-wide text-foreground">
        {title}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{thankYou}</p>

      <div className="mt-6 rounded-lg border border-border bg-card px-6 py-4 shadow-sm">
        <p className="text-sm text-muted-foreground">{t('orderNumber')}</p>
        <p className="mt-1 font-mono text-2xl font-bold text-[#DC2626]">#{orderNumber}</p>
      </div>

      {customerEmail && (
        <p className="mt-4 text-sm text-muted-foreground">
          {t('emailSent')} <span className="text-foreground">{customerEmail}</span>
        </p>
      )}

      <Separator className="my-8 bg-border" />

      <div className="text-left">
        <h2 className="mb-6 font-heading text-xl font-bold uppercase tracking-wide text-foreground">
          {nextStepsTitle}
        </h2>
        <ol className="space-y-4">
          {NEXT_STEPS.map(({ Icon }, idx) => (
            <li key={idx} className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DC2626]/10 border border-[#DC2626]/30">
                <Icon className="size-5 text-[#DC2626]" />
              </div>
              <div className="pt-1.5">
                <p className="text-sm font-medium text-foreground">Step {idx + 1}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{stepTexts[idx]}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <Separator className="my-8 bg-border" />

      <Link
        href={btnLink}
        className={buttonVariants({ size: 'lg', className: 'bg-[#DC2626] text-white hover:bg-[#ef4444]' })}
      >
        {btnText}
        <ArrowRight className="ml-2 size-4" />
      </Link>
    </div>
  );
}
