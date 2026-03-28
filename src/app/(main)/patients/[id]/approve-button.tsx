'use client';

import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface ApproveButtonProps {
  patientName: string;
  action: string;
  condition: string | null;
  providerRoute: string | null;
  whyThisAction: string | null;
  onApproved: () => void;
}

export function ApproveButton({
  patientName,
  action,
  condition,
  providerRoute,
  whyThisAction,
  onApproved,
}: ApproveButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sent, setSent] = useState(false);

  function handleConfirm() {
    setSent(true);
    setDialogOpen(false);
    toast.success(`Notification sent to ${patientName}`, {
      description: action,
    });
    onApproved();
  }

  if (sent) {
    return (
      <Button variant="outline" disabled className="gap-2 text-success">
        <CheckCircle2 className="size-4" />
        Sent
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} className="gap-2">
        <Mail className="size-4" data-icon="inline-start" />
        Approve &amp; Send to Patient
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Notification</DialogTitle>
            <DialogDescription>
              Review and approve sending this recommendation to the patient.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">
                Patient:
              </span>{' '}
              <span className="text-foreground">{patientName}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">
                Recommended Action:
              </span>{' '}
              <span className="text-foreground">{action}</span>
            </div>
            {condition && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Condition:
                </span>{' '}
                <span className="text-foreground">{condition}</span>
              </div>
            )}
            {whyThisAction && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Explanation:
                </span>{' '}
                <span className="text-foreground">{whyThisAction}</span>
              </div>
            )}
            {providerRoute && (
              <div>
                <span className="font-medium text-muted-foreground">
                  Routing:
                </span>{' '}
                <span className="text-foreground capitalize">
                  {providerRoute}
                </span>
              </div>
            )}

            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Notification Preview
              </p>
              <p className="text-sm text-foreground">
                Dear {patientName}, based on a recent review of your health
                records, we recommend: {action}.
                {providerRoute &&
                  ` Please contact your ${providerRoute} to arrange this.`}{' '}
                If you have questions, please call your care team.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="gap-2">
              <Mail className="size-4" data-icon="inline-start" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
