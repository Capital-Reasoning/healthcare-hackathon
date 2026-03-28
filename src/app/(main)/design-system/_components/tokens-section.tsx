"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SwatchGroup } from "./helpers";

export function TokensSection() {
  const [animKey, setAnimKey] = useState(0);

  return (
    <>
      {/* ─── Colours ─── */}
      <Section id="colours" title="Colours">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <SwatchGroup
            title="Primary (Teal)"
            swatches={[
              { name: "Primary", hex: "#0B8585" },
              { name: "Hover", hex: "#0A7373" },
              { name: "Pressed", hex: "#085C5C" },
              { name: "Tint", hex: "#E8F6F6" },
              { name: "Tint Medium", hex: "#D0EEEE" },
            ]}
          />
          <SwatchGroup
            title="Secondary (Navy)"
            swatches={[
              { name: "Navy 800", hex: "#1A2E44" },
              { name: "Navy 700", hex: "#2A4365" },
            ]}
          />
          <SwatchGroup
            title="Backgrounds"
            swatches={[
              { name: "Page", hex: "#FAFAF8" },
              { name: "Card", hex: "#FFFFFF" },
              { name: "Muted", hex: "#F5F4F0" },
              { name: "Inset", hex: "#EFEEE9" },
            ]}
          />
          <SwatchGroup
            title="Borders"
            swatches={[
              { name: "Default", hex: "#E6E4DF" },
              { name: "Strong", hex: "#D4D1CA" },
              { name: "Primary", hex: "#A8D4D4" },
            ]}
          />
          <SwatchGroup
            title="Text"
            swatches={[
              { name: "Primary", hex: "#1A2E44" },
              { name: "Secondary", hex: "#334155" },
              { name: "Muted", hex: "#475569" },
            ]}
          />
          <SwatchGroup
            title="Semantic"
            swatches={[
              { name: "Success", hex: "#0B7A5E" },
              { name: "Success Tint", hex: "#E6F5F0" },
              { name: "Warning", hex: "#C27A15" },
              { name: "Warning Tint", hex: "#FDF3E3" },
              { name: "Error", hex: "#C93B3B" },
              { name: "Error Tint", hex: "#FDE8E8" },
            ]}
          />
        </div>
      </Section>

      {/* ─── Typography ─── */}
      <Section id="typography" title="Typography">
        <div className="space-y-8">
          <div>
            <p className="text-caption text-text-muted mb-1">
              DISPLAY — 36/40, Semibold
            </p>
            <p className="text-display text-navy-800">
              Patient Population Overview
            </p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1">
              HEADING 1 — 28/36, Semibold
            </p>
            <p className="text-h1 text-navy-800">Population Health Metrics</p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1">
              HEADING 2 — 22/28, Semibold
            </p>
            <p className="text-h2 text-navy-800">At a Glance</p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1">
              HEADING 3 — 18/24, Medium
            </p>
            <p className="text-h3 text-navy-800">
              Patient Demographics Breakdown
            </p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1">
              BODY — 15/24, Regular
            </p>
            <p className="text-body text-text-primary">
              The patient population shows a 12% increase in chronic condition
              management compliance over the past quarter. Early intervention
              protocols are contributing to improved outcomes across all
              demographics.
            </p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1">
              BODY SMALL — 14/22, Regular
            </p>
            <p className="text-body-sm text-text-secondary">
              Secondary text used for table cells, metadata, and supporting
              information. Last updated 2 hours ago by Dr. Sarah Chen.
            </p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1">
              CAPTION — 12/18, Medium, Uppercase
            </p>
            <p className="text-caption text-text-muted">TOTAL PATIENTS</p>
          </div>
          <div>
            <p className="text-caption text-text-muted mb-1">
              MONO — JetBrains Mono
            </p>
            <p className="font-mono text-body text-text-primary">
              PAT-2024-00847 &middot; ICD-10: E11.9 &middot; HbA1c: 7.2%
            </p>
          </div>
        </div>
      </Section>

      {/* ─── Shadows ─── */}
      <Section id="shadows" title="Shadows">
        <div className="flex flex-wrap gap-6">
          {["shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl"].map(
            (s) => (
              <div
                key={s}
                className={`rounded-lg bg-bg-card p-6 text-center text-body-sm ${s}`}
              >
                {s}
              </div>
            ),
          )}
        </div>
      </Section>

      {/* ─── Glass Effects ─── */}
      <Section id="glass-effects" title="Glass Effects">
        <div
          className="rounded-xl p-8"
          style={{
            background:
              "linear-gradient(135deg, #0B8585 0%, #2A4365 50%, #0A7373 100%)",
          }}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { cls: "glass", label: "glass", desc: "Standard frosted panel" },
              {
                cls: "glass-strong",
                label: "glass-strong",
                desc: "More opaque surface",
              },
              {
                cls: "glass-subtle",
                label: "glass-subtle",
                desc: "Barely-there frost",
              },
              {
                cls: "glass-dark",
                label: "glass-dark",
                desc: "Dark frosted surface",
              },
            ].map((g) => (
              <div key={g.cls} className={`${g.cls} rounded-lg p-6`}>
                <p
                  className={`text-h3 ${g.cls === "glass-dark" ? "" : "text-navy-800"}`}
                >
                  {g.label}
                </p>
                <p
                  className={`text-body-sm mt-1 ${g.cls === "glass-dark" ? "opacity-70" : "text-text-secondary"}`}
                >
                  {g.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ─── Glow + Gradient Borders ─── */}
      <Section id="glow-gradients" title="Glow & Gradient Borders">
        <div className="flex flex-wrap gap-6">
          <div className="glow-sm rounded-lg bg-bg-card p-6 text-center text-body-sm">
            glow-sm
          </div>
          <div className="glow-md rounded-lg bg-bg-card p-6 text-center text-body-sm">
            glow-md
          </div>
          <div className="glow-lg rounded-lg bg-bg-card p-6 text-center text-body-sm">
            glow-lg
          </div>
          <div className="gradient-border-primary rounded-lg bg-bg-card p-6">
            <p className="text-body-sm font-medium text-navy-800">
              Primary Gradient
            </p>
          </div>
          <div className="gradient-border-ai rounded-lg bg-bg-card p-6">
            <p className="text-body-sm font-medium text-navy-800">
              AI Gradient
            </p>
          </div>
        </div>
      </Section>

      {/* ─── Animations ─── */}
      <Section id="animations" title="Animations">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAnimKey((k) => k + 1)}
        >
          <RefreshCw className="size-3.5" />
          Replay All
        </Button>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            "fade-in",
            "fade-in-up",
            "slide-in-right",
            "slide-in-up",
            "scale-in",
            "shimmer",
            "pulse-subtle",
            "expand",
          ].map((name) => (
            <div
              key={`${name}-${animKey}`}
              className={`${name === "shimmer" ? "shimmer" : `animate-${name}`} rounded-lg border border-border-primary bg-primary-tint p-4 text-center text-body-sm font-medium text-primary-pressed`}
            >
              {name}
            </div>
          ))}
        </div>
      </Section>

      {/* ─── Surface Variants ─── */}
      <Section id="surface-variants" title="Surface Variants">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <p className="text-h3 text-navy-800">Default</p>
            <p className="text-body-sm text-text-secondary mt-1">
              White card with subtle shadow
            </p>
          </div>
          <div className="rounded-lg border border-border bg-bg-muted p-5">
            <p className="text-h3 text-navy-800">Muted</p>
            <p className="text-body-sm text-text-secondary mt-1">
              Recessed / muted sections
            </p>
          </div>
          <div className="rounded-lg border border-border-strong bg-bg-inset p-5">
            <p className="text-h3 text-navy-800">Inset</p>
            <p className="text-body-sm text-text-secondary mt-1">
              Inset well / code blocks
            </p>
          </div>
          <div
            className="rounded-xl p-[3px]"
            style={{
              background:
                "linear-gradient(135deg, #0B8585 0%, #1A2E44 50%, #085C5C 100%)",
            }}
          >
            <div className="glass-strong rounded-[17px] p-5">
              <p className="text-h3 text-navy-800">Glass</p>
              <p className="text-body-sm text-text-secondary mt-1">
                Frosted glass for AI panel
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ─── Border Radius ─── */}
      <Section id="border-radius" title="Border Radius">
        <div className="flex flex-wrap items-end gap-4">
          {[
            { label: "sm (6px)", className: "rounded-sm" },
            { label: "md (10px)", className: "rounded-md" },
            { label: "lg (14px)", className: "rounded-lg" },
            { label: "xl (20px)", className: "rounded-xl" },
            { label: "2xl (24px)", className: "rounded-2xl" },
            { label: "full", className: "rounded-full" },
          ].map(({ label, className }) => (
            <div key={label} className="text-center">
              <div
                className={`${className} size-16 border-2 border-primary bg-primary-tint`}
              />
              <p className="text-body-sm text-text-muted mt-2">{label}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
