'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
  type ExpandedState,
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { SkeletonVariant } from '@/components/feedback/skeleton-variants';
import { EmptyState } from '@/components/feedback/empty-state';

/* ─── Types ──────────────────────────────────────────── */

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  /** Show loading skeleton rows */
  isLoading?: boolean;
  /** Empty state configuration */
  emptyState?: { title: string; description?: string; icon?: React.ReactNode };
  /** Enable pagination. Pass `true` for defaults or configure options. */
  pagination?:
    | boolean
    | { pageSize?: number; pageSizeOptions?: number[] };
  /** Enable column sorting */
  sortable?: boolean;
  /** Enable row selection with checkboxes */
  selectable?: boolean;
  /** Called when selection changes */
  onSelectionChange?: (selected: T[]) => void;
  /** Called when a row is clicked */
  onRowClick?: (row: T) => void;
  /** Enable expandable rows */
  expandable?: boolean;
  /** Render function for expanded row content */
  renderExpanded?: (row: T) => React.ReactNode;
  /** Global filter string */
  globalFilter?: string;
  /** Visual variant */
  variant?: 'default' | 'dense' | 'striped';
  className?: string;
}

/* ─── Constants ──────────────────────────────────────── */

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/* ─── Component ──────────────────────────────────────── */

function DataTable<T>({
  data,
  columns: userColumns,
  isLoading,
  emptyState: emptyStateConfig,
  pagination,
  sortable = true,
  selectable,
  onSelectionChange,
  onRowClick,
  expandable,
  renderExpanded,
  globalFilter,
  variant = 'default',
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const paginationEnabled = !!pagination;
  const pageSize =
    typeof pagination === 'object' ? pagination.pageSize ?? DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE;
  const pageSizeOptions =
    typeof pagination === 'object'
      ? pagination.pageSizeOptions ?? DEFAULT_PAGE_SIZE_OPTIONS
      : DEFAULT_PAGE_SIZE_OPTIONS;

  // Prepend selection column
  const columns = React.useMemo(() => {
    const cols: ColumnDef<T, unknown>[] = [];

    if (selectable) {
      cols.push({
        id: '_select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(!!checked)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(!!checked)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        size: 40,
      });
    }

    if (expandable) {
      cols.push({
        id: '_expand',
        header: () => null,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            className="p-0.5 rounded hover:bg-gray-50 transition-colors"
            aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
          >
            {row.getIsExpanded() ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </button>
        ),
        enableSorting: false,
        size: 40,
      });
    }

    cols.push(...userColumns);
    return cols;
  }, [userColumns, selectable, expandable]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      expanded,
      globalFilter,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    ...(sortable && { getSortedRowModel: getSortedRowModel() }),
    ...(globalFilter !== undefined && { getFilteredRowModel: getFilteredRowModel() }),
    ...(paginationEnabled && { getPaginationRowModel: getPaginationRowModel() }),
    initialState: {
      pagination: { pageSize },
    },
    enableRowSelection: !!selectable,
  });

  // Notify parent of selection changes
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  onSelectionChangeRef.current = onSelectionChange;
  React.useEffect(() => {
    onSelectionChangeRef.current?.(
      table.getSelectedRowModel().rows.map((r) => r.original),
    );
  }, [rowSelection, table]);

  const isDense = variant === 'dense';
  const cellPadding = isDense ? 'px-3 py-1.5' : 'px-4 py-3';
  const headerPadding = isDense ? 'px-3 py-2' : 'px-4 py-3';

  const totalColumns = columns.length;

  return (
    <div data-slot="data-table" data-variant={variant} className={cn('w-full', className)}>
      {/* Selection count */}
      {selectable && Object.keys(rowSelection).length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 text-body-sm text-muted-foreground bg-primary-tint rounded-t-lg border border-b-0 border-border">
          {Object.keys(rowSelection).length} row(s) selected
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <table className="w-full text-body-sm">
          {/* Header */}
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort() && sortable;
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        headerPadding,
                        'text-left text-caption font-medium text-muted-foreground',
                        canSort && 'cursor-pointer select-none hover:text-foreground transition-colors',
                      )}
                      style={header.column.getSize() !== 150 ? { width: header.column.getSize() } : undefined}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1.5">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <SortIcon sorted={header.column.getIsSorted()} />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skeleton-${i}`}>
                  <td colSpan={totalColumns} className={cellPadding}>
                    <SkeletonVariant variant="table-row" />
                  </td>
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={totalColumns}>
                  <EmptyState
                    icon={emptyStateConfig?.icon}
                    title={emptyStateConfig?.title ?? 'No data'}
                    description={emptyStateConfig?.description ?? 'No results found.'}
                  />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <tr
                    className={cn(
                      'border-b border-border transition-colors',
                      'hover:bg-gray-50',
                      row.getIsSelected() && 'bg-primary-tint',
                      variant === 'striped' && 'even:bg-gray-50',
                      onRowClick && 'cursor-pointer',
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={cellPadding}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {/* Expanded row content */}
                  {expandable && row.getIsExpanded() && renderExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={totalColumns} className="px-4 py-3">
                        {renderExpanded(row.original)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginationEnabled && !isLoading && data.length > 0 && (
        <div className="flex items-center justify-between px-2 py-3">
          <div className="text-body-sm text-muted-foreground">
            Showing{' '}
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            –
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              data.length,
            )}{' '}
            of {data.length}
          </div>

          <div className="flex items-center gap-4">
            {/* Page size selector */}
            <div className="flex items-center gap-2 text-body-sm">
              <span className="text-muted-foreground">Rows:</span>
              <select
                className="h-8 rounded-md border border-border bg-white px-2 text-body-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <PaginationButton
                onClick={() => table.firstPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="First page"
              >
                <ChevronsLeft className="size-4" />
              </PaginationButton>
              <PaginationButton
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Previous page"
              >
                <ChevronLeft className="size-4" />
              </PaginationButton>
              <span className="px-2 text-body-sm text-muted-foreground">
                {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
              <PaginationButton
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Next page"
              >
                <ChevronRight className="size-4" />
              </PaginationButton>
              <PaginationButton
                onClick={() => table.lastPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Last page"
              >
                <ChevronsRight className="size-4" />
              </PaginationButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────── */

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="size-3.5 text-primary" />;
  if (sorted === 'desc') return <ArrowDown className="size-3.5 text-primary" />;
  return <ArrowUpDown className="size-3.5 opacity-40" />;
}

function PaginationButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center size-8 rounded-md border border-border bg-white text-muted-foreground transition-colors hover:bg-gray-50 hover:text-foreground disabled:opacity-40 disabled:pointer-events-none"
      {...props}
    >
      {children}
    </button>
  );
}

export { DataTable, type DataTableProps, type ColumnDef };
