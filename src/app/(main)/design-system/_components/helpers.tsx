import type React from "react";

export function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-6 scroll-mt-8">
      <h2 className="text-h1 text-navy-800 border-b border-border pb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SubSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-h3 text-navy-800">{title}</h3>
        {description && (
          <p className="text-body-sm text-text-secondary mt-0.5">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

export function Swatch({ name, hex }: { name: string; hex: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 shrink-0 rounded-lg border border-border"
        style={{ backgroundColor: hex }}
      />
      <div>
        <div className="text-body-sm font-medium text-text-primary">{name}</div>
        <div className="font-mono text-xs text-text-muted">{hex}</div>
      </div>
    </div>
  );
}

export function SwatchGroup({
  title,
  swatches,
}: {
  title: string;
  swatches: { name: string; hex: string }[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-h3 text-text-primary">{title}</h3>
      {swatches.map((s) => (
        <Swatch key={s.hex + s.name} {...s} />
      ))}
    </div>
  );
}
