import { Box, Tab, Tabs } from "@mui/material";
import { useLockFn } from "ahooks";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { closeAllConnections } from "tauri-plugin-mihomo-api";

import { BasePage } from "@/components/base";
import { ProviderButton } from "@/components/proxy/provider-button";
import { ProxyGroups } from "@/components/proxy/proxy-groups";
import { useVerge } from "@/hooks/use-verge";
import { useAppData } from "@/providers/app-data-context";
import { patchClashMode } from "@/services/cmds";

const MODES = ["rule", "global", "direct"] as const;
type Mode = (typeof MODES)[number];
const MODE_SET = new Set<string>(MODES);
const isMode = (value: unknown): value is Mode =>
  typeof value === "string" && MODE_SET.has(value);

const ProxyPage = () => {
  const { t } = useTranslation();
  const { clashConfig, refreshClashConfig } = useAppData();
  const { verge } = useVerge();

  const modeList = useMemo(() => MODES, []);
  const normalizedMode = clashConfig?.mode?.toLowerCase();
  const curMode = isMode(normalizedMode) ? normalizedMode : undefined;

  const onChangeMode = useLockFn(async (mode: Mode) => {
    if (mode !== curMode && verge?.auto_close_connection) {
      closeAllConnections();
    }
    await patchClashMode(mode);
    refreshClashConfig();
  });

  useEffect(() => {
    if (normalizedMode && !isMode(normalizedMode)) {
      onChangeMode("rule");
    }
  }, [normalizedMode, onChangeMode]);

  return (
    <BasePage
      full
      contentStyle={{ height: "101.5%", display: "flex", flexDirection: "column" }}
      title={t("proxies.page.title.default")}
      header={<ProviderButton />}
    >
      {/* 模式 Tab（对齐安卓：规则模式/全局模式/直连模式） */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", flexShrink: 0 }}>
        <Tabs
          value={curMode ?? "rule"}
          onChange={(_, v) => onChangeMode(v as Mode)}
          variant="fullWidth"
          sx={{
            minHeight: 44,
            "& .MuiTab-root": { minHeight: 44, fontSize: 13, fontWeight: 500 },
          }}
        >
          {modeList.map((mode) => (
            <Tab key={mode} label={t(`proxies.page.modes.${mode}`)} value={mode} />
          ))}
        </Tabs>
      </Box>

      {/* 代理分组列表 */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        <ProxyGroups
          mode={curMode ?? "rule"}
          isChainMode={false}
          chainConfigData={null}
        />
      </Box>
    </BasePage>
  );
};

export default ProxyPage;
