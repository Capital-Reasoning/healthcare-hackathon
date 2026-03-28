"use client";

import { useState } from "react";
import {
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  Download,
  Plus,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { Page } from "@/components/layout/page";
import { Section } from "@/components/layout/section";
import { LayoutCard, CardContent, CardHeader, CardTitle } from "@/components/layout/card";
import { Grid } from "@/components/layout/grid";
import { PageTabs, PageTabsContent } from "@/components/navigation/page-tabs";
import { FilterBar, type FilterConfig } from "@/components/forms/filter-bar";
import { StatusAlert } from "@/components/feedback/status-alert";
import { Button } from "@/components/ui/button";

import { StatCard } from "@/components/data-display";
import { DataTable } from "@/components/data-display";
import { DataBadge } from "@/components/data-display";
import { LineChart, DonutChart, BarChart } from "@/components/charts";
import { RiskBadge, Timeline } from "@/components/healthcare";
import type { RiskLevel } from "@/components/healthcare";
import type { EventType, EventStatus } from "@/components/healthcare";

/* ─── Demo Data ──────────────────────────────────────── */

interface DemoPatient {
  id: string;
  name: string;
  mrn: string;
  age: number;
  gender: "Male" | "Female";
  status: "Active" | "Inactive" | "Discharged";
  riskLevel: RiskLevel;
  lastVisit: string;
  primaryCondition: string;
}

const DEMO_PATIENTS: DemoPatient[] = [
  { id: "1", name: "Maria Santos", mrn: "MRN-001234", age: 67, gender: "Female", status: "Active", riskLevel: "high", lastVisit: "2026-03-18", primaryCondition: "Heart Failure" },
  { id: "2", name: "James Chen", mrn: "MRN-001891", age: 54, gender: "Male", status: "Active", riskLevel: "medium", lastVisit: "2026-03-20", primaryCondition: "Type 2 Diabetes" },
  { id: "3", name: "Aisha Johnson", mrn: "MRN-002103", age: 45, gender: "Female", status: "Active", riskLevel: "low", lastVisit: "2026-03-15", primaryCondition: "Hypertension" },
  { id: "4", name: "Robert Kim", mrn: "MRN-001567", age: 72, gender: "Male", status: "Active", riskLevel: "critical", lastVisit: "2026-03-21", primaryCondition: "COPD" },
  { id: "5", name: "Elena Vasquez", mrn: "MRN-003421", age: 38, gender: "Female", status: "Active", riskLevel: "low", lastVisit: "2026-03-10", primaryCondition: "Asthma" },
  { id: "6", name: "David Thompson", mrn: "MRN-002876", age: 61, gender: "Male", status: "Inactive", riskLevel: "medium", lastVisit: "2026-02-28", primaryCondition: "Chronic Kidney Disease" },
  { id: "7", name: "Priya Patel", mrn: "MRN-001098", age: 29, gender: "Female", status: "Active", riskLevel: "low", lastVisit: "2026-03-19", primaryCondition: "Anxiety Disorder" },
  { id: "8", name: "Marcus Williams", mrn: "MRN-004512", age: 78, gender: "Male", status: "Active", riskLevel: "high", lastVisit: "2026-03-17", primaryCondition: "Atrial Fibrillation" },
  { id: "9", name: "Sarah O'Brien", mrn: "MRN-002345", age: 52, gender: "Female", status: "Discharged", riskLevel: "low", lastVisit: "2026-03-05", primaryCondition: "Post-Surgical Recovery" },
  { id: "10", name: "Ahmed Hassan", mrn: "MRN-003890", age: 63, gender: "Male", status: "Active", riskLevel: "medium", lastVisit: "2026-03-16", primaryCondition: "Type 2 Diabetes" },
  { id: "11", name: "Catherine Lee", mrn: "MRN-001456", age: 41, gender: "Female", status: "Active", riskLevel: "low", lastVisit: "2026-03-14", primaryCondition: "Migraine" },
  { id: "12", name: "William Brown", mrn: "MRN-005234", age: 85, gender: "Male", status: "Active", riskLevel: "critical", lastVisit: "2026-03-22", primaryCondition: "Heart Failure" },
  { id: "13", name: "Lisa Nakamura", mrn: "MRN-002789", age: 56, gender: "Female", status: "Active", riskLevel: "medium", lastVisit: "2026-03-12", primaryCondition: "Rheumatoid Arthritis" },
  { id: "14", name: "Thomas Garcia", mrn: "MRN-004100", age: 33, gender: "Male", status: "Inactive", riskLevel: "low", lastVisit: "2026-01-20", primaryCondition: "Depression" },
  { id: "15", name: "Nancy Wright", mrn: "MRN-003567", age: 70, gender: "Female", status: "Active", riskLevel: "high", lastVisit: "2026-03-21", primaryCondition: "Hypertension" },
];

const statusVariant: Record<DemoPatient["status"], "success" | "secondary" | "outline"> = {
  Active: "success",
  Inactive: "secondary",
  Discharged: "outline",
};

const PATIENT_COLUMNS: ColumnDef<DemoPatient, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "mrn", header: "MRN" },
  { accessorKey: "age", header: "Age" },
  { accessorKey: "gender", header: "Gender" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return <DataBadge variant={statusVariant[status]} size="sm">{status}</DataBadge>;
    },
  },
  {
    accessorKey: "riskLevel",
    header: "Risk Level",
    cell: ({ row }) => <RiskBadge level={row.original.riskLevel} size="sm" />,
  },
  {
    accessorKey: "lastVisit",
    header: "Last Visit",
    cell: ({ row }) => {
      const d = new Date(row.original.lastVisit);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    },
  },
  { accessorKey: "primaryCondition", header: "Primary Condition" },
];

