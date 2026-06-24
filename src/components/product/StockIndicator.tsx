import { cn } from '@/lib/utils';

interface StockIndicatorProps {
  quantity: number;
  lowStockThreshold?: number;
  className?: string;
}

export default function StockIndicator({
  quantity,
  lowStockThreshold = 3,
  className,
}: StockIndicatorProps) {
  if (quantity === 0) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="relative flex size-2.5">
          <span className="inline-flex size-2.5 rounded-full bg-red-500" />
        </span>
        <span className="text-sm font-medium text-foreground">Out of Stock</span>
      </div>
    );
  }

  if (quantity <= lowStockThreshold) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-amber-400" />
        </span>
        <span className="text-sm font-medium text-foreground">
          Only {quantity} left
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex size-2.5">
        <span className="inline-flex size-2.5 rounded-full bg-green-500" />
      </span>
        <span className="text-sm font-medium text-foreground">In Stock</span>
    </div>
  );
}
