'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  markPatientDone,
  unmarkPatientDone,
  isPatientDone,
} from '@/components/healthcare/triage-dashboard';

export function MarkDoneButton({ patientId }: { patientId: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(isPatientDone(patientId));
  }, [patientId]);

  const handleToggle = () => {
    if (done) {
      unmarkPatientDone(patientId);
      setDone(false);
    } else {
      markPatientDone(patientId);
      setDone(true);
    }
  };

  if (done) {
    return (
      <Button variant="outline" onClick={handleToggle} className="gap-2">
        <Undo2 className="size-4" />
        Undo Done
      </Button>
    );
  }

  return (
    <Button variant="secondary" onClick={handleToggle} className="gap-2">
      <CheckCircle2 className="size-4" />
      Mark as Done
    </Button>
  );
}
