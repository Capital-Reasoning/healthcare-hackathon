'use client';

import { useRef, useCallback, useEffect } from 'react';
import { SendHorizonal, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAgentStore } from '@/stores/agent-store';
import { useChatContext } from './chat-context';
import { SuggestionChips } from './suggestion-chips';
import { cn } from '@/lib/utils';

export function ChatInput() {
  const { sendMessage, status, stop, messages } = useChatContext();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isActive = status === 'submitted' || status === 'streaming';
  const isOpen = useAgentStore((s) => s.isOpen);

  // Autofocus input when panel opens
  useEffect(() => {
    if (isOpen && !isActive) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isActive]);

  const handleSubmit = useCallback(() => {
    const value = inputRef.current?.value.trim();
    if (!value || isActive) return;

    sendMessage({ text: value });

    // Clear input
    if (inputRef.current) {
      inputRef.current.value = '';
      // Reset height for auto-grow textareas
      inputRef.current.style.height = 'auto';
    }
  }, [sendMessage, isActive]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const showSuggestions = messages.length === 0;

  return (
    <div className="border-t border-border/50 bg-card">
      {showSuggestions && <div className="pt-3"><SuggestionChips /></div>}

      <div className="flex items-center gap-2 p-3">
        <Textarea
          ref={inputRef}
          placeholder="Ask BestPath AI..."
          onKeyDown={handleKeyDown}
          disabled={isActive}
          className={cn(
            'min-h-[40px] max-h-[120px] resize-none rounded-xl border-border/60 bg-white text-body-sm shadow-sm transition-shadow focus:shadow-md',
          )}
          rows={1}
        />

        {isActive ? (
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => stop()}
            className="h-[40px] w-[40px] shrink-0 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
            aria-label="Stop generating"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={handleSubmit}
            className="h-[40px] w-[40px] shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover"
            aria-label="Send message"
          >
            <SendHorizonal className="size-4" />
          </Button>
        )}
      </div>

    </div>
  );
}
