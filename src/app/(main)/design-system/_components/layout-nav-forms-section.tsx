"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

// Layout components
import {
  LayoutCard,
  CardContent as LCardContent,
  CardHeader as LCardHeader,
  CardTitle as LCardTitle,
} from "@/components/layout/card";
import { Grid } from "@/components/layout/grid";
import { Stack } from "@/components/layout/stack";
import { Panel } from "@/components/layout/panel";
import { Divider } from "@/components/layout/divider";
import { Section as LayoutSection } from "@/components/layout/section";

// Navigation components
import { PageTabs, PageTabsContent } from "@/components/navigation/page-tabs";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

// Form components
import { SearchBar } from "@/components/forms/search-bar";
import { FilterBar, type FilterConfig } from "@/components/forms/filter-bar";
import { DatePicker } from "@/components/forms/date-picker";
import { DateRangeSelector } from "@/components/forms/date-range-selector";
import { MultiSelect } from "@/components/forms/multi-select";
import { FormField } from "@/components/forms/form-field";

import { Section, SubSection } from "./helpers";

/* ─── Demo filter configs ─── */
const DEMO_FILTERS: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ],
  },
  {
    key: "risk",
    label: "Risk Level",
    options: [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
    ],
  },
];

const MULTI_OPTIONS = [
  { label: "Cardiology", value: "cardiology" },
  { label: "Oncology", value: "oncology" },
  { label: "Neurology", value: "neurology" },
  { label: "Primary Care", value: "primary-care" },
  { label: "Endocrinology", value: "endocrinology" },
];

