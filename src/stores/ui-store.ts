import { create } from 'zustand';

interface UiState {
  activeFilters: Record<string, string[]>;
  sortConfig: { field: string; direction: 'asc' | 'desc' } | null;
  setFilter: (key: string, values: string[]) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  setSort: (field: string, direction: 'asc' | 'desc') => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeFilters: {},
  sortConfig: null,
  setFilter: (key, values) =>
    set((state) => ({ activeFilters: { ...state.activeFilters, [key]: values } })),
  removeFilter: (key) =>
    set((state) => {
      const { [key]: _, ...rest } = state.activeFilters;
      return { activeFilters: rest };
    }),
  clearFilters: () => set({ activeFilters: {} }),
  setSort: (field, direction) => set({ sortConfig: { field, direction } }),
}));
