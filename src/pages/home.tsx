/**
 * 首页 — VPN 连接中心（对齐安卓版 悦通 design_main.xml）
 *
 * 布局：
 *  ┌──────────────────────────────────────────────────┐
 *  │  [M]  my@yue.to   到期: 永久   流量: <1% [====] │  ← 用户信息卡
 *  ├──────────────────────────────────────────────────┤
 *  │              ○○●  大圆形连接按钮  ●○○           │
 *  │                      已连接                      │
 *  │                    00:19:37                      │
 *  ├──────────────────────────────────────────────────┤  ← 仅连接时显示
 *  │  总流量: 1.84 MiB                                │
 *  │     下载: 0 B/s   │   上传: 33.0 KB/s           │
 *  ├──────────────────────────────────────────────────┤
 *  │  代理: 规则模式                          >       │
 *  │  ─────────────────────────────────────────────  │
 *  │  节点选择: 悦通                          >       │
 *  └──────────────────────────────────────────────────┘
 */

import {
  PowerSettingsNewRounded,
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  AppsRounded,
  NotificationsNoneRounded,
  ChevronRightRounded,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { closeAllConnections } from "tauri-plugin-mihomo-api";

import { BasePage } from "@/components/base";
import { useConnectionData } from "@/hooks/use-connection-data";
import { useCurrentProxy } from "@/hooks/use-current-proxy";
import { useSystemProxyState } from "@/hooks/use-system-proxy-state";
import { useTrafficData } from "@/hooks/use-traffic-data";
import { useXBoardUserInfo } from "@/hooks/use-xboard-user-info";
import { useAppData } from "@/providers/app-data-context";
import { showNotice } from "@/services/notice-service";
import { useXBoardSession } from "@/services/xboard/store";
import parseTraffic from "@/utils/parse-traffic";

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

function calcTrafficPct(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min((used / total) * 100, 100);
}

function formatPercent(pct: number): string {
  if (pct <= 0) return "0%";
  if (pct < 1) return "<1%";
  if (pct >= 100) return "100%";
  return `${Math.round(pct)}%`;
}

// ─── 用户信息卡（对齐安卓 home tab 用户信息卡）────────────────────────────────

function AccountBar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const session = useXBoardSession();
  const { userInfo, loading } = useXBoardUserInfo();

  const initial = userInfo?.email?.[0]?.toUpperCase() ?? "U";
  const expiredAt = userInfo?.expiredAt ?? null;
  const expiryLabel =
    expiredAt === null
      ? t("account.dashboard.account.noExpiry")
      : dayjs(expiredAt * 1000).format("YYYY-MM-DD");

  const usedBytes = (userInfo?.usedDownload ?? 0) + (userInfo?.usedUpload ?? 0);
  const totalBytes = userInfo?.transferEnable ?? 0;
  const pct = calcTrafficPct(usedBytes, totalBytes);

  if (!session) {
    return (
      <Paper
        elevation={4}
        onClick={() => navigate("/account")}
        sx={{
          borderRadius: 2,
          p: 2,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "background.paper",
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ color: "white" }}>
            U
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="body2"
            fontWeight="bold"
            color="primary.main"
            noWrap
          >
            {t("account.login.tab")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("account.page.title")}
          </Typography>
        </Box>
        <ChevronRightRounded sx={{ color: "text.disabled" }} />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={4}
      onClick={() => navigate("/account")}
      sx={{
        borderRadius: 2,
        p: 2,
        cursor: "pointer",
        bgcolor: "background.paper",
        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {/* 头像 */}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {loading ? (
            <CircularProgress size={16} sx={{ color: "white" }} />
          ) : (
            <Typography variant="h6" fontWeight="bold" sx={{ color: "white" }}>
              {initial}
            </Typography>
          )}
        </Box>

        {/* 文字信息 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Skeleton width={140} height={18} />
          ) : (
            <Typography
              variant="body2"
              fontWeight="bold"
              color="primary.dark"
              noWrap
              sx={{ color: "#1A237E" }}
            >
              {userInfo?.email ?? "—"}
            </Typography>
          )}
          <Stack direction="row" alignItems="center" spacing={0.5} mt={0.25}>
            {loading ? (
              <Skeleton width={100} height={14} />
            ) : (
              <Typography variant="caption" sx={{ color: "#5C7CAB" }}>
                {t("account.dashboard.account.expiry")}：{expiryLabel}
              </Typography>
            )}
          </Stack>

          {/* 流量进度条 */}
          {!loading && session && (
            <Box sx={{ mt: 0.75 }}>
              <Typography
                variant="caption"
                sx={{ color: "#5C7CAB", fontSize: "11px" }}
              >
                {t("account.dashboard.traffic.title")} {formatPercent(pct)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalBytes === 0 ? 100 : pct}
                sx={{
                  mt: 0.5,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 3,
                    background:
                      pct >= 95
                        ? theme.palette.error.main
                        : pct >= 80
                          ? theme.palette.warning.main
                          : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

// ─── 大连接按钮（对齐安卓 180/152/128dp 三层圆）────────────────────────────────

interface ConnectButtonProps {
  connected: boolean;
  connecting: boolean;
  onToggle: () => void;
  elapsed: number;
}

function ConnectButton({
  connected,
  connecting,
  onToggle,
  elapsed,
}: ConnectButtonProps) {
  const theme = useTheme();
  const primaryColor = connected ? theme.palette.primary.main : "#8EAACB";

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: 2,
        py: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
        bgcolor: "background.paper",
      }}
    >
      {/* 三层圆（对齐安卓 bg_connect_button_ring 180/152/128dp） */}
      <Box
        sx={{
          position: "relative",
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 外层光晕环 alpha 0.12 */}
        <Box
          sx={{
            position: "absolute",
            width: 180,
            height: 180,
            borderRadius: "50%",
            bgcolor: primaryColor,
            opacity: 0.12,
            transition: "all 0.4s",
            ...(connected && {
              animation: "pulse 2.5s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { transform: "scale(1)", opacity: 0.12 },
                "50%": { transform: "scale(1.06)", opacity: 0.06 },
              },
            }),
          }}
        />
        {/* 中层环 alpha 0.22 */}
        <Box
          sx={{
            position: "absolute",
            width: 152,
            height: 152,
            borderRadius: "50%",
            bgcolor: primaryColor,
            opacity: 0.22,
            transition: "all 0.4s",
          }}
        />
        {/* 内层按钮 128dp */}
        <Box
          onClick={connecting ? undefined : onToggle}
          sx={{
            width: 128,
            height: 128,
            borderRadius: "50%",
            bgcolor: primaryColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: connecting ? "default" : "pointer",
            boxShadow: connected
              ? `0 6px 24px ${alpha(theme.palette.primary.main, 0.5)}`
              : "0 4px 16px rgba(0,0,0,0.15)",
            transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            "&:hover": connecting ? {} : { transform: "scale(1.04)" },
            "&:active": connecting ? {} : { transform: "scale(0.97)" },
          }}
        >
          {connecting ? (
            <CircularProgress size={40} sx={{ color: "white" }} />
          ) : (
            <PowerSettingsNewRounded sx={{ fontSize: 52, color: "white" }} />
          )}
        </Box>
      </Box>

      {/* 状态文字（对齐安卓 18sp bold, colorConnected / colorDisconnected） */}
      <Typography
        variant="h6"
        fontWeight="bold"
        sx={{
          mt: 2.5,
          color: connected ? theme.palette.primary.main : "#8EAACB",
          transition: "color 0.3s",
          fontSize: "18px",
        }}
      >
        {connecting ? "连接中…" : connected ? "已连接" : "未连接"}
      </Typography>

      {/* 连接时: 计时器（对齐安卓 monospace） */}
      {connected && (
        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "#5C7CAB",
            fontFamily: "monospace",
            fontSize: "13px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatElapsed(elapsed)}
        </Typography>
      )}

      {/* 未连接时: 提示文字 */}
      {!connected && !connecting && (
        <Typography variant="caption" sx={{ mt: 0.5, color: "#8EAACB" }}>
          点击连接
        </Typography>
      )}
    </Paper>
  );
}

// ─── 速度卡（仅连接时显示，对齐安卓连接速度卡）────────────────────────────────

function SpeedCard() {
  const {
    response: { data: traffic },
  } = useTrafficData();
  const {
    response: { data: connections },
  } = useConnectionData();

  const [upVal, upUnit] = parseTraffic(traffic?.up ?? 0);
  const [downVal, downUnit] = parseTraffic(traffic?.down ?? 0);
  const [fwdVal, fwdUnit] = parseTraffic(
    (connections?.uploadTotal ?? 0) + (connections?.downloadTotal ?? 0),
  );

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: 2,
        p: 2,
        bgcolor: "background.paper",
      }}
    >
      {/* 总流量（对齐安卓 forwarded 小字） */}
      <Typography
        variant="caption"
        sx={{ color: "#8EAACB", display: "block", mb: 1 }}
      >
        总流量：{fwdVal} {fwdUnit}
      </Typography>

      {/* 下载 | 上传 两列（对齐安卓 LinearLayout horizontal） */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {/* 下载 */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ArrowDownwardRounded sx={{ fontSize: 14, color: "#5C7CAB" }} />
            <Typography variant="caption" sx={{ color: "#5C7CAB" }}>
              下载
            </Typography>
          </Box>
          <Typography
            variant="body1"
            fontWeight="bold"
            sx={{ color: "#1A237E", mt: 0.25 }}
          >
            {downVal}{" "}
            <Typography
              component="span"
              variant="caption"
              sx={{ color: "#5C7CAB" }}
            >
              {downUnit}/s
            </Typography>
          </Typography>
        </Box>

        {/* 分隔线 */}
        <Box sx={{ width: 1, height: 36, bgcolor: "#E0EAF8" }} />

        {/* 上传 */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <ArrowUpwardRounded sx={{ fontSize: 14, color: "#5C7CAB" }} />
            <Typography variant="caption" sx={{ color: "#5C7CAB" }}>
              上传
            </Typography>
          </Box>
          <Typography
            variant="body1"
            fontWeight="bold"
            sx={{ color: "#1A237E", mt: 0.25 }}
          >
            {upVal}{" "}
            <Typography
              component="span"
              variant="caption"
              sx={{ color: "#5C7CAB" }}
            >
              {upUnit}/s
            </Typography>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

// ─── 代理模式 + 节点卡（对齐安卓单卡，点击跳节点页）────────────────────────────

function ProxyCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { clashConfig } = useAppData();
  const { currentProxy, primaryGroupName } = useCurrentProxy();

  const modeLabel = (() => {
    const m = clashConfig?.mode ?? "rule";
    if (m === "rule") return t("home.components.clashMode.labels.rule");
    if (m === "global") return t("home.components.clashMode.labels.global");
    if (m === "direct") return t("home.components.clashMode.labels.direct");
    return m;
  })();

  const nodeName = currentProxy
    ? `${primaryGroupName ? primaryGroupName + " · " : ""}${currentProxy.name}`
    : t("home.components.currentProxy.labels.noActiveNode");

  const handlePress = () => navigate("/proxies");

  return (
    <Paper
      elevation={4}
      onClick={handlePress}
      sx={{
        borderRadius: 2,
        bgcolor: "background.paper",
        cursor: "pointer",
        overflow: "hidden",
        "&:hover": { bgcolor: alpha("#3A6BBF", 0.03) },
      }}
    >
      {/* 代理模式行（对齐安卓 56dp height） */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          height: 56,
          px: 2,
          gap: 1.25,
        }}
      >
        <AppsRounded sx={{ fontSize: 20, color: "#3A6BBF", flexShrink: 0 }} />
        <Typography variant="body2" sx={{ color: "#8EAACB", flexShrink: 0 }}>
          代理
        </Typography>
        <Typography
          variant="body2"
          fontWeight="bold"
          sx={{ color: "#1A237E", flex: 1 }}
        >
          {modeLabel}
        </Typography>
        <ChevronRightRounded
          sx={{ fontSize: 18, color: "#8EAACB", flexShrink: 0 }}
        />
      </Box>

      {/* 分隔线 */}
      <Divider sx={{ mx: 2, borderColor: "#E0EAF8" }} />

      {/* 节点选择行（对齐安卓 52dp height） */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          height: 52,
          px: 2,
          gap: 1.25,
        }}
      >
        <NotificationsNoneRounded
          sx={{ fontSize: 20, color: "#3A6BBF", flexShrink: 0 }}
        />
        <Typography variant="body2" sx={{ color: "#8EAACB", flexShrink: 0 }}>
          节点选择
        </Typography>
        <Typography
          variant="body2"
          fontWeight="bold"
          noWrap
          sx={{ color: "#1A237E", flex: 1 }}
        >
          {nodeName}
        </Typography>
        <ChevronRightRounded
          sx={{ fontSize: 18, color: "#8EAACB", flexShrink: 0 }}
        />
      </Box>
    </Paper>
  );
}

// ─── 首页主体 ─────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { configState, toggleSystemProxy } = useSystemProxyState();

  const isConnected = configState;
  const [connecting, setConnecting] = useState(false);

  // 连接计时器
  const connectedAtRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isConnected && connectedAtRef.current === null) {
      connectedAtRef.current = Date.now();
    } else if (!isConnected) {
      connectedAtRef.current = null;
      // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
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

  const handleToggle = async () => {
    if (connecting) return;
    setConnecting(true);
    try {
      if (isConnected) {
        await closeAllConnections();
      }
      await toggleSystemProxy(!configState);
    } catch (e: any) {
      showNotice.error(
        e instanceof Error ? e.message : String(e ?? "操作失败"),
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <BasePage contentStyle={{ padding: "12px 16px" }}>
      <Stack spacing={2}>
        {/* 用户信息卡 */}
        <AccountBar />

        {/* 连接按钮卡 */}
        <ConnectButton
          connected={isConnected}
          connecting={connecting}
          onToggle={handleToggle}
          elapsed={elapsed}
        />

        {/* 速度卡（仅连接时显示，对齐安卓） */}
        {isConnected && <SpeedCard />}

        {/* 代理模式 + 节点卡 */}
        <ProxyCard />
      </Stack>
    </BasePage>
  );
};

export default HomePage;
