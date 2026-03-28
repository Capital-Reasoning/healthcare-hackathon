import * as React from 'react';
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  /** Items to compare — each has a name and a map of column → value */
  items: { name: string; values: Record<string, React.ReactNode> }[];
  /** Column keys to display */
  columns: string[];
  /** Highlight cells that differ across items */
  highlightDifferences?: boolean;
  className?: string;
}

function ComparisonTable({
  items,
  columns,
  highlightDifferences = false,
  className,
}: ComparisonTableProps) {
  // Pre-compute which columns have differing values
  const diffColumns = React.useMemo(() => {
    if (!highlightDifferences) return new Set<string>();
    const diffs = new Set<string>();
    for (const col of columns) {
      const values = items.map((item) => String(item.values[col] ?? ''));
      if (new Set(values).size > 1) diffs.add(col);
    }
    return diffs;
  }, [items, columns, highlightDifferences]);

  return (
    <div data-slot="comparison-table" className={cn('overflow-x-auto', className)}>
      <table className="w-full text-body-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="px-4 py-3 text-left text-caption font-medium text-muted-foreground">
              Feature
            </th>
            {items.map((item) => (
              <th
                key={item.name}
                className="px-4 py-3 text-left text-h3 font-medium text-foreground"
              >
                {item.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {columns.map((col) => (
            <tr key={col} className="border-b border-border">
              <td className="px-4 py-3 text-muted-foreground font-medium">
                {col}
              </td>
              {items.map((item) => (
                <td
                  key={item.name}
                  className={cn(
                    'px-4 py-3 text-foreground',
                    diffColumns.has(col) && 'bg-warning-tint/50',
                  )}
                >
                  {item.values[col] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { ComparisonTable, type ComparisonTableProps };
