import * as React from 'react';
import { cn } from '@/lib/utils';

/** Props for the Section layout component. */
interface SectionProps {
  /** Optional section heading rendered as H2 */
  title?: string;
  /** Optional description rendered below the title */
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Groups related content within a page. Renders an optional title/description
 * pair with a left teal accent bar for visual distinction, followed by the
 * section body.
 *
 * This is a server component.
 */
export function Section({
  title,
  description,
  children,
  className,
}: SectionProps) {
  return (
    <section
      data-slot="section"
      className={cn('flex flex-col gap-5', className)}
    >
      {(title || description) && (
        <div data-slot="section-header" className="flex flex-col gap-1">
          {title && <h2 className="text-h2 text-foreground">{title}</h2>}
          {description && (
            <p className="text-body-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