/* ─── Risk Analysis Data ─────────────────────────────── */

const RISK_DISTRIBUTION = [
  { name: "Low", value: 1847, color: "var(--success)" },
  { name: "Medium", value: 653, color: "var(--warning)" },
  { name: "High", value: 300, color: "var(--error)" },
  { name: "Critical", value: 47, color: "var(--error)" },
];

const RISK_TREND_DATA = [
  { month: "Oct", avgScore: 0.41, highRisk: 62 },
  { month: "Nov", avgScore: 0.39, highRisk: 58 },
  { month: "Dec", avgScore: 0.38, highRisk: 55 },
  { month: "Jan", avgScore: 0.36, highRisk: 52 },
  { month: "Feb", avgScore: 0.35, highRisk: 49 },
  { month: "Mar", avgScore: 0.34, highRisk: 47 },
];

/* ─── Demographics Data ──────────────────────────────── */

const AGE_DISTRIBUTION = [
  { range: "18-30", count: 312 },
  { range: "31-45", count: 587 },
  { range: "46-60", count: 823 },
  { range: "61-75", count: 741 },
  { range: "75+", count: 384 },
];

const GENDER_DISTRIBUTION = [
  { name: "Female", value: 1526 },
  { name: "Male", value: 1289 },
  { name: "Non-binary", value: 32 },
];

/* ─── Audit Log Data ─────────────────────────────────── */

const AUDIT_EVENTS: {
  title: string;
  description: string;
  timestamp: string;
  type: EventType;
  status: EventStatus;
}[] = [
  {
    title: "Patient Encounter — Maria Santos",
    description: "Cardiology follow-up. Updated medication regimen for heart failure management.",
    timestamp: "2026-03-22T09:15:00",
    type: "encounter",
    status: "completed",
  },
  {
    title: "Medication Change — Robert Kim",
    description: "Switched from Albuterol to Symbicort per pulmonologist recommendation.",
    timestamp: "2026-03-21T14:30:00",
    type: "medication",
    status: "completed",
  },
  {
    title: "Lab Result — James Chen",
    description: "HbA1c result: 7.2%. Slight improvement from previous 7.8%.",
    timestamp: "2026-03-21T11:00:00",
    type: "lab",
    status: "completed",
  },
  {
    title: "Procedure Scheduled — William Brown",
    description: "Echocardiogram scheduled for March 25 to evaluate cardiac function.",
    timestamp: "2026-03-20T16:45:00",
    type: "procedure",
    status: "pending",
  },
  {
    title: "Clinical Note — Nancy Wright",
    description: "Blood pressure remains elevated despite titration. Considering adding amlodipine.",
    timestamp: "2026-03-20T10:20:00",
    type: "note",
    status: "completed",
  },
  {
    title: "Lab Order Cancelled — Sarah O'Brien",
    description: "Post-discharge CBC cancelled per patient request after full recovery confirmation.",
    timestamp: "2026-03-19T08:00:00",
    type: "lab",
    status: "cancelled",
  },
];

/* ─── Static Config ──────────────────────────────────── */

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "risk", label: "Risk Analysis" },
  { value: "demographics", label: "Demographics" },
  { value: "audit", label: "Audit Log" },
];

const FILTERS: FilterConfig[] = [
  {
    key: "status",
    label: "Status",
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
      { label: "Discharged", value: "discharged" },
    ],
  },
  {
    key: "risk",
    label: "Risk Level",
    options: [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
      { label: "Critical", value: "critical" },
    ],
  },
  {
    key: "department",
    label: "Department",
    options: [
      { label: "Cardiology", value: "cardiology" },
      { label: "Oncology", value: "oncology" },
      { label: "Neurology", value: "neurology" },
      { label: "Primary Care", value: "primary-care" },
    ],
  },
];

