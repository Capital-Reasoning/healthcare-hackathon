"use client";

import { useState } from "react";
import {
  Users,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Inbox,
} from "lucide-react";
import { Grid } from "@/components/layout/grid";
import { Panel } from "@/components/layout/panel";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  StatCard,
  DataBadge,
  KeyValue,
  List,
  DataTable,
  type ColumnDef,
  Carousel,
  ImageCard,
  ComparisonTable,
  KanbanBoard,
  type KanbanColumn,
} from "@/components/data-display";
import { Section, SubSection } from "./helpers";

/* ─── DataTable demo data ─── */
interface DemoPatientRow {
  id: string;
  name: string;
  age: number;
  department: string;
  risk: string;
}

const DEMO_TABLE_DATA: DemoPatientRow[] = [
  { id: "PAT-001", name: "Sarah Johnson", age: 45, department: "Cardiology", risk: "Low" },
  { id: "PAT-002", name: "Michael Chen", age: 62, department: "Oncology", risk: "High" },
  { id: "PAT-003", name: "Emma Williams", age: 78, department: "Neurology", risk: "Critical" },
  { id: "PAT-004", name: "James Park", age: 34, department: "Primary Care", risk: "Low" },
  { id: "PAT-005", name: "Maria Garcia", age: 56, department: "Endocrinology", risk: "Medium" },
];

const DEMO_TABLE_COLUMNS: ColumnDef<DemoPatientRow, unknown>[] = [
  { accessorKey: "id", header: "Patient ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "age", header: "Age" },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "risk", header: "Risk Level" },
];

/* ─── KanbanBoard initial data ─── */
const INITIAL_KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: "todo",
    title: "To Do",
    items: [
      { id: "k1", title: "Review lab results", description: "PAT-001 — HbA1c panel" },
      { id: "k2", title: "Schedule follow-up", description: "PAT-003 — 30-day check" },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    items: [
      { id: "k3", title: "Update care plan", description: "PAT-002 — Chemo cycle 3" },
      { id: "k4", title: "Insurance pre-auth", description: "PAT-005 — MRI approval" },
      { id: "k5", title: "Medication reconciliation", description: "PAT-004 — Post-discharge" },
    ],
  },
  {
    id: "done",
    title: "Done",
    items: [
      { id: "k6", title: "Referral sent", description: "PAT-001 — Cardiology consult" },
      { id: "k7", title: "Discharge summary", description: "PAT-003 — Completed" },
    ],
  },
];

