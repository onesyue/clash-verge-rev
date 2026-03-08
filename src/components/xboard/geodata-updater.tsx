/**
 * GeoData 自动更新组件
 *
 * 无 UI，挂载在 Layout 内。
 * 1. 应用启动后延迟 10 秒检查是否需要自动更新 GeoData
 * 2. 每小时定期检查是否到了更新间隔
 */

import { useEffect, useRef } from "react";
import { updateGeo } from "tauri-plugin-mihomo-api";

import {
  markGeoUpdated,
  shouldAutoUpdateGeo,
} from "@/hooks/use-geo-auto-update";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 每小时检查一次

async function tryAutoUpdate() {
  if (!shouldAutoUpdateGeo()) return;
  try {
    await updateGeo();
    markGeoUpdated();
    console.info("[GeoDataUpdater] GeoData auto-updated");
  } catch (err) {
    console.warn("[GeoDataUpdater] Auto-update failed:", err);
  }
}

export function GeoDataUpdater() {
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    // 启动后延迟 10 秒检查一次
    const startupTimer = setTimeout(tryAutoUpdate, 10_000);

    // 之后每小时定期检查
    const intervalTimer = setInterval(tryAutoUpdate, CHECK_INTERVAL_MS);

    return () => {
      clearTimeout(startupTimer);
      clearInterval(intervalTimer);
    };
  }, []);

  return null;
}
