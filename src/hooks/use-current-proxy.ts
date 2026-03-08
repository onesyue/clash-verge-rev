import { useMemo } from "react";

import { useAppData } from "@/providers/app-data-context";

interface ProxyGroup {
  name: string;
  now: string;
  type?: string;
}

// 获取当前代理节点信息的自定义Hook
export const useCurrentProxy = () => {
  const { proxies, clashConfig, refreshProxy } = useAppData();

  const currentMode = clashConfig?.mode?.toLowerCase() || "rule";

  const currentProxyInfo = useMemo(() => {
    if (!proxies) return { currentProxy: null, primaryGroupName: null };

    const { global, groups, records } = proxies;

    let primaryGroupName = "GLOBAL";
    let currentName = global?.now;

    if (currentMode === "rule" && groups.length > 0) {
      // 直接使用第一个非 GLOBAL 的策略组
      const firstGroup = groups.find((g: ProxyGroup) => g.name !== "GLOBAL");

      if (firstGroup) {
        primaryGroupName = firstGroup.name;
        currentName = firstGroup.now;
      }
    }

    if (!currentName) return { currentProxy: null, primaryGroupName };

    const currentProxy = records[currentName] || {
      name: currentName,
      type: "Unknown",
      udp: false,
      xudp: false,
      tfo: false,
      mptcp: false,
      smux: false,
      history: [],
    };

    return { currentProxy, primaryGroupName };
  }, [proxies, currentMode]);

  return {
    currentProxy: currentProxyInfo.currentProxy,
    primaryGroupName: currentProxyInfo.primaryGroupName,
    mode: currentMode,
    refreshProxy,
  };
};