export function LayoutNavFormsSection() {
  const [searchValue, setSearchValue] = useState("");
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({});
  const [dateValue, setDateValue] = useState<Date | undefined>();
  const [rangeStart, setRangeStart] = useState<Date | undefined>();
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>();
  const [multiValue, setMultiValue] = useState<string[]>([
    "cardiology",
    "neurology",
  ]);

  return (
    <>
      {/* ─── Layout Components ─── */}
      <Section id="layout-components" title="Layout Components">
        <SubSection
          title="LayoutCard"
          description="Extended card with variant styling: default, muted, glass, interactive"
        >
          <Grid cols={4} gap="default">
            <LayoutCard>
              <LCardHeader>
                <LCardTitle>Default</LCardTitle>
              </LCardHeader>
              <LCardContent>
                <p className="text-body-sm text-muted-foreground">
                  Standard white card
                </p>
              </LCardContent>
            </LayoutCard>
            <LayoutCard variant="muted">
              <LCardHeader>
                <LCardTitle>Muted</LCardTitle>
              </LCardHeader>
              <LCardContent>
                <p className="text-body-sm text-muted-foreground">
                  Recessed background
                </p>
              </LCardContent>
            </LayoutCard>
            <div
              className="rounded-[17px] p-[3px]"
              style={{
                background:
                  "linear-gradient(135deg, #0B8585 0%, #2A4365 50%, #0A7373 100%)",
              }}
            >
              <LayoutCard variant="glass">
                <LCardHeader>
                  <LCardTitle>Glass</LCardTitle>
                </LCardHeader>
                <LCardContent>
                  <p className="text-body-sm text-muted-foreground">
                    Frosted effect
                  </p>
                </LCardContent>
              </LayoutCard>
            </div>
            <LayoutCard variant="interactive">
              <LCardHeader>
                <LCardTitle>Interactive</LCardTitle>
              </LCardHeader>
              <LCardContent>
                <p className="text-body-sm text-muted-foreground">
                  Hover to see lift
                </p>
              </LCardContent>
            </LayoutCard>
          </Grid>
        </SubSection>

        <SubSection
          title="Grid"
          description="Responsive grid — 1/2/3/4 columns, collapses on mobile"
        >
          <Grid cols={3} gap="sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-bg-muted p-4 text-center text-body-sm text-text-secondary"
              >
                Grid item {i + 1}
              </div>
            ))}
          </Grid>
        </SubSection>

        <SubSection
          title="Stack"
          description="Flexbox helper — direction, gap, align, justify"
        >
          <div className="flex gap-8">
            <div>
              <p className="text-caption text-text-muted mb-2">COLUMN</p>
              <Stack gap="sm">
                <div className="rounded bg-primary-tint px-3 py-1.5 text-body-sm">
                  Item 1
                </div>
                <div className="rounded bg-primary-tint px-3 py-1.5 text-body-sm">
                  Item 2
                </div>
                <div className="rounded bg-primary-tint px-3 py-1.5 text-body-sm">
                  Item 3
                </div>
              </Stack>
            </div>
            <div>
              <p className="text-caption text-text-muted mb-2">ROW</p>
              <Stack direction="row" gap="sm" align="center">
                <div className="rounded bg-primary-tint px-3 py-1.5 text-body-sm">
                  Item 1
                </div>
                <div className="rounded bg-primary-tint px-3 py-3 text-body-sm">
                  Item 2
                </div>
                <div className="rounded bg-primary-tint px-3 py-1.5 text-body-sm">
                  Item 3
                </div>
              </Stack>
            </div>
          </div>
        </SubSection>

        <SubSection title="Panel" description="Container with configurable padding">
          <div className="flex flex-wrap gap-4">
            {(["none", "sm", "default", "lg"] as const).map((p) => (
              <Panel key={p} padding={p} className="min-w-32">
                <div className="rounded bg-bg-muted p-2 text-body-sm text-text-secondary text-center">
                  padding=&quot;{p}&quot;
                </div>
              </Panel>
            ))}
          </div>
        </SubSection>

        <SubSection
          title="Divider"
          description="Horizontal or vertical separator"
        >
          <div className="flex items-center gap-4">
            <span className="text-body-sm">Left</span>
            <Divider orientation="vertical" className="h-6" />
            <span className="text-body-sm">Right</span>
          </div>
          <Divider className="my-2" />
          <p className="text-body-sm text-text-secondary">
            Content below a horizontal divider
          </p>
        </SubSection>

        <SubSection
          title="Section"
          description="Content grouping with optional title + border"
        >
          <LayoutSection title="Example Section" description="Description text for context">
            <div className="rounded-lg bg-bg-muted p-4 text-body-sm text-text-secondary">
              Section content goes here
            </div>
          </LayoutSection>
        </SubSection>
      </Section>

      {/* ─── Navigation Components ─── */}
      <Section id="navigation-components" title="Navigation Components">
        <SubSection
          title="Breadcrumbs"
          description="Navigation trail with semantic markup"
        >
          <Breadcrumbs
            items={[
              { label: "Dashboard", href: "/" },
              { label: "Patients", href: "/patients" },
              { label: "John Smith" },
            ]}
          />
        </SubSection>

        <SubSection
          title="PageTabs"
          description="Uppercase underline tabs — line variant with teal active indicator"
        >
          <PageTabs
            tabs={[
              { value: "overview", label: "Overview" },
              { value: "risk", label: "Risk Analysis" },
              { value: "demographics", label: "Demographics" },
              { value: "audit", label: "Audit Log" },
            ]}
            defaultValue="overview"
          >
            <PageTabsContent value="overview">
              <div className="rounded-lg bg-bg-muted p-4 text-body-sm text-text-secondary">
                Overview tab content
              </div>
            </PageTabsContent>
            <PageTabsContent value="risk">
              <div className="rounded-lg bg-bg-muted p-4 text-body-sm text-text-secondary">
                Risk analysis tab content
              </div>
            </PageTabsContent>
            <PageTabsContent value="demographics">
              <div className="rounded-lg bg-bg-muted p-4 text-body-sm text-text-secondary">
                Demographics tab content
              </div>
            </PageTabsContent>
            <PageTabsContent value="audit">
              <div className="rounded-lg bg-bg-muted p-4 text-body-sm text-text-secondary">
                Audit log tab content
              </div>
            </PageTabsContent>
          </PageTabs>
        </SubSection>
      </Section>

      {/* ─── Form Components ─── */}
      <Section id="form-components" title="Form Components">
        <SubSection
          title="SearchBar"
          description="Debounced search with icon and clear button"
        >
          <div className="max-w-sm">
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Search patients..."
              debounce={300}
            />
          </div>
        </SubSection>

        <SubSection
          title="FilterBar"
          description="Horizontal filter dropdowns with actions"
        >
          <FilterBar
            filters={DEMO_FILTERS}
            activeFilters={activeFilters}
            onFilterChange={(key, value) =>
              setActiveFilters((prev) => ({ ...prev, [key]: value }))
            }
            onClear={() => setActiveFilters({})}
            actions={
              <>
                <Button variant="outline" size="sm">
                  <Download className="size-4" data-icon="inline-start" />
                  Export
                </Button>
                <Button size="sm">
                  <Plus className="size-4" data-icon="inline-start" />
                  New Patient
                </Button>
              </>
            }
          />
        </SubSection>

        <SubSection
          title="DatePicker"
          description="Calendar popover with month navigation"
        >
          <DatePicker
            value={dateValue}
            onChange={setDateValue}
            placeholder="Select a date"
          />
        </SubSection>

        <SubSection
          title="DateRangeSelector"
          description="Two date pickers with preset ranges"
        >
          <DateRangeSelector
            startDate={rangeStart}
            endDate={rangeEnd}
            onChange={({ start, end }) => {
              setRangeStart(start);
              setRangeEnd(end);
            }}
          />
        </SubSection>

        <SubSection
          title="MultiSelect"
          description="Searchable dropdown with removable chips"
        >
          <div className="max-w-sm">
            <MultiSelect
              options={MULTI_OPTIONS}
              value={multiValue}
              onChange={setMultiValue}
              placeholder="Select departments..."
            />
          </div>
        </SubSection>

        <SubSection
          title="FormField"
          description="Wrapper for label, error, and hint text"
        >
          <div className="grid max-w-lg grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Full Name" htmlFor="name" required>
              <Input id="name" placeholder="Dr. Sarah Chen" />
            </FormField>
            <FormField
              label="Email"
              htmlFor="email"
              error="Invalid email address"
            >
              <Input id="email" placeholder="doctor@hospital.org" aria-invalid />
            </FormField>
            <FormField label="Notes" htmlFor="notes" hint="Optional. Max 500 characters.">
              <Textarea id="notes" placeholder="Additional notes..." />
            </FormField>
            <div className="space-y-4">
              <FormField label="Notifications">
                <div className="flex items-center gap-2">
                  <Checkbox id="notify" />
                  <label htmlFor="notify" className="text-sm">
                    Email notifications
                  </label>
                </div>
              </FormField>
              <FormField label="Active">
                <Switch />
              </FormField>
            </div>
          </div>
        </SubSection>
      </Section>
    </>
  );
}
