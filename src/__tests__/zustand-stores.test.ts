import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  useLoadingCache,
  useLoadingCacheStore,
  useSetLoadingCache,
  useSetThemeMode,
  useSetUpdateState,
  useThemeMode,
  useThemeModeStore,
  useUpdateState,
  useUpdateStateStore,
} from "../services/states";

describe("ThemeMode store", () => {
  beforeEach(() => {
    useThemeModeStore.setState({ themeMode: undefined });
  });

  it("starts with undefined theme", () => {
    const { result } = renderHook(() => useThemeMode());
    expect(result.current).toBeUndefined();
  });

  it("sets theme mode", () => {
    const { result: mode } = renderHook(() => useThemeMode());
    const { result: setMode } = renderHook(() => useSetThemeMode());

    act(() => setMode.current("dark"));
    expect(mode.current).toBe("dark");

    act(() => setMode.current("light"));
    expect(mode.current).toBe("light");
  });
});

describe("LoadingCache store", () => {
  beforeEach(() => {
    useLoadingCacheStore.setState({ loadingCache: {} });
  });

  it("starts empty", () => {
    const { result } = renderHook(() => useLoadingCache());
    expect(result.current).toEqual({});
  });

  it("supports updater function", () => {
    const { result: cache } = renderHook(() => useLoadingCache());
    const { result: setCache } = renderHook(() => useSetLoadingCache());

    act(() => setCache.current((prev) => ({ ...prev, abc: true })));
    expect(cache.current).toEqual({ abc: true });

    act(() => setCache.current((prev) => ({ ...prev, def: true })));
    expect(cache.current).toEqual({ abc: true, def: true });

    act(() => setCache.current((prev) => ({ ...prev, abc: false })));
    expect(cache.current).toEqual({ abc: false, def: true });
  });

  it("supports direct value", () => {
    const { result: cache } = renderHook(() => useLoadingCache());
    const { result: setCache } = renderHook(() => useSetLoadingCache());

    act(() => setCache.current({ x: true }));
    expect(cache.current).toEqual({ x: true });
  });
});

describe("UpdateState store", () => {
  beforeEach(() => {
    useUpdateStateStore.setState({ updateState: false });
  });

  it("starts false", () => {
    const { result } = renderHook(() => useUpdateState());
    expect(result.current).toBe(false);
  });

  it("toggles state", () => {
    const { result: state } = renderHook(() => useUpdateState());
    const { result: setState } = renderHook(() => useSetUpdateState());

    act(() => setState.current(true));
    expect(state.current).toBe(true);

    act(() => setState.current(false));
    expect(state.current).toBe(false);
  });
});
