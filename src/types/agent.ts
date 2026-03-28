export interface StoredPart {
  type: 'text' | 'tool';
  text?: string;
  toolName?: string;
  state?: string;
  input?: unknown;
  output?: unknown;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** Ordered parts including tool invocations for faithful reconstruction */
  parts?: StoredPart[];
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type AgentView = 'chat' | 'history';

export type MobileSheetState = 'collapsed' | 'peek' | 'expanded';

export interface SuggestionChip {
  label: string;
  prompt: string;
}

export type PageContext = '/' | '/patients' | '/research' | '/settings';
