import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Conversation, type StoredPart } from '@/types/agent';
import { generateId } from '@/lib/utils';
import { type UIMessage } from 'ai';

/** Extract a serialisable snapshot of message parts (text + tool invocations). */
function serializeParts(parts: UIMessage['parts']): {
  content: string;
  storedParts: StoredPart[];
} {
  const storedParts: StoredPart[] = [];
  const textChunks: string[] = [];

  if (!parts) return { content: '', storedParts: [] };

  for (const p of parts) {
    if (p.type === 'text') {
      textChunks.push(p.text);
      storedParts.push({ type: 'text', text: p.text });
    } else if (p.type.startsWith('tool-')) {
      storedParts.push({
        type: 'tool',
        toolName: p.type.replace(/^tool-/, ''),
        state: 'state' in p ? String(p.state) : 'output-available',
        input: 'input' in p ? p.input : undefined,
        output: 'output' in p ? p.output : undefined,
      });
    }
  }

  return { content: textChunks.join('\n'), storedParts };
}

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;

  /** Create a new conversation and make it active. Returns the new ID. */
  newConversation: () => string;

  /** Persist the current useChat messages into the conversation list. */
  saveConversation: (
    id: string,
    messages: UIMessage[],
    title?: string,
  ) => void;

  /** Retrieve serialised messages for a past conversation. */
  getConversationMessages: (id: string) => UIMessage[];

  /** Update a conversation's title (e.g. auto-title after first exchange). */
  updateTitle: (id: string, title: string) => void;

  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  clearHistory: () => void;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

      newConversation: () => {
        const id = generateId();
        const conversation: Conversation = {
          id,
          title: 'New conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      saveConversation: (id, messages, title) => {
        const serialized = messages.map((m) => {
          const { content, storedParts } = serializeParts(m.parts);
          return {
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content,
            parts: storedParts,
            createdAt: new Date(),
          };
        });

        set((state) => {
          const existing = state.conversations.find((c) => c.id === id);
          if (existing) {
            return {
              conversations: state.conversations.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      messages: serialized,
                      title: title ?? c.title,
                      updatedAt: new Date(),
                    }
                  : c,
              ),
            };
          }
          return {
            conversations: [
              {
                id,
                title: title ?? 'New conversation',
                messages: serialized,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              ...state.conversations,
            ],
          };
        });
      },

      getConversationMessages: (id) => {
        const conversation = get().conversations.find((c) => c.id === id);
        if (!conversation) return [];
        // Re-hydrate stored messages into UIMessage shape
        return conversation.messages.map((m) => {
          // If we have stored parts (new format), reconstruct faithfully
          if (m.parts?.length) {
            const parts: UIMessage['parts'] = m.parts.map((sp) => {
              if (sp.type === 'text') {
                return { type: 'text' as const, text: sp.text ?? '' };
              }
              // Tool invocation part
              return {
                type: `tool-${sp.toolName}`,
                state: sp.state ?? 'output-available',
                input: sp.input,
                output: sp.output,
              } as unknown as UIMessage['parts'][number];
            });
            return {
              id: m.id,
              role: m.role,
              parts,
              createdAt: new Date(m.createdAt),
            };
          }
          // Backward compat: old messages stored as content only
          return {
            id: m.id,
            role: m.role,
            parts: [{ type: 'text' as const, text: m.content }],
            createdAt: new Date(m.createdAt),
          };
        });
      },

      updateTitle: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date() } : c,
          ),
        })),

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id
              ? null
              : state.activeConversationId,
        })),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      clearHistory: () =>
        set({ conversations: [], activeConversationId: null }),
    }),
    {
      name: 'bestpath-conversations',
    },
  ),
);
