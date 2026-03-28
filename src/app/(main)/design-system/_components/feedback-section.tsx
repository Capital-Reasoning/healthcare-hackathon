"use client";

import { useState } from "react";
import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Grid } from "@/components/layout/grid";
import { Panel } from "@/components/layout/panel";
import { StatusAlert } from "@/components/feedback/status-alert";
import { Modal } from "@/components/feedback/modal";
import { SkeletonVariant } from "@/components/feedback/skeleton-variants";
import { EmptyState } from "@/components/feedback/empty-state";
import { ProgressBar } from "@/components/feedback/progress-bar";
import { LoadingSpinner } from "@/components/feedback/loading-spinner";
import { Section, SubSection } from "./helpers";

export function FeedbackSection() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <Section id="feedback-components" title="Feedback Components">
      <SubSection
        title="StatusAlert"
        description="Notification banners with variant-colored left strip"
      >
        <div className="space-y-3">
          <StatusAlert
            variant="info"
            title="New clinical guideline available"
            description="Updated HbA1c monitoring protocol for Type 2 Diabetes patients."
          />
          <StatusAlert
            variant="success"
            title="Compliance target reached"
            description="Annual wellness visits now at 94% — exceeding the 90% goal."
          />
          <StatusAlert
            variant="warning"
            title="Medication interaction flagged"
            description="Review patient PAT-2024-00312 — potential NSAID/ACE inhibitor interaction detected."
          />
          <StatusAlert
            variant="error"
            title="Critical lab result"
            description="Patient PAT-2024-00847 — potassium level 6.2 mEq/L requires immediate review."
          />
        </div>
      </SubSection>

      <SubSection
        title="Modal"
        description="Dialog with size variants (sm / default / lg / xl / full)"
      >
        <Button variant="outline" onClick={() => setModalOpen(true)}>
          Open Modal
        </Button>
        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Confirm Action"
          description="Are you sure you want to proceed? This action cannot be undone."
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Confirm</Button>
            </>
          }
        >
          <p className="text-body-sm text-muted-foreground">
            Additional modal content goes here. The modal supports sm,
            default, lg, xl, and full size presets.
          </p>
        </Modal>
      </SubSection>

      <SubSection title="ProgressBar" description="Animated progress with variant colours and sizes">
        <div className="max-w-md space-y-4">
          <div>
            <p className="text-caption text-text-muted mb-1.5">DEFAULT (72%)</p>
            <ProgressBar value={72} showLabel />
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1.5">SUCCESS (94%)</p>
            <ProgressBar value={94} variant="success" showLabel />
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1.5">WARNING (45%)</p>
            <ProgressBar value={45} variant="warning" showLabel />
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1.5">ERROR (12%)</p>
            <ProgressBar value={12} variant="error" showLabel />
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1.5">SIZES</p>
            <div className="space-y-2">
              <ProgressBar value={60} size="sm" />
              <ProgressBar value={60} size="default" />
              <ProgressBar value={60} size="lg" />
            </div>
          </div>
        </div>
      </SubSection>

      <SubSection
        title="LoadingSpinner"
        description="Animated spinner in sm, default, lg sizes"
      >
        <div className="flex items-center gap-6">
          <div className="text-center">
            <LoadingSpinner size="sm" />
            <p className="text-caption text-text-muted mt-2">SM</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="default" />
            <p className="text-caption text-text-muted mt-2">DEFAULT</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-caption text-text-muted mt-2">LG</p>
          </div>
        </div>
      </SubSection>

      <SubSection
        title="SkeletonVariant"
        description="Pre-composed skeleton shapes for different content types"
      >
        <Grid cols={3} gap="default">
          <div>
            <p className="text-caption text-text-muted mb-3">TEXT</p>
            <SkeletonVariant variant="text" />
          </div>
          <div>
            <p className="text-caption text-text-muted mb-3">CARD</p>
            <SkeletonVariant variant="card" />
          </div>
          <div>
            <p className="text-caption text-text-muted mb-3">CHART</p>
            <SkeletonVariant variant="chart" />
          </div>
          <div>
            <p className="text-caption text-text-muted mb-3">AVATAR</p>
            <SkeletonVariant variant="avatar" />
          </div>
          <div className="col-span-2">
            <p className="text-caption text-text-muted mb-3">TABLE ROW</p>
            <div className="space-y-1">
              <SkeletonVariant variant="table-row" />
              <SkeletonVariant variant="table-row" />
              <SkeletonVariant variant="table-row" />
            </div>
          </div>
        </Grid>
      </SubSection>

      <SubSection
        title="EmptyState"
        description="Placeholder for empty content areas"
      >
        <Panel>
          <EmptyState
            icon={<Inbox className="size-12" />}
            title="No patients found"
            description="Try adjusting your search or filters to find what you're looking for."
            action={
              <Button size="sm">
                <Plus className="size-4" data-icon="inline-start" />
                Add Patient
              </Button>
            }
          />
        </Panel>
      </SubSection>
    </Section>
  );
}
