import Link from 'next/link';
import { HeartPulse, LogOut } from 'lucide-react';

export default function NavigatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar — minimal */}
      <header className="flex h-12 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <HeartPulse className="size-5 text-primary" />
          <span className="text-body-sm font-semibold text-foreground">
            BestPath Care Navigator
          </span>
        </div>
        <div className="hidden lg:block" />
        <Link
          href="/"
          className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
          title="Exit to Dashboard"
          aria-label="Exit to Dashboard"
        >
          <LogOut className="size-5" />
        </Link>
      </header>
      {/* Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
