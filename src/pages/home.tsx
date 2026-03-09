/**
 * Home — VPN Dashboard (Bento Grid layout)
 */

import {
  PowerSettingsNewRounded,
  ArrowDownwardRounded,
  ArrowUpwardRounded,
  AppsRounded,
  NotificationsNoneRounded,
  ChevronRightRounded,
  SpeedRounded,
  WarningAmberRounded,
} from "@mui/icons-material";
import {
  Box,
  ButtonBase,
  CircularProgress,
  Divider,
  LinearProgress,
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
import { mutate } from "swr";
import { closeAllConnections } from "tauri-plugin-mihomo-api";

import { BasePage } from "@/components/base";
import { GlassCard } from "@/components/shared/glass-card";
import { useConnectionData } from "@/hooks/use-connection-data";
import { useCurrentProxy } from "@/hooks/use-current-proxy";
import { useTrafficData } from "@/hooks/use-traffic-data";
import { useVerge } from "@/hooks/use-verge";
import { useXBoardUserInfo } from "@/hooks/use-xboard-user-info";
import { useAppData } from "@/providers/app-data-context";
import { enhanceProfiles, patchVergeConfig } from "@/services/cmds";
import delayManager from "@/services/delay";
import { showNotice } from "@/services/notice-service";
import { useXBoardSession } from "@/services/xboard/store";
import {
  refreshXBoardProfile,
  syncXBoardSubscription,
} from "@/services/xboard/sync";
import parseTraffic, { formatPercent } from "@/utils/parse-traffic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const avatarBoxSx = {
  width: 44,
  height: 44,
  borderRadius: "12px",
  bgcolor: "primary.main",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
} as const;

