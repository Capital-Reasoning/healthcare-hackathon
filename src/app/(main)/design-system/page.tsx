import { TokensSection } from "./_components/tokens-section";
import { BaseComponentsSection } from "./_components/base-components-section";
import { LayoutNavFormsSection } from "./_components/layout-nav-forms-section";
import { FeedbackSection } from "./_components/feedback-section";
import { DataDisplaySection } from "./_components/data-display-section";
import { ChartsHealthcareSection } from "./_components/charts-healthcare-section";

export default function DesignSystemPage() {
  return (
    <div className="max-w-6xl space-y-16 pb-16">
      {/* Header */}
      <div>
        <p className="text-caption text-primary mb-2">DESIGN SYSTEM</p>
        <h1 className="text-display text-navy-800">Visual Reference</h1>
        <p className="text-body text-text-secondary mt-2">
          All design tokens, patterns, components, and utilities available in
          BestPath.
        </p>
      </div>

      {/* Table of Contents */}
      <nav className="rounded-lg border border-border bg-bg-muted p-5">
        <h2 className="text-h3 text-navy-800 mb-3">Contents</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 md:grid-cols-3 lg:grid-cols-4">
          {[
            { id: "colours", label: "Colours" },
            { id: "typography", label: "Typography" },
            { id: "shadows", label: "Shadows" },
            { id: "glass-effects", label: "Glass Effects" },
            { id: "glow-gradients", label: "Glow & Gradients" },
            { id: "animations", label: "Animations" },
            { id: "buttons", label: "Buttons" },
            { id: "badges", label: "Badges" },
            { id: "card-patterns", label: "Card Patterns" },
            { id: "notifications", label: "Notifications" },
            { id: "surface-variants", label: "Surface Variants" },
            { id: "border-radius", label: "Border Radius" },
            { id: "layout-components", label: "Layout Components" },
            { id: "navigation-components", label: "Navigation" },
            { id: "form-components", label: "Form Components" },
            { id: "feedback-components", label: "Feedback" },
            { id: "data-display-components", label: "Data Display" },
            { id: "charts", label: "Charts" },
            { id: "healthcare-components", label: "Healthcare" },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-body-sm text-primary hover:text-primary-pressed hover:underline transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Sections */}
      <TokensSection />
      <BaseComponentsSection />
      <LayoutNavFormsSection />
      <FeedbackSection />
      <DataDisplaySection />
      <ChartsHealthcareSection />
    </div>
  );
}
