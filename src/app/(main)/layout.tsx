import { Navbar } from "@/components/navigation";
import { CommandPalette } from "@/components/navigation/command-palette";
import { AgentPanelLayout } from "@/components/agent/agent-panel-layout";

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
      <div className="flex min-h-0 flex-1 pt-14">
        <AgentPanelLayout>{children}</AgentPanelLayout>
      </div>
    </div>
  );
}
