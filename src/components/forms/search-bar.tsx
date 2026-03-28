"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Props for the SearchBar component.
 */
export interface SearchBarProps {
  /** Placeholder text */
  placeholder?: string;
  /** Current search value */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** Callback when cleared */
  onClear?: () => void;
  /** Debounce delay in ms (0 = no debounce) */
  debounce?: number;
  className?: string;
}

/**
 * Search input with icon and clear button.
 * Supports debounced onChange for performance with large lists.
 */
export function SearchBar({
  placeholder = "Search\u2026",
  value,
  onChange,
  onClear,
  debounce = 0,
  className,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = React.useState(value);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal state when external value changes
  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setInternalValue(next);

    if (debounce > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(next);
      }, debounce);
    } else {
      onChange(next);
    }
  };

  const handleClear = () => {
    setInternalValue("");
    onChange("");
    onClear?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && internalValue) {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div data-slot="search-bar" className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "h-9 w-full rounded-lg border border-input bg-white pl-8 pr-8 text-sm transition-colors outline-none",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          /* Hide native search clear button */
          "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
        )}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
