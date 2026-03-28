'use client';

import { Page } from '@/components/layout/page';
import { Section } from '@/components/layout/section';
import { DocumentsSection } from './documents-section';

export default function SettingsPage() {
  return (
    <Page
      title="Settings"
      description="Manage your documents and application preferences"
    >
      <Section>
        <DocumentsSection />
      </Section>
    </Page>
  );
}
