import { Users } from 'lucide-react';

export default function PatientsPage() {
  return (
    <div className="space-y-6 p-6 md:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h1 className="text-h1 text-foreground">Patient Panel</h1>
        </div>
        <p className="text-body-sm text-muted-foreground">
          Browse and search your patient panel. Use the dashboard for triage-prioritized views.
        </p>
      </header>
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <Users className="size-10 mx-auto text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">Patient list view in progress</p>
        <p className="text-xs text-muted-foreground">
          Individual patient records are available from the triage dashboard.
        </p>
      </div>
    </div>
  );
}
