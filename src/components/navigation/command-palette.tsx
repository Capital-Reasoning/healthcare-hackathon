'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Compass,
  Zap,
  MessageSquare,
  Search,
} from 'lucide-react';
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useAgentStore } from '@/stores/agent-store';

interface CommandPaletteProps {
  className?: string;
}

function CommandPalette({ className }: CommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const toggleAgent = useAgentStore((s) => s.toggle);

  // Listen for ⌘K / Ctrl+K
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const navigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const runAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} className={className}>
      <Command>
        <CommandInput placeholder="Type a command or search…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => navigate('/')}>
              <LayoutDashboard className="text-muted-foreground" />
              Dashboard
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/patients')}>
              <Users className="text-muted-foreground" />
              Patients
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => navigate('/navigator')}>
              <Compass className="text-muted-foreground" />
              Care Navigator
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => navigate('/')}>
              <Zap className="text-muted-foreground" />
              Analyze Patient Panel
            </CommandItem>
            <CommandItem onSelect={() => runAction(toggleAgent)}>
              <MessageSquare className="text-muted-foreground" />
              Toggle AI Assistant
              <CommandShortcut>⌘J</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Search">
            <CommandItem onSelect={() => navigate('/patients')}>
              <Search className="text-muted-foreground" />
              Search Patients…
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export { CommandPalette };
