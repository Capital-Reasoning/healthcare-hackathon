'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRef, useEffect, useState, useCallback, type FormEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { UIMessage } from 'ai';

/* ─── Markdown component overrides (patient-facing, larger text) ─── */

const mdComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 text-xl font-bold text-foreground">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 text-lg font-bold text-foreground">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-1.5 text-base font-semibold text-foreground">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-3 mb-1 text-sm font-semibold text-muted-foreground">
      {children}
    </h4>
  ),
  p: ({ children }) => <p className="my-1.5 leading-relaxed">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="my-2 ml-5 list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-5 list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline decoration-primary/30 hover:decoration-primary"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <pre className="my-2 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
          <code>{children}</code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 text-sm">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  hr: () => <hr className="my-3 border-border/50" />,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary/30 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
};

/* ─── Welcome message ─── */

const WELCOME_TEXT =
  'Hi there, I\'m your BestPath Care Navigator. I\'m here to help you understand what preventive care and screenings you may be due for, and where to access them in British Columbia -- even if you don\'t have a family doctor.\n\nTo get started, could you tell me a bit about yourself? For example, your age, sex, and any health conditions or medications you\'re currently managing.';

const WELCOME_MESSAGE: UIMessage = {
  id: 'welcome',
  role: 'assistant',
  parts: [{ type: 'text' as const, text: WELCOME_TEXT }],
};

/* ─── Helpers ─── */

function getMessageText(message: UIMessage): string {
  const textParts = message.parts?.filter(
    (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text',
  );
  if (textParts && textParts.length > 0) {
    return textParts.map((p) => p.text).join('\n');
  }
  return '';
}

/* ─── Page component ─── */

export default function NavigatorPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { pageContext: '/navigator' },
    }),
    messages: [WELCOME_MESSAGE],
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const text = inputValue.trim();
      if (!text || isLoading) return;
      sendMessage({ text });
      setInputValue('');
    },
    [inputValue, isLoading, sendMessage],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    },
    [onSubmit],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Chat messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  message.role === 'user'
                    ? 'bg-muted text-foreground'
                    : 'bg-primary-tint text-foreground'
                }`}
              >
                {message.role === 'assistant' ? (
                  <div className="text-[0.9375rem] leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={mdComponents}
                    >
                      {getMessageText(message)}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[0.9375rem] leading-relaxed">
                    {getMessageText(message)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading &&
            messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-primary-tint px-5 py-4">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card px-4 py-4 sm:px-6">
        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-2xl items-end gap-3"
        >
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Tell me about your health concerns..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-[0.9375rem] leading-relaxed text-foreground placeholder:text-hint outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40 disabled:hover:bg-primary"
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </button>
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-hint">
          This is decision support information, not medical advice. Please
          discuss recommendations with a healthcare provider.
        </p>
      </div>
    </div>
  );
}
