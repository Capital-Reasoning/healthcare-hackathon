'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Mail, Phone } from 'lucide-react';
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

function buildEmailTemplate(
  patientName: string,
  action: string,
  condition: string | null,
  providerRoute: string | null,
): string {
  const firstName = patientName.split(' ')[0] ?? patientName;
  const conditionLine = condition
    ? `\nThis relates to your ongoing care for ${condition}.`
    : '';
  const routingLine = providerRoute
    ? `\nTo arrange this, please contact your ${providerRoute} or call our clinic directly.`
    : '\nPlease contact our clinic to arrange this at your earliest convenience.';

  return `Dear ${firstName},

Following a review of your health records, your care team would like to recommend the following:

${action}${conditionLine}${routingLine}

If you have any questions or concerns, please don't hesitate to reach out to your care team. We're here to help.

Kind regards,
Your BestPath Care Team
(555) 123-4567`;
}

function buildSmsTemplate(
  patientName: string,
  action: string,
  providerRoute: string | null,
): string {
  const firstName = patientName.split(' ')[0] ?? patientName;
  const routingLine = providerRoute
    ? ` Please contact your ${providerRoute} to arrange this.`
    : ' Please contact our clinic to arrange this.';

  return `Hi ${firstName}, your care team recommends: ${action}.${routingLine} Questions? Call (555) 123-4567. — BestPath Care Team`;
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
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSms, setSendSms] = useState(true);
  const [emailContent, setEmailContent] = useState('');
  const [smsContent, setSmsContent] = useState('');

  function handleOpen() {
    setEmailContent(
      buildEmailTemplate(patientName, action, condition, providerRoute),
    );
    setSmsContent(buildSmsTemplate(patientName, action, providerRoute));
    setDialogOpen(true);
  }

  function handleConfirm() {
    const channels: string[] = [];
    if (sendEmail) channels.push('email');
    if (sendSms) channels.push('SMS');

    if (channels.length === 0) {
      toast.error('Please select at least one notification channel.');
      return;
    }

    setSent(true);
    setDialogOpen(false);
    toast.success(
      `Notification sent to ${patientName} via ${channels.join(' and ')}`,
      { description: action },
    );
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
      <Button onClick={handleOpen} className="gap-2 min-w-44">
        <Send className="size-4" data-icon="inline-start" />
        Approve &amp; Send
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Patient Notification</DialogTitle>
            <DialogDescription>
              Review and approve sending this recommendation to the patient.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Recipient Info */}
            <div className="rounded-lg border border-border bg-muted p-4 space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Recipient
              </h4>
              <div className="text-sm">
                <span className="font-medium text-foreground">
                  {patientName}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">
                  Recommended Action:
                </span>{' '}
                <span className="text-foreground">{action}</span>
              </div>
              {condition && (
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">
                    Condition:
                  </span>{' '}
                  <span className="text-foreground">{condition}</span>
                </div>
              )}
              {whyThisAction && (
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">
                    Reasoning:
                  </span>{' '}
                  <span className="text-foreground">{whyThisAction}</span>
                </div>
              )}
            </div>

            {/* Notification Channels */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Notification Channels
              </h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="size-4 rounded border-border text-primary accent-primary"
                  />
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Email
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendSms}
                    onChange={(e) => setSendSms(e.target.checked)}
                    className="size-4 rounded border-border text-primary accent-primary"
                  />
                  <Phone className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Text Message
                  </span>
                </label>
              </div>
            </div>

            {/* Email Preview */}
            {sendEmail && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Email Message
                </h4>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground resize-y min-h-[180px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  rows={10}
                />
              </div>
            )}

            {/* SMS Preview */}
            {sendSms && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Text Message
                </h4>
                <textarea
                  value={smsContent}
                  onChange={(e) => setSmsContent(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {smsContent.length} / 160 characters
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="gap-2">
              <Send className="size-4" data-icon="inline-start" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
