/**
 * 首页 — VPN 连接中心
 *
 * 布局：
 *  ┌───────────────────────────────────────┐
 *  │  账号摘要（头像 + 邮箱 + 套餐 + 到期）  │
 *  ├───────────────────────────────────────┤
 *  │          大圆形连接按钮               │
 *  │         已连接 · 00:19:37            │
 *  ├───────────────────────────────────────┤
 *  │  ↑ 33 KB/s   ↓ 0 B/s   总: 1.84 MB  │
 *  ├───────────────────────────────────────┤
 *  │  [规则] [全局] [直连]   节点组 › 节点  │
 *  └───────────────────────────────────────┘
 */

import {
  PowerSettingsNewRounded,
  ArrowUpwardRounded,
  ArrowDownwardRounded,
  CloudDownloadRounded,
  WorkspacePremiumRounded,
  ChevronRightRounded,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useLockFn } from "ahooks";
import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { closeAllConnections } from "tauri-plugin-mihomo-api";

import { BasePage } from "@/components/base";
import { useConnectionData } from "@/hooks/use-connection-data";
import { useCurrentProxy } from "@/hooks/use-current-proxy";
import { useSystemProxyState } from "@/hooks/use-system-proxy-state";
import { useSystemState } from "@/hooks/use-system-state";
import { useTrafficData } from "@/hooks/use-traffic-data";
import { useVerge } from "@/hooks/use-verge";
import { useXBoardUserInfo } from "@/hooks/use-xboard-user-info";
import { useAppData } from "@/providers/app-data-context";
import { patchClashMode } from "@/services/cmds";
import { showNotice } from "@/services/notice-service";
import { useXBoardSession } from "@/services/xboard/store";
import parseTraffic from "@/utils/parse-traffic";
import dayjs from "dayjs";

