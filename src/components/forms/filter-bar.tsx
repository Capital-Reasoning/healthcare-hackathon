"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";

/**
 * Configuration for a single filter dropdown.
 */
export interface FilterConfig {
  /** Unique key for this filter */
  key: string;
  /** Display label */
  label: string;
  /** Filter options */
  options: { label: string; value: string }[];
}

/**
 * Props for the FilterBar component.
 */
export interface FilterBarProps {
  /** Filter configurations */
  filters: FilterConfig[];
  /** Currently active filter values */
  activeFilters: Record<string, string | string[]>;
  /** Callback when a filter changes */
  onFilterChange: (key: string, value: string | string[]) => void;
  /** Callback to clear all filters */
  onClear: () => void;
  /** Additional action buttons (e.g., Export, + New Patient) */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Horizontal filter controls bar with custom animated dropdowns and action buttons.
 */
export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClear,
  actions,
  className,
}: FilterBarProps) {
  const activeCount = Object.values(activeFilters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== "" && v !== undefined;
  }).length;

  return (
    <div
      data-slot="filter-bar"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {/* Left side: filters label + dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
              {activeCount}
            </Badge>
          )}
        </span>

        {filters.map((filter) => (
          <FilterDropdown
            key={filter.key}
            filter={filter}
            value={activeFilters[filter.key]}
            onChange={(val) => onFilterChange(filter.key, val)}
          />
        ))}

        {activeCount > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={onClear}
            className="h-8 px-2 text-xs text-muted-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Right side: action buttons */}
      {actions && (
        <>
          <div
            className="mx-1 hidden h-6 w-px bg-border sm:block"
            aria-hidden="true"
          />
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </>
      )}
    </div>
  );
}

/**
 * Custom animated filter dropdown.
 */
function FilterDropdown({
  filter,
  value,
  onChange,
}: {
  filter: FilterConfig;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const currentValue = Array.isArray(value) ? value[0] ?? "" : value ?? "";
  const currentLabel =
    filter.options.find((o) => o.value === currentValue)?.label ?? "";

  // Close on click outside
  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleSelect = (optValue: string) => {
    onChange(optValue);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Filter by ${filter.label}`}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-sm transition-all outline-none",
          "hover:border-border-strong",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          open ? "border-ring ring-3 ring-ring/50" : "border-input",
          currentValue ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span>
          {currentLabel ? (
            <>
              <span className="text-muted-foreground">{filter.label}:</span>{" "}
              {currentLabel}
            </>
          ) : (
            filter.label
          )}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown menu */}
      <div
        role="listbox"
        aria-label={filter.label}
        className={cn(
          "absolute left-0 top-full z-50 mt-1 min-w-[160px] origin-top rounded-lg border border-border bg-white py-1 shadow-lg ring-1 ring-foreground/5",
          "transition-all duration-150",
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0",
        )}
      >
        {filter.options.map((opt) => {
          const isSelected = opt.value === currentValue;
          return (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleSelect(opt.value)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors",
                "hover:bg-muted",
                isSelected && "text-primary font-medium",
              )}
            >
              <span className="flex-1 text-left">{opt.label}</span>
              {isSelected && (
                <Check className="size-3.5 text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
