'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Compass,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { cn } from '@/lib/utils';

/** Navigation item definition */
interface NavItem {
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Lucide icon component */
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Patients', href: '/patients', icon: Users },
  { label: 'Care Navigator', href: '/navigator', icon: Compass },
];

/**
 * Main navigation bar fixed to the top of the viewport.
 * Displays the app logo, primary navigation links, notifications, and user avatar.
 */
export function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <header
      data-slot="navbar"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex h-14 items-center bg-navy-800 px-4',
        className
      )}
    >
      {/* Left: Logo + App Name */}
      <div className="flex items-center gap-2">
        <Activity className="size-5 text-teal-500" aria-hidden="true" />
        <span className="font-heading text-body-sm font-semibold text-white">
          {APP_CONFIG.name}
        </span>
      </div>

      {/* Center: Navigation Links */}
      <nav
        aria-label="Main navigation"
        className="mx-auto flex items-center gap-1"
      >
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-body-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white/80'
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right: spacer to keep nav centered */}
      <div className="flex items-center" />
    </header>
  );
}