export function DataDisplaySection() {
  const [kanbanColumns, setKanbanColumns] = useState<KanbanColumn[]>(INITIAL_KANBAN_COLUMNS);

  return (
    <Section id="data-display-components" title="Data Display Components">
      <SubSection
        title="StatCard"
        description="Metric display card with label, value, icon, and trend indicator"
      >
        <Grid cols={4} gap="default">
          <StatCard
            label="TOTAL PATIENTS"
            value="2,847"
            icon={<Users />}
            trend={{
              value: "+12.5%",
              direction: "up",
              label: "vs last quarter",
              sentiment: "positive",
            }}
          />
          <StatCard
            label="ACTIVE CASES"
            value="184"
            icon={<Activity />}
            trend={{
              value: "+3.2%",
              direction: "up",
              label: "this month",
              sentiment: "positive",
            }}
          />
          <StatCard
            label="HIGH RISK"
            value="23"
            icon={<AlertTriangle />}
            trend={{
              value: "-8.1%",
              direction: "down",
              label: "vs last month",
              sentiment: "positive",
            }}
          />
          <StatCard
            label="AVG SCORE"
            value="74.2"
            icon={<ShieldCheck />}
            trend={{
              value: "0.0%",
              direction: "flat",
              label: "no change",
              sentiment: "neutral",
            }}
          />
        </Grid>
      </SubSection>

      <SubSection
        title="DataBadge"
        description="Rich badge component with variants, sizes, dots, and dismiss"
      >
        <div className="space-y-4">
          <div>
            <p className="text-caption text-text-muted mb-2">VARIANTS</p>
            <div className="flex flex-wrap items-center gap-2">
              <DataBadge variant="default">Default</DataBadge>
              <DataBadge variant="primary">Primary</DataBadge>
              <DataBadge variant="secondary">Secondary</DataBadge>
              <DataBadge variant="success">Success</DataBadge>
              <DataBadge variant="warning">Warning</DataBadge>
              <DataBadge variant="error">Error</DataBadge>
              <DataBadge variant="outline">Outline</DataBadge>
            </div>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-2">SIZES</p>
            <div className="flex flex-wrap items-center gap-2">
              <DataBadge size="sm">Small</DataBadge>
              <DataBadge size="default">Default</DataBadge>
              <DataBadge size="lg">Large</DataBadge>
            </div>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-2">DOT INDICATOR</p>
            <div className="flex flex-wrap items-center gap-2">
              <DataBadge variant="success" dot>Active</DataBadge>
              <DataBadge variant="warning" dot>Pending</DataBadge>
              <DataBadge variant="error" dot>Critical</DataBadge>
            </div>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-2">DISMISSIBLE</p>
            <div className="flex flex-wrap items-center gap-2">
              <DataBadge variant="primary" dismissible onDismiss={() => {}}>
                Removable Tag
              </DataBadge>
              <DataBadge variant="secondary" dismissible onDismiss={() => {}}>
                Another Tag
              </DataBadge>
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection
        title="KeyValue"
        description="Key-value pair display in horizontal, vertical, or grid layouts"
      >
        <div className="space-y-6">
          <div>
            <p className="text-caption text-text-muted mb-2">HORIZONTAL</p>
            <Panel className="max-w-md">
              <KeyValue
                layout="horizontal"
                items={[
                  { label: "Patient ID", value: "PAT-2024-00847" },
                  { label: "Status", value: "Active" },
                  { label: "Provider", value: "Dr. Sarah Chen" },
                  { label: "Last Visit", value: "Mar 15, 2026" },
                ]}
              />
            </Panel>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-2">VERTICAL</p>
            <Panel className="max-w-md">
              <KeyValue
                layout="vertical"
                items={[
                  { label: "Diagnosis", value: "Type 2 Diabetes Mellitus" },
                  { label: "ICD-10", value: "E11.9" },
                  { label: "HbA1c", value: "7.2%" },
                ]}
              />
            </Panel>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-2">GRID (3 COLUMNS)</p>
            <Panel>
              <KeyValue
                layout="grid"
                columns={3}
                items={[
                  { label: "Blood Type", value: "O+" },
                  { label: "Height", value: "5'10\"" },
                  { label: "Weight", value: "172 lbs" },
                  { label: "BMI", value: "24.7" },
                  { label: "Allergies", value: "Penicillin" },
                  { label: "Insurance", value: "BlueCross PPO" },
                ]}
              />
            </Panel>
          </div>
        </div>
      </SubSection>

      <SubSection
        title="List"
        description="Simple list component with dividers and empty state"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Panel>
            <p className="text-caption text-text-muted mb-3">WITH ITEMS</p>
            <List
              items={[
                "Annual wellness visit scheduled",
                "Lab results reviewed — HbA1c within range",
                "Medication refill processed",
                "Follow-up appointment in 3 months",
              ]}
              renderItem={(item) => (
                <div className="py-2 text-body-sm text-foreground">{item}</div>
              )}
            />
          </Panel>
          <Panel>
            <p className="text-caption text-text-muted mb-3">EMPTY STATE</p>
            <List
              items={[]}
              renderItem={() => null}
              emptyState={
                <EmptyState
                  icon={<Inbox className="size-8" />}
                  title="No records"
                  description="No items to display yet."
                />
              }
            />
          </Panel>
        </div>
      </SubSection>

      <SubSection
        title="DataTable"
        description="Full-featured table with sorting, pagination, and row actions"
      >
        <Panel>
          <DataTable
            data={DEMO_TABLE_DATA}
            columns={DEMO_TABLE_COLUMNS}
            sortable
            pagination={{ pageSize: 5 }}
          />
        </Panel>
      </SubSection>

      <SubSection
        title="Carousel"
        description="Slide-based carousel with arrows and dots"
      >
        <div className="max-w-xl">
          <Carousel
            items={[
              <div key="1" className="flex h-48 items-center justify-center rounded-lg bg-primary-tint">
                <p className="text-h2 text-primary">Slide 1</p>
              </div>,
              <div key="2" className="flex h-48 items-center justify-center rounded-lg bg-success-tint">
                <p className="text-h2 text-success">Slide 2</p>
              </div>,
              <div key="3" className="flex h-48 items-center justify-center rounded-lg bg-warning-tint">
                <p className="text-h2 text-warning">Slide 3</p>
              </div>,
            ]}
          />
        </div>
      </SubSection>

      <SubSection
        title="ImageCard"
        description="Card wrapping an image with optional caption"
      >
        <div className="max-w-sm">
          <ImageCard
            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' fill='%230B8585'%3E%3Crect width='400' height='225' rx='0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' fill='white' font-size='18' font-family='sans-serif'%3EPlaceholder Image%3C/text%3E%3C/svg%3E"
            alt="Placeholder image"
            caption="Sample medical imaging result — March 2026"
          />
        </div>
      </SubSection>

      <SubSection
        title="ComparisonTable"
        description="Side-by-side comparison of items across features"
      >
        <Panel>
          <ComparisonTable
            items={[
              {
                name: "Plan A",
                values: {
                  "Monthly Cost": "$250",
                  "Deductible": "$1,500",
                  "Coverage": "80%",
                  "Network": "PPO",
                },
              },
              {
                name: "Plan B",
                values: {
                  "Monthly Cost": "$180",
                  "Deductible": "$3,000",
                  "Coverage": "70%",
                  "Network": "HMO",
                },
              },
            ]}
            columns={["Monthly Cost", "Deductible", "Coverage", "Network"]}
            highlightDifferences
          />
        </Panel>
      </SubSection>

      <SubSection
        title="KanbanBoard"
        description="Drag-and-drop board with configurable columns"
      >
        <KanbanBoard
          columns={kanbanColumns}
          onDragEnd={(result) => {
            setKanbanColumns((prev) => {
              const cols = prev.map((c) => ({ ...c, items: [...c.items] }));
              const fromCol = cols.find((c) => c.id === result.fromColumn);
              const toCol = cols.find((c) => c.id === result.toColumn);
              if (!fromCol || !toCol) return prev;
              const [moved] = fromCol.items.splice(result.fromIndex, 1);
              if (moved) toCol.items.splice(result.toIndex, 0, moved);
              return cols;
            });
          }}
        />
      </SubSection>
    </Section>
  );
}
