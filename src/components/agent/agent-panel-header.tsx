'use client';

import {
  Activity,
  ChevronRight,
  ChevronDown,
  Plus,
  History,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgentStore } from '@/stores/agent-store';
import { useConversationStore } from '@/stores/conversation-store';
import { useChatContext } from './chat-context';

interface AgentPanelHeaderProps {
  mobile?: boolean;
}

export function AgentPanelHeader({
  mobile,
}: AgentPanelHeaderProps) {
  const { close, activeView, setView } = useAgentStore();
  const { newConversation } = useConversationStore();
  const { setMessages } = useChatContext();

  const handleNewConversation = () => {
    const id = newConversation();
    setMessages([]);
    setView('chat');
    void id;
  };

  const handleClose = () => {
    close();
  };

  const isHistoryView = activeView === 'history';

  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-border/30 px-3 py-2">
      {isHistoryView ? (
        <>
          {/* Back button in history view */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('chat')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Back to chat"
          >
            <ArrowLeft className="size-3.5" />
          </Button>
          <span className="text-body-sm font-semibold text-foreground">
            History
          </span>
        </>
      ) : (
        <>
          {/* Title */}
          <Activity className="size-4 text-primary" aria-hidden="true" />
          <span className="text-body-sm font-semibold text-foreground">
            BestPath AI
          </span>
        </>
      )}

      <div className="ml-auto flex items-center gap-1">
        {/* New conversation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNewConversation}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          aria-label="New conversation"
        >
          <Plus className="size-3.5" />
        </Button>

        {/* History toggle — opens the full history list view */}
        {!isHistoryView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('history')}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Conversation history"
          >
            <History className="size-3.5" />
          </Button>
        )}

        {/* Close / collapse */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        >
          {mobile ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
