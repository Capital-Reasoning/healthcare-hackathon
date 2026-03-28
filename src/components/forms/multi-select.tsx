"use client";

import * as React from "react";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

/**
 * Props for the MultiSelect component.
 */
export interface MultiSelectProps {
  /** Available options */
  options: { label: string; value: string }[];
  /** Selected values */
  value: string[];
  /** Callback when selection changes */
  onChange: (value: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Maximum selections allowed */
  maxSelections?: number;
  className?: string;
}

/**
 * Multi-value select with searchable dropdown and removable chips.
 * Built on Popover + Command (cmdk) for keyboard-friendly interaction.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options...",
  maxSelections,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const listboxId = React.useId();

  const selectedSet = React.useMemo(() => new Set(value), [value]);

  // Prevent scroll jump when opening — save and restore scroll position
  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      const scrollY = window.scrollY;
      setOpen(true);
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "instant" });
      });
    } else {
      setOpen(false);
    }
  }, []);

  const toggleOption = (optionValue: string) => {
    if (selectedSet.has(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      if (maxSelections && value.length >= maxSelections) return;
      onChange([...value, optionValue]);
    }
  };

  const removeChip = (optionValue: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  const labelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const opt of options) {
      map.set(opt.value, opt.label);
    }
    return map;
  }, [options]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <button
            type="button"
            data-slot="multi-select"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-label={placeholder}
            className={cn(
              "flex min-h-9 w-full items-center justify-between gap-1 rounded-lg border border-input bg-white px-2 py-1 text-left text-sm transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "disabled:pointer-events-none disabled:opacity-50",
              className
            )}
          />
        }
      >
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {value.length === 0 && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          {value.map((v) => (
            <Badge
              key={v}
              variant="secondary"
              className="h-5 gap-0.5 px-1.5 text-xs"
            >
              {labelMap.get(v) ?? v}
              {/* Use a span with role instead of button to avoid nested-button hydration error */}
              <span
                role="button"
                tabIndex={0}
                aria-label={`Remove ${labelMap.get(v) ?? v}`}
                onClick={(e) => removeChip(v, e)}
                onMouseDown={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChange(value.filter((val) => val !== v));
                  }
                }}
                className="ml-0.5 cursor-pointer rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <X className="size-3" />
              </span>
            </Badge>
          ))}
        </div>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList id={listboxId}>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value);
                const isAtLimit =
                  maxSelections !== undefined &&
                  value.length >= maxSelections &&
                  !isSelected;

                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={isAtLimit}
                    onSelect={() => toggleOption(option.value)}
                    data-checked={isSelected ? "true" : undefined}
                  >
                    <div
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors",
                        isSelected && "border-primary bg-primary text-primary-foreground"
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
