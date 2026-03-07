/**
 * 悦通用户中心
 *
 * 布局：
 *  ┌──────────────────────────────────────────────┐
 *  │  ProfileHeader（头像 + 邮箱 + 套餐 + 到期）   │
 *  └──────────────────────────────────────────────┘
 *  ┌──────────────────────────────────────────────┐
 *  │  QuickActions（订阅同步 / 商店 / 订单 / 公告）│
 *  └──────────────────────────────────────────────┘
 *  ┌─────────────┐ ┌────────────────────────────┐
 *  │  环形流量卡  │ │  钱包卡 & 邀请卡            │
 *  └─────────────┘ └────────────────────────────┘
 */

import {
  AccountCircleRounded,
  AnnouncementRounded,
  ContentCopyRounded,

  GroupRounded,
  LinkRounded,
  ListAltRounded,
  LogoutRounded,
  MonetizationOnRounded,
  RefreshRounded,
  ShoppingBagRounded,
  SyncRounded,
  WorkspacePremiumRounded,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CircularProgress,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import dayjs from "dayjs";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { EnhancedCard } from "@/components/home/enhanced-card";
import { useXBoardUserInfo } from "@/hooks/use-xboard-user-info";
import { showNotice } from "@/services/notice-service";
import { logout } from "@/services/xboard/api";
import { clearSession, useSetXBoardSession, useXBoardSession } from "@/services/xboard/store";
import {
  clearProfileUid,
  refreshXBoardProfile,
} from "@/services/xboard/sync";
import type { InviteInfo, UserInfo } from "@/services/xboard/types";
import parseTraffic from "@/utils/parse-traffic";

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatBalance(cents: number, unit: string): string {
  return `${unit}${(cents / 100).toFixed(2)}`;
}

function formatExpiry(expiredAt: number | null, noExpiry: string): string {
  if (expiredAt === null) return noExpiry;
  return dayjs(expiredAt * 1000).format("YYYY-MM-DD");
}

function calcTrafficPct(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.round((used / total) * 100), 100);
}

// ────────────────────────────────────────────────────────────────────────────
// ProfileHeader
// ────────────────────────────────────────────────────────────────────────────