// ─── Account Bar ──────────────────────────────────────────────────────────────

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
      <GlassCard onClick={() => navigate("/account")} sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={avatarBoxSx}>
            <Typography
              variant="body1"
              fontWeight="bold"
              sx={{ color: "white" }}
            >
              U
            </Typography>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
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
        </Box>
      </GlassCard>
    );
  }

  return (
    <GlassCard onClick={() => navigate("/account")} sx={{ p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={avatarBoxSx}>
          {loading ? (
            <CircularProgress size={16} sx={{ color: "white" }} />
          ) : (
            <Typography
              variant="body1"
              fontWeight="bold"
              sx={{ color: "white" }}
            >
              {initial}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Skeleton width={140} height={18} />
          ) : (
            <Typography
              variant="body2"
              fontWeight={600}
              color="text.primary"
              noWrap
            >
              {userInfo?.email ?? "—"}
            </Typography>
          )}
          <Stack direction="row" alignItems="center" spacing={0.5} mt={0.25}>
            {loading ? (
              <Skeleton width={100} height={14} />
            ) : (
              <Typography variant="caption" color="text.secondary">
                {t("account.dashboard.account.expiry")}: {expiryLabel}
              </Typography>
            )}
          </Stack>

          {!loading && session && (
            <Box sx={{ mt: 0.75 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "11px" }}
              >
                {t("account.dashboard.traffic.title")} {formatPercent(pct)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalBytes === 0 ? 100 : pct}
                sx={{
                  mt: 0.5,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 2,
                    background:
                      pct >= 95
                        ? theme.palette.error.main
                        : pct >= 80
                          ? theme.palette.warning.main
                          : theme.palette.primary.main,
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
    </GlassCard>
  );
}

// ─── Connect Button ───────────────────────────────────────────────────────────

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
  const { t } = useTranslation();
  const theme = useTheme();
  // Track connection changes to trigger CSS bounce animation via key
  const animKeyRef = useRef(0);
  const prevConnectedRef = useRef(connected);
  if (prevConnectedRef.current !== connected) {
    prevConnectedRef.current = connected;
    animKeyRef.current += 1;
  }

  const activeColor = theme.palette.primary.main;
  const inactiveColor = theme.palette.text.disabled;

  return (
    <GlassCard sx={{ py: 4, textAlign: "center" }}>
      {/* Circular button */}
      <Box
        sx={{
          position: "relative",
          width: 160,
          height: 160,
          mx: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer glow ring */}
        <Box
          sx={{
            position: "absolute",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: connected ? activeColor : inactiveColor,
            opacity: 0.1,
            pointerEvents: "none",
            transition: "all 0.4s",
            ...(connected && {
              animation: "pulse 2.5s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { transform: "scale(1)", opacity: 0.1 },
                "50%": { transform: "scale(1.08)", opacity: 0.05 },
              },
            }),
          }}
        />
        {/* Middle ring */}
        <Box
          sx={{
            position: "absolute",
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: connected ? activeColor : inactiveColor,
            opacity: 0.18,
            pointerEvents: "none",
            transition: "all 0.4s",
          }}
        />
        {/* Inner button — key forces re-mount to replay CSS animation */}
        <Box
          key={animKeyRef.current}
          onClick={connecting ? undefined : onToggle}
          sx={{
            position: "relative",
            zIndex: 1,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: connected ? activeColor : inactiveColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: connecting ? "default" : "pointer",
            boxShadow: connected
              ? `0 8px 32px ${alpha(activeColor, 0.4)}`
              : "none",
            transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            animation:
              animKeyRef.current > 0
                ? "connectBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                : "none",
            "@keyframes connectBounce": {
              "0%": { transform: "scale(0.85)" },
              "50%": { transform: "scale(1.1)" },
              "100%": { transform: "scale(1)" },
            },
            "&:hover": connecting ? {} : { transform: "scale(1.05)" },
            "&:active": connecting ? {} : { transform: "scale(0.96)" },
          }}
        >
          {connecting ? (
            <CircularProgress size={36} sx={{ color: "white" }} />
          ) : (
            <PowerSettingsNewRounded sx={{ fontSize: 44, color: "white" }} />
          )}
        </Box>
      </Box>

      {/* Status text */}
      <Typography
        variant="body1"
        fontWeight={600}
        sx={{
          mt: 2.5,
          color: connected ? theme.palette.primary.main : "text.secondary",
          transition: "color 0.3s",
        }}
      >
        {connecting
          ? t("home.components.connectButton.status.connecting")
          : connected
            ? t("home.components.connectButton.status.connected")
            : t("home.components.connectButton.status.disconnected")}
      </Typography>

      {connected && (
        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: "text.secondary",
            fontFamily:
              "'JetBrains Mono', 'Roboto Mono', 'Fira Code', monospace",
            fontSize: "13px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatElapsed(elapsed)}
        </Typography>
      )}

      {!connected && !connecting && (
        <Typography variant="caption" sx={{ mt: 0.5, color: "text.disabled" }}>
          {t("home.components.connectButton.action")}
        </Typography>
      )}
    </GlassCard>
  );
}

// ─── Speed Card (only when connected) ─────────────────────────────────────────

function SpeedCard() {
  const { t } = useTranslation();
  const theme = useTheme();
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
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
      {/* Download card */}
      <GlassCard sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowDownwardRounded
              sx={{ fontSize: 16, color: "primary.main" }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {t("home.components.speedCard.download")}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
            fontSize: "20px",
            color: "text.primary",
          }}
        >
          {downVal}
          <Typography
            component="span"
            variant="caption"
            sx={{ color: "text.secondary", ml: 0.5 }}
          >
            {downUnit}/s
          </Typography>
        </Typography>
      </GlassCard>

      {/* Upload card */}
      <GlassCard sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "8px",
              bgcolor: alpha(theme.palette.secondary.main, 0.12),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowUpwardRounded
              sx={{ fontSize: 16, color: "secondary.main" }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {t("home.components.speedCard.upload")}
          </Typography>
        </Box>
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
            fontSize: "20px",
            color: "text.primary",
          }}
        >
          {upVal}
          <Typography
            component="span"
            variant="caption"
            sx={{ color: "text.secondary", ml: 0.5 }}
          >
            {upUnit}/s
          </Typography>
        </Typography>
      </GlassCard>

      {/* Total traffic - full width */}
      <GlassCard
        sx={{
          gridColumn: "1 / -1",
          p: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {t("home.components.speedCard.totalTraffic")}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
            color: "text.primary",
          }}
        >
          {fwdVal} {fwdUnit}
        </Typography>
      </GlassCard>
    </Box>
  );
}

// ─── Proxy Card ───────────────────────────────────────────────────────────────

function ProxyCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const session = useXBoardSession();
  const { clashConfig, proxies, refreshProxy: appRefreshProxy } = useAppData();
  const { currentProxy, primaryGroupName } = useCurrentProxy();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void appRefreshProxy();
  }, [appRefreshProxy]);

  const modeLabel = (() => {
    const m = clashConfig?.mode ?? "rule";
    if (m === "rule") return t("home.components.clashMode.labels.rule");
    if (m === "global") return t("home.components.clashMode.labels.global");
    if (m === "direct") return t("home.components.clashMode.labels.direct");
    return m;
  })();

  const hasRealGroups =
    (proxies?.groups?.filter(
      (g: { name: string }) => g.name !== "GLOBAL" && g.name !== "DIRECT",
    )?.length ?? 0) > 0;

  const nodeName = currentProxy
    ? `${primaryGroupName ? primaryGroupName + " · " : ""}${currentProxy.name}`
    : t("home.components.currentProxy.labels.noActiveNode");

  const handlePress = () => navigate("/proxies");

  const handleSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (syncing) return;
    setSyncing(true);
    try {
      if (session?.subscribeUrl) {
        await syncXBoardSubscription(session.subscribeUrl);
      } else {
        await refreshXBoardProfile();
      }
      await enhanceProfiles();
      await appRefreshProxy();
      await mutate("getProxies");
      await mutate("getClashConfig");
      showNotice.success(
        t("home.components.currentProxy.messages.syncSuccess"),
      );
    } catch (err) {
      showNotice.error(
        t("home.components.currentProxy.messages.syncFailed") +
          ": " +
          (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <GlassCard onClick={handlePress} sx={{ overflow: "hidden" }}>
      {/* Proxy mode row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          height: 52,
          px: 2,
          gap: 1.25,
        }}
      >
        <AppsRounded
          sx={{
            fontSize: 20,
            color: theme.palette.primary.main,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ flexShrink: 0 }}
        >
          {t("home.components.clashMode.title")}
        </Typography>
        <Typography
          variant="body2"
          fontWeight={600}
          color="text.primary"
          sx={{ flex: 1 }}
        >
          {modeLabel}
        </Typography>
        <ChevronRightRounded
          sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }}
        />
      </Box>

      <Divider sx={{ mx: 2, borderColor: "divider" }} />

      {/* Node row or sync button */}
      {!hasRealGroups && session ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 48,
            px: 2,
          }}
        >
          <Typography
            variant="body2"
            fontWeight={600}
            onClick={handleSync}
            sx={{
              color: syncing ? "text.disabled" : "primary.main",
              cursor: syncing ? "default" : "pointer",
            }}
          >
            {syncing
              ? t("home.components.currentProxy.messages.syncing")
              : t("home.components.currentProxy.messages.noNodes")}
          </Typography>
          {syncing && (
            <CircularProgress
              size={16}
              sx={{ ml: 1, color: "text.disabled" }}
            />
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            height: 48,
            px: 2,
            gap: 1.25,
          }}
        >
          <NotificationsNoneRounded
            sx={{
              fontSize: 20,
              color: theme.palette.primary.main,
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flexShrink: 0 }}
          >
            {t("home.components.currentProxy.title")}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            noWrap
            color="text.primary"
            sx={{ flex: 1 }}
          >
            {nodeName}
          </Typography>
          <ChevronRightRounded
            sx={{ fontSize: 18, color: "text.disabled", flexShrink: 0 }}
          />
        </Box>
      )}
    </GlassCard>
  );
}

