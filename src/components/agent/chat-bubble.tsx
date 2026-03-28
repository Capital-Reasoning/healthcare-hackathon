'use client';

import { useState, useMemo } from 'react';
import { type UIMessage } from 'ai';
import { Copy, Check } from 'lucide-react';
import { MessageContent } from './message-content';
import { ToolInvocationDisplay } from './tool-invocation-display';
import { useChatContext } from './chat-context';

interface ChatBubbleProps {
  message: UIMessage;
  /** True only for the last message in the thread — controls streaming cursor */
  isLast?: boolean;
}

/**
 * Groups consecutive tool parts together so they render as a single
 * bordered container with dividers, rather than separate items.
 */
function groupParts(parts: UIMessage['parts']) {
  if (!parts) return [];

  const groups: { type: 'tool-group' | 'other'; parts: typeof parts }[] = [];

  for (const part of parts) {
    const isTool = part.type.startsWith('tool-');
    const lastGroup = groups[groups.length - 1];

    if (isTool) {
      if (lastGroup?.type === 'tool-group') {
        lastGroup.parts.push(part);
      } else {
        groups.push({ type: 'tool-group', parts: [part] });
      }
    } else {
      groups.push({ type: 'other', parts: [part] });
    }
  }

  return groups;
}

export function ChatBubble({ message, isLast }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const { status } = useChatContext();
  const isUser = message.role === 'user';
  const isStreaming = isLast && status === 'streaming' && message.role === 'assistant';

  const textContent = message.parts
    ?.filter(
      (p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text',
    )
    .map((p) => p.text)
    .join('\n');

  const groups = useMemo(() => groupParts(message.parts), [message.parts]);

  const handleCopy = async () => {
    if (textContent) {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1 animate-fade-in">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-body-sm text-primary-foreground">
          {textContent}
        </div>
      </div>
    );
  }

  // Assistant message — content goes directly on the card surface
  return (
    <div className="group animate-fade-in text-body-sm text-text-primary">
      {groups.map((group, gi) => {
        // Tool group — render in a single bordered container
        if (group.type === 'tool-group') {
          return (
            <div
              key={gi}
              className="my-3 overflow-hidden rounded-lg border border-border/50 bg-bg-muted/30"
            >
              {group.parts.map((part, i) => (
                <div
                  key={i}
                  className={i > 0 ? 'border-t border-border/30' : ''}
                >
                  <ToolInvocationDisplay
                    toolName={part.type.replace(/^tool-/, '')}
                    state={
                      'state' in part
                        ? (part.state as string)
                        : 'input-streaming'
                    }
                    input={'input' in part ? part.input : undefined}
                    output={'output' in part ? part.output : undefined}
                    grouped
                  />
                </div>
              ))}
            </div>
          );
        }

        // Other parts
        return group.parts.map((part, i) => {
          const key = `${gi}-${i}`;
          if (part.type === 'text') {
            return (
              <MessageContent
                key={key}
                text={part.text}
                isStreaming={isStreaming}
              />
            );
          }
          if (part.type === 'reasoning') {
            return (
              <details key={key} className="mt-1 text-xs text-text-muted">
                <summary className="cursor-pointer font-medium">
                  Thinking…
                </summary>
                <p className="mt-1 whitespace-pre-wrap pl-2 text-[11px] opacity-70">
                  {part.text}
                </p>
              </details>
            );
          }
          return null;
        });
      })}

      {/* Streaming dots indicator */}
      {isStreaming && (
        <div className="mt-2 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-primary animate-pulse-subtle"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      )}

      {/* Copy button — bottom of message */}
      {!isStreaming && textContent && (
        <div className="mt-1 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-bg-muted hover:text-foreground"
            aria-label="Copy message"
          >
            {copied ? (
              <>
                <Check className="size-3 text-success" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3" />
                Copy
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
