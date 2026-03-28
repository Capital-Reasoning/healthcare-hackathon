import * as React from 'react';
import { cn } from '@/lib/utils';
import { SkeletonVariant } from '@/components/feedback/skeleton-variants';
import { EmptyState } from '@/components/feedback/empty-state';
import { Inbox } from 'lucide-react';

interface ListProps<T> {
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Custom empty state content */
  emptyState?: React.ReactNode;
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Show dividers between items */
  dividers?: boolean;
  className?: string;
}

function List<T>({
  items,
  renderItem,
  emptyState,
  isLoading,
  dividers = true,
  className,
}: ListProps<T>) {
  if (isLoading) {
    return (
      <div data-slot="list" className={cn('flex flex-col gap-3', className)}>
        <SkeletonVariant variant="text" />
        <SkeletonVariant variant="text" />
        <SkeletonVariant variant="text" />
      </div>
    );
  }

  if (items.length === 0) {
    if (emptyState) {
      return (
        <div data-slot="list" className={className}>
          {emptyState}
        </div>
      );
    }
    return (
      <div data-slot="list" className={className}>
        <EmptyState
          icon={<Inbox />}
          title="No items"
          description="There are no items to display."
        />
      </div>
    );
  }

  return (
    <div data-slot="list" className={cn('flex flex-col', className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            dividers && index < items.length - 1 && 'border-b border-border',
          )}
        >
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}

export { List, type ListProps };
