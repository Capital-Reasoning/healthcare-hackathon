'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselProps {
  items: React.ReactNode[];
  /** Auto-advance interval in ms */
  autoPlay?: boolean;
  /** Auto-advance interval (default: 5000ms) */
  interval?: number;
  /** Show navigation dots */
  showDots?: boolean;
  /** Show arrow buttons */
  showArrows?: boolean;
  className?: string;
}

function Carousel({
  items,
  autoPlay = false,
  interval = 5000,
  showDots = true,
  showArrows = true,
  className,
}: CarouselProps) {
  const [current, setCurrent] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const count = items.length;

  const next = React.useCallback(() => setCurrent((i) => (i + 1) % count), [count]);
  const prev = React.useCallback(() => setCurrent((i) => (i - 1 + count) % count), [count]);

  // Auto-play
  React.useEffect(() => {
    if (!autoPlay || isPaused || count <= 1) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [autoPlay, isPaused, interval, next, count]);

  // Touch handling
  const touchStartX = React.useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    if (Math.abs(delta) > 50) {
      delta > 0 ? prev() : next();
    }
  };

  if (count === 0) return null;

  return (
    <div
      data-slot="carousel"
      className={cn('relative w-full overflow-hidden', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {items.map((item, i) => (
          <div key={i} className="w-full shrink-0">
            {item}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-card shadow-md border border-border-strong flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-card shadow-md border border-border-strong flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}

      {/* Dots */}
      {showDots && count > 1 && (
        <div className="flex justify-center gap-2 mt-3">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                'size-2.5 rounded-full transition-all cursor-pointer',
                i === current
                  ? 'bg-primary scale-110'
                  : 'bg-border-strong hover:bg-muted-foreground/40',
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { Carousel, type CarouselProps };
