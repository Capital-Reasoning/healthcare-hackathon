import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPatientById } from '@/lib/db/queries/patients';
import { getPatientEngineResults, getLatestEngineRun } from '@/lib/db/queries/engine-results';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { PatientContent } from './patient-content';
import { RunAssessmentButton } from './run-assessment-button';
import { MarkDoneButton } from './mark-dealt-with-button';

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: patientId } = await params;

  const patient = await getPatientById(patientId);
  if (!patient) notFound();

  const [engineResults, engineRun] = await Promise.all([
    getPatientEngineResults(patientId),
    getLatestEngineRun(patientId),
  ]);

  const patientName = `${patient.firstName} ${patient.lastName}`;
  const lastEncounter = patient.encounters[0] ?? null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-6 pt-8 pb-8">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      {/* Patient Header */}
      <div className="rounded-md border border-border bg-white">
        {/* Top section: name + actions */}
        <div className="flex items-center justify-between gap-4 p-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-sm font-semibold">
              {patient.firstName.charAt(0)}
              {patient.lastName.charAt(0)}
            </div>
            <div>
              <h1 className="text-h1 text-foreground">{patientName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RunAssessmentButton patientId={patientId} />
            <MarkDoneButton patientId={patientId} />
          </div>
        </div>

        {/* Bottom section: info bar with key-value pairs separated by dividers */}
        <div className="flex items-center gap-0 border-t border-border divide-x divide-border">
          <InfoCell label="MRN" value={patient.patientId} />
          {patient.age != null && (
            <InfoCell label="Age" value={`${patient.age} years`} />
          )}
          {patient.sex && <InfoCell label="Sex" value={patient.sex} />}
          {patient.dateOfBirth && (
            <InfoCell
              label="Date of Birth"
              value={new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            />
          )}
          {lastEncounter && (
            <InfoCell
              label="Last Seen"
              value={
                lastEncounter.encounterDate
                  ? new Date(
                      lastEncounter.encounterDate,
                    ).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Unknown'
              }
            />
          )}
        </div>
      </div>

      {/* Patient Content — summary + tabs for assessment/activity/clinical */}
      <ErrorBoundary>
        <PatientContent
          engineResults={engineResults}
          runDate={
            engineRun
              ? (engineRun.completedAt?.toISOString() ??
                engineRun.startedAt?.toISOString() ??
                new Date().toISOString())
              : null
          }
          patientName={patientName}
          patientId={patientId}
          encounters={patient.encounters}
          medications={patient.medications}
          labResults={patient.labResults}
          vitals={patient.vitals}
        />
      </ErrorBoundary>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-5 py-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground capitalize">
        {value}
      </p>
    </div>
  );
}
