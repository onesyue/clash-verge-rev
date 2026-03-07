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
      contentStyle={{
        height: "101.5%",
        display: "flex",
        flexDirection: "column",
      }}
      title={t("proxies.page.title.default")}
      header={<ProviderButton />}
    >
      {/* 模式分段控件（对齐安卓，无下划线横线） */}
      <Box sx={{ px: 1.5, pt: 1, pb: 0.5, flexShrink: 0 }}>
        <Tabs
          value={curMode ?? "rule"}
          onChange={(_, v) => onChangeMode(v as Mode)}
          variant="fullWidth"
          TabIndicatorProps={{ style: { display: "none" } }}
          sx={{
            minHeight: 36,
            borderRadius: 2,
            bgcolor: "action.hover",
            p: 0.5,
            "& .MuiTab-root": {
              minHeight: 28,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 1.5,
              py: 0.5,
              transition: "all 0.2s",
              color: "text.secondary",
            },
            "& .Mui-selected": {
              color: "primary.main",
              bgcolor: "background.paper",
              boxShadow: 1,
            },
          }}
        >
          {modeList.map((mode) => (
            <Tab
              key={mode}
              label={t(`proxies.page.modes.${mode}`)}
              value={mode}
            />
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