/* ─── Page Component ─────────────────────────────────── */

export default function DashboardPage() {
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({});

  return (
    <Page
      title="Patient Population Overview"
      description="Real-time population health metrics and AI-powered data analysis"
      breadcrumbs={[
        { label: "Dashboard", href: "/" },
        { label: "Population Overview" },
      ]}
    >
      {/* At a Glance */}
      <Section title="At a Glance">
        <Grid cols={4} gap="default">
          <StatCard
            label="Total Patients"
            value="2,847"
            icon={<Users />}
            trend={{
              value: "+12.3%",
              direction: "up",
              label: "vs prev. period",
              sentiment: "positive",
            }}
          />
          <StatCard
            label="Active Cases"
            value="384"
            icon={<Activity />}
            trend={{
              value: "+3.1%",
              direction: "up",
              label: "vs prev. period",
              sentiment: "positive",
            }}
          />
          <StatCard
            label="High Risk"
            value="47"
            icon={<AlertTriangle />}
            trend={{
              value: "-8.2%",
              direction: "down",
              label: "vs prev. period",
              sentiment: "positive",
            }}
          />
          <StatCard
            label="Avg. Risk Score"
            value="0.34"
            icon={<TrendingUp />}
            trend={{
              value: "-2.1%",
              direction: "down",
              label: "vs prev. period",
              sentiment: "positive",
            }}
          />
        </Grid>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <div className="flex flex-col gap-3">
          <StatusAlert
            variant="warning"
            title="Bias Detection Alert"
            description="Potential demographic bias detected in risk scoring model for patients aged 65+. Review recommended."
          />
          <StatusAlert
            variant="success"
            title="Data Pipeline Healthy"
            description="All data sources are synced and up to date. Last sync: 5 minutes ago."
          />
        </div>
      </Section>

      {/* Patient Records */}
      <Section title="Patient Records">
        <PageTabs tabs={TABS} defaultValue="overview">
          {/* ── Overview Tab ── */}
          <PageTabsContent value="overview">
            <div className="flex flex-col gap-4">
              <FilterBar
                filters={FILTERS}
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

              <DataTable<DemoPatient>
                data={DEMO_PATIENTS}
                columns={PATIENT_COLUMNS}
                pagination={{ pageSize: 10 }}
                sortable
                selectable
              />
            </div>
          </PageTabsContent>

          {/* ── Risk Analysis Tab ── */}
          <PageTabsContent value="risk">
            <div className="flex flex-col gap-6">
              <Grid cols={2} gap="default">
                <LayoutCard>
                  <CardHeader>
                    <CardTitle>Risk Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DonutChart
                      data={RISK_DISTRIBUTION}
                      height={300}
                      label={
                        <div>
                          <div className="text-display text-foreground">2,847</div>
                          <div className="text-caption text-muted-foreground">Total Patients</div>
                        </div>
                      }
                    />
                  </CardContent>
                </LayoutCard>

                <LayoutCard>
                  <CardHeader>
                    <CardTitle>Risk Score Trends (6 Months)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LineChart
                      data={RISK_TREND_DATA}
                      xKey="month"
                      yKeys={["avgScore", "highRisk"]}
                      height={300}
                      area
                      showLegend
                    />
                  </CardContent>
                </LayoutCard>
              </Grid>
            </div>
          </PageTabsContent>

          {/* ── Demographics Tab ── */}
          <PageTabsContent value="demographics">
            <div className="flex flex-col gap-6">
              <Grid cols={2} gap="default">
                <LayoutCard>
                  <CardHeader>
                    <CardTitle>Age Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BarChart
                      data={AGE_DISTRIBUTION}
                      xKey="range"
                      yKeys={["count"]}
                      height={300}
                    />
                  </CardContent>
                </LayoutCard>

                <LayoutCard>
                  <CardHeader>
                    <CardTitle>Gender Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DonutChart
                      data={GENDER_DISTRIBUTION}
                      height={300}
                      label={
                        <div>
                          <div className="text-display text-foreground">2,847</div>
                          <div className="text-caption text-muted-foreground">Patients</div>
                        </div>
                      }
                    />
                  </CardContent>
                </LayoutCard>
              </Grid>
            </div>
          </PageTabsContent>

          {/* ── Audit Log Tab ── */}
          <PageTabsContent value="audit">
            <LayoutCard>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <Timeline events={AUDIT_EVENTS} />
              </CardContent>
            </LayoutCard>
          </PageTabsContent>
        </PageTabs>
      </Section>
    </Page>
  );
}
