import { Skeleton } from '@/components/ui/skeleton';

type SkeletonVariant = 'productCard' | 'productDetail' | 'orderRow' | 'text' | 'image';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden border border-border bg-card">
      <Skeleton className="w-full aspect-square" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Skeleton className="w-full aspect-square rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        <div className="space-y-2 pt-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-full mt-6" />
      </div>
    </div>
  );
}

function OrderRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-border">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-32 flex-1" />
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

function TextSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );
}

function ImageSkeleton({ className }: { className?: string }) {
  return <Skeleton className={`w-full aspect-video rounded-lg ${className ?? ''}`} />;
}

function renderVariant(variant: SkeletonVariant, className?: string) {
  switch (variant) {
    case 'productCard':
      return <ProductCardSkeleton />;
    case 'productDetail':
      return <ProductDetailSkeleton />;
    case 'orderRow':
      return <OrderRowSkeleton />;
    case 'text':
      return <TextSkeleton />;
    case 'image':
      return <ImageSkeleton className={className} />;
  }
}

export default function LoadingSkeleton({
  variant = 'text',
  count = 1,
  className,
}: LoadingSkeletonProps) {
  if (count === 1) {
    return renderVariant(variant, className);
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderVariant(variant, className)}</div>
      ))}
    </>
  );
}
