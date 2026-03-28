'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRef, useEffect, useState, useCallback, useMemo, type FormEvent } from 'react';
import { Send, Loader2, CheckCircle2, Search } from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { UIMessage } from 'ai';
import {
  NavigatorResponseRenderer,
  tryParseCareResponse,
} from '@/components/navigator';

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
    <h4 className="mt-3 mb-1 text-sm font-semibold text-text-muted">
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
    <blockquote className="my-2 border-l-2 border-primary/30 pl-4 italic text-text-muted">
      {children}
    </blockquote>
  ),
};

/* ─── Welcome message ─── */

const WELCOME_TEXT =
  'Hi! I\'m your BestPath Care Navigator. I help you figure out what preventive care and screenings you\'re due for, and where to access them in British Columbia — even without a family doctor.\n\nLet\'s get started. What\'s your age and sex? And are you managing any health conditions or taking any medications?';

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

/** Count completed + in-progress tool invocations in a message */
function getToolCallProgress(message: UIMessage): {
  completed: number;
  inProgress: number;
  total: number;
} {
  let completed = 0;
  let inProgress = 0;
  for (const part of message.parts ?? []) {
    if (part.type === 'tool-invocation') {
      if ('state' in part && part.state === 'output-available') {
        completed++;
      } else {
        inProgress++;
      }
    }
  }
  return { completed, inProgress, total: completed + inProgress };
}

/* ─── Real progress indicator based on tool calls ─── */

