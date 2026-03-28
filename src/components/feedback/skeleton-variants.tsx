import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

/** Props for the SkeletonVariant component. */
interface SkeletonVariantProps {
  /** Type of content to skeleton */
  variant?: 'text' | 'card' | 'avatar' | 'chart' | 'table-row';
  className?: string;
}

/** Three lines of varying width mimicking a text paragraph. */
function TextSkeleton({ className }: { className?: string }) {
  return (
    <div data-slot="skeleton-text" className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  );
}

/** Full card skeleton with header area, content lines, and bottom bar. */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn(
        'rounded-lg border border-border p-4 space-y-4',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/** Circular avatar skeleton. */
function AvatarSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      data-slot="skeleton-avatar"
      className={cn('size-10 rounded-full', className)}
    />
  );
}

/** Rectangular area with simulated bar chart heights. */
function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="skeleton-chart"
      className={cn('flex items-end gap-2 h-32', className)}
    >
      <Skeleton className="h-2/5 w-8 rounded-t-sm" />
      <Skeleton className="h-3/5 w-8 rounded-t-sm" />
      <Skeleton className="h-4/5 w-8 rounded-t-sm" />
      <Skeleton className="h-1/2 w-8 rounded-t-sm" />
      <Skeleton className="h-full w-8 rounded-t-sm" />
      <Skeleton className="h-3/5 w-8 rounded-t-sm" />
      <Skeleton className="h-2/5 w-8 rounded-t-sm" />
    </div>
  );
}

/** Horizontal row with cells of varying widths mimicking a table row. */
function TableRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="skeleton-table-row"
      className={cn('flex items-center gap-4 py-3', className)}
    >
      <Skeleton className="h-4 w-10" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16 ml-auto" />
    </div>
  );
}

/**
 * Composed skeleton shapes for different content types. Uses the base shadcn
 * Skeleton component internally to produce pre-configured placeholder layouts.
 *
 * Variants: `text`, `card`, `avatar`, `chart`, `table-row`.
 */
function SkeletonVariant({ variant = 'text', className }: SkeletonVariantProps) {
  switch (variant) {
    case 'text':
      return <TextSkeleton className={className} />;
    case 'card':
      return <CardSkeleton className={className} />;
    case 'avatar':
      return <AvatarSkeleton className={className} />;
    case 'chart':
      return <ChartSkeleton className={className} />;
    case 'table-row':
      return <TableRowSkeleton className={className} />;
  }
}

export { SkeletonVariant, type SkeletonVariantProps };
