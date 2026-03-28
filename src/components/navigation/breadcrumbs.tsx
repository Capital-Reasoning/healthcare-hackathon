import Link from 'next/link';
import { cn } from '@/lib/utils';

/** Props for the Breadcrumbs component */
export interface BreadcrumbsProps {
  /** Breadcrumb trail items. The last item represents the current page. */
  items: { label: string; href?: string }[];
  /** Additional class names */
  className?: string;
}

/**
 * Accessible breadcrumb trail for hierarchical page navigation.
 * The last item is rendered as bold text (current page); earlier items are links.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      data-slot="breadcrumbs"
      aria-label="Breadcrumb"
      className={cn('text-body-sm', className)}
    >
      <ol className="flex items-center">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="flex items-center">
              {/* Separator */}
              {index > 0 && (
                <span
                  className="mx-2 text-muted-foreground"
                  aria-hidden="true"
                >
                  /
                </span>
              )}

              {isLast ? (
                <span
                  className="font-semibold text-foreground"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-muted-foreground">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
