'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function RunAssessmentButton({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRun() {
    setLoading(true);
    toast.info('Running assessment — this may take a minute or two', { duration: 5000 });
    try {
      const res = await fetch('/api/engine/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? 'Assessment failed');
        return;
      }

      toast.success('Assessment complete', {
        description: `Found ${json.data?.targets?.length ?? 0} targets`,
      });

      router.refresh();
    } catch {
      toast.error('Failed to run assessment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRun} disabled={loading} className="gap-2">
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Play className="size-4" data-icon="inline-start" />
      )}
      {loading ? 'Rerunning...' : 'Rerun Assessment'}
    </Button>
  );
}
