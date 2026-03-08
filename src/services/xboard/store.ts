/**
 * XBoard 会话状态管理（Zustand）
 *
 * 职责：
 *  1. 持久化 session（authData + subscribeUrl）到 localStorage
 *  2. 通过 Zustand store 在组件间共享登录态（无需 Provider）
 *  3. 提供 login / logout / refresh helpers
 */

import { create } from "zustand";

import type { AuthResult, XBoardSession } from "./types";

// ────────────────────────────────────────────────────────────────────────────
// localStorage 持久化
// ────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "xboard_session";

export function loadSession(): XBoardSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<XBoardSession>;
    if (!obj.authData) return null;
    return {
      authData: obj.authData,
      subscribeUrl: obj.subscribeUrl ?? "",
    };
  } catch {
    return null;
  }
}

export function saveSession(session: XBoardSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  // Also update the Zustand store
  useXBoardSessionStore.getState().setSession(null);
}

/** 从 AuthResult 组合成 XBoardSession 并保存 */
export function persistAuthResult(result: AuthResult): XBoardSession {
  const session: XBoardSession = {
    authData: result.authData,
    subscribeUrl: result.subscribeUrl,
  };
  saveSession(session);
  return session;
}

// ────────────────────────────────────────────────────────────────────────────
// Zustand Store
// ────────────────────────────────────────────────────────────────────────────

interface XBoardSessionStore {
  session: XBoardSession | null;
  setSession: (
    session:
      | XBoardSession
      | null
      | ((prev: XBoardSession | null) => XBoardSession | null),
  ) => void;
}

export const useXBoardSessionStore = create<XBoardSessionStore>((set) => ({
  session: loadSession(),
  setSession: (updater) =>
    set((state) => ({
      session: typeof updater === "function" ? updater(state.session) : updater,
    })),
}));

/** 读取当前 session */
export const useXBoardSession = () => useXBoardSessionStore((s) => s.session);

/** 设置 session（同时持久化到 localStorage） */
export function useSetXBoardSession() {
  const setSession = useXBoardSessionStore((s) => s.setSession);
  return (
    updater:
      | XBoardSession
      | null
      | ((prev: XBoardSession | null) => XBoardSession | null),
  ) => {
    // Use Zustand's set() with an updater to avoid stale getState() reads
    setSession((prev) => {
      const newSession =
        typeof updater === "function" ? updater(prev) : updater;
      // Persist to localStorage
      if (newSession) {
        saveSession(newSession);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return newSession;
    });
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Convenience helpers（在组件外也可直接调用）
// ────────────────────────────────────────────────────────────────────────────

/** 判断当前是否已登录 */
export function isLoggedIn(): boolean {
  return loadSession() !== null;
}
