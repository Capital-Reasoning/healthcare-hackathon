import { CommandPalette } from "@/components/navigation/command-palette";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <CommandPalette />

      <main className="@container/main min-w-0 flex-1 overflow-y-auto bg-gray-50/60">
        {children}
      </main>
    </div>
  );
}
