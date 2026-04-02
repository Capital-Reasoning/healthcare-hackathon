'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
  whyThisAction: _whyThisAction,
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
        <DialogContent className="sm:max-w-4xl bg-white">
          {/* Header */}
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Send Patient Notification
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Review the messages below and send to the patient.
            </p>
          </div>

          {/* Patient summary bar */}
          <div className="flex items-center gap-3 rounded-md border border-border bg-gray-50 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
              {patientName.split(' ').map((n) => n.charAt(0)).join('').slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{patientName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {action}
                {condition ? ` · ${condition}` : ''}
                {providerRoute ? ` · ${providerRoute}` : ''}
              </p>
            </div>
          </div>

          {/* Channel cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email card */}
            <div className={`rounded-md border transition-colors ${sendEmail ? 'border-border' : 'border-border/50 opacity-50'}`}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-gray-50/60 rounded-t-md">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Email</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sendEmail}
                  onClick={() => setSendEmail(!sendEmail)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${sendEmail ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block size-3.5 rounded-full bg-white transition-transform ${sendEmail ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                </button>
              </div>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                disabled={!sendEmail}
                className="w-full border-0 bg-transparent p-3 text-sm leading-relaxed resize-none h-44 focus:outline-none disabled:cursor-not-allowed text-foreground"
                rows={8}
              />
            </div>

            {/* SMS card */}
            <div className={`rounded-md border transition-colors ${sendSms ? 'border-border' : 'border-border/50 opacity-50'}`}>
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-gray-50/60 rounded-t-md">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Text Message</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={sendSms}
                  onClick={() => setSendSms(!sendSms)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${sendSms ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block size-3.5 rounded-full bg-white transition-transform ${sendSms ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                </button>
              </div>
              <textarea
                value={smsContent}
                onChange={(e) => setSmsContent(e.target.value)}
                disabled={!sendSms}
                className="w-full border-0 bg-transparent p-3 text-sm leading-relaxed resize-none h-44 focus:outline-none disabled:cursor-not-allowed text-foreground"
                rows={8}
              />
            </div>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="gap-2">
              <Send className="size-4" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
