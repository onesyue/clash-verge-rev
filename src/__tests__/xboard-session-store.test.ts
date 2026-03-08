import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  clearSession,
  loadSession,
  persistAuthResult,
  saveSession,
  useSetXBoardSession,
  useXBoardSession,
  useXBoardSessionStore,
} from "../services/xboard/store";

describe("XBoard Session localStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    useXBoardSessionStore.setState({ session: null });
  });

  it("loadSession returns null when empty", () => {
    expect(loadSession()).toBeNull();
  });

  it("saveSession + loadSession round-trips", () => {
    const session = { authData: "token123", subscribeUrl: "https://sub.url" };
    saveSession(session);
    expect(loadSession()).toEqual(session);
  });

  it("loadSession returns null for invalid JSON", () => {
    localStorage.setItem("xboard_session", "not-json");
    expect(loadSession()).toBeNull();
  });

  it("loadSession returns null if authData missing", () => {
    localStorage.setItem(
      "xboard_session",
      JSON.stringify({ subscribeUrl: "url" }),
    );
    expect(loadSession()).toBeNull();
  });

  it("clearSession removes from localStorage and store", () => {
    saveSession({ authData: "tok", subscribeUrl: "url" });
    useXBoardSessionStore.setState({
      session: { authData: "tok", subscribeUrl: "url" },
    });

    clearSession();
    expect(loadSession()).toBeNull();
    expect(useXBoardSessionStore.getState().session).toBeNull();
  });

  it("persistAuthResult saves and returns session", () => {
    const result = persistAuthResult({
      authData: "auth-data",
      subscribeUrl: "https://example.com/sub",
    });
    expect(result).toEqual({
      authData: "auth-data",
      subscribeUrl: "https://example.com/sub",
    });
    expect(loadSession()).toEqual(result);
  });
});

describe("XBoard Session Zustand hook", () => {
  beforeEach(() => {
    localStorage.clear();
    useXBoardSessionStore.setState({ session: null });
  });

  it("starts null", () => {
    const { result } = renderHook(() => useXBoardSession());
    expect(result.current).toBeNull();
  });

  it("useSetXBoardSession updates store and localStorage", () => {
    const { result: session } = renderHook(() => useXBoardSession());
    const { result: setSession } = renderHook(() => useSetXBoardSession());

    const newSession = { authData: "new-tok", subscribeUrl: "https://new.url" };

    act(() => setSession.current(newSession));

    expect(session.current).toEqual(newSession);
    expect(loadSession()).toEqual(newSession);
  });

  it("useSetXBoardSession(null) clears localStorage", () => {
    const newSession = { authData: "tok", subscribeUrl: "url" };
    useXBoardSessionStore.setState({ session: newSession });
    saveSession(newSession);

    const { result: session } = renderHook(() => useXBoardSession());
    const { result: setSession } = renderHook(() => useSetXBoardSession());

    act(() => setSession.current(null));

    expect(session.current).toBeNull();
    expect(loadSession()).toBeNull();
  });
});
