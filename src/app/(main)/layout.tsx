import { Navbar } from "@/components/navigation";
import { CommandPalette } from "@/components/navigation/command-palette";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Navbar />
      <CommandPalette />

      {/* Main content area — fixed height, navbar offset via pt-14 */}
      <main className="@container/main min-w-0 flex-1 overflow-y-auto p-6 pt-14">
        {children}
      </main>
    </div>
  );
}