// ─── Expiry Warning Banner ────────────────────────────────────────────────────

function ExpiryBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userInfo } = useXBoardUserInfo();

  if (!userInfo?.expiredAt) return null;

  const daysLeft = Math.floor(
    (userInfo.expiredAt * 1000 - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (daysLeft > 7) return null;

  const isExpired = daysLeft < 0;

  return (
    <Box
      onClick={() => navigate("/shop")}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 2,
        py: 1.25,
        borderRadius: "var(--glass-radius)",
        cursor: "pointer",
        background: isExpired
          ? "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.06))"
          : "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))",
        border: `0.5px solid ${isExpired ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
        transition: "all 0.2s ease",
        "&:hover": { opacity: 0.85 },
      }}
    >
      <WarningAmberRounded
        sx={{
          fontSize: 18,
          color: isExpired ? "#EF4444" : "#F59E0B",
          flexShrink: 0,
        }}
      />
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          fontSize: "13px",
          color: isExpired ? "#EF4444" : "#F59E0B",
          fontWeight: 500,
        }}
      >
        {isExpired
          ? t("home.components.expiryBanner.expired" as any)
          : t("home.components.expiryBanner.expiringSoon" as any, {
              days: daysLeft,
            })}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          color: isExpired ? "#EF4444" : "#F59E0B",
          fontWeight: 600,
          fontSize: "12px",
          flexShrink: 0,
        }}
      >
        {t("home.components.expiryBanner.renew" as any)}
      </Typography>
    </Box>
  );
}

// ─── Speed Test Button ───────────────────────────────────────────────────────

function SpeedTestButton() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { currentProxy, primaryGroupName } = useCurrentProxy();
  const { verge } = useVerge();
  const timeout = verge?.default_latency_timeout || 10000;
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const handleTest = async () => {
    if (testing || !currentProxy) return;
    setTesting(true);
    setResult(null);
    try {
      const groupName = primaryGroupName || "GLOBAL";
      const update = await delayManager.checkDelay(
        currentProxy.name,
        groupName,
        timeout,
      );
      setResult(update.delay > 0 ? update.delay : -1);
    } catch {
      setResult(-1);
    } finally {
      setTesting(false);
    }
  };

  const delayColor =
    result === null
      ? theme.palette.primary.main
      : result > 0
        ? delayManager.formatDelayColor(result, timeout)
        : "#EF4444";

  return (
    <GlassCard sx={{ overflow: "hidden" }}>
      <ButtonBase
        onClick={handleTest}
        disabled={!currentProxy}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          height: 48,
          px: 2,
          gap: 1.25,
          justifyContent: "flex-start",
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            bgcolor: alpha(delayColor, 0.12),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {testing ? (
            <CircularProgress size={16} sx={{ color: delayColor }} />
          ) : (
            <SpeedRounded sx={{ fontSize: 18, color: delayColor }} />
          )}
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ flexShrink: 0 }}
        >
          {t("home.components.speedTest.title" as any)}
        </Typography>
        <Box sx={{ flex: 1 }} />
        {result !== null && !testing && (
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
              fontSize: "13px",
              color: delayColor,
            }}
          >
            {result > 0
              ? `${result}ms`
              : t("home.components.speedTest.failed" as any)}
          </Typography>
        )}
        {!currentProxy && !testing && (
          <Typography variant="caption" color="text.disabled">
            {t("home.components.speedTest.noNode" as any)}
          </Typography>
        )}
      </ButtonBase>
    </GlassCard>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

const HomePage = () => {
  const { t } = useTranslation();
  const { verge, mutateVerge } = useVerge();
  const { proxies } = useAppData();
  const session = useXBoardSession();
  const configState = verge?.enable_system_proxy ?? false;
  const isConnected = configState;
  const [connecting, setConnecting] = useState(false);

  // Subscription expiry reminder (within 3 days)
  const { userInfo } = useXBoardUserInfo();
  const expiryWarnedRef = useRef(false);
  useEffect(() => {
    if (expiryWarnedRef.current || !userInfo?.expiredAt) return;
    const daysLeft = Math.floor(
      (userInfo.expiredAt * 1000 - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft <= 3 && daysLeft >= 0) {
      expiryWarnedRef.current = true;
      showNotice.info(
        t("home.notifications.expiryWarning", { days: daysLeft }),
      );
    } else if (daysLeft < 0) {
      expiryWarnedRef.current = true;
      showNotice.error(t("home.notifications.expired"));
    }
  }, [userInfo, t]);

  // Auto-sync subscription when logged in but no proxy nodes
  const autoSyncDoneRef = useRef(false);
  useEffect(() => {
    if (autoSyncDoneRef.current) return;
    if (!session?.subscribeUrl) return;
    const realGroups =
      proxies?.groups?.filter(
        (g: { name: string }) => g.name !== "GLOBAL" && g.name !== "DIRECT",
      ) ?? [];
    if (realGroups.length > 0) return;
    autoSyncDoneRef.current = true;
    syncXBoardSubscription(session.subscribeUrl)
      .then(() => {
        showNotice.success(
          t("home.components.currentProxy.messages.syncSuccess"),
        );
      })
      .catch((err) => {
        showNotice.error(
          t("home.components.currentProxy.messages.syncFailed") +
            ": " +
            (err instanceof Error ? err.message : String(err)),
        );
      });
  }, [session, proxies, t]);

  // Connection timer
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
    const newState = !configState;
    try {
      if (!newState) {
        await closeAllConnections();
      }
      await patchVergeConfig({ enable_system_proxy: newState });
      await mutateVerge();
      await mutate("getSystemProxy");
      await mutate("getAutotemProxy");
    } catch (e: unknown) {
      await mutateVerge();
      showNotice.error(
        e instanceof Error ? e.message : String(e ?? "Operation failed"),
      );
    } finally {
      setConnecting(false);
    }
  };

  return (
    <BasePage contentStyle={{ padding: "16px 20px" }}>
      <Stack spacing={1.5}>
        <ExpiryBanner />
        <AccountBar />
        <ConnectButton
          connected={isConnected}
          connecting={connecting}
          onToggle={handleToggle}
          elapsed={elapsed}
        />
        {isConnected && <SpeedCard />}
        <SpeedTestButton />
        <ProxyCard />
      </Stack>
    </BasePage>
  );
};

export default HomePage;
