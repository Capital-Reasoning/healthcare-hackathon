'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Activity, Search, BarChart3, Users } from 'lucide-react';
import { useChatContext } from './chat-context';
import { ChatBubble } from './chat-bubble';

export function ChatThread() {
  const { messages, status } = useChatContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Track whether user is scrolled near the bottom
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
  }, []);

  // Always scroll on user message submit
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'user') {
      isNearBottomRef.current = true;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // Auto-scroll as content grows, but only if user is near the bottom
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const content = container.firstElementChild;
    if (!content) return;

    const observer = new ResizeObserver(() => {
      if (isNearBottomRef.current) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    });

    observer.observe(content);
    return () => observer.disconnect();
    // Re-attach observer when message count changes
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
        {/* Hero */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-tint to-primary-tint-medium shadow-sm">
            <Activity className="size-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-h3 font-semibold text-text-primary">
              BestPath AI
            </h2>
            <p className="max-w-[300px] text-body-sm text-text-muted">
              Explore patient records, clinical metrics, and research documents
              using natural language.
            </p>
          </div>
        </div>

        {/* Capabilities */}
        <div className="flex w-full max-w-[320px] flex-col gap-2">
          {[
            { icon: Users, text: 'Search and filter patient records' },
            { icon: BarChart3, text: 'Visualise trends and distributions' },
            { icon: Search, text: 'Query clinical documents' },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-xl bg-bg-muted/60 px-4 py-2.5 text-left"
            >
              <Icon className="size-4 shrink-0 text-primary" />
              <span className="text-xs text-text-secondary">{text}</span>
            </div>
          ))}
        </div>

      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto scroll-smooth"
      onScroll={handleScroll}
    >
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message, i) => (
          <ChatBubble
            key={message.id}
            message={message}
            isLast={i === messages.length - 1}
          />
        ))}

        {status === 'submitted' && (
          <div className="flex items-center gap-1 px-1 animate-fade-in">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 rounded-full bg-primary animate-pulse-subtle"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
