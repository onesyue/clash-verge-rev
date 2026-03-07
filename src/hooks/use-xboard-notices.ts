/**
 * 获取 XBoard 面板公告的 SWR hook
 *
 * - 已登录时自动拉取，15 分钟刷新一次
 * - 暴露 unreadCount：createdAt > lastReadAt 的条数
 * - 提供 markAllRead()：将 lastReadAt 更新到当前时间
 */

import { useCallback, useSyncExternalStore } from "react";
import useSWR from "swr";

import { SWR_DEFAULTS } from "@/services/config";
import { getNotices } from "@/services/xboard/api";
import { useXBoardSession } from "@/services/xboard/store";
import type { Notice } from "@/services/xboard/types";

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 min
const STORAGE_KEY = "xboard_notices_last_read_at";

// ── 已读时间戳 mini-store（外部订阅，跨组件同步） ──────────────────────────

let lastReadAt: number = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
const readSubscribers = new Set<() => void>();

function getLastReadAt() {
  return lastReadAt;
}

function subscribeLastReadAt(cb: () => void) {
  readSubscribers.add(cb);
  return () => readSubscribers.delete(cb);
}

function persistLastReadAt(ts: number) {
  lastReadAt = ts;
  localStorage.setItem(STORAGE_KEY, String(ts));
  readSubscribers.forEach((cb) => cb());
}

// ─────────────────────────────────────────────────────────────────────────────

export function useXBoardNotices() {
  const session = useXBoardSession();

  const { data, error, isLoading, mutate } = useSWR<Notice[]>(
    session ? ["xboard-notices", session.authData] : null,
    () => getNotices(session!.authData),
    {
      ...SWR_DEFAULTS,
      refreshInterval: REFRESH_INTERVAL,
    },
  );

  const currentLastReadAt = useSyncExternalStore(
    subscribeLastReadAt,
    getLastReadAt,
  );

  const notices = data ?? [];
  const unreadCount = notices.filter((n) => n.createdAt > currentLastReadAt).length;

  const markAllRead = useCallback(() => {
    persistLastReadAt(Math.floor(Date.now() / 1000));
  }, []);

  return {
    notices,
    loading: isLoading,
    error: error ?? null,
    unreadCount,
    markAllRead,
    refresh: mutate,
  };
}

/** 仅在启动时用于检查未读公告数（不触发 SWR，直接读 localStorage）*/
export function getNoticesLastReadAt(): number {
  return Number(localStorage.getItem(STORAGE_KEY) ?? 0);
}

export { persistLastReadAt as markNoticesRead };
