'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { cn } from '@/lib/utils';

interface AddToCartProduct {
  id: string;
  title: string;
  slug: string;
  sku: string;
  price_cents: number;
  primary_image_path?: string;
  max_per_order?: number;
}

interface AddToCartButtonProps {
  product: AddToCartProduct;
  disabled?: boolean;
  className?: string;
}

export default function AddToCartButton({
  product,
  disabled = false,
  className,
}: AddToCartButtonProps) {
  const t = useTranslations('common');
  const tProduct = useTranslations('product');
  const { addItem, isInCart } = useCart();
  const [added, setAdded] = useState(false);

  const inCart = isInCart(product.id);

  const handleClick = useCallback(() => {
    if (disabled || added) return;

    addItem({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      price_cents: product.price_cents,
      image: product.primary_image_path ?? '',
      maxPerOrder: product.max_per_order,
    });

    setAdded(true);
    const timer = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [disabled, added, addItem, product]);

  const label = disabled
    ? t('outOfStock')
    : added || inCart
      ? tProduct('addedToCart')
      : t('addToCart');

  return (
    <motion.div
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={cn('w-full', className)}
    >
      <Button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'w-full gap-2 font-semibold transition-colors',
          disabled
            ? 'cursor-not-allowed bg-muted text-muted-foreground'
            : added || inCart
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-[#DC2626] text-white hover:bg-[#ef4444]'
        )}
        size="lg"
      >
        {added || inCart ? (
          <Check className="size-4" />
        ) : (
          <ShoppingCart className="size-4" />
        )}
        {label}
      </Button>
    </motion.div>
  );
}
