/**
 * XBoard 会话状态管理
 *
 * 职责：
 *  1. 持久化 session（baseUrl + authData + subscribeUrl）到 localStorage
 *  2. 通过 React Context 在组件树中共享登录态
 *  3. 提供 login / logout / refresh helpers
 */

import { createContextState } from "foxact/create-context-state";

import type { AuthResult, UserInfo, XBoardSession } from "./types";

// ────────────────────────────────────────────────────────────────────────────
// localStorage 持久化
// ────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "xboard_session";

export function loadSession(): XBoardSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<XBoardSession>;
    if (!obj.baseUrl || !obj.authData) return null;
    return {
      baseUrl: obj.baseUrl,
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
}

/** 从 AuthResult + baseUrl 组合成 XBoardSession 并保存 */
export function persistAuthResult(
  baseUrl: string,
  result: AuthResult,
): XBoardSession {
  const session: XBoardSession = {
    baseUrl,
    authData: result.authData,
    subscribeUrl: result.subscribeUrl,
  };
  saveSession(session);
  return session;
}

// ────────────────────────────────────────────────────────────────────────────
// React Context State
// ────────────────────────────────────────────────────────────────────────────

/**
 * 当前会话，null 表示未登录
 * 从 localStorage 读取初始值，保证刷新后不丢失登录态
 */
const [XBoardSessionProvider, useXBoardSession, useSetXBoardSession] =
  createContextState<XBoardSession | null>(loadSession());

/**
 * 缓存的用户信息，null 表示尚未加载或未登录
 */
const [XBoardUserInfoProvider, useXBoardUserInfo, useSetXBoardUserInfo] =
  createContextState<UserInfo | null>(null);

export {
  XBoardSessionProvider,
  useXBoardSession,
  useSetXBoardSession,
  XBoardUserInfoProvider,
  useXBoardUserInfo,
  useSetXBoardUserInfo,
};

// ────────────────────────────────────────────────────────────────────────────
// Convenience helpers（在组件外也可直接调用）
// ────────────────────────────────────────────────────────────────────────────

/** 判断当前是否已登录 */
export function isLoggedIn(): boolean {
  return loadSession() !== null;
}