function ToolProgressIndicator({
  completed,
  inProgress,
  total,
}: {
  completed: number;
  inProgress: number;
  total: number;
}) {
  // Estimate: typically 2-3 searches, then final generation
  const estimatedSteps = Math.max(total + 1, 3); // at least 3 visual steps
  const searchesDone = completed;
  const isSearching = inProgress > 0;
  const isGenerating = !isSearching && completed > 0;

  const steps: { label: string; state: 'done' | 'active' | 'pending' }[] = [];

  // Add a step for each completed search
  for (let i = 0; i < searchesDone; i++) {
    steps.push({
      label: i === 0 ? 'Searched clinical guidelines' : `Found additional guideline sources`,
      state: 'done',
    });
  }

  // Active search step
  if (isSearching) {
    steps.push({
      label: searchesDone === 0
        ? 'Searching clinical guidelines...'
        : 'Searching for more guideline sources...',
      state: 'active',
    });
  }

  // Final generation step
  if (isGenerating) {
    steps.push({
      label: 'Preparing your personalized recommendations...',
      state: 'active',
    });
  }

  // Progress bar: percentage based on completed steps vs estimated total
  const progressPct = Math.min(
    95,
    Math.round(((searchesDone + (isGenerating ? 0.5 : 0)) / estimatedSteps) * 100),
  );

  return (
    <div className="space-y-3 py-1">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
          {searchesDone}/{estimatedSteps - 1} searches
        </span>
      </div>

      {/* Step list */}
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 ${
              step.state === 'done' ? 'text-muted-foreground' : 'text-foreground'
            } ${step.state === 'active' ? 'animate-fade-in' : ''}`}
          >
            {step.state === 'done' ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-success" />
            ) : (
              <Loader2 className="size-3.5 shrink-0 text-primary animate-spin" />
            )}
            <span className="text-[0.8125rem] leading-snug">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Paragraph splitting for streaming reveal ─── */

function splitParagraphs(text: string): { sealed: string[]; pending: string | null } {
  const parts: string[] = [];
  let lastEnd = 0;

  for (const match of text.matchAll(/\n\n+/g)) {
    const content = text.slice(lastEnd, match.index).trim();
    if (content) parts.push(content);
    lastEnd = match.index + match[0].length;
  }

  const tail = text.slice(lastEnd).trim();
  if (tail) return { sealed: parts, pending: tail };
  return { sealed: parts, pending: null };
}

/* ─── Message content renderer ─── */

function AssistantMessageContent({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  // useMemo MUST be called before any conditional returns (Rules of Hooks)
  const { sealed, pending } = useMemo(() => splitParagraphs(text), [text]);
  const careResponse = useMemo(() => tryParseCareResponse(text), [text]);

  if (careResponse) {
    return <NavigatorResponseRenderer data={careResponse} />;
  }

  const visible = isStreaming
    ? sealed
    : pending
      ? [...sealed, pending]
      : sealed;

  if (visible.length === 0 && pending && isStreaming) {
    return (
      <div className="animate-fade-in">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {pending}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {visible.map((para, i) => (
        <div key={i} className="animate-fade-in-up">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {para}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
}

/* ─── Left panel ─── */

function BrandPanel() {
  return (
    <div className="w-full max-w-sm space-y-6">
        {/* Logo — full width, no padding constraint */}
        <Image
          src="/bestpath-logo.jpg"
          alt="BestPath — A Step In The Right Direction"
          width={859}
          height={720}
          className="mx-auto w-72 h-auto mb-8"
          priority
        />

        {/* Heading + description */}
        <div className="text-center">
          <h2 className="text-h2 text-foreground">Care Navigator</h2>
          <p className="mt-2 text-body text-muted-foreground leading-relaxed">
            Find out what preventive care and screenings you&apos;re due for
            and where to access them in BC — no family doctor needed.
          </p>
        </div>

        {/* Divider */}
        <div className="mx-auto w-10 border-t-2 border-primary/30" />

        {/* Feature bullets */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary-tint shrink-0">
              <Search className="size-3.5 text-primary" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-foreground">Evidence-based guidance</p>
              <p className="text-body-sm text-muted-foreground">Backed by BC clinical guidelines</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary-tint shrink-0">
              <CheckCircle2 className="size-3.5 text-primary" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-foreground">Clear next steps</p>
              <p className="text-body-sm text-muted-foreground">Who to see, where to go, what to ask</p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          Guidance based on clinical guidelines, not medical advice.
          Share with a healthcare provider.
        </p>
    </div>
  );
}

/* ─── Page component ─── */

export default function NavigatorPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', body: { pageContext: '/navigator' } }),
    [],
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    messages: [WELCOME_MESSAGE],
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

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
      if (inputRef.current) inputRef.current.style.height = 'auto';
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

  const lastMessage = messages[messages.length - 1];

  // Real tool-call progress from the streaming message
  const toolProgress = lastMessage?.role === 'assistant' && lastMessage.id !== 'welcome'
    ? getToolCallProgress(lastMessage)
    : { completed: 0, inProgress: 0, total: 0 };

  const showToolProgress =
    isLoading && toolProgress.total > 0;

  // Show standalone indicator when waiting for first response (no assistant message yet)
  const showStandaloneIndicator =
    isLoading && lastMessage?.role === 'user';

  return (
    <div className="flex h-full">
      {/* Left panel — brand + description (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-[40%] items-center justify-center border-r border-border bg-card">
        <BrandPanel />
      </div>

      {/* Right panel — chat */}
      <div className="flex flex-1 flex-col">
        {/* Chat messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-8 sm:px-6">
            {messages.map((message) => {
              const text = getMessageText(message);
              if (message.role === 'assistant' && !text && message.id !== 'welcome') {
                return null;
              }

              const isStreamingThis =
                isLoading &&
                message.role === 'assistant' &&
                message.id === lastMessage?.id &&
                message.id !== 'welcome';

              return (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-2xl px-5 py-4 ${
                      message.role === 'user'
                        ? 'max-w-[88%] bg-primary text-primary-foreground'
                        : 'w-full border border-border bg-card text-foreground shadow-sm'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="text-[0.9375rem] leading-relaxed text-foreground">
                        <AssistantMessageContent text={text} isStreaming={isStreamingThis} />
                        {/* Real tool-call progress inline */}
                        {isStreamingThis && showToolProgress && (
                          <div className="mt-3 border-t border-border/50 pt-3">
                            <ToolProgressIndicator {...toolProgress} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[0.9375rem] leading-relaxed">
                        {text}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Standalone indicator — waiting for first response */}
            {showStandaloneIndicator && (
              <div className="flex justify-start">
                <div className="w-full rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-2.5 animate-fade-in">
                    <Loader2 className="size-3.5 text-primary animate-spin" />
                    <span className="text-[0.8125rem] text-foreground">Thinking...</span>
                  </div>
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
              aria-label="Message the Care Navigator"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                e.target.style.height = 'auto';
                const newHeight = Math.min(e.target.scrollHeight, 160);
                e.target.style.height = `${newHeight}px`;
                e.target.style.overflowY = e.target.scrollHeight > 160 ? 'auto' : 'hidden';
              }}
              onKeyDown={onKeyDown}
              placeholder="Tell me about your health concerns..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-[0.9375rem] leading-relaxed text-foreground placeholder:text-text-muted outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/30"
              style={{ overflow: 'hidden' }}
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
          {/* Disclaimer only shown on small screens (large screens have it in left panel) */}
          <p className="lg:hidden mx-auto mt-2.5 max-w-2xl text-center text-[0.8125rem] leading-relaxed text-text-muted">
            This is guidance based on clinical guidelines, not medical advice.
            Please share these suggestions with a healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
}
