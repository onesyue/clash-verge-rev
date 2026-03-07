/**
 * GeoData 自动更新启动监听器
 *
 * 无 UI，挂载在 Layout 内，应用启动后延迟检查是否需要自动更新 GeoData。
 * 延迟 10 秒执行，避免影响启动速度。
 */

import { useEffect, useRef } from "react";
import { updateGeo } from "tauri-plugin-mihomo-api";

import {
  markGeoUpdated,
  shouldAutoUpdateGeo,
} from "@/hooks/use-geo-auto-update";

export function GeoDataUpdater() {
  const didRunRef = useRef(false);

  useEffect(() => {
    if (didRunRef.current) return;
    didRunRef.current = true;

    const timer = setTimeout(async () => {
      if (!shouldAutoUpdateGeo()) return;
      try {
        await updateGeo();
        markGeoUpdated();
        console.info("[GeoDataUpdater] GeoData auto-updated on startup");
      } catch (err) {
        console.warn("[GeoDataUpdater] Auto-update failed:", err);
      }
    }, 10_000); // 延迟 10s，等 Mihomo 核心就绪

    return () => clearTimeout(timer);
  }, []);

  return null;
}
