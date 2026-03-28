'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { useAgentStore } from '@/stores/agent-store';
import { useConversationStore } from '@/stores/conversation-store';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { ChatProvider } from './chat-context';
import { AgentPanelHeader } from './agent-panel-header';
import { ChatThread } from './chat-thread';
import { ChatInput } from './chat-input';
import { ConversationHistory } from './conversation-history';
import { cn } from '@/lib/utils';

export function AgentPanel() {
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 639px)');
  const { isOpen, activeView, setStreaming } =
    useAgentStore();
  const {
    activeConversationId,
    saveConversation,
    getConversationMessages,
    updateTitle,
    newConversation: createNewConversation,
  } = useConversationStore();

  // Ensure there is always an active conversation
  const conversationIdRef = useRef(activeConversationId);
  useEffect(() => {
    if (!activeConversationId) {
      const id = createNewConversation();
      conversationIdRef.current = id;
    } else {
      conversationIdRef.current = activeConversationId;
    }
  }, [activeConversationId, createNewConversation]);

  const chatHelpers = useChat({
    id: activeConversationId ?? undefined,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { pageContext: pathname },
    }),
    messages: activeConversationId
      ? getConversationMessages(activeConversationId)
      : undefined,
    onFinish: () => {
      // Persist messages after each completed exchange
      const id = conversationIdRef.current;
      if (id && chatHelpers.messages.length > 0) {
        // Auto-title from first user message
        const firstUserMsg = chatHelpers.messages.find(
          (m) => m.role === 'user',
        );
        const title = firstUserMsg
          ? (firstUserMsg.parts
              ?.filter(
                (p): p is Extract<typeof p, { type: 'text' }> =>
                  p.type === 'text',
              )
              .map((p) => p.text)
              .join(' ')
              .slice(0, 50) ?? 'New conversation')
          : undefined;

        saveConversation(id, chatHelpers.messages, title);
        if (title) updateTitle(id, title);
      }
    },
  });

  // Sync streaming status to store for the animated border
  useEffect(() => {
    const isActive = chatHelpers.status === 'streaming' || chatHelpers.status === 'submitted';
    setStreaming(isActive);
  }, [chatHelpers.status, setStreaming]);

  // Load messages when switching conversations
  const loadConversation = useCallback(
    (id: string) => {
      const msgs = getConversationMessages(id);
      chatHelpers.setMessages(msgs);
    },
    [getConversationMessages, chatHelpers],
  );

  // Mobile bottom sheet — always rendered, animated with translate-y
  if (isMobile) {
    return (
      <ChatProvider value={chatHelpers}>
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 z-40 flex h-[calc(100dvh-3.5rem)] flex-col rounded-t-2xl glass-strong',
            'transition-transform duration-300 ease-out',
            isOpen
              ? 'pointer-events-auto translate-y-0'
              : 'pointer-events-none translate-y-full',
          )}
        >
          <AgentPanelHeader mobile />
          <div className="flex min-h-0 flex-1 flex-col">
            {activeView === 'chat' ? (
              <>
                <ChatThread />
                <ChatInput />
              </>
            ) : (
              <ConversationHistory onLoadConversation={loadConversation} />
            )}
          </div>
        </div>
      </ChatProvider>
    );
  }

  // Desktop / tablet — renders inside the floating card wrapper from AgentPanelLayout
  return (
    <ChatProvider value={chatHelpers}>
      {/* Header — pinned at top, never scrolls */}
      <AgentPanelHeader />

      {/* Content — this flex child takes remaining space */}
      <div className="flex min-h-0 flex-1 flex-col">
        {activeView === 'chat' ? (
          <>
            {/* Chat messages — scrollable */}
            <ChatThread />
            {/* Input — pinned at bottom, never scrolls */}
            <ChatInput />
          </>
        ) : (
          <ConversationHistory onLoadConversation={loadConversation} />
        )}
      </div>
    </ChatProvider>
  );
}
