import {
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Section } from "./helpers";

export function BaseComponentsSection() {
  return (
    <>
      <Section id="buttons" title="Buttons">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
      </Section>

      <Section id="badges" title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <span className="inline-flex h-6 items-center rounded-full bg-success-tint px-2.5 text-[13px] font-medium text-success">
            Compliant
          </span>
          <span className="inline-flex h-6 items-center rounded-full bg-warning-tint px-2.5 text-[13px] font-medium text-[#9A6011]">
            Pending Review
          </span>
          <span className="inline-flex h-6 items-center rounded-full bg-error-tint px-2.5 text-[13px] font-medium text-error">
            Critical
          </span>
        </div>
      </Section>

      {/* ─── Card Patterns ─── */}
      <Section id="card-patterns" title="Card Patterns">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-caption text-text-muted">TOTAL PATIENTS</p>
                  <p className="mt-1 text-display text-navy-800">2,847</p>
                </div>
                <div className="rounded-lg bg-primary-tint p-2">
                  <Users className="size-5 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-body-sm">
                <TrendingUp className="size-3.5 text-success" />
                <span className="font-medium text-success">+12.5%</span>
                <span className="text-text-muted">vs last quarter</span>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Last 24 hours of patient interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-body-sm text-text-secondary">
                47 new encounters recorded across 12 departments. 3 critical
                alerts require attention.
              </p>
            </CardContent>
          </Card>
          <div
            className="rounded-xl p-[3px]"
            style={{
              background:
                "linear-gradient(135deg, #0B8585 0%, #1A2E44 50%, #085C5C 100%)",
            }}
          >
            <div className="glass-strong rounded-[17px] p-5">
              <p className="text-h3 text-navy-800">AI Analysis</p>
              <p className="text-body-sm text-text-secondary mt-2">
                Based on the current data, I&apos;ve identified 3 patients at
                elevated risk for readmission within 30 days.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Notifications (design token ref) ─── */}
      <Section id="notifications" title="Notifications">
        <div className="space-y-3">
          <div className="flex overflow-hidden rounded-lg bg-primary-tint">
            <div className="w-1 shrink-0 self-stretch bg-primary" />
            <div className="flex items-start gap-3 p-4">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-body-sm font-medium text-navy-800">
                  New clinical guideline available
                </p>
                <p className="text-body-sm text-text-secondary mt-0.5">
                  Updated HbA1c monitoring protocol for Type 2 Diabetes
                  patients.
                </p>
              </div>
            </div>
          </div>
          <div className="flex overflow-hidden rounded-lg bg-success-tint">
            <div className="w-1 shrink-0 self-stretch bg-success" />
            <div className="flex items-start gap-3 p-4">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <div>
                <p className="text-body-sm font-medium text-navy-800">
                  Compliance target reached
                </p>
                <p className="text-body-sm text-text-secondary mt-0.5">
                  Annual wellness visits now at 94% — exceeding the 90% goal.
                </p>
              </div>
            </div>
          </div>
          <div className="flex overflow-hidden rounded-lg bg-warning-tint">
            <div className="w-1 shrink-0 self-stretch bg-warning" />
            <div className="flex items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <p className="text-body-sm font-medium text-navy-800">
                  Medication interaction flagged
                </p>
                <p className="text-body-sm text-text-secondary mt-0.5">
                  Review patient PAT-2024-00312 — potential NSAID/ACE inhibitor
                  interaction detected.
                </p>
              </div>
            </div>
          </div>
          <div className="flex overflow-hidden rounded-lg bg-error-tint">
            <div className="w-1 shrink-0 self-stretch bg-error" />
            <div className="flex items-start gap-3 p-4">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-error" />
              <div>
                <p className="text-body-sm font-medium text-navy-800">
                  Critical lab result
                </p>
                <p className="text-body-sm text-text-secondary mt-0.5">
                  Patient PAT-2024-00847 — potassium level 6.2 mEq/L requires
                  immediate review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
