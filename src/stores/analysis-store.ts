import { create } from 'zustand';

interface AnalysisState {
  hasAnalyzed: boolean;
  setAnalyzed: () => void;
}

/** No `persist` — survives client-side navigation but resets on page refresh. */
export const useAnalysisStore = create<AnalysisState>((set) => ({
  hasAnalyzed: false,
  setAnalyzed: () => set({ hasAnalyzed: true }),
}));
