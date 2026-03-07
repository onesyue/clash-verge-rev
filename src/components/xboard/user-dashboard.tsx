/**
 * XBoard 用户仪表盘
 *
 * 卡片布局（对齐 ClashMetaForAndroid 的用户中心）：
 *  ┌──────────────────────────────┐
 *  │  账户信息卡（邮箱/套餐/到期）  │
 *  └──────────────────────────────┘
 *  ┌───────────────┐ ┌────────────┐
 *  │  流量使用卡    │ │  钱包 + 邀 │
 *  │  进度条 + 详情 │ │  请卡      │
 *  └───────────────┘ └────────────┘
 */

import {
  AccountCircleRounded,
  ContentCopyRounded,
  EventRounded,
  GroupRounded,
  LinkRounded,
  LogoutRounded,
  MonetizationOnRounded,
  RefreshRounded,
  WorkspacePremiumRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  LinearProgress,
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
// AccountInfoCard
// ────────────────────────────────────────────────────────────────────────────

function AccountInfoCard({
  userInfo,
  loading,
  subscribeUrl,
  onLogout,
  loggingOut,
  onSync,
  syncing,
}: {
  userInfo: UserInfo | null;
  loading: boolean;
  subscribeUrl: string;
  onLogout: () => void;
  loggingOut: boolean;
  onSync: () => void;
  syncing: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const rows: Array<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = [
    {
      icon: <AccountCircleRounded fontSize="small" color="action" />,
      label: t("account.dashboard.account.email"),
      value: loading ? <Skeleton width={160} /> : (userInfo?.email || "—"),
    },
    {
      icon: <WorkspacePremiumRounded fontSize="small" color="action" />,
      label: t("account.dashboard.account.plan"),
      value: loading ? (
        <Skeleton width={80} />
      ) : (
        userInfo?.planName ?? t("account.dashboard.account.noPlan")
      ),
    },
    {
      icon: <EventRounded fontSize="small" color="action" />,
      label: t("account.dashboard.account.expiry"),
      value: loading ? (
        <Skeleton width={100} />
      ) : (
        formatExpiry(userInfo?.expiredAt ?? null, t("account.dashboard.account.noExpiry"))
      ),
    },
  ];

  return (
    <EnhancedCard
      title={t("account.dashboard.account.title")}
      icon={<AccountCircleRounded />}
      iconColor="primary"
      action={
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={
            loggingOut ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <LogoutRounded fontSize="small" />
            )
          }
          onClick={onLogout}
          disabled={loggingOut}
          sx={{ borderRadius: 1.5 }}
        >
          {t("account.session.logout")}
        </Button>
      }
    >
      <Stack spacing={1.5}>
        {rows.map((row) => (
          <Stack key={row.label} direction="row" alignItems="center" spacing={1}>
            {row.icon}
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56 }}>
              {row.label}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="medium"
              sx={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: theme.palette.text.primary,
              }}
            >
              {row.value}
            </Typography>
          </Stack>
        ))}

        {/* 订阅同步行 */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <LinkRounded fontSize="small" color="action" />
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56 }}>
            {t("account.dashboard.account.subscribeUrl")}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "monospace",
              fontSize: 11,
            }}
            title={subscribeUrl}
          >
            {subscribeUrl || "—"}
          </Typography>
          <Tooltip
            title={syncing ? t("account.dashboard.account.syncing") : t("account.dashboard.account.syncNow")}
          >
            <span>
              <IconButton
                size="small"
                onClick={onSync}
                disabled={syncing}
                sx={{ flexShrink: 0 }}
              >
                <RefreshRounded
                  sx={{
                    fontSize: 16,
                    animation: syncing ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                      from: { transform: "rotate(0deg)" },
                      to: { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </EnhancedCard>
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
        {/* 总量行 */}
        <Stack direction="row" justifyContent="space-between" alignItems="baseline">
          {loading ? (
            <Skeleton width="60%" />
          ) : isUnlimited ? (
            <Typography variant="body2" fontWeight="medium">
              {t("account.dashboard.traffic.unlimited")}
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary">
                {t("account.dashboard.traffic.used")}
                {" "}
                <Box component="span" fontWeight="bold" color="text.primary">
                  {usedVal} {usedUnit}
                </Box>
                {" / "}
                {totalVal} {totalUnit}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                {t("account.dashboard.traffic.usagePercent", { percent: pct })}
              </Typography>
            </>
          )}
        </Stack>

        {/* 进度条 */}
        {!loading && !isUnlimited && (
          <LinearProgress
            variant="determinate"
            value={pct}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: alpha(barColor, 0.15),
              "& .MuiLinearProgress-bar": { backgroundColor: barColor, borderRadius: 4 },
            }}
          />
        )}
        {loading && <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 4 }} />}

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
      {/* 顶部刷新按钮 + 错误提示 */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
        {error && !loading && (
          <Typography variant="caption" color="error">
            {t("account.dashboard.loadFailed")}
          </Typography>
        )}
        <Tooltip title={t("account.dashboard.refresh")}>
          <span>
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshRounded
                fontSize="small"
                sx={{
                  animation:
                    loading || refreshing ? "spin 1s linear infinite" : "none",
                  "@keyframes spin": {
                    from: { transform: "rotate(0deg)" },
                    to: { transform: "rotate(360deg)" },
                  },
                }}
              />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* 账户信息卡（全宽） */}
      <AccountInfoCard
        userInfo={userInfo}
        loading={loading}
        subscribeUrl={session?.subscribeUrl ?? ""}
        onLogout={handleLogout}
        loggingOut={loggingOut}
        onSync={handleSync}
        syncing={syncing}
      />

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
