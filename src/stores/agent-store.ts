import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type AgentView, type MobileSheetState } from '@/types/agent';

interface AgentState {
  isOpen: boolean;
  activeView: AgentView;
  mobileSheetState: MobileSheetState;
  /** True when the agent is streaming or processing a request */
  isStreaming: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
  setView: (view: AgentView) => void;
  setMobileSheetState: (state: MobileSheetState) => void;
  setStreaming: (streaming: boolean) => void;
}

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      isOpen: false,
      activeView: 'chat',
      mobileSheetState: 'collapsed',
      isStreaming: false,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setView: (view) => set({ activeView: view }),
      setMobileSheetState: (mobileSheetState) => set({ mobileSheetState }),
      setStreaming: (isStreaming) => set({ isStreaming }),
    }),
    {
      name: 'rithm-agent-panel',
      partialize: (state) => ({ isOpen: state.isOpen }),
    },
  ),
);
