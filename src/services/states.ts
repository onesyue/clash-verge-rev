import { create } from "zustand";

// ── Theme Mode ──────────────────────────────────────────────────────────────

interface ThemeModeStore {
  themeMode: "light" | "dark" | undefined;
  setThemeMode: (mode: "light" | "dark") => void;
}

export const useThemeModeStore = create<ThemeModeStore>((set) => ({
  themeMode: undefined,
  setThemeMode: (mode) => set({ themeMode: mode }),
}));

export const useThemeMode = () => useThemeModeStore((s) => s.themeMode);
export const useSetThemeMode = () => useThemeModeStore((s) => s.setThemeMode);

// ── Loading Cache ───────────────────────────────────────────────────────────

interface LoadingCacheStore {
  loadingCache: Record<string, boolean>;
  setLoadingCache: (
    updater:
      | Record<string, boolean>
      | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => void;
}

export const useLoadingCacheStore = create<LoadingCacheStore>((set) => ({
  loadingCache: {},
  setLoadingCache: (updater) =>
    set((state) => ({
      loadingCache:
        typeof updater === "function" ? updater(state.loadingCache) : updater,
    })),
}));

export const useLoadingCache = () =>
  useLoadingCacheStore((s) => s.loadingCache);
export const useSetLoadingCache = () =>
  useLoadingCacheStore((s) => s.setLoadingCache);

// ── Update State ────────────────────────────────────────────────────────────

interface UpdateStateStore {
  updateState: boolean;
  setUpdateState: (state: boolean | ((prev: boolean) => boolean)) => void;
}

export const useUpdateStateStore = create<UpdateStateStore>((set) => ({
  updateState: false,
  setUpdateState: (updater) =>
    set((state) => ({
      updateState:
        typeof updater === "function" ? updater(state.updateState) : updater,
    })),
}));

export const useUpdateState = () => useUpdateStateStore((s) => s.updateState);
export const useSetUpdateState = () =>
  useUpdateStateStore((s) => s.setUpdateState);