function ProfileHeader({
  userInfo,
  loading,
  onLogout,
  loggingOut,
}: {
  userInfo: ReturnType<typeof useXBoardUserInfo>["userInfo"];
  loading: boolean;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const initial = userInfo?.email?.[0]?.toUpperCase() ?? "?";
  const expiredAt = userInfo?.expiredAt ?? null;
  const daysLeft =
    expiredAt !== null ? dayjs(expiredAt * 1000).diff(dayjs(), "day") : null;
  const expiryLabel =
    expiredAt === null
      ? t("account.dashboard.account.noExpiry")
      : daysLeft !== null && daysLeft >= 0
        ? `${daysLeft} 天后到期`
        : "已到期";
  const expiryColor =
    daysLeft !== null && daysLeft < 7
      ? theme.palette.error.main
      : daysLeft !== null && daysLeft < 30
        ? theme.palette.warning.main
        : theme.palette.text.secondary;

  return (
    <Card
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* 头像 */}
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            <Typography variant="h5" fontWeight="bold" sx={{ color: "white" }}>
              {initial}
            </Typography>
          )}
        </Box>

        {/* 信息 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <>
              <Skeleton width={160} height={22} />
              <Skeleton width={100} height={18} sx={{ mt: 0.5 }} />
            </>
          ) : (
            <>
              <Typography
                variant="body1"
                fontWeight="bold"
                noWrap
                title={userInfo?.email}
              >
                {userInfo?.email ?? "—"}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.25 }}>
                <WorkspacePremiumRounded sx={{ fontSize: 14, color: "primary.main" }} />
                <Typography variant="caption" color="primary.main" fontWeight="medium">
                  {userInfo?.planName ?? t("account.dashboard.account.noPlan")}
                </Typography>
                <Typography variant="caption" sx={{ color: expiryColor }}>
                  · {expiryLabel}
                </Typography>
              </Stack>
            </>
          )}
        </Box>

        {/* 退出 */}
        <Tooltip title={t("account.session.logout")}>
          <span>
            <IconButton
              size="small"
              onClick={onLogout}
              disabled={loggingOut}
              sx={{ color: "text.secondary" }}
            >
              {loggingOut ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <LogoutRounded fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// QuickActions
// ────────────────────────────────────────────────────────────────────────────

function QuickActions({
  onSync,
  syncing,
  subscribeUrl,
}: {
  onSync: () => void;
  syncing: boolean;
  subscribeUrl: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const actions = [
    {
      icon: syncing ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        <SyncRounded />
      ),
      label: syncing
        ? t("account.dashboard.account.syncing")
        : t("account.dashboard.account.syncNow"),
      onClick: onSync,
      disabled: syncing || !subscribeUrl,
      color: theme.palette.primary.main,
    },
    {
      icon: <ShoppingBagRounded />,
      label: t("account.shop.page.title"),
      onClick: () => navigate("/shop"),
      color: theme.palette.secondary.main,
    },
    {
      icon: <ListAltRounded />,
      label: t("account.orders.page.title"),
      onClick: () => navigate("/orders"),
      color: theme.palette.warning.main,
    },
    {
      icon: <AnnouncementRounded />,
      label: t("account.notices.page.title"),
      onClick: () => navigate("/notices"),
      color: theme.palette.info.main,
    },
  ];

  return (
    <Grid container spacing={1.5} columns={4}>
      {actions.map((a) => (
        <Grid key={a.label} size={1}>
          <Box
            onClick={a.disabled ? undefined : a.onClick}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.75,
              py: 1.5,
              borderRadius: 2.5,
              cursor: a.disabled ? "default" : "pointer",
              opacity: a.disabled ? 0.5 : 1,
              backgroundColor: alpha(a.color, 0.07),
              border: `1px solid ${alpha(a.color, 0.15)}`,
              transition: "all 0.15s",
              "&:hover": a.disabled
                ? {}
                : {
                    backgroundColor: alpha(a.color, 0.13),
                    transform: "translateY(-1px)",
                  },
            }}
          >
            <Box sx={{ color: a.color, display: "flex" }}>{a.icon}</Box>
            <Typography variant="caption" fontWeight="medium" color={a.color} noWrap>
              {a.label}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TrafficCard
// ────────────────────────────────────────────────────────────────────────────

function TrafficCard({ userInfo, loading }: { userInfo: UserInfo | null; loading: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const usedBytes = (userInfo?.usedDownload ?? 0) + (userInfo?.usedUpload ?? 0);
  const totalBytes = userInfo?.transferEnable ?? 0;
  const remainingBytes = Math.max(totalBytes - usedBytes, 0);
  const pct = calcTrafficPct(usedBytes, totalBytes);
  const isUnlimited = totalBytes === 0;

  const [usedVal, usedUnit] = parseTraffic(usedBytes);
  const [totalVal, totalUnit] = parseTraffic(totalBytes);
  const [remainVal, remainUnit] = parseTraffic(remainingBytes);
  const [upVal, upUnit] = parseTraffic(userInfo?.usedUpload ?? 0);
  const [downVal, downUnit] = parseTraffic(userInfo?.usedDownload ?? 0);

  // 进度条颜色：>80% 警告色，>95% 错误色
  const barColor =
    pct >= 95
      ? theme.palette.error.main
      : pct >= 80
        ? theme.palette.warning.main
        : theme.palette.primary.main;

  return (
    <EnhancedCard
      title={t("account.dashboard.traffic.title")}
      icon={<LinkRounded />}
      iconColor="info"
    >
      <Stack spacing={2}>
        {/* 环形进度 */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
            {/* 背景圆 */}
            <CircularProgress
              variant="determinate"
              value={100}
              size={80}
              thickness={5}
              sx={{ color: alpha(barColor, 0.12), position: "absolute" }}
            />
            {/* 前景圆 */}
            <CircularProgress
              variant={loading ? "indeterminate" : "determinate"}
              value={isUnlimited ? 100 : pct}
              size={80}
              thickness={5}
              sx={{ color: barColor }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {loading ? null : (
                <Typography variant="caption" fontWeight="bold" color={barColor}>
                  {isUnlimited ? "∞" : `${pct}%`}
                </Typography>
              )}
            </Box>
          </Box>

          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            {loading ? (
              <>
                <Skeleton width="80%" />
                <Skeleton width="60%" />
              </>
            ) : isUnlimited ? (
              <Typography variant="body2" fontWeight="medium">
                {t("account.dashboard.traffic.unlimited")}
              </Typography>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  {t("account.dashboard.traffic.used")}{" "}
                  <Box component="span" fontWeight="bold" color="text.primary">
                    {usedVal} {usedUnit}
                  </Box>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("account.dashboard.traffic.total")}{" "}
                  <Box component="span" fontWeight="medium" color="text.primary">
                    {totalVal} {totalUnit}
                  </Box>
                </Typography>
              </>
            )}
          </Stack>
        </Stack>

        {/* 剩余 / 上传 / 下载 */}
        <Grid container spacing={1} columns={12}>
          {[
            {
              label: t("account.dashboard.traffic.remaining"),
              value: isUnlimited
                ? t("account.dashboard.traffic.unlimited")
                : `${remainVal} ${remainUnit}`,
              color: theme.palette.success.main,
            },
            {
              label: t("account.dashboard.traffic.upload"),
              value: `${upVal} ${upUnit}`,
              color: theme.palette.secondary.main,
            },
            {
              label: t("account.dashboard.traffic.download"),
              value: `${downVal} ${downUnit}`,
              color: theme.palette.primary.main,
            },
          ].map((item) => (
            <Grid key={item.label} size={4}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  textAlign: "center",
                  backgroundColor: alpha(item.color, 0.07),
                  border: `1px solid ${alpha(item.color, 0.18)}`,
                }}
              >
                {loading ? (
                  <Skeleton width="80%" sx={{ mx: "auto" }} />
                ) : (
                  <Typography variant="body2" fontWeight="bold" color={item.color} noWrap>
                    {item.value}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" noWrap>
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </EnhancedCard>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// WalletCard
// ────────────────────────────────────────────────────────────────────────────

function WalletCard({ userInfo, loading }: { userInfo: UserInfo | null; loading: boolean }) {
  const { t } = useTranslation();
  const unit = t("account.dashboard.wallet.unit");

  const items = [
    {
      icon: <MonetizationOnRounded fontSize="small" />,
      label: t("account.dashboard.wallet.balance"),
      value: loading ? null : formatBalance(userInfo?.balance ?? 0, unit),
      color: "warning" as const,
    },
    {
      icon: <MonetizationOnRounded fontSize="small" />,
      label: t("account.dashboard.wallet.commission"),
      value: loading ? null : formatBalance(userInfo?.commissionBalance ?? 0, unit),
      color: "success" as const,
    },
  ];

  return (
    <EnhancedCard
      title={t("account.dashboard.wallet.title")}
      icon={<MonetizationOnRounded />}
      iconColor="warning"
    >
      <Stack spacing={1.5}>
        {items.map((item) => (
          <Stack key={item.label} direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: "50%",
                backgroundColor: (theme) => alpha(theme.palette[item.color].main, 0.12),
                color: `${item.color}.main`,
                flexShrink: 0,
              }}
            >
              {item.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {item.label}
              </Typography>
              {item.value === null ? (
                <Skeleton width={80} />
              ) : (
                <Typography variant="body1" fontWeight="bold">
                  {item.value}
                </Typography>
              )}
            </Box>
          </Stack>
        ))}
      </Stack>
    </EnhancedCard>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// InviteCard
// ────────────────────────────────────────────────────────────────────────────

function InviteCard({
  inviteInfo,
  loading,
}: {
  inviteInfo: InviteInfo | null;
  loading: boolean;
}) {
  const { t } = useTranslation();

  const handleCopy = async () => {
    if (!inviteInfo?.inviteUrl) return;
    try {
      await writeText(inviteInfo.inviteUrl);
      showNotice.success(t("account.dashboard.invite.linkCopied"));
    } catch {
      showNotice.error("复制失败");
    }
  };

  return (
    <EnhancedCard
      title={t("account.dashboard.invite.title")}
      icon={<GroupRounded />}
      iconColor="success"
    >
      <Stack spacing={1.5}>
        {/* 已邀请人数 */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <GroupRounded fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary">
            {t("account.dashboard.invite.referrals")}
          </Typography>
          {loading ? (
            <Skeleton width={40} />
          ) : (
            <Typography variant="body2" fontWeight="bold">
              {inviteInfo?.referralCount ?? 0} {t("account.dashboard.invite.people")}
            </Typography>
          )}
        </Stack>

        {/* 邀请链接 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            p: 1,
            borderRadius: 1.5,
            backgroundColor: (theme) =>
              alpha(theme.palette.primary.main, 0.06),
            border: (theme) =>
              `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
          }}
        >
          <LinkRounded fontSize="small" color="action" sx={{ flexShrink: 0 }} />
          {loading ? (
            <Skeleton sx={{ flex: 1 }} />
          ) : (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontFamily: "monospace",
              }}
              title={inviteInfo?.inviteUrl || t("account.dashboard.invite.noLink")}
            >
              {inviteInfo?.inviteUrl || t("account.dashboard.invite.noLink")}
            </Typography>
          )}
          {!loading && inviteInfo?.inviteUrl && (
            <Tooltip title={t("account.dashboard.invite.copyLink")}>
              <IconButton size="small" onClick={handleCopy} sx={{ flexShrink: 0 }}>
                <ContentCopyRounded sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Stack>
    </EnhancedCard>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// UserDashboard (root export)
// ────────────────────────────────────────────────────────────────────────────

export function UserDashboard() {
  const { t } = useTranslation();
  const session = useXBoardSession();
  const setSession = useSetXBoardSession();
  const { userInfo, inviteInfo, loading, error, refresh } = useXBoardUserInfo();
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout(session!.baseUrl, session!.authData);
    } finally {
      clearSession();
      clearProfileUid();
      setSession(null);
      setLoggingOut(false);
      showNotice.success(t("account.session.feedback.logoutSuccess"));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await refreshXBoardProfile();
      showNotice.success(t("account.dashboard.account.syncSuccess"));
    } catch (err: any) {
      showNotice.error(
        t("account.dashboard.account.syncFailed"),
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Profile Header */}
      <ProfileHeader
        userInfo={userInfo}
        loading={loading}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* 快捷操作 */}
      <QuickActions
        onSync={handleSync}
        syncing={syncing}
        subscribeUrl={session?.subscribeUrl ?? ""}
      />

      {/* 错误 + 刷新 */}
      {(error || refreshing) && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
          {error && !loading && (
            <Typography variant="caption" color="error">
              {t("account.dashboard.loadFailed")}
            </Typography>
          )}
          <Tooltip title={t("account.dashboard.refresh")}>
            <span>
              <IconButton size="small" onClick={handleRefresh} disabled={loading || refreshing}>
                <RefreshRounded
                  fontSize="small"
                  sx={{
                    animation: loading || refreshing ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      )}

      {/* 流量卡（左） + 钱包卡 & 邀请卡（右列） */}
      <Grid container spacing={2} columns={12}>
        <Grid size={7}>
          <TrafficCard userInfo={userInfo} loading={loading} />
        </Grid>
        <Grid size={5}>
          <Stack spacing={2} sx={{ height: "100%" }}>
            <WalletCard userInfo={userInfo} loading={loading} />
            <InviteCard inviteInfo={inviteInfo} loading={loading} />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
