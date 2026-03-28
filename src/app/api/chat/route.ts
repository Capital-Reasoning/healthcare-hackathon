import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { agentTools } from '@/lib/ai/tools';

export const maxDuration = 300;

/**
 * Strip incomplete or malformed parts that would cause convertToModelMessages
 * to throw. This includes:
 * - Tool-invocation parts that didn't complete (missing toolCallId/output)
 * - File/image parts with undefined data or mediaType
 */
function sanitizeMessages(messages: UIMessage[]): UIMessage[] {
  return messages.map((msg) => ({
    ...msg,
    parts: msg.parts?.filter((part) => {
      // Only keep tool parts that completed successfully
      if (part.type.startsWith('tool-')) {
        return 'state' in part && part.state === 'output-available';
      }
      // Filter out file/image parts with missing data
      if (part.type === 'file') {
        return 'data' in part && part.data != null && 'mediaType' in part && part.mediaType != null;
      }
      return true;
    }),
  }));
}

export async function POST(request: Request) {
  const { messages, pageContext } = (await request.json()) as {
    messages: UIMessage[];
    pageContext?: string;
  };

  const systemPrompt = buildSystemPrompt({ pageContext });

  const modelMessages = await convertToModelMessages(sanitizeMessages(messages));

  const result = streamText({
    model: anthropic('claude-opus-4-6'),
    system: systemPrompt,
    messages: modelMessages,
    tools: agentTools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
