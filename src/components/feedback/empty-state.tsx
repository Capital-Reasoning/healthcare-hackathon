import * as React from 'react';
import { cn } from '@/lib/utils';

/** Props for the EmptyState placeholder component. */
interface EmptyStateProps {
  /** Icon component (pass a Lucide icon element like `<Inbox />`) */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Call-to-action element (typically a Button) */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Centered placeholder displayed when a content area has no data.
 *
 * For icons, pass a Lucide icon element — the component handles sizing
 * and color. Use `strokeWidth={1.5}` on the icon for best results at
 * larger sizes to avoid corner artifacts.
 */
function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex flex-col items-center text-center py-12',
        className,
      )}
    >
      {icon && (
        <div
          className="mb-4 text-muted-foreground/25 [&>svg]:size-14 [&>svg]:stroke-[1.75]"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3 className="text-h3 text-foreground">{title}</h3>

      {description && (
        <p className="text-body-sm text-muted-foreground max-w-sm mt-1">
          {description}
        </p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export { EmptyState, type EmptyStateProps };
