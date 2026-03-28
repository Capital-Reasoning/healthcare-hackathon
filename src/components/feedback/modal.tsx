'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

/** Props for the Modal dialog component. */
interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Modal title */
  title: string;
  /** Modal description */
  description?: string;
  /** Modal size */
  size?: 'sm' | 'default' | 'lg' | 'xl' | 'full';
  /** Footer content (action buttons) */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  default: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  full: 'sm:max-w-[calc(100vw-4rem)] sm:max-h-[calc(100vh-4rem)]',
};

/**
 * Enhanced dialog with size variants. Wraps the shadcn Dialog components and
 * adds support for `sm`, `default`, `lg`, `xl`, and `full` sizing presets.
 */
function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = 'default',
  footer,
  children,
  className,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="modal"
        className={cn(sizeClasses[size], className)}
      >
        <DialogHeader className="gap-1.5 pb-4">
          <DialogTitle style={{ fontSize: '1.5rem', lineHeight: '2rem', fontWeight: 600 }}>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div data-slot="modal-body">{children}</div>

        {footer && <DialogFooter className="bg-bg-muted">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

export { Modal, type ModalProps };
