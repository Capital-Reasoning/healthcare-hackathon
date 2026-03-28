'use client';

import { createContext, useContext } from 'react';
import { type useChat } from '@ai-sdk/react';

/** The subset of useChat return values that child components need. */
export type ChatHelpers = ReturnType<typeof useChat>;

const ChatContext = createContext<ChatHelpers | null>(null);

export function ChatProvider({
  value,
  children,
}: {
  value: ChatHelpers;
  children: React.ReactNode;
}) {
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext(): ChatHelpers {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatContext must be used inside <ChatProvider>');
  }
  return ctx;
}
