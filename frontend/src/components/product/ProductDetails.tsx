'use client';

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatCents } from '@/lib/constants';
import StockIndicator from '@/components/product/StockIndicator';
import AddToCartButton from '@/components/product/AddToCartButton';
import ShareButton from '@/components/product/ShareButton';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';
import { cn } from '@/lib/utils';
import { Minus, Plus, Trash2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';

interface ProductDetailProps {
  product: {
    id: string;
    slug: string;
    title: string;
    sku: string;
    price_cents: number;
    compare_at_price_cents?: number;
    description: string;
    category: string;
    make: string;
    model: string;
    year_start: number;
    year_end: number;
    engine_code?: string;
    stock: number;
    warranty?: string;
    condition: string;
    primary_image_path?: string;
    max_per_order?: number;
    mileage_km?: number | null;
    condition_notes?: string | null;
    included_items?: string | null;
    specs_json?: string | null;
    warranty_summary?: string | null;
  };
}

export default function ProductDetails({ product }: ProductDetailProps) {
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const { get } = useSiteSettings();
  const { items, updateQuantity, removeItem, addItem } = useCart();

  const cartItem = items.find((i) => i.productId === product.id || i.id === product.id);
  const cartQty = cartItem?.quantity ?? 0;
  const maxPerOrder = Math.max(1, product.max_per_order ?? 1);
  const allowStepper = maxPerOrder > 1;

  const isOutOfStock = product.stock === 0;
  const showShare = get('product_share_enabled', '1') !== '0';
  const router = useRouter();

  const handleBuyNow = useCallback(() => {
    if (!cartItem) {
      addItem({
        productId: product.id,
        title: product.title,
        slug: product.slug,
        sku: product.sku,
        price_cents: product.price_cents,
        image: product.primary_image_path ?? '',
        maxPerOrder: product.max_per_order,
      });
    }
    router.push('/checkout');
  }, [cartItem, addItem, product, router]);

  return (
    <div className="flex flex-col gap-8">
      {/* Category badge */}
      <Badge
        className={cn(
          'w-fit capitalize',
          product.category === 'engine'
            ? 'bg-[#DC2626]/20 text-foreground hover:bg-[#DC2626]/30'
            : 'bg-blue-500/20 text-foreground hover:bg-blue-500/30'
        )}
      >
        {product.category}
      </Badge>

      {/* Title + Share */}
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-heading text-3xl font-bold leading-tight text-foreground lg:text-4xl">
          {product.title}
        </h1>
        {showShare && <ShareButton title={product.title} className="shrink-0 mt-1" />}
      </div>

      {/* Year range + engine code */}
      {/* <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          {product.year_start}
          {product.year_end !== product.year_start ? `–${product.year_end}` : ''}{' '}
          {product.make} {product.model}
        </span>
        {product.engine_code && (
          <>
            <span className="text-muted-foreground/30">·</span>
            <span className="font-mono text-xs text-muted-foreground/60">{product.engine_code}</span>
          </>
        )}
      </div> */}

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <motion.span
          key={product.price_cents}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-heading text-4xl font-bold text-[#DC2626]"
        >
          {formatCents(product.price_cents)}
        </motion.span>
        {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
          <>
            <span className="text-xl text-muted-foreground/40 line-through">
              {formatCents(product.compare_at_price_cents)}
            </span>
            <Badge className="bg-emerald-500/20 text-foreground hover:bg-emerald-500/30 text-xs">
              {Math.round(((product.compare_at_price_cents - product.price_cents) / product.compare_at_price_cents) * 100)}% OFF
            </Badge>
          </>
        )}
      </div>

      <Separator className="bg-border" />

      {/* Stock indicator */}
      <StockIndicator quantity={product.stock} />

      {/* Max per order notice — only show when limit is exactly 1 */}
      {(!product.max_per_order || product.max_per_order <= 1) && (
        <p className="text-xs text-muted-foreground/60">{t('maxPerOrder')}</p>
      )}

      {/* Add to cart / qty stepper / remove */}
      {!isOutOfStock && cartQty > 0 ? (
        <div className="flex items-center gap-3 w-full">
          {allowStepper ? (
            <div className="flex flex-1 items-center justify-between rounded-lg border border-border bg-input h-11 px-1">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => updateQuantity(product.id, cartQty - 1)}
                className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
              >
                <Minus className="size-4" />
              </button>
              <span className="font-heading text-sm font-bold text-foreground">
                {cartQty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => updateQuantity(product.id, cartQty + 1)}
                disabled={cartQty >= maxPerOrder}
                className="flex h-9 w-9 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[#DC2626]/10 hover:text-[#DC2626] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="size-4" />
              </button>
            </div>
          ) : (
            <span className="flex-1 rounded-lg border border-border bg-muted h-11 flex items-center justify-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              In cart
            </span>
          )}
          <button
            type="button"
            aria-label="Remove from cart"
            onClick={() => removeItem(product.id)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-input text-muted-foreground transition-colors hover:border-[#DC2626]/40 hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      ) : (
        <AddToCartButton
          product={{
            id: product.id,
            title: product.title,
            slug: product.slug,
            sku: product.sku,
            price_cents: product.price_cents,
            primary_image_path: product.primary_image_path,
            max_per_order: product.max_per_order,
          }}
          disabled={isOutOfStock}
        />
      )}

      {!isOutOfStock && (
        <Button
          onClick={handleBuyNow}
          className="w-full gap-2 border-2 border-[#DC2626] bg-transparent font-semibold text-[#DC2626] transition-colors hover:bg-[#DC2626] hover:text-white"
          size="lg"
        >
          <Zap className="size-4" />
          {tCommon('buyNow')}
        </Button>
      )}

      {/* <Separator className="bg-border" /> */}

      {/* Meta info */}
      {/* <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t('sku')}</dt>
        <dd className="font-mono text-foreground/80">{product.sku}</dd>

        <dt className="text-muted-foreground">{t('condition')}</dt>
        <dd className="capitalize text-foreground/80">{product.condition}</dd>

        {product.warranty && (
          <>
            <dt className="text-muted-foreground">{t('warranty')}</dt>
            <dd className="text-foreground/80">{product.warranty}</dd>
          </>
        )}
      </dl> */}
    </div>
  );
}
