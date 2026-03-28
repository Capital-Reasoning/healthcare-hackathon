'use client';

import { MessageContent } from './message-content';

interface StreamingTextProps {
  text: string;
}

/**
 * Renders actively streaming text with a cursor animation.
 * Delegates to MessageContent for actual rendering (markdown + OpenUI).
 */
export function StreamingText({ text }: StreamingTextProps) {
  return (
    <div className="relative">
      <MessageContent text={text} isStreaming />
      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary" />
    </div>
  );
}
