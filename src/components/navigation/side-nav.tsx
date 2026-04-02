'use client';

import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** A single item in the side navigation */
export interface SideNavItem {
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Lucide icon component */
  icon: React.ComponentType<{ className?: string }>;
  /** Whether this item is the active route */
  active?: boolean;
  /** Optional badge count (e.g. unread items) */
  badge?: number;
}

/** Props for the collapsible side navigation */
export interface SideNavProps {
  /** Navigation items to render */
  items: SideNavItem[];
  /** Whether the sidebar is collapsed to icon-only mode */
  collapsed?: boolean;
  /** Callback when the collapse toggle is clicked */
  onToggleCollapse?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Collapsible sidebar navigation.
 * Supports expanded (icon + label) and collapsed (icon-only) modes
 * with a smooth width transition.
 */
export function SideNav({
  items,
  collapsed = false,
  onToggleCollapse,
  className,
}: SideNavProps) {
  return (
    <aside
      data-slot="side-nav"
      data-collapsed={collapsed || undefined}
      className={cn(
        'flex flex-col border-r border-border bg-white transition-all duration-200',
        collapsed ? 'w-14' : 'w-60',
        className
      )}
    >
      {/* Navigation Items */}
      <nav aria-label="Side navigation" className="flex-1 space-y-1 p-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium transition-colors',
                item.active
                  ? 'border-l-2 border-teal-500 bg-teal-50 text-teal-500'
                  : 'text-muted-foreground hover:bg-gray-50 hover:text-foreground',
                collapsed && 'justify-center px-0'
              )}
            >
              <Icon
                className={cn(
                  'size-5 shrink-0',
                  item.active ? 'text-teal-500' : 'text-muted-foreground group-hover:text-foreground'
                )}
                aria-hidden="true"
              />

              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}

              {!collapsed && item.badge != null && item.badge > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-auto h-5 min-w-5 justify-center px-1.5 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-body-sm font-medium text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground',
              collapsed && 'justify-center px-0'
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5 shrink-0" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="size-5 shrink-0" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
