import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Props for the FormField wrapper component.
 */
export interface FormFieldProps {
  /** Field label */
  label?: string;
  /** Error message */
  error?: string;
  /** Hint/helper text */
  hint?: string;
  /** HTML for attribute (connects label to input) */
  htmlFor?: string;
  /** Whether the field is required */
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrapper for form inputs that provides consistent label, error, and hint rendering.
 * Server-renderable — no "use client" directive.
 *
 * - Label above the input (with optional red asterisk for required)
 * - Error message below in red (takes precedence over hint)
 * - Hint text below in muted color
 * - Uses `group` class for disabled state propagation
 */
export function FormField({
  label,
  error,
  hint,
  htmlFor,
  required,
  children,
  className,
}: FormFieldProps) {
  const errorId = htmlFor ? `${htmlFor}-error` : undefined;
  const hintId = htmlFor ? `${htmlFor}-hint` : undefined;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div
      data-slot="form-field"
      className={cn("group flex flex-col gap-1.5", className)}
      {...(describedBy ? { "aria-describedby": describedBy } : {})}
    >
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="text-destructive ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </Label>
      )}

      {children}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-destructive text-body-sm"
        >
          {error}
        </p>
      ) : hint ? (
        <p
          id={hintId}
          className="text-hint text-[11px] italic leading-tight"
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
