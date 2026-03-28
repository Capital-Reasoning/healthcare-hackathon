'use client';

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Calendar,
  Pill,
  TestTube2,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataBadge } from '@/components/data-display/badge';

// ── Type definitions matching Drizzle select model shapes ──────────────────

interface Encounter {
  id: string;
  encounterId: string;
  patientId: string;
  encounterDate: string | null;
  encounterType: string | null;
  facility: string | null;
  chiefComplaint: string | null;
  diagnosisCode: string | null;
  diagnosisDescription: string | null;
  triageLevel: number | null;
  disposition: string | null;
  lengthOfStayHours: string | null;
  attendingPhysician: string | null;
  createdAt: Date | null;
}

interface Medication {
  id: string;
  medicationId: string;
  patientId: string;
  drugName: string;
  drugCode: string | null;
  dosage: string | null;
  frequency: string | null;
  route: string | null;
  prescriber: string | null;
  startDate: string | null;
  endDate: string | null;
  active: boolean | null;
  createdAt: Date | null;
}

interface LabResult {
  id: string;
  labId: string;
  patientId: string;
  encounterId: string | null;
  testName: string | null;
  testCode: string | null;
  value: string | null;
  unit: string | null;
  referenceRangeLow: string | null;
  referenceRangeHigh: string | null;
  abnormalFlag: string | null;
  collectedDate: string | null;
  createdAt: Date | null;
}

interface Vital {
  id: string;
  vitalsId: string;
  patientId: string;
  encounterId: string | null;
  heartRate: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  temperatureCelsius: string | null;
  respiratoryRate: number | null;
  o2Saturation: string | null;
  painScale: number | null;
  recordedAt: Date | null;
  createdAt: Date | null;
}

interface PatientDataTabsProps {
  encounters: Encounter[];
  medications: Medication[];
  labResults: LabResult[];
  vitals: Vital[];
}