// ─── 计时器格式化 ────────────────────────────────────────────────────────────

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((secs % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ─── 账号摘要条 ──────────────────────────────────────────────────────────────

function AccountBar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const session = useXBoardSession();
  const { userInfo, loading } = useXBoardUserInfo();

  if (!session) {
    return (
      <Box
        onClick={() => navigate("/account")}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          cursor: "pointer",
          bgcolor: alpha(theme.palette.primary.main, 0.06),
          border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.text.secondary, 0.15),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WorkspacePremiumRounded sx={{ fontSize: 18, color: "text.secondary" }} />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {t("account.page.title")} — {t("account.login.tab")}
        </Typography>
        <ChevronRightRounded sx={{ ml: "auto", color: "text.disabled" }} />
      </Box>
    );
  }

  const initial = userInfo?.email?.[0]?.toUpperCase() ?? "?";
  const expiredAt = userInfo?.expiredAt ?? null;
  const expiryLabel =
    expiredAt === null
      ? t("account.dashboard.account.noExpiry")
      : dayjs(expiredAt * 1000).format("YYYY-MM-DD");

  return (
    <Box
      onClick={() => navigate("/account")}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        cursor: "pointer",
        bgcolor: alpha(theme.palette.primary.main, 0.06),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.1) },
      }}
    >
      {/* 头像 */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {loading ? (
          <CircularProgress size={14} sx={{ color: "white" }} />
        ) : (
          <Typography variant="body2" fontWeight="bold" sx={{ color: "white" }}>
            {initial}
          </Typography>
        )}
      </Box>

      {/* 邮箱 + 套餐 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {loading ? (
          <Skeleton width={120} height={16} />
        ) : (
          <Typography variant="body2" fontWeight="medium" noWrap>
            {userInfo?.email ?? "—"}
          </Typography>
        )}
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <WorkspacePremiumRounded sx={{ fontSize: 12, color: "primary.main" }} />
          {loading ? (
            <Skeleton width={80} height={14} />
          ) : (
            <Typography variant="caption" color="primary.main">
              {userInfo?.planName ?? t("account.dashboard.account.noPlan")}
            </Typography>
          )}
          {!loading && (
            <Typography variant="caption" color="text.secondary">
              · {expiryLabel}
            </Typography>
          )}
        </Stack>
      </Box>

      <ChevronRightRounded sx={{ color: "text.disabled", flexShrink: 0 }} />
    </Box>
  );
}

// ─── 大连接按钮 ───────────────────────────────────────────────────────────────

interface ConnectButtonProps {
  connected: boolean;
  connecting: boolean;
  onToggle: () => void;
  elapsed: number;
}

function ConnectButton({ connected, connecting, onToggle, elapsed }: ConnectButtonProps) {
  const theme = useTheme();

  const glowColor = connected ? theme.palette.primary.main : theme.palette.text.disabled;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        py: 2,
      }}
    >
      {/* 外层光晕圈 */}
      <Box
        sx={{
          position: "relative",
          width: 160,
          height: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 光晕 */}
        {connected && (
          <Box
            sx={{
              position: "absolute",
              inset: -8,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.25)} 0%, transparent 70%)`,
              animation: "pulse 2.5s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { transform: "scale(1)", opacity: 0.8 },
                "50%": { transform: "scale(1.08)", opacity: 0.4 },
              },
            }}
          />
        )}

        {/* 按钮主体 */}
        <Box
          onClick={connecting ? undefined : onToggle}
          sx={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: connected
              ? `linear-gradient(145deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              : theme.palette.mode === "dark"
                ? "#2a2d3a"
                : "#f0f2f5",
            boxShadow: connected
              ? `0 8px 32px ${alpha(theme.palette.primary.main, 0.45)}, 0 0 0 3px ${alpha(theme.palette.primary.main, 0.25)}`
              : `0 4px 16px ${alpha(theme.palette.common.black, 0.15)}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: connecting ? "default" : "pointer",
            transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            "&:hover": connecting
              ? {}
              : {
                  transform: "scale(1.04)",
                  boxShadow: connected
                    ? `0 12px 40px ${alpha(theme.palette.primary.main, 0.55)}`
                    : `0 8px 24px ${alpha(theme.palette.common.black, 0.2)}`,
                },
            "&:active": connecting ? {} : { transform: "scale(0.97)" },
          }}
        >
          {connecting ? (
            <CircularProgress
              size={36}
              sx={{ color: connected ? "white" : "primary.main" }}
            />
          ) : (
            <PowerSettingsNewRounded
              sx={{
                fontSize: 48,
                color: connected ? "white" : glowColor,
                transition: "color 0.3s",
              }}
            />
          )}
        </Box>
      </Box>

      {/* 状态文字 + 计时器 */}
      <Box sx={{ textAlign: "center" }}>
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            color: connected ? "primary.main" : "text.secondary",
            transition: "color 0.3s",
          }}
        >
          {connecting ? "连接中…" : connected ? "已连接" : "未连接"}
        </Typography>
        {connected && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontVariantNumeric: "tabular-nums",
              fontFamily: "monospace",
              mt: 0.25,
            }}
          >
            {formatElapsed(elapsed)}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ─── 流量统计行 ───────────────────────────────────────────────────────────────

function TrafficBar() {
  const {
    response: { data: traffic },
  } = useTrafficData();
  const {
    response: { data: connections },
  } = useConnectionData();
  const theme = useTheme();

  const [upVal, upUnit] = parseTraffic(traffic?.up ?? 0);
  const [downVal, downUnit] = parseTraffic(traffic?.down ?? 0);
  const [totalVal, totalUnit] = parseTraffic(
    (connections?.uploadTotal ?? 0) + (connections?.downloadTotal ?? 0),
  );

  const stats = [
    {
      icon: <ArrowUpwardRounded sx={{ fontSize: 16 }} />,
      value: `${upVal}`,
      unit: `${upUnit}/s`,
      color: theme.palette.secondary.main,
      label: "上传",
    },
    {
      icon: <ArrowDownwardRounded sx={{ fontSize: 16 }} />,
      value: `${downVal}`,
      unit: `${downUnit}/s`,
      color: theme.palette.primary.main,
      label: "下载",
    },
    {
      icon: <CloudDownloadRounded sx={{ fontSize: 16 }} />,
      value: `${totalVal}`,
      unit: totalUnit,
      color: theme.palette.info.main,
      label: "总流量",
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        justifyContent: "space-around",
        p: 1.5,
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      }}
    >
      {stats.map((s, i) => (
        <Box
          key={i}
          sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
        >
          <Box sx={{ color: s.color, display: "flex", alignItems: "center" }}>
            {s.icon}
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {s.label}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.4 }}>
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ fontVariantNumeric: "tabular-nums" }}
              >
                {s.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {s.unit}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Paper>
  );
}

// ─── 模式 + 节点行 ────────────────────────────────────────────────────────────

function ProxyBar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { clashConfig, refreshClashConfig } = useAppData();
  const { verge } = useVerge();
  const { currentProxy, primaryGroupName, mode } = useCurrentProxy();

  const MODES = [
    { key: "rule", label: t("home.components.clashMode.labels.rule") },
    { key: "global", label: t("home.components.clashMode.labels.global") },
    { key: "direct", label: t("home.components.clashMode.labels.direct") },
  ] as const;

  const handleModeChange = useLockFn(async (newMode: string) => {
    if (newMode === mode) return;
    if (verge?.auto_close_connection) {
      await closeAllConnections();
    }
    try {
      await patchClashMode(newMode);
      refreshClashConfig();
    } catch (e) {
      showNotice.error(e);
    }
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {/* 模式 Chip 组 */}
      <Stack direction="row" spacing={1} justifyContent="center">
        {MODES.map((m) => (
          <Chip
            key={m.key}
            label={m.label}
            size="medium"
            onClick={() => handleModeChange(m.key)}
            variant={mode === m.key ? "filled" : "outlined"}
            color={mode === m.key ? "primary" : "default"}
            sx={{
              fontWeight: mode === m.key ? 700 : 400,
              transition: "all 0.2s",
              flex: 1,
              borderRadius: 2,
            }}
          />
        ))}
      </Stack>

      {/* 当前节点行 */}
      <Paper
        elevation={0}
        onClick={() => navigate("/proxies")}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.25,
          borderRadius: 2,
          cursor: "pointer",
          bgcolor: alpha(theme.palette.background.paper, 0.6),
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderColor: alpha(theme.palette.primary.main, 0.3),
          },
        }}
      >
        {/* 在线指示灯 */}
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: currentProxy ? "success.main" : "text.disabled",
            flexShrink: 0,
          }}
        />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {currentProxy ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {primaryGroupName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ›
              </Typography>
              <Typography variant="body2" fontWeight="medium" noWrap>
                {currentProxy.name}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("home.components.currentProxy.labels.noActiveNode")}
            </Typography>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {currentProxy?.type ?? ""}
        </Typography>
        <ChevronRightRounded sx={{ fontSize: 18, color: "text.disabled" }} />
      </Paper>
    </Box>
  );
}

// ─── 首页主体 ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { t } = useTranslation();
  const { verge } = useVerge();
  const { isTunModeAvailable } = useSystemState();
  const { configState, toggleSystemProxy } = useSystemProxyState();
  const enable_tun_mode = verge?.enable_tun_mode ?? false;

  // 已连接 = 系统代理开启 OR TUN 模式开启且服务可用
  const isConnected = configState || (enable_tun_mode && isTunModeAvailable);
  const [connecting, setConnecting] = useState(false);

  // 连接计时器
  const connectedAtRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isConnected && connectedAtRef.current === null) {
      connectedAtRef.current = Date.now();
    } else if (!isConnected) {
      connectedAtRef.current = null;
      setElapsed(0);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) return;
    const id = setInterval(() => {
      if (connectedAtRef.current !== null) {
        setElapsed(Math.floor((Date.now() - connectedAtRef.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [isConnected]);

  const handleToggle = useLockFn(async () => {
    setConnecting(true);
    try {
      await toggleSystemProxy(!configState);
    } catch (e) {
      showNotice.error(e);
    } finally {
      setConnecting(false);
    }
  });

  return (
    <BasePage title={t("home.page.title")} contentStyle={{ padding: "12px 16px" }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        {/* 账号摘要 */}
        <AccountBar />

        {/* 大按钮 */}
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <ConnectButton
            connected={isConnected}
            connecting={connecting}
            onToggle={handleToggle}
            elapsed={elapsed}
          />
        </Box>

        {/* 流量统计 */}
        <TrafficBar />

        {/* 代理模式 + 节点 */}
        <ProxyBar />
      </Stack>
    </BasePage>
  );
};

export default HomePage;
