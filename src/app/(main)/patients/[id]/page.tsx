import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, FileQuestion } from 'lucide-react';
import { getPatientById } from '@/lib/db/queries/patients';
import { getPatientEngineResults, getLatestEngineRun } from '@/lib/db/queries/engine-results';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import { AssessmentResults } from './assessment-results';
import { PatientDataTabs } from './patient-data-tabs';
import { RunAssessmentButton } from './run-assessment-button';

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
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      {/* Patient Header */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <User className="size-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-h1 text-foreground">
              Patient: {patientName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
              {patient.age != null && <span>Age: {patient.age}</span>}
              {patient.sex && <span>Sex: {patient.sex}</span>}
              <span>ID: {patient.patientId}</span>
            </div>
            {lastEncounter && (
              <p className="text-sm text-muted-foreground mt-1">
                Last Encounter:{' '}
                {lastEncounter.encounterDate
                  ? new Date(lastEncounter.encounterDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      },
                    )
                  : 'Unknown date'}
                {lastEncounter.facility && ` at ${lastEncounter.facility}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Results Section */}
      <ErrorBoundary>
        {engineResults.length > 0 && engineRun ? (
          <AssessmentResults
            targets={engineResults}
            runDate={
              engineRun.completedAt?.toISOString() ??
              engineRun.startedAt?.toISOString() ??
              new Date().toISOString()
            }
            overallConfidence={null}
            patientName={patientName}
          />
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <FileQuestion className="size-10 mx-auto text-muted-foreground mb-3" />
            <h2 className="text-h3 text-foreground mb-1">
              No assessment results yet
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Run the BestPath engine to generate care pathway recommendations
              for this patient.
            </p>
            <RunAssessmentButton patientId={patientId} />
          </div>
        )}
      </ErrorBoundary>

      {/* Patient Data Tabs */}
      <ErrorBoundary>
        <PatientDataTabs
          encounters={patient.encounters}
          medications={patient.medications}
          labResults={patient.labResults}
          vitals={patient.vitals}
        />
      </ErrorBoundary>
    </div>
  );
}
