'use client';

import { Renderer } from '@openuidev/react-lang';
import { bestpathLibrary } from '@/lib/openui/library';
import { GeneratedCard } from './generated-card';

interface AgentRendererProps {
  response: string;
  isStreaming?: boolean;
}

/**
 * Standalone OpenUI renderer for rendering full OpenUI Lang responses.
 * Wraps the output in a GeneratedCard for the glass border effect.
 */
export function AgentRenderer({ response, isStreaming }: AgentRendererProps) {
  return (
    <GeneratedCard>
      <Renderer
        response={response}
        library={bestpathLibrary}
        isStreaming={isStreaming}
      />
    </GeneratedCard>
  );
}
