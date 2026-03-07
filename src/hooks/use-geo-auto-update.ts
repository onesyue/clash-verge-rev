/**
 * GeoData 自动更新偏好管理 hook
 *
 * 所有偏好存储于 localStorage，无需 Rust 侧改动。
 * 实际更新通过 tauri-plugin-mihomo-api 的 updateGeo() 调用 Mihomo 内置机制。
 */

import { useSyncExternalStore } from "react";
import { updateGeo } from "tauri-plugin-mihomo-api";

const KEY_AUTO_UPDATE = "geodata_auto_update_enabled";
const KEY_LAST_UPDATED = "geodata_last_updated_at";
const KEY_INTERVAL_HOURS = "geodata_auto_update_interval_hours";

export const GEO_INTERVAL_OPTIONS = [6, 12, 24, 48, 72] as const;
export type GeoIntervalHours = (typeof GEO_INTERVAL_OPTIONS)[number];

// ── mini-store ────────────────────────────────────────────────────────────────

interface GeoState {
  enabled: boolean;
  intervalHours: GeoIntervalHours;
  lastUpdatedAt: number; // Unix ms, 0 = never
}

let state: GeoState = {
  enabled: localStorage.getItem(KEY_AUTO_UPDATE) === "true",
  intervalHours: (Number(localStorage.getItem(KEY_INTERVAL_HOURS)) ||
    24) as GeoIntervalHours,
  lastUpdatedAt: Number(localStorage.getItem(KEY_LAST_UPDATED) ?? 0),
};

const subscribers = new Set<() => void>();

function getSnapshot() {
  return state;
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function setState(patch: Partial<GeoState>) {
  state = { ...state, ...patch };
  if (patch.enabled !== undefined)
    localStorage.setItem(KEY_AUTO_UPDATE, String(patch.enabled));
  if (patch.intervalHours !== undefined)
    localStorage.setItem(KEY_INTERVAL_HOURS, String(patch.intervalHours));
  if (patch.lastUpdatedAt !== undefined)
    localStorage.setItem(KEY_LAST_UPDATED, String(patch.lastUpdatedAt));
  subscribers.forEach((cb) => cb());
}

// ─────────────────────────────────────────────────────────────────────────────

export function useGeoAutoUpdate() {
  const { enabled, intervalHours, lastUpdatedAt } = useSyncExternalStore(
    subscribe,
    getSnapshot,
  );

  const setEnabled = (v: boolean) => setState({ enabled: v });
  const setIntervalHours = (v: GeoIntervalHours) =>
    setState({ intervalHours: v });

  const triggerUpdate = async () => {
    await updateGeo();
    setState({ lastUpdatedAt: Date.now() });
  };

  return {
    enabled,
    intervalHours,
    lastUpdatedAt,
    setEnabled,
    setIntervalHours,
    triggerUpdate,
  };
}

/**
 * 判断是否需要自动更新（供启动时调用，无 React 依赖）
 */
export function shouldAutoUpdateGeo(): boolean {
  if (state.enabled !== true) return false;
  if (state.lastUpdatedAt === 0) return true;
  const elapsedMs = Date.now() - state.lastUpdatedAt;
  return elapsedMs >= state.intervalHours * 60 * 60 * 1000;
}

/**
 * 记录更新完成时间（供 GeoDataUpdater 调用）
 */
export function markGeoUpdated() {
  setState({ lastUpdatedAt: Date.now() });
}
