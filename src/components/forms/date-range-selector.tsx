"use client";

import * as React from "react";
import { subDays, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format } from "date-fns";
import { cn } from "@/lib/utils";
import { DatePicker } from "./date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * A preset date range with a label and a function to compute start/end dates.
 */
export interface DateRangePreset {
  label: string;
  getValue: () => { start: Date; end: Date };
}

/**
 * Props for the DateRangeSelector component.
 */
export interface DateRangeSelectorProps {
  /** Start date */
  startDate?: Date;
  /** End date */
  endDate?: Date;
  /** Callback when range changes */
  onChange: (range: { start?: Date; end?: Date }) => void;
  /** Preset ranges */
  presets?: DateRangePreset[];
  className?: string;
}

/** Default preset ranges for convenience. */
const DEFAULT_PRESETS: DateRangePreset[] = [
  {
    label: "Last 7 days",
    getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }),
  },
  {
    label: "This quarter",
    getValue: () => ({
      start: startOfQuarter(new Date()),
      end: endOfQuarter(new Date()),
    }),
  },
  {
    label: "This year",
    getValue: () => ({
      start: startOfYear(new Date()),
      end: endOfYear(new Date()),
    }),
  },
];

/**
 * Date range selector with two date pickers and a presets dropdown.
 * Selecting a preset automatically fills both start and end dates.
 */
export function DateRangeSelector({
  startDate,
  endDate,
  onChange,
  presets = DEFAULT_PRESETS,
  className,
}: DateRangeSelectorProps) {
  const [selectedPreset, setSelectedPreset] = React.useState<string>("");

  const handlePresetChange = (presetLabel: string | null) => {
    if (presetLabel === null) return;
    setSelectedPreset(presetLabel);

    if (presetLabel === "custom") {
      // "Custom" selected — no auto-fill, user picks manually
      return;
    }

    const preset = presets.find((p) => p.label === presetLabel);
    if (preset) {
      const { start, end } = preset.getValue();
      onChange({ start, end });
    }
  };

  const handleStartChange = (date: Date | undefined) => {
    setSelectedPreset("custom");
    onChange({ start: date, end: endDate });
  };

  const handleEndChange = (date: Date | undefined) => {
    setSelectedPreset("custom");
    onChange({ start: startDate, end: date });
  };

  /** Format a display string for the current range. */
  const rangeLabel = React.useMemo(() => {
    if (startDate && endDate) {
      return `${format(startDate, "MMM d")} \u2013 ${format(endDate, "MMM d, yyyy")}`;
    }
    return null;
  }, [startDate, endDate]);

  return (
    <div
      data-slot="date-range-selector"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {/* Presets dropdown */}
      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger
          aria-label="Select date range preset"
          className="h-9 min-w-[140px]"
        >
          <SelectValue placeholder="Select range" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.label} value={preset.label}>
              {preset.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {/* Date pickers */}
      <div className="flex items-center gap-1.5">
        <DatePicker
          value={startDate}
          onChange={handleStartChange}
          placeholder="Start date"
          maxDate={endDate}
        />
        <span className="text-muted-foreground" aria-hidden="true">
          &mdash;
        </span>
        <DatePicker
          value={endDate}
          onChange={handleEndChange}
          placeholder="End date"
          minDate={startDate}
        />
      </div>

      {/* Optional: show the formatted range */}
      {rangeLabel && (
        <span className="text-body-sm text-muted-foreground hidden sm:inline">
          {rangeLabel}
        </span>
      )}
    </div>
  );
}
