/**
 * 悦通用户中心（对齐安卓版 design_main.xml Tab 3: 我的）
 *
 * 布局：
 *  ┌──────────────────────────────────────────┐
 *  │  [M]  my@yue.to                          │  ← 用户头部卡（水平）
 *  │       Infinity · Ultimate                │
 *  ├──────────────────────────────────────────┤
 *  │  套餐: Infinity · ...                    │  ← 套餐信息卡
 *  │  到期: 永久                              │
 *  │  流量使用 <1%               364 GB / ... │
 *  │  [==============================░░░░░░░] │
 *  ├──────────────────────────────────────────┤
 *  │    余额 ¥0.00   │   返利 ¥0.00          │  ← 余额卡
 *  ├──────────────────────────────────────────┤
 *  │  邀请链接: https://...          [复制]   │  ← 邀请卡（仅有链接时显示）
 *  │  已邀请 N 人                             │
 *  ├──────────────────────────────────────────┤
 *  │  [       修改密码       ]               │  ← outlined buttons
 *  │  [        公告         ]               │
 *  │  [       我的订单       ]               │
 *  │  [       退出登录       ]  (red)        │
 *  └──────────────────────────────────────────┘
 */

import {
  RefreshRounded,
  SyncRounded,
  PersonRounded,
  EventRepeatRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  TextField,
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

import { useXBoardUserInfo } from "@/hooks/use-xboard-user-info";
import { showNotice } from "@/services/notice-service";
import { changePassword, logout } from "@/services/xboard/api";
import { XBoardErrorCode } from "@/services/xboard/errors";
import {
  clearSession,
  useSetXBoardSession,
  useXBoardSession,
} from "@/services/xboard/store";
import {
  clearProfileUid,
  refreshXBoardProfile,
  syncXBoardSubscription,
} from "@/services/xboard/sync";
import type { UserInfo } from "@/services/xboard/types";
import parseTraffic, { formatPercent } from "@/utils/parse-traffic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBalance(cents: number, unit: string): string {
  return `${unit}${(cents / 100).toFixed(2)}`;
}

// 返回浮点百分比（0–100），不提前取整，保留精度供 formatPercent 判断
function calcTrafficPct(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min((used / total) * 100, 100);
}

// ─── 修改密码对话框 ───────────────────────────────────────────────────────────

