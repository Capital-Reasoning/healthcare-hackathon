import * as React from 'react';
import { cn } from '@/lib/utils';
import { Breadcrumbs } from '@/components/navigation/breadcrumbs';

/** Props for the Page layout wrapper. */
interface PageProps {
  /** Page title displayed as H1 */
  title: string;
  /** Description text below the title */
  description?: string;
  /** Breadcrumb items for navigation context */
  breadcrumbs?: { label: string; href?: string }[];
  /** Action buttons rendered top-right */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Top-level page wrapper that renders a consistent header (breadcrumbs, title,
 * description, actions) followed by a content area with vertical spacing.
 *
 * This is a server component — no "use client" directive.
 */
export function Page({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className,
}: PageProps) {
  return (
    <div data-slot="page" className={cn('flex flex-col gap-8', className)}>
      {/* Header */}
      <header data-slot="page-header" className="flex flex-col gap-1">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} />
        )}

        {/* Title row with actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 text-foreground">{title}</h1>
            {description && (
              <p className="text-body text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div
              data-slot="page-actions"
              className="flex shrink-0 items-center gap-2"
            >
              {actions}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div data-slot="page-content" className="flex flex-col gap-8">
        {children}
      </div>
    </div>
  );
}
