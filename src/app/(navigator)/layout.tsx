import Link from 'next/link';
import { ArrowLeft, HeartPulse } from 'lucide-react';

export default function NavigatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <HeartPulse className="size-5 text-primary" />
          <span className="text-body font-semibold text-foreground">
            BestPath Care Navigator
          </span>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-body-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Dashboard
        </Link>
      </header>
      {/* Content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
