import { useMemo } from "react";

import { useAppData } from "@/providers/app-data-context";

// 定义代理组类型
interface ProxyGroup {
  name: string;
  now: string;
  type?: string;
}

// 获取当前代理节点信息的自定义Hook
export const useCurrentProxy = () => {
  // 从AppDataProvider获取数据
  const { proxies, clashConfig, rules, refreshProxy } = useAppData();

  // 获取当前模式
  const currentMode = clashConfig?.mode?.toLowerCase() || "rule";

  // 获取当前代理节点信息
  const currentProxyInfo = useMemo(() => {
    if (!proxies) return { currentProxy: null, primaryGroupName: null };

    const { global, groups, records } = proxies;

    // 默认信息
    let primaryGroupName = "GLOBAL";
    let currentName = global?.now;

    if (currentMode === "rule" && groups.length > 0) {
      // 1. 优先通过 MATCH 规则找到出口代理组（最准确）
      let matchGroup: ProxyGroup | undefined;
      if (Array.isArray(rules)) {
        for (let i = rules.length - 1; i >= 0; i--) {
          const rule = rules[i];
          if (rule?.type?.toUpperCase() === "MATCH" && rule.proxy) {
            const matchPolicy = rule.proxy.trim();
            matchGroup = groups.find((g: ProxyGroup) => g.name === matchPolicy);
            break;
          }
        }
      }

      // 2. 关键词匹配
      const primaryKeywords = [
        "节点选择",
        "proxy",
        "select",
        "自动选择",
        "auto",
      ];
      const keywordGroup =
        !matchGroup &&
        groups.find((group: ProxyGroup) =>
          primaryKeywords.some((keyword) =>
            group.name.toLowerCase().includes(keyword.toLowerCase()),
          ),
        );

      // 3. 回退到第一个 Selector 类型的组（而非任意第一个组）
      const fallbackGroup =
        !matchGroup &&
        !keywordGroup &&
        (groups.find(
          (g: ProxyGroup) => g.name !== "GLOBAL" && g.type === "Selector",
        ) ||
          groups.filter((g: ProxyGroup) => g.name !== "GLOBAL")[0]);

      const primaryGroup = matchGroup || keywordGroup || fallbackGroup;

      if (primaryGroup) {
        primaryGroupName = primaryGroup.name;
        currentName = primaryGroup.now;
      }
    }

    // 如果找不到当前节点，返回null
    if (!currentName) return { currentProxy: null, primaryGroupName };

    // 获取完整的节点信息
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
  }, [proxies, currentMode, rules]);

  return {
    currentProxy: currentProxyInfo.currentProxy,
    primaryGroupName: currentProxyInfo.primaryGroupName,
    mode: currentMode,
    refreshProxy,
  };
};
