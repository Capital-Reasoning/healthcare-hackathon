"use client";

import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

/**
 * Props for the DatePicker component.
 */
export interface DatePickerProps {
  /** Selected date */
  value?: Date;
  /** Callback when date changes */
  onChange: (date: Date | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  className?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

/**
 * Date selection component with a calendar popover.
 * Renders a button trigger styled like an input that opens a month/day grid.
 * Supports year and month navigation.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  minDate,
  maxDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(() =>
    value ? startOfMonth(value) : startOfMonth(new Date()),
  );

  // Sync view month when value changes externally
  React.useEffect(() => {
    if (value) setViewMonth(startOfMonth(value));
  }, [value]);

  const { days, startDayOfWeek } = React.useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    return {
      days: eachDayOfInterval({ start: monthStart, end: monthEnd }),
      startDayOfWeek: getDay(monthStart),
    };
  }, [viewMonth]);

  const handleSelect = (day: Date) => {
    onChange(day);
    setOpen(false);
  };

  const isDisabled = React.useCallback(
    (day: Date) => {
      const d = startOfDay(day);
      if (minDate && isBefore(d, startOfDay(minDate))) return true;
      if (maxDate && isAfter(d, startOfDay(maxDate))) return true;
      return false;
    },
    [minDate, maxDate],
  );

  return (
    <span className="inline-block h-9 align-middle" data-slot="date-picker-wrapper">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            data-slot="date-picker"
            aria-label={value ? format(value, "MMM d, yyyy") : placeholder}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-white px-2.5 text-sm outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "disabled:pointer-events-none disabled:opacity-50",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <Calendar
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="whitespace-nowrap">
          {value ? format(value, "MMM d, yyyy") : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        {/* Year + Month navigation */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setViewMonth((m) => subYears(m, 1))}
              aria-label="Previous year"
            >
              <ChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
          <span className="text-sm font-medium select-none">
            {format(viewMonth, "MMMM yyyy")}
          </span>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setViewMonth((m) => addYears(m, 1))}
              aria-label="Next year"
            >
              <ChevronsRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-0">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="flex h-8 w-8 items-center justify-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {/* Leading empty cells */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8 w-8" />
          ))}

          {/* Day cells */}
          {(() => {
            const now = new Date();
            return days.map((day) => {
            const selected = value ? isSameDay(day, value) : false;
            const today = isSameDay(day, now);
            const disabled = isDisabled(day);
            const inMonth = isSameMonth(day, viewMonth);

            return (
              <button
                key={day.toISOString()}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(day)}
                aria-label={format(day, "MMMM d, yyyy")}
                aria-pressed={selected}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                  "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !inMonth && "text-muted-foreground/50",
                  today && !selected && "font-semibold text-foreground",
                  selected &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  disabled && "pointer-events-none opacity-50",
                )}
              >
                {format(day, "d")}
              </button>
            );
          });
          })()}
        </div>
      </PopoverContent>
    </Popover>
    </span>
  );
}
