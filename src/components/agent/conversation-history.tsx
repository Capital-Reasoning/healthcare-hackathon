'use client';

import { MessageSquare, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversationStore } from '@/stores/conversation-store';
import { useAgentStore } from '@/stores/agent-store';
import { cn } from '@/lib/utils';

interface ConversationHistoryProps {
  onLoadConversation: (id: string) => void;
}

export function ConversationHistory({
  onLoadConversation,
}: ConversationHistoryProps) {
  const {
    conversations,
    activeConversationId,
    deleteConversation,
    setActiveConversation,
    clearHistory,
  } = useConversationStore();
  const setView = useAgentStore((s) => s.setView);

  // Only show conversations that have at least one message
  const nonEmptyConversations = conversations.filter(
    (c) => c.messages.length > 0,
  );

  const handleSelect = (id: string) => {
    setActiveConversation(id);
    onLoadConversation(id);
    setView('chat');
  };

  if (nonEmptyConversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <Clock className="size-8 text-hint" />
        <p className="text-body-sm text-text-muted">No conversations yet</p>
        <p className="text-xs text-hint">
          Start a conversation and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {nonEmptyConversations.map((c) => {
            const lastMessage = c.messages[c.messages.length - 1];
            const preview = lastMessage?.content.slice(0, 80) ?? 'No messages';
            const date = new Date(c.updatedAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(c.id);
                  }
                }}
                className={cn(
                  'group flex w-full cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-bg-muted',
                  c.id === activeConversationId && 'bg-primary-tint/50',
                )}
              >
                <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-body-sm font-medium text-text-primary">
                      {c.title}
                    </span>
                    <span className="shrink-0 text-[10px] text-hint">
                      {date}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-text-muted">
                    {preview}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(c.id);
                  }}
                  className="mt-0.5 shrink-0 rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
                  aria-label={`Delete ${c.title}`}
                >
                  <Trash2 className="size-3 text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-border/50 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearHistory}
          className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-3" />
          Clear all conversations
        </Button>
      </div>
    </div>
  );
}