function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const session = useXBoardSession();
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setOldPwd("");
    setNewPwd("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!newPwd || !oldPwd) return;
    if (!session) return;
    setSubmitting(true);
    try {
      await changePassword(session.authData, oldPwd, newPwd);
      showNotice.success(t("account.dashboard.changePassword.success"));
      handleClose();
    } catch (e: unknown) {
      showNotice.error(
        e instanceof Error
          ? e.message
          : t("account.dashboard.changePassword.failed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("account.dashboard.changePassword.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label={t("account.dashboard.changePassword.oldPassword")}
            type="password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label={t("account.dashboard.changePassword.newPassword")}
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          {t("shared.actions.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || !oldPwd || !newPwd}
          startIcon={
            submitting ? (
              <CircularProgress size={14} color="inherit" />
            ) : undefined
          }
        >
          {t("account.dashboard.changePassword.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 用户头部卡（水平布局，对齐安卓 profile_content 头部卡）─────────────────────

function ProfileHeader({
  userInfo,
  loading,
  onRefresh,
  refreshing,
  syncing,
  onSync,
  subscribeUrl,
}: {
  userInfo: UserInfo | null;
  loading: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  syncing: boolean;
  onSync: () => void;
  subscribeUrl: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const initial = userInfo?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <Paper
      elevation={4}
      sx={{
        borderRadius: 2,
        p: 2,
        bgcolor: "background.paper",
        position: "relative",
      }}
    >
      {/* 右上角操作按钮 */}
      <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex" }}>
        <Tooltip title={t("account.dashboard.account.syncNow")}>
          <span>
            <IconButton
              size="small"
              onClick={onSync}
              disabled={syncing || !subscribeUrl}
              sx={{ color: "text.secondary" }}
            >
              <SyncRounded
                fontSize="small"
                sx={{
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
        <Tooltip title={t("account.dashboard.refresh")}>
          <span>
            <IconButton
              size="small"
              onClick={onRefresh}
              disabled={loading || refreshing}
              sx={{ color: "text.secondary" }}
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

      {/* 水平布局：头像 左 + 信息 右（对齐安卓 60dp avatar + column） */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pr: 8 }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {loading ? (
            <CircularProgress size={22} sx={{ color: "white" }} />
          ) : (
            <Typography variant="h5" fontWeight="bold" sx={{ color: "white" }}>
              {initial}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <Skeleton width={160} height={22} />
          ) : (
            <Typography
              variant="body1"
              fontWeight="bold"
              noWrap
              sx={{ color: "text.primary", fontSize: "15px" }}
            >
              {userInfo?.email ?? "—"}
            </Typography>
          )}
          {loading ? (
            <Skeleton width={120} height={16} sx={{ mt: 0.5 }} />
          ) : (
            <Typography
              variant="body2"
              sx={{ color: "primary.main", mt: 0.5, fontSize: "12px" }}
            >
              {userInfo?.planName ?? t("account.dashboard.account.noPlan")}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

// ─── 套餐信息卡（对齐安卓：套餐名 + 到期 + 流量% + 详情 + 进度条）──────────────

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 1,
      }}
    >
      <Box
        sx={{
          color: "primary.main",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", flexShrink: 0 }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1 }} />
      {value}
    </Box>
  );
}

function SubscriptionCard({
  userInfo,
  loading,
}: {
  userInfo: UserInfo | null;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();

  const usedBytes = (userInfo?.usedDownload ?? 0) + (userInfo?.usedUpload ?? 0);
  const totalBytes = userInfo?.transferEnable ?? 0;
  const isUnlimited = totalBytes === 0;
  const pct = calcTrafficPct(usedBytes, totalBytes);

  const [usedVal, usedUnit] = parseTraffic(usedBytes);
  const [totalVal, totalUnit] = parseTraffic(totalBytes);

  const expiredAt = userInfo?.expiredAt ?? null;
  const expiryLabel =
    expiredAt === null
      ? t("account.dashboard.account.noExpiry")
      : dayjs(expiredAt * 1000).format("YYYY-MM-DD");

  const daysLeft =
    expiredAt !== null
      ? Math.floor((expiredAt * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
      : Infinity;
  const isExpiringSoon = daysLeft <= 7 && daysLeft >= 0;
  const isExpired = daysLeft < 0;

  const barColor =
    pct >= 95
      ? theme.palette.error.main
      : pct >= 80
        ? theme.palette.warning.main
        : theme.palette.primary.main;

  const trafficDetail = isUnlimited
    ? t("account.dashboard.traffic.unlimited")
    : usedBytes === 0
      ? t("account.dashboard.traffic.noUsage")
      : `${usedVal} ${usedUnit} / ${totalVal} ${totalUnit}`;

  return (
    <Paper
      elevation={4}
      sx={{ borderRadius: 2, p: 2, bgcolor: "background.paper" }}
    >
      {/* 套餐名 */}
      <Row
        icon={<PersonRounded sx={{ fontSize: 18 }} />}
        label={t("account.dashboard.traffic.title")}
        value={
          loading ? (
            <Skeleton width={100} />
          ) : (
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ color: "text.primary" }}
            >
              {userInfo?.planName ?? t("account.dashboard.account.noPlan")}
            </Typography>
          )
        }
      />

      {/* 到期 */}
      <Row
        icon={<EventRepeatRounded sx={{ fontSize: 18 }} />}
        label={`${t("account.dashboard.account.expiry")}：`}
        value={
          loading ? (
            <Skeleton width={80} />
          ) : (
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ color: "text.primary" }}
            >
              {expiryLabel}
            </Typography>
          )
        }
      />

      {/* 流量使用标签 + 详情 */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", flex: 1 }}>
          {t("account.dashboard.traffic.title")} {formatPercent(pct)}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {loading ? "" : trafficDetail}
        </Typography>
      </Box>

      {/* 进度条 */}
      {loading ? (
        <Skeleton height={8} sx={{ borderRadius: 1 }} />
      ) : isUnlimited ? (
        <Box
          sx={{
            height: 6,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          }}
        />
      ) : (
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(barColor, 0.12),
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
              background:
                pct >= 95
                  ? theme.palette.error.main
                  : pct >= 80
                    ? theme.palette.warning.main
                    : `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.7)})`,
            },
          }}
        />
      )}

      {!loading && (isExpired || isExpiringSoon) && (
        <Button
          variant="contained"
          size="small"
          fullWidth
          onClick={() => navigate("/shop")}
          sx={{
            mt: 1.5,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            background: isExpired
              ? theme.palette.error.main
              : theme.palette.warning.main,
            "&:hover": {
              background: isExpired
                ? theme.palette.error.dark
                : theme.palette.warning.dark,
            },
          }}
        >
          {isExpired
            ? t("account.dashboard.account.renewNowExpired")
            : t("account.dashboard.account.renewNow", { days: daysLeft })}
        </Button>
      )}
    </Paper>
  );
}

// ─── 余额卡（对齐安卓两列横排）────────────────────────────────────────────────

function BalanceCard({
  userInfo,
  loading,
}: {
  userInfo: UserInfo | null;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const unit = t("account.dashboard.wallet.unit");

  return (
    <Paper
      elevation={4}
      sx={{ borderRadius: 2, bgcolor: "background.paper", overflow: "hidden" }}
    >
      <Box sx={{ display: "flex" }}>
        {/* 余额 */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 2.25,
            px: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontSize: "11px" }}
          >
            {t("account.dashboard.wallet.balance")}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={28} />
          ) : (
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: "text.primary", mt: 0.5 }}
            >
              {formatBalance(userInfo?.balance ?? 0, unit)}
            </Typography>
          )}
        </Box>

        {/* 分隔线 */}
        <Box
          sx={{ width: 1, bgcolor: "divider", alignSelf: "center", height: 40 }}
        />

        {/* 返利余额 */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 2.25,
            px: 1,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", fontSize: "11px" }}
          >
            {t("account.dashboard.wallet.commission")}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={28} />
          ) : (
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: "text.primary", mt: 0.5 }}
            >
              {formatBalance(userInfo?.commissionBalance ?? 0, unit)}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

// ─── 邀请卡（对齐安卓 profile_invite_card）────────────────────────────────────

function InviteCard({
  inviteUrl,
  referralCount,
  loading,
}: {
  inviteUrl: string | null | undefined;
  referralCount: number;
  loading: boolean;
}) {
  const { t } = useTranslation();

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await writeText(inviteUrl);
      showNotice.success(t("account.dashboard.invite.linkCopied"));
    } catch {
      showNotice.error(t("account.dashboard.invite.copyFailed"));
    }
  };

  if (!loading && !inviteUrl) return null;

  return (
    <Paper
      elevation={4}
      sx={{ borderRadius: 2, p: 2, bgcolor: "background.paper" }}
    >
      {/* 标题行 + 邀请人数 */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", flex: 1 }}>
          {t("account.dashboard.invite.title")}
        </Typography>
        <Typography variant="caption" sx={{ color: "primary.main" }}>
          {t("account.dashboard.invite.referralCount", {
            count: referralCount,
          })}
        </Typography>
      </Box>

      {/* 链接框 + 复制按钮 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: "action.hover",
          borderRadius: 1,
          px: 1.25,
          py: 1,
          gap: 1,
        }}
      >
        {loading ? (
          <Skeleton sx={{ flex: 1 }} />
        ) : (
          <Typography
            variant="caption"
            noWrap
            sx={{ color: "text.secondary", flex: 1, fontSize: "12px" }}
          >
            {inviteUrl ?? "--"}
          </Typography>
        )}
        <Typography
          variant="caption"
          onClick={handleCopy}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleCopy();
          }}
          sx={{
            color: "primary.main",
            cursor: "pointer",
            flexShrink: 0,
            fontWeight: "bold",
            fontSize: "12px",
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          {t("account.dashboard.invite.copy")}
        </Typography>
      </Box>
    </Paper>
  );
}

// ─── 操作按钮组（对齐安卓 OutlinedButton 全宽堆叠）────────────────────────────

function ActionButtons({
  onChangePassword,
  onLogout,
  loggingOut,
}: {
  onChangePassword: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const btns = [
    {
      label: t("account.dashboard.changePassword.title"),
      onClick: onChangePassword,
      color: "primary" as const,
    },
    {
      label: t("account.notices.page.title"),
      onClick: () => navigate("/notices"),
      color: "primary" as const,
    },
    {
      label: t("account.orders.page.title"),
      onClick: () => navigate("/orders"),
      color: "primary" as const,
    },
  ];

  return (
    <Stack spacing={1.25}>
      {btns.map((btn) => (
        <Button
          key={btn.label}
          variant="outlined"
          fullWidth
          onClick={btn.onClick}
          sx={{
            borderRadius: 1.5,
            textTransform: "none",
            fontWeight: "medium",
            py: 1,
          }}
        >
          {btn.label}
        </Button>
      ))}

      {/* 退出登录（红色，对齐安卓 android:textColor="#D32F2F" app:strokeColor="#D32F2F"） */}
      <Button
        variant="outlined"
        fullWidth
        onClick={loggingOut ? undefined : onLogout}
        disabled={loggingOut}
        sx={{
          borderRadius: 1.5,
          textTransform: "none",
          fontWeight: "medium",
          py: 1,
          color: "error.main",
          borderColor: "error.main",
          "&:hover": {
            borderColor: "error.dark",
            bgcolor: "action.hover",
          },
        }}
        startIcon={
          loggingOut ? <CircularProgress size={14} color="error" /> : undefined
        }
      >
        {t("account.session.logout")}
      </Button>
    </Stack>
  );
}

// ─── UserDashboard 根组件 ─────────────────────────────────────────────────────

export function UserDashboard() {
  const { t } = useTranslation();
  const session = useXBoardSession();
  const setSession = useSetXBoardSession();
  const { userInfo, inviteInfo, loading, error, refresh } = useXBoardUserInfo();
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout(session!.authData);
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
      // uid 失效（新设备 / 手动删除了 Profile）→ 自动重新绑定
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code: string }).code
          : null;
      if (
        code === XBoardErrorCode.PROFILE_NOT_FOUND ||
        code === XBoardErrorCode.PROFILE_DELETED
      ) {
        if (session?.subscribeUrl) {
          try {
            await syncXBoardSubscription(session.subscribeUrl);
            showNotice.success(t("account.dashboard.account.syncSuccess"));
            return;
          } catch {
            // fall through to generic error
          }
        }
      }
      showNotice.error(
        t("account.dashboard.account.syncFailed"),
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Stack spacing={1.5}>
      {/* 用户头部卡 */}
      <ProfileHeader
        userInfo={userInfo}
        loading={loading}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        syncing={syncing}
        onSync={handleSync}
        subscribeUrl={session?.subscribeUrl ?? ""}
      />

      {/* 套餐信息卡 */}
      <SubscriptionCard userInfo={userInfo} loading={loading} />

      {/* 余额卡 */}
      <BalanceCard userInfo={userInfo} loading={loading} />

      {/* 邀请卡（仅有链接时显示） */}
      <InviteCard
        inviteUrl={inviteInfo?.inviteUrl}
        referralCount={inviteInfo?.referralCount ?? 0}
        loading={loading}
      />

      {/* 操作按钮组 */}
      <ActionButtons
        onChangePassword={() => setChangePwdOpen(true)}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* 错误提示 */}
      {error && !loading && (
        <Typography variant="caption" color="error" textAlign="center">
          {t("account.dashboard.loadFailed")}
        </Typography>
      )}

      <ChangePasswordDialog
        open={changePwdOpen}
        onClose={() => setChangePwdOpen(false)}
      />
    </Stack>
  );
}
