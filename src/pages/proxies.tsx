import { alpha, Box, ButtonBase, Typography } from "@mui/material";
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

  // iOS-style segmented control in the header
  const modeSelector = useMemo(
    () => (
      <Box
        sx={({ palette }) => ({
          display: "flex",
          borderRadius: "10px",
          p: "2px",
          bgcolor: alpha(
            palette.text.primary,
            palette.mode === "dark" ? 0.08 : 0.06,
          ),
          gap: "2px",
        })}
      >
        {modeList.map((mode) => {
          const active = (curMode ?? "rule") === mode;
          return (
            <ButtonBase
              key={mode}
              onClick={() => onChangeMode(mode)}
              sx={({ palette }) => ({
                px: 1.25,
                py: 0.5,
                borderRadius: "8px",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                bgcolor: active
                  ? palette.mode === "dark"
                    ? alpha(palette.background.paper, 0.8)
                    : "background.paper"
                  : "transparent",
                boxShadow: active
                  ? "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)"
                  : "none",
              })}
            >
              <Typography
                sx={({ palette }) => ({
                  fontSize: "12px",
                  fontWeight: active ? 600 : 400,
                  lineHeight: 1,
                  color: active ? palette.text.primary : palette.text.secondary,
                  whiteSpace: "nowrap",
                })}
              >
                {t(`proxies.page.modes.${mode}`)}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    ),
    [modeList, curMode, onChangeMode, t],
  );

  return (
    <BasePage
      full
      contentStyle={{
        height: "101.5%",
        display: "flex",
        flexDirection: "column",
      }}
      title={t("proxies.page.title.default")}
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {modeSelector}
          <ProviderButton />
        </Box>
      }
    >
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
