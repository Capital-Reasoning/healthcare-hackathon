"use client";

import { Grid } from "@/components/layout/grid";
import { Panel } from "@/components/layout/panel";
import {
  BarChart,
  LineChart,
  DonutChart,
  SparkLine,
  AreaChart,
  HeatMap,
  ScatterPlot,
  RadarChart,
  GaugeChart,
  TreeMap,
} from "@/components/charts";
import {
  PatientCard,
  RiskBadge,
  Timeline,
  VitalSign,
  MedicationCard,
} from "@/components/healthcare";
import { Section, SubSection } from "./helpers";

export function ChartsHealthcareSection() {
  return (
    <>
      {/* ─── Charts ─── */}
      <Section id="charts" title="Charts">
        <SubSection
          title="BarChart"
          description="Multi-series bar chart with categorical X axis"
        >
          <Panel>
            <BarChart
              data={[
                { month: "Jan", revenue: 4200, expenses: 2800 },
                { month: "Feb", revenue: 3800, expenses: 2600 },
                { month: "Mar", revenue: 5100, expenses: 3200 },
                { month: "Apr", revenue: 4600, expenses: 2900 },
                { month: "May", revenue: 5400, expenses: 3100 },
                { month: "Jun", revenue: 6200, expenses: 3500 },
              ]}
              xKey="month"
              yKeys={["revenue", "expenses"]}
              colors={["var(--chart-1)", "var(--chart-4)"]}
              height={300}
            />
          </Panel>
        </SubSection>

        <SubSection
          title="LineChart"
          description="Trend line chart with optional area fill"
        >
          <Panel>
            <LineChart
              data={[
                { week: "W1", admissions: 42, discharges: 38 },
                { week: "W2", admissions: 35, discharges: 40 },
                { week: "W3", admissions: 48, discharges: 44 },
                { week: "W4", admissions: 52, discharges: 49 },
                { week: "W5", admissions: 38, discharges: 42 },
                { week: "W6", admissions: 45, discharges: 46 },
                { week: "W7", admissions: 55, discharges: 50 },
              ]}
              xKey="week"
              yKeys={["admissions", "discharges"]}
              colors={["var(--chart-1)", "var(--chart-4)"]}
              area
              height={300}
            />
          </Panel>
        </SubSection>

        <SubSection
          title="DonutChart"
          description="Category breakdown with center label"
        >
          <Panel>
            <DonutChart
              data={[
                { name: "Cardiology", value: 340 },
                { name: "Oncology", value: 210 },
                { name: "Neurology", value: 180 },
                { name: "Primary Care", value: 420 },
                { name: "Other", value: 150 },
              ]}
              height={300}
              label={
                <div>
                  <p className="text-display text-navy-800">1,300</p>
                  <p className="text-caption text-text-muted">Total Patients</p>
                </div>
              }
            />
          </Panel>
        </SubSection>

        <SubSection
          title="SparkLine"
          description="Inline micro-charts for embedding in text or tables"
        >
          <div className="flex flex-wrap items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-body-sm text-text-secondary">Admissions</span>
              <SparkLine data={[10, 14, 8, 16, 12, 18, 22]} height={24} width={80} />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-body-sm text-text-secondary">Revenue</span>
              <SparkLine data={[5, 8, 12, 10, 15, 18, 20]} color="var(--success)" height={32} width={100} showDot />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-body-sm text-text-secondary">Risk Score</span>
              <SparkLine data={[80, 72, 65, 70, 60, 55, 48]} color="var(--error)" height={40} width={120} showDot />
            </div>
          </div>
        </SubSection>

        <SubSection
          title="AreaChart"
          description="Stacked area chart showing cumulative trends"
        >
          <Panel>
            <AreaChart
              data={[
                { month: "Jan", inpatient: 120, outpatient: 340, emergency: 80 },
                { month: "Feb", inpatient: 130, outpatient: 360, emergency: 90 },
                { month: "Mar", inpatient: 115, outpatient: 380, emergency: 75 },
                { month: "Apr", inpatient: 140, outpatient: 400, emergency: 95 },
                { month: "May", inpatient: 125, outpatient: 420, emergency: 85 },
                { month: "Jun", inpatient: 150, outpatient: 440, emergency: 100 },
              ]}
              xKey="month"
              yKeys={["inpatient", "outpatient", "emergency"]}
              stacked
              height={300}
            />
          </Panel>
        </SubSection>

        <SubSection
          title="HeatMap"
          description="Color-intensity grid for matrix data"
        >
          <Panel>
            <HeatMap
              xLabels={["Q1", "Q2", "Q3", "Q4"]}
              yLabels={["Cardiology", "Oncology", "Neurology", "Primary Care"]}
              data={[
                { x: "Q1", y: "Cardiology", value: 85 },
                { x: "Q2", y: "Cardiology", value: 92 },
                { x: "Q3", y: "Cardiology", value: 78 },
                { x: "Q4", y: "Cardiology", value: 95 },
                { x: "Q1", y: "Oncology", value: 62 },
                { x: "Q2", y: "Oncology", value: 70 },
                { x: "Q3", y: "Oncology", value: 58 },
                { x: "Q4", y: "Oncology", value: 75 },
                { x: "Q1", y: "Neurology", value: 45 },
                { x: "Q2", y: "Neurology", value: 52 },
                { x: "Q3", y: "Neurology", value: 48 },
                { x: "Q4", y: "Neurology", value: 60 },
                { x: "Q1", y: "Primary Care", value: 90 },
                { x: "Q2", y: "Primary Care", value: 88 },
                { x: "Q3", y: "Primary Care", value: 95 },
                { x: "Q4", y: "Primary Care", value: 98 },
              ]}
            />
          </Panel>
        </SubSection>

        <SubSection
          title="ScatterPlot"
          description="Scatter chart for correlation analysis"
        >
          <Panel>
            <ScatterPlot
              data={[
                { age: 35, risk: 22 },
                { age: 42, risk: 35 },
                { age: 55, risk: 58 },
                { age: 60, risk: 65 },
                { age: 48, risk: 42 },
                { age: 38, risk: 28 },
                { age: 65, risk: 72 },
                { age: 50, risk: 48 },
                { age: 72, risk: 80 },
                { age: 45, risk: 38 },
                { age: 58, risk: 55 },
                { age: 32, risk: 18 },
              ]}
              xKey="age"
              yKey="risk"
              height={300}
            />
          </Panel>
        </SubSection>

        <SubSection
          title="RadarChart"
          description="Multi-axis radar with overlay series"
        >
          <Panel>
            <RadarChart
              data={[
                { metric: "Compliance", current: 85, target: 90 },
                { metric: "Outcomes", current: 78, target: 85 },
                { metric: "Satisfaction", current: 92, target: 88 },
                { metric: "Efficiency", current: 70, target: 80 },
                { metric: "Safety", current: 95, target: 92 },
              ]}
              axisKey="metric"
              valueKeys={["current", "target"]}
              colors={["var(--chart-1)", "var(--chart-4)"]}
              height={350}
            />
          </Panel>
        </SubSection>

        <SubSection
          title="GaugeChart"
          description="Semi-circular gauge for single-value KPIs"
        >
          <div className="flex flex-wrap items-end justify-center gap-8">
            <GaugeChart value={30} label="Low Risk" size={180} />
            <GaugeChart value={65} label="Moderate" size={180} />
            <GaugeChart value={90} label="Critical" size={180} />
          </div>
        </SubSection>

        <SubSection
          title="TreeMap"
          description="Hierarchical data as nested rectangles"
        >
          <Panel>
            <TreeMap
              data={[
                { name: "Cardiology", value: 340 },
                { name: "Primary Care", value: 420 },
                { name: "Oncology", value: 210 },
                { name: "Neurology", value: 180 },
                { name: "Orthopedics", value: 150 },
                { name: "Pediatrics", value: 120 },
              ]}
              height={300}
            />
          </Panel>
        </SubSection>
      </Section>

      {/* ─── Healthcare Components ─── */}
      <Section id="healthcare-components" title="Healthcare Components">
        <SubSection
          title="PatientCard"
          description="Patient summary card with avatar, demographics, and risk level"
        >
          <Grid cols={3} gap="default">
            <PatientCard
              name="Sarah Johnson"
              id="PAT-2024-00312"
              age={45}
              gender="Female"
              condition="Type 2 Diabetes"
              riskLevel="low"
              lastVisit="2026-03-10"
            />
            <PatientCard
              name="Michael Chen"
              id="PAT-2024-00847"
              age={62}
              gender="Male"
              condition="Hypertension, CKD Stage 3"
              riskLevel="high"
              lastVisit="2026-03-18"
            />
            <PatientCard
              name="Emma Williams"
              id="PAT-2024-01205"
              age={78}
              gender="Female"
              condition="CHF, Atrial Fibrillation"
              riskLevel="critical"
              lastVisit="2026-03-20"
            />
          </Grid>
        </SubSection>

        <SubSection
          title="RiskBadge"
          description="Risk-level indicator with semantic colors and icons"
        >
          <div className="space-y-4">
            <div>
              <p className="text-caption text-text-muted mb-2">DEFAULT SIZE</p>
              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge level="low" />
                <RiskBadge level="medium" />
                <RiskBadge level="high" />
                <RiskBadge level="critical" />
              </div>
            </div>
            <div>
              <p className="text-caption text-text-muted mb-2">SMALL SIZE</p>
              <div className="flex flex-wrap items-center gap-3">
                <RiskBadge level="low" size="sm" />
                <RiskBadge level="medium" size="sm" />
                <RiskBadge level="high" size="sm" />
                <RiskBadge level="critical" size="sm" />
              </div>
            </div>
          </div>
        </SubSection>

        <SubSection
          title="Timeline"
          description="Chronological event timeline with type icons and status colors"
        >
          <Panel className="max-w-xl">
            <Timeline
              events={[
                {
                  title: "Annual Wellness Visit",
                  description: "Routine checkup with Dr. Sarah Chen. All vitals within normal range.",
                  timestamp: "2026-03-20",
                  type: "encounter",
                  status: "completed",
                },
                {
                  title: "Metformin 500mg Prescribed",
                  description: "New prescription for diabetes management.",
                  timestamp: "2026-03-18",
                  type: "medication",
                  status: "completed",
                },
                {
                  title: "HbA1c Lab Results",
                  description: "Result: 7.2% — within target range.",
                  timestamp: "2026-03-15",
                  type: "lab",
                  status: "completed",
                },
                {
                  title: "Colonoscopy Scheduled",
                  description: "Routine screening procedure pending scheduling.",
                  timestamp: "2026-04-10",
                  type: "procedure",
                  status: "pending",
                },
                {
                  title: "Referral to Cardiology",
                  description: "Cancelled per patient request.",
                  timestamp: "2026-03-12",
                  type: "note",
                  status: "cancelled",
                },
              ]}
            />
          </Panel>
        </SubSection>

        <SubSection
          title="VitalSign"
          description="Vital sign display with status dot and sparkline trend"
        >
          <Panel className="max-w-lg">
            <div className="divide-y divide-border">
              <VitalSign
                label="Heart Rate"
                value="72"
                unit="bpm"
                status="normal"
                trend={[68, 70, 72, 71, 73, 72, 72]}
              />
              <VitalSign
                label="Blood Pressure"
                value="145/92"
                unit="mmHg"
                status="warning"
                trend={[130, 135, 140, 138, 142, 145, 145]}
              />
              <VitalSign
                label="SpO2"
                value="91"
                unit="%"
                status="critical"
                trend={[96, 95, 94, 93, 92, 91, 91]}
              />
            </div>
          </Panel>
        </SubSection>

        <SubSection
          title="MedicationCard"
          description="Medication summary with status badge and prescriber info"
        >
          <Grid cols={3} gap="default">
            <MedicationCard
              name="Metformin"
              dosage="500mg"
              frequency="Twice daily"
              prescriber="Sarah Chen"
              startDate="2026-01-15"
              status="active"
            />
            <MedicationCard
              name="Lisinopril"
              dosage="10mg"
              frequency="Once daily"
              prescriber="James Park"
              startDate="2025-11-02"
              status="discontinued"
            />
            <MedicationCard
              name="Atorvastatin"
              dosage="20mg"
              frequency="Once daily at bedtime"
              prescriber="Sarah Chen"
              status="pending"
            />
          </Grid>
        </SubSection>
      </Section>
    </>
  );
}
