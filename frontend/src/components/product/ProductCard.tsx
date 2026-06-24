'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCents } from '@/lib/constants';
import AddToCartButton from '@/components/product/AddToCartButton';
import { useCart } from '@/hooks/useCart';
import { Minus, Plus, Trash2 } from 'lucide-react';
import type { Product } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const t = useTranslations('common');
  const { items, updateQuantity, removeItem } = useCart();
  const cartItem = items.find((i) => i.productId === product.id || i.id === product.id);
  const cartQty = cartItem?.quantity ?? 0;
  const maxPerOrder = Math.max(1, product.max_per_order ?? 1);
  const allowStepper = maxPerOrder > 1;
  const imageUrls = product.images?.length
    ? product.images.map((img) => `/api${img.medium_path || img.image_path}`)
    : [];
  const primaryImage = imageUrls[0] ?? null;
  const inStock = product.stock > 0;
  const hasMultipleImages = imageUrls.length > 1;

  const [imgIdx, setImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-cycle images every 3s, pause on hover
  useEffect(() => {
    if (!hasMultipleImages || isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setImgIdx((prev) => (prev + 1) % imageUrls.length);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasMultipleImages, isHovered, imageUrls.length]);

  const currentImage = imageUrls[imgIdx] ?? primaryImage;

  return (
    <motion.article
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-[#DC2626]/40 hover:shadow-[0_0_20px_rgba(220,38,38,0.08)]',
        className
      )}
    >
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-muted"
        tabIndex={-1}
        aria-hidden="true"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {currentImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={product.title}
              className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
              loading="lazy"
            />
            {/* Image dots indicator */}
            {hasMultipleImages && (
              <div className="absolute bottom-2 left-1/2 z-[2] flex -translate-x-1/2 gap-1">
                {imageUrls.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-colors',
                      i === imgIdx ? 'bg-white' : 'bg-white/40'
                    )}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
            <Package className="size-12" aria-hidden="true" />
          </div>
        )}

        {/* Category badge */}
        <Badge className="absolute left-2 top-2 border-0 bg-[#DC2626] text-[10px] font-bold uppercase tracking-wider text-white">
          {product.category}
        </Badge>

        {/* Out-of-stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <span className="rounded-full bg-card/90 px-3 py-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {t('outOfStock')}
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Year range + engine code */}
        {(product.year_start || product.engine_code) && (
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/50">
            {product.year_start && product.year_end
              ? `${product.year_start}–${product.year_end}`
              : product.year_start
              ? String(product.year_start)
              : ''}
            {product.engine_code && ` · ${product.engine_code}`}
          </p>
        )}

        {/* Title */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-[#DC2626]">
            {product.title}
          </h3>
        </Link>

        {/* Make / model */}
        <p className="text-xs text-muted-foreground/60">
          {product.make}
          {product.model && ` · ${product.model}`}
        </p>

        {/* Price + stock */}
        <div className="mt-auto flex items-end justify-between pt-1">
          <div className="flex flex-col">
            {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
              <span className="text-xs font-medium text-muted-foreground line-through">
                {formatCents(product.compare_at_price_cents)}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-xl font-black text-[#DC2626]">
                {formatCents(product.price_cents)}
              </span>
              {product.compare_at_price_cents && product.compare_at_price_cents > product.price_cents && (
                <span className="rounded bg-[#DC2626]/10 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                  -{Math.round(((product.compare_at_price_cents - product.price_cents) / product.compare_at_price_cents) * 100)}%
                </span>
              )}
            </div>
          </div>
          <span
            className={cn(
              'flex items-center gap-1 text-[11px] font-semibold',
              inStock ? 'text-green-400' : 'text-foreground'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                inStock ? 'bg-green-400' : 'bg-red-400'
              )}
              aria-hidden="true"
            />
            {inStock ? t('inStock') : t('outOfStock')}
          </span>
        </div>

        {/* Add to cart / qty stepper / remove */}
        {cartQty > 0 ? (
          <div className="mt-1 flex items-center gap-2">
            {allowStepper ? (
              <div className="flex flex-1 items-center justify-between rounded-md border border-border bg-input">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => updateQuantity(product.id, cartQty - 1)}
                  className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
                  className="flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            ) : (
              <span className="flex-1 rounded-md border border-border bg-muted px-3 py-2 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                In cart
              </span>
            )}
            <button
              type="button"
              aria-label="Remove from cart"
              onClick={() => removeItem(product.id)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-input text-muted-foreground transition-colors hover:border-[#DC2626]/40 hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
            >
              <Trash2 className="size-4" />
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
              primary_image_path: primaryImage ?? undefined,
              max_per_order: product.max_per_order,
            }}
            disabled={!inStock}
            className="mt-1"
          />
        )}
      </div>
    </motion.article>
  );
}
