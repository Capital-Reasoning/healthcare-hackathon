'use client';

import * as React from 'react';

interface FlexRowProps {
  children: React.ReactNode[];
  className?: string;
}

/**
 * Responsive row layout for OpenUI-generated content.
 * Uses CSS grid auto-fit so items flow into columns when there's space
 * and stack to a single column at narrow widths.
 */
function FlexRow({ children, className }: FlexRowProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
      }}
    >
      {children.map((child, i) => (
        <div key={i} className="min-w-0">
          {child}
        </div>
      ))}
    </div>
  );
}

export { FlexRow, type FlexRowProps };
