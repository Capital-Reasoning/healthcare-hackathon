'use client';

import * as React from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { LayoutCard, CardContent } from '@/components/layout/card';

/* ─── Types ──────────────────────────────────────────── */

interface KanbanItem {
  id: string;
  title: string;
  description?: string;
  [key: string]: unknown;
}

interface KanbanColumn {
  id: string;
  title: string;
  items: KanbanItem[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  /** Called when an item is moved between or within columns */
  onDragEnd?: (result: {
    itemId: string;
    fromColumn: string;
    toColumn: string;
    fromIndex: number;
    toIndex: number;
  }) => void;
  /** Custom card renderer */
  renderCard?: (item: KanbanItem) => React.ReactNode;
  className?: string;
}

/* ─── Helpers ────────────────────────────────────────── */

function reorderColumns(
  columns: KanbanColumn[],
  source: { droppableId: string; index: number },
  destination: { droppableId: string; index: number },
): KanbanColumn[] {
  const cols = columns.map((c) => ({ ...c, items: [...c.items] }));
  const fromCol = cols.find((c) => c.id === source.droppableId);
  const toCol = cols.find((c) => c.id === destination.droppableId);
  if (!fromCol || !toCol) return columns;
  const [moved] = fromCol.items.splice(source.index, 1);
  if (moved) toCol.items.splice(destination.index, 0, moved);
  return cols;
}

/* ─── Component ──────────────────────────────────────── */

function KanbanBoard({
  columns,
  onDragEnd,
  renderCard,
  className,
}: KanbanBoardProps) {
  // Internal state for optimistic / uncontrolled usage
  const [internalColumns, setInternalColumns] = React.useState(columns);

  // Sync when parent columns change (controlled mode)
  React.useEffect(() => {
    setInternalColumns(columns);
  }, [columns]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    // Optimistic update — immediately reflect the move in DOM
    setInternalColumns((prev) =>
      reorderColumns(prev, result.source, result.destination!),
    );

    // Notify parent
    onDragEnd?.({
      itemId: result.draggableId,
      fromColumn: result.source.droppableId,
      toColumn: result.destination.droppableId,
      fromIndex: result.source.index,
      toIndex: result.destination.index,
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        data-slot="kanban-board"
        className={cn('flex gap-4 overflow-x-auto pb-2', className)}
      >
        {internalColumns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col min-w-[280px] w-[280px] shrink-0"
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-2 py-2 mb-2">
              <h3 className="text-body-sm font-medium text-foreground">
                {column.title}
              </h3>
              <span className="text-caption text-muted-foreground">
                {column.items.length}
              </span>
            </div>

            {/* Droppable area */}
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'flex flex-col gap-2 flex-1 rounded-lg p-2 min-h-[120px]',
                    snapshot.isDraggingOver
                      ? 'bg-primary-tint border-2 border-dashed border-primary/30'
                      : 'bg-gray-50 border-2 border-transparent',
                  )}
                >
                  {column.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={cn(
                            dragSnapshot.isDragging && 'shadow-lg rotate-1',
                          )}
                        >
                          {renderCard ? (
                            renderCard(item)
                          ) : (
                            <DefaultCard item={item} />
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

/* ─── Default card ───────────────────────────────────── */

function DefaultCard({ item }: { item: KanbanItem }) {
  return (
    <LayoutCard>
      <CardContent className="p-3">
        <p className="text-body-sm font-medium text-foreground">{item.title}</p>
        {item.description && (
          <p className="text-caption text-muted-foreground mt-1">
            {item.description}
          </p>
        )}
      </CardContent>
    </LayoutCard>
  );
}

export { KanbanBoard, type KanbanBoardProps, type KanbanItem, type KanbanColumn };
