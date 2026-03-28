'use client';

import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { type SuggestionChip } from '@/types/agent';
import { useChatContext } from './chat-context';

const SUGGESTIONS_BY_ROUTE: Record<string, SuggestionChip[]> = {
  '/': [
    { label: 'Summarize patient metrics', prompt: 'Give me a summary of the current patient metrics and key KPIs.' },
    { label: 'Show risk distribution', prompt: 'Show me the patient risk distribution as a chart.' },
    { label: 'Compare to last month', prompt: 'Compare this month\'s metrics to last month and highlight any significant changes.' },
  ],
  '/patients': [
    { label: 'Find high-risk patients', prompt: 'Show me all high-risk and critical patients with their conditions.' },
    { label: 'Show readmission trends', prompt: 'Show me the readmission trends and rates over the past quarter.' },
    { label: 'Analyze demographics', prompt: 'Analyze the patient demographics — age distribution, gender breakdown, and common conditions.' },
  ],
  '/research': [
    { label: 'Search recent studies', prompt: 'Search for the most recent clinical studies and guidelines in our document library.' },
    { label: 'Summarize findings', prompt: 'Summarize the key findings from our uploaded research documents.' },
    { label: 'Find related papers', prompt: 'Find documents related to heart failure management guidelines.' },
  ],
  '/settings': [
    { label: 'What can you do?', prompt: 'What are your capabilities? What data can you access and what kinds of analyses can you perform?' },
  ],
};

export function SuggestionChips() {
  const pathname = usePathname();
  const { sendMessage } = useChatContext();

  // Match the closest route
  const route = Object.keys(SUGGESTIONS_BY_ROUTE).find((r) =>
    r === '/' ? pathname === '/' : pathname.startsWith(r),
  ) ?? '/';

  const suggestions = SUGGESTIONS_BY_ROUTE[route] ?? SUGGESTIONS_BY_ROUTE['/']!;

  return (
    <div className="flex flex-wrap gap-2 px-4 pb-2">
      {suggestions.map((chip) => (
        <Button
          key={chip.label}
          variant="outline"
          size="sm"
          className="h-auto whitespace-normal rounded-full border-primary/30 bg-primary-tint px-3 py-1.5 text-xs font-medium text-primary-pressed hover:bg-primary-tint-medium hover:text-primary-pressed"
          onClick={() => sendMessage({ text: chip.prompt })}
        >
          {chip.label}
        </Button>
      ))}
    </div>
  );
}
