import { cva } from 'class-variance-authority';

/**
 * Surface variants — card-level containers.
 * Usage: <div className={cn(surfaceVariants({ surface: "glass" }), "p-4 rounded-lg")} />
 */
export const surfaceVariants = cva('', {
  variants: {
    surface: {
      default: 'bg-card border border-border shadow-sm',
      muted: 'bg-bg-muted border border-border',
      glass: 'glass rounded-lg',
      inset: 'bg-bg-inset border border-border-strong',
    },
  },
  defaultVariants: {
    surface: 'default',
  },
});

/**
 * Size variants — reusable sizing pattern for custom components.
 */
export const sizeVariants = cva('', {
  variants: {
    size: {
      sm: 'text-sm px-3 py-1.5',
      default: 'text-base px-4 py-2',
      lg: 'text-lg px-5 py-3',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

/**
 * Semantic colour variants — for status indicators, tags, inline badges.
 */
export const colorVariants = cva('', {
  variants: {
    color: {
      default: 'bg-card text-text-primary border border-border',
      primary: 'bg-primary text-white',
      secondary: 'bg-bg-muted text-text-primary',
      success: 'bg-success-tint text-success border border-success/20',
      warning: 'bg-warning-tint text-warning border border-warning/20',
      error: 'bg-error-tint text-error border border-error/20',
      ghost: 'bg-transparent text-text-secondary hover:bg-bg-muted',
    },
  },
  defaultVariants: {
    color: 'default',
  },
});

export type SurfaceVariant = 'default' | 'muted' | 'glass' | 'inset';
export type SizeVariant = 'sm' | 'default' | 'lg';
export type ColorVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'ghost';
