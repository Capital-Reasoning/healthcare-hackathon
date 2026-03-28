'use client';

interface GeneratedCardProps {
  children: React.ReactNode;
}

/**
 * Spacing wrapper for AI-generated OpenUI blocks.
 * No card wrapper — the white panel BG provides a clean surface.
 * Components that need cards (StatCard, PatientCard, etc.) bring their own.
 */
export function GeneratedCard({ children }: GeneratedCardProps) {
  return (
    <div className="generated-ui-block my-5 outline-none animate-fade-in-up">
      {children}
    </div>
  );
}
