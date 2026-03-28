'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useRef, useEffect, useState, useCallback, useMemo, type FormEvent } from 'react';
import { Send, Loader2, CheckCircle2, Search, Heart, BookOpen, Sparkles } from 'lucide-react';
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

/* ─── Time-based analysis progress indicator ─── */

const PROGRESS_STEPS = [
  { label: 'Understanding your health profile', icon: Heart },
  { label: 'Searching clinical guidelines', icon: BookOpen },
  { label: 'Preparing your recommendations', icon: Sparkles },
] as const;

function AnalysisProgress({ stage }: { stage: number }) {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="w-full rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="space-y-1">
          {PROGRESS_STEPS.map((step, i) => {
            const stepNum = i + 1;
            const state: 'done' | 'active' | 'pending' =
              stepNum < stage ? 'done' : stepNum === stage ? 'active' : 'pending';
            const StepIcon = step.icon;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-500 ${
                  state === 'active' ? 'bg-primary/5' : ''
                } ${state === 'pending' ? 'opacity-35' : 'opacity-100'}`}
              >
                {state === 'done' ? (
                  <CheckCircle2 className="size-[1.125rem] shrink-0 text-primary" />
                ) : state === 'active' ? (
                  <Loader2 className="size-[1.125rem] shrink-0 text-primary animate-spin" />
                ) : (
                  <div className="size-[1.125rem] shrink-0 rounded-full border-2 border-muted-foreground/30" />
                )}
                <StepIcon
                  className={`size-4 shrink-0 ${
                    state === 'active'
                      ? 'text-primary'
                      : state === 'done'
                        ? 'text-primary/70'
                        : 'text-muted-foreground'
                  }`}
                />
                <span
                  className={`text-[0.875rem] leading-snug ${
                    state === 'active'
                      ? 'text-foreground font-medium'
                      : state === 'done'
                        ? 'text-foreground/70'
                        : 'text-muted-foreground'
                  }`}
                >
                  {step.label}{state === 'active' ? '...' : ''}
                </span>
              </div>
            );
          })}
        </div>
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

  // Time-based progress stages (0 = thinking, 1/2/3 = stepper stages)
  const [progressStage, setProgressStage] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setProgressStage(0);
      return;
    }
    // Advance through stages on timers
    const t1 = setTimeout(() => setProgressStage(1), 2000);
    const t2 = setTimeout(() => setProgressStage(2), 35000);
    const t3 = setTimeout(() => setProgressStage(3), 70000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isLoading]);

  // Auto-scroll to bottom on new messages or progress change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading, progressStage]);

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

  // Hide progress once the final care-response JSON has been parsed
  const lastAssistantText =
    lastMessage?.role === 'assistant' && lastMessage.id !== 'welcome'
      ? getMessageText(lastMessage)
      : '';
  const hasCareResponse = !!lastAssistantText && tryParseCareResponse(lastAssistantText) !== null;
  const showProgress = isLoading && !hasCareResponse;

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

            {/* Progress indicator — time-based stages */}
            {showProgress && (
              progressStage >= 1 ? (
                <AnalysisProgress stage={progressStage} />
              ) : (
                <div className="flex justify-start animate-fade-in">
                  <div className="w-full rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <Loader2 className="size-[1.125rem] text-primary animate-spin" />
                      <span className="text-[0.875rem] text-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )
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
