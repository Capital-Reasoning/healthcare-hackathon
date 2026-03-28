import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { PageTabs, PageTabsContent } from '@/components/navigation/page-tabs';

/* ─── Tabs ───────────────────────────────────────────── */

export const TabsDefinition = defineComponent({
  name: 'Tabs',
  description:
    'Pill-style tabbed layout with a sliding active indicator. Provide an array of tab definitions and a matching array of child panels. Each panel is shown when its corresponding tab is active.',
  props: z.object({
    tabs: z
      .array(
        z.object({
          value: z.string().describe('Unique key for this tab'),
          label: z.string().describe('Display label for this tab'),
        }),
      )
      .describe('Tab definitions — value is the key, label is displayed'),
    panels: z
      .array(z.any())
      .describe(
        'Array of child components, one per tab. Matched to tabs by index.',
      ),
  }),
  component: ({ props, renderNode }) => {
    const { tabs, panels } = props;
    const defaultValue = tabs[0]?.value;

    return (
      <PageTabs tabs={tabs} defaultValue={defaultValue}>
        {tabs.map((tab, index) => (
          <PageTabsContent key={tab.value} value={tab.value}>
            {renderNode((panels as unknown[])[index])}
          </PageTabsContent>
        ))}
      </PageTabs>
    );
  },
});
