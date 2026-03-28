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
    emoji: string;
    icon: typeof AlertTriangle;
    headerBg: string;
    headerText: string;
    cardBorder: string;
    iconColor: string;
  }
> = {
  'act-soon': {
    label: 'Act Soon',
    emoji: '\uD83D\uDD34',
    icon: AlertTriangle,
    headerBg: 'bg-red-50',
    headerText: 'text-red-800',
    cardBorder: 'border-red-200',
    iconColor: 'text-red-600',
  },
  'schedule-when-convenient': {
    label: 'Schedule When Convenient',
    emoji: '\uD83D\uDFE1',
    icon: CalendarClock,
    headerBg: 'bg-amber-50',
    headerText: 'text-amber-800',
    cardBorder: 'border-amber-200',
    iconColor: 'text-amber-600',
  },
  'keep-doing': {
    label: 'Keep Doing What You\'re Doing',
    emoji: '\uD83D\uDFE2',
    icon: CheckCircle2,
    headerBg: 'bg-emerald-50',
    headerText: 'text-emerald-800',
    cardBorder: 'border-emerald-200',
    iconColor: 'text-emerald-600',
  },
};

/* ─── Parse helper ─── */

export function tryParseCareResponse(text: string): CareNavigatorResponse | null {
  // Try to extract JSON from a fenced code block
  const fencedMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = fencedMatch?.[1] ?? text.trim();

  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    if (parsed.type === 'care-navigator-response' && Array.isArray(parsed.tiers)) {
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
}: {
  item: ActionItem;
  tierConfig: (typeof TIER_CONFIG)[PriorityTier['priority']];
}) {
  return (
    <div className={`rounded-xl border ${tierConfig.cardBorder} bg-card p-4 shadow-sm`}>
      <h4 className="text-[0.9375rem] font-semibold text-foreground">{item.title}</h4>
      <p className="mt-1 text-[0.875rem] leading-relaxed text-text-secondary">
        {item.description}
      </p>

      <div className="mt-3 space-y-2">
        {/* Who to see */}
        <div className="flex items-start gap-2">
          <MapPin className={`mt-0.5 size-4 shrink-0 ${tierConfig.iconColor}`} />
          <div>
            <span className="text-[0.8125rem] font-medium text-foreground">Who to see: </span>
            <span className="text-[0.8125rem] text-text-secondary">{item.whoToSee}</span>
          </div>
        </div>

        {/* What to say */}
        <div className="flex items-start gap-2">
          <MessageCircle className={`mt-0.5 size-4 shrink-0 ${tierConfig.iconColor}`} />
          <div>
            <span className="text-[0.8125rem] font-medium text-foreground">What to say: </span>
            <span className="text-[0.8125rem] italic text-text-secondary">
              &ldquo;{item.whatToSay}&rdquo;
            </span>
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
              className={`flex items-center gap-2 rounded-lg ${config.headerBg} px-3 py-2`}
            >
              <span className="text-base" role="img" aria-label={config.label}>
                {config.emoji}
              </span>
              <Icon className={`size-4 ${config.iconColor}`} />
              <h3 className={`text-[0.875rem] font-semibold ${config.headerText}`}>
                {config.label}
              </h3>
            </div>

            {/* Action cards */}
            <div className="space-y-2 pl-1">
              {tier.items.map((item, idx) => (
                <ActionCard key={idx} item={item} tierConfig={config} />
              ))}
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