function formatDate(d: string | Date | null): string {
  if (!d) return '--';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function PatientDataTabs({
  encounters,
  medications,
  labResults,
  vitals,
}: PatientDataTabsProps) {
  const latestVital = vitals[0] ?? null;

  return (
    <div className="space-y-4">
      <h2 className="text-h2 text-foreground">Clinical Record</h2>

      <Tabs defaultValue="encounters">
        <TabsList variant="line">
          <TabsTrigger value="encounters">
            <Calendar className="size-4" />
            Encounters ({encounters.length})
          </TabsTrigger>
          <TabsTrigger value="medications">
            <Pill className="size-4" />
            Medications ({medications.length})
          </TabsTrigger>
          <TabsTrigger value="labs">
            <TestTube2 className="size-4" />
            Lab Results ({labResults.length})
          </TabsTrigger>
          <TabsTrigger value="vitals">
            <HeartPulse className="size-4" />
            Vitals
          </TabsTrigger>
        </TabsList>

        {/* ── Encounters ────────────────────────────────────────────── */}
        <TabsContent value="encounters">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {encounters.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                No encounters recorded.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Date
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Facility
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Diagnosis
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        CTAS
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Disposition
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {encounters.map((enc) => (
                      <tr
                        key={enc.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {formatDate(enc.encounterDate)}
                        </td>
                        <td className="px-4 py-2.5 capitalize">
                          {enc.encounterType ?? '--'}
                        </td>
                        <td className="px-4 py-2.5">
                          {enc.facility ?? '--'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-foreground">
                            {enc.diagnosisDescription ?? '--'}
                          </span>
                          {enc.diagnosisCode && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({enc.diagnosisCode})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {enc.triageLevel != null ? (
                            <DataBadge
                              variant={
                                enc.triageLevel <= 2
                                  ? 'error'
                                  : enc.triageLevel <= 3
                                    ? 'warning'
                                    : 'secondary'
                              }
                              size="sm"
                            >
                              {enc.triageLevel}
                            </DataBadge>
                          ) : (
                            '--'
                          )}
                        </td>
                        <td className="px-4 py-2.5 capitalize">
                          {enc.disposition ?? '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Medications ───────────────────────────────────────────── */}
        <TabsContent value="medications">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {medications.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                No active medications.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Drug Name
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Dosage
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Frequency
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Start Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med) => (
                      <tr
                        key={med.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-medium">
                          {med.drugName}
                        </td>
                        <td className="px-4 py-2.5">
                          {med.dosage ?? '--'}
                        </td>
                        <td className="px-4 py-2.5 capitalize">
                          {med.frequency ?? '--'}
                        </td>
                        <td className="px-4 py-2.5">
                          {med.active ? (
                            <DataBadge variant="success" size="sm">
                              <CheckCircle2 className="size-3" /> Active
                            </DataBadge>
                          ) : (
                            <DataBadge variant="secondary" size="sm">
                              Inactive
                            </DataBadge>
                          )}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap">
                          {formatDate(med.startDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Lab Results ───────────────────────────────────────────── */}
        <TabsContent value="labs">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {labResults.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                No lab results recorded.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Test Name
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Value
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Unit
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Flag
                      </th>
                      <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {labResults.map((lab) => {
                      const isAbnormal =
                        lab.abnormalFlag != null &&
                        lab.abnormalFlag !== 'N' &&
                        lab.abnormalFlag !== '';
                      return (
                        <tr
                          key={lab.id}
                          className={cn(
                            'border-b border-border last:border-0 transition-colors',
                            isAbnormal
                              ? 'bg-error-tint/50 hover:bg-error-tint/70'
                              : 'hover:bg-muted/30',
                          )}
                        >
                          <td className="px-4 py-2.5 font-medium">
                            {lab.testName ?? lab.testCode ?? '--'}
                          </td>
                          <td className="px-4 py-2.5">
                            {lab.value ?? '--'}
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground">
                            {lab.unit ?? '--'}
                          </td>
                          <td className="px-4 py-2.5">
                            {isAbnormal ? (
                              <DataBadge variant="error" size="sm">
                                <AlertTriangle className="size-3" />
                                {lab.abnormalFlag === 'H'
                                  ? 'High'
                                  : lab.abnormalFlag === 'L'
                                    ? 'Low'
                                    : lab.abnormalFlag}
                              </DataBadge>
                            ) : (
                              <span className="text-muted-foreground">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {formatDate(lab.collectedDate)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Vitals ────────────────────────────────────────────────── */}
        <TabsContent value="vitals">
          <div className="rounded-lg border border-border bg-card p-5">
            {!latestVital ? (
              <p className="text-sm text-muted-foreground text-center">
                No vitals recorded.
              </p>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground mb-4">
                  Recorded: {formatDate(latestVital.recordedAt)}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <VitalCard
                    label="Blood Pressure"
                    value={
                      latestVital.systolicBp != null &&
                      latestVital.diastolicBp != null
                        ? `${latestVital.systolicBp}/${latestVital.diastolicBp}`
                        : '--'
                    }
                    unit="mmHg"
                  />
                  <VitalCard
                    label="Heart Rate"
                    value={
                      latestVital.heartRate != null
                        ? String(latestVital.heartRate)
                        : '--'
                    }
                    unit="bpm"
                  />
                  <VitalCard
                    label="Temperature"
                    value={latestVital.temperatureCelsius ?? '--'}
                    unit="C"
                  />
                  <VitalCard
                    label="Respiratory Rate"
                    value={
                      latestVital.respiratoryRate != null
                        ? String(latestVital.respiratoryRate)
                        : '--'
                    }
                    unit="breaths/min"
                  />
                  <VitalCard
                    label="O2 Saturation"
                    value={latestVital.o2Saturation ?? '--'}
                    unit="%"
                  />
                  <VitalCard
                    label="Pain Scale"
                    value={
                      latestVital.painScale != null
                        ? String(latestVital.painScale)
                        : '--'
                    }
                    unit="/10"
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function VitalCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{unit}</p>
    </div>
  );
}
