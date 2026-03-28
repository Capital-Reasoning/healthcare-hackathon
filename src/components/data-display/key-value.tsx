import * as React from 'react';
import { cn } from '@/lib/utils';

interface KeyValueItem {
  label: string;
  value: React.ReactNode;
}

interface KeyValueProps {
  items: KeyValueItem[];
  /** Layout mode */
  layout?: 'horizontal' | 'vertical' | 'grid';
  /** Number of grid columns (only used with grid layout) */
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const gridColClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
} as const;

function KeyValue({
  items,
  layout = 'vertical',
  columns = 2,
  className,
}: KeyValueProps) {
  if (layout === 'grid') {
    return (
      <dl
        data-slot="key-value"
        data-layout="grid"
        className={cn('grid gap-4', gridColClasses[columns], className)}
      >
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-body-sm text-muted-foreground">{item.label}</dt>
            <dd className="text-body-sm text-foreground font-medium mt-0.5">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl
      data-slot="key-value"
      data-layout={layout}
      className={cn('flex flex-col gap-3', className)}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            layout === 'horizontal'
              ? 'flex items-center justify-between'
              : 'flex flex-col',
          )}
        >
          <dt className="text-body-sm text-muted-foreground">{item.label}</dt>
          <dd
            className={cn(
              'text-body-sm text-foreground font-medium',
              layout === 'vertical' && 'mt-0.5',
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export { KeyValue, type KeyValueProps, type KeyValueItem };
