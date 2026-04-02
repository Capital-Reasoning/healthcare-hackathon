'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Compass,
  LayoutDashboard,
  Users,
} from 'lucide-react';
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
 * Displays the app logo and primary navigation links.
 */
export function Navbar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <header
      data-slot="navbar"
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex h-14 items-center bg-white border-b border-border px-4',
        className
      )}
    >
      {/* Left: Logo */}
      <Link href="/" className="flex items-center">
        <Image
          src="/logo-new.png"
          alt="BestPath"
          width={400}
          height={300}
          className="h-10 w-auto"
          priority
        />
      </Link>

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
                  ? 'bg-gray-100 text-foreground'
                  : 'text-muted-foreground hover:bg-gray-50 hover:text-foreground'
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
