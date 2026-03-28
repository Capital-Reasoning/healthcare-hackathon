'use client';

import { AlertTriangle, CalendarClock, CheckCircle2, MapPin, MessageCircle } from 'lucide-react';

/* ─── Types for structured navigator response ─── */

interface ActionItem {
  title: string;
  description: string;
  whoToSee: string;
  whatToSay: string;
}

interface PriorityTier {
  priority: 'act-soon' | 'schedule-when-convenient' | 'keep-doing';
  items: ActionItem[];
}

interface CareNavigatorResponse {
  type: 'care-navigator-response';
  greeting: string;
  tiers: PriorityTier[];
  disclaimer: string;
}

/* ─── Tier config ─── */

const TIER_CONFIG: Record<
  PriorityTier['priority'],
  {
    label: string;
    icon: typeof AlertTriangle;
    headerBg: string;
    headerText: string;
    cardBorder: string;
    iconColor: string;
  }
> = {
  'act-soon': {
    label: 'Act Soon',
    icon: AlertTriangle,
    headerBg: 'bg-red-100',
    headerText: 'text-red-900',
    cardBorder: 'border-red-300',
    iconColor: 'text-red-700',
  },
  'schedule-when-convenient': {
    label: 'Schedule When Convenient',
    icon: CalendarClock,
    headerBg: 'bg-amber-100',
    headerText: 'text-amber-900',
    cardBorder: 'border-amber-300',
    iconColor: 'text-amber-700',
  },
  'keep-doing': {
    label: 'Keep It Up',
    icon: CheckCircle2,
    headerBg: 'bg-emerald-100',
    headerText: 'text-emerald-900',
    cardBorder: 'border-emerald-300',
    iconColor: 'text-emerald-700',
  },
};

/* ─── Parse helper ─── */

export function tryParseCareResponse(text: string): CareNavigatorResponse | null {
  // Try to extract JSON from a fenced code block
  const fencedMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = fencedMatch?.[1] ?? text.trim();

  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    if (
      parsed.type === 'care-navigator-response' &&
      Array.isArray(parsed.tiers) &&
      typeof parsed.greeting === 'string'
    ) {
      // Validate tier shape — each tier must have priority + items array
      const tiers = parsed.tiers as Record<string, unknown>[];
      for (const tier of tiers) {
        if (typeof tier.priority !== 'string' || !Array.isArray(tier.items)) return null;
        for (const item of tier.items as Record<string, unknown>[]) {
          if (typeof item.title !== 'string') return null;
        }
      }
      return parsed as unknown as CareNavigatorResponse;
    }
  } catch {
    // Not valid JSON — that's fine, treat as plain text
  }
  return null;
}

/* ─── Action Card ─── */

function ActionCard({
  item,
  tierConfig,
  number,
}: {
  item: ActionItem;
  tierConfig: (typeof TIER_CONFIG)[PriorityTier['priority']];
  number: number;
}) {
  return (
    <div className={`rounded-xl border ${tierConfig.cardBorder} bg-card p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${tierConfig.headerBg} ${tierConfig.headerText}`}
        >
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[0.9375rem] font-semibold text-foreground">{item.title}</h4>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-text-secondary">
            {item.description}
          </p>

          <div className="mt-3 space-y-1.5">
            {/* Who to see */}
            <div className="flex items-start gap-2">
              <MapPin className={`mt-0.5 size-3.5 shrink-0 ${tierConfig.iconColor}`} />
              <span className="text-[0.8125rem] text-text-secondary">
                <span className="font-medium text-foreground">See: </span>
                {item.whoToSee}
              </span>
            </div>

            {/* What to say */}
            <div className="flex items-start gap-2">
              <MessageCircle className={`mt-0.5 size-3.5 shrink-0 ${tierConfig.iconColor}`} />
              <span className="text-[0.8125rem] text-text-secondary">
                <span className="font-medium text-foreground">Say: </span>
                <span className="italic">&ldquo;{item.whatToSay}&rdquo;</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main renderer ─── */

export function NavigatorResponseRenderer({
  data,
}: {
  data: CareNavigatorResponse;
}) {
  // Pre-compute global numbering across all tiers
  let globalItemIndex = 0;

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <p className="text-[0.9375rem] leading-relaxed text-foreground">{data.greeting}</p>

      {/* Priority tiers */}
      {data.tiers.map((tier) => {
        const config = TIER_CONFIG[tier.priority];
        if (!config || tier.items.length === 0) return null;
        const Icon = config.icon;

        return (
          <div key={tier.priority} className="space-y-2">
            {/* Tier header */}
            <div
              className={`flex items-center gap-2 rounded-lg ${config.headerBg} px-3 py-1.5`}
            >
              <Icon className={`size-4 ${config.iconColor}`} />
              <h3 className={`text-[0.8125rem] font-semibold ${config.headerText}`}>
                {config.label}
              </h3>
            </div>

            {/* Action cards */}
            <div className="space-y-2 pl-1">
              {tier.items.map((item, idx) => {
                globalItemIndex++;
                return (
                  <ActionCard
                    key={idx}
                    item={item}
                    tierConfig={config}
                    number={globalItemIndex}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Disclaimer */}
      {data.disclaimer && (
        <div className="rounded-lg border border-border bg-bg-muted px-4 py-3">
          <p className="text-[0.8125rem] leading-relaxed text-text-muted">
            {data.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
