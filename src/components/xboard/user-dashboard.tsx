/**
 * 悦通用户中心 — 2026 VPN 风格
 *
 * 布局：
 *  ┌──────────────────────────────────────┐
 *  │     [M]  my@yue.to                   │
 *  │   Infinity · 永久                    │  ← 居中大头像
 *  ├──────────────────────────────────────┤
 *  │ 订阅详情                             │
 *  │ [████░░░] 5%  已用 364 GB / 9999 GB │
 *  ├──────────────────────────────────────┤
 *  │  余额 ¥0.00   │   返利 ¥0.00        │
 *  ├──────────────────────────────────────┤
 *  │ 🔑 修改密码                >         │
 *  │ 📢 公告                    >         │
 *  │ 📦 我的订单                >         │
 *  │ 👥 邀请好友                >         │
 *  │ 🚪 退出登录                          │
 *  └──────────────────────────────────────┘
 */

import {
  AnnouncementRounded,
  ChevronRightRounded,
  GroupRounded,
  KeyRounded,
  ListAltRounded,
  LogoutRounded,
  MonetizationOnRounded,
  RefreshRounded,
  SyncRounded,
  VisibilityOffRounded,
  VisibilityRounded,
  WorkspacePremiumRounded,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
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
import {
  clearSession,
  useSetXBoardSession,
  useXBoardSession,
} from "@/services/xboard/store";
import { clearProfileUid, refreshXBoardProfile } from "@/services/xboard/sync";
import type { InviteInfo, UserInfo } from "@/services/xboard/types";
import parseTraffic from "@/utils/parse-traffic";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBalance(cents: number, unit: string): string {
  return `${unit}${(cents / 100).toFixed(2)}`;
}

function calcTrafficPct(used: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.round((used / total) * 100), 100);
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
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setOldPwd("");
    setNewPwd("");
    setConfirmPwd("");
    onClose();
  };

  const handleSubmit = async () => {
    if (!newPwd || !oldPwd) return;
    if (newPwd !== confirmPwd) {
      showNotice.error("两次输入的新密码不一致");
      return;
    }
    if (!session) return;
    setSubmitting(true);
    try {
      await changePassword(session.baseUrl, session.authData, oldPwd, newPwd);
      showNotice.success("密码修改成功");
      handleClose();
    } catch (e: any) {
      showNotice.error(e instanceof Error ? e.message : "修改失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>修改密码</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="当前密码"
            type={showOld ? "text" : "password"}
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              endAdornment: (
                <IconButton size="small" onClick={() => setShowOld((v) => !v)}>
                  {showOld ? (
                    <VisibilityOffRounded fontSize="small" />
                  ) : (
                    <VisibilityRounded fontSize="small" />
                  )}
                </IconButton>
              ),
            }}
          />
          <TextField
            label="新密码"
            type={showNew ? "text" : "password"}
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              endAdornment: (
                <IconButton size="small" onClick={() => setShowNew((v) => !v)}>
                  {showNew ? (
                    <VisibilityOffRounded fontSize="small" />
                  ) : (
                    <VisibilityRounded fontSize="small" />
                  )}
                </IconButton>
              ),
            }}
          />
          <TextField
            label="确认新密码"
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            fullWidth
            size="small"
            error={confirmPwd.length > 0 && confirmPwd !== newPwd}
            helperText={
              confirmPwd.length > 0 && confirmPwd !== newPwd
                ? "两次输入不一致"
                : ""
            }
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
          disabled={submitting || !oldPwd || !newPwd || newPwd !== confirmPwd}
          startIcon={
            submitting ? (
              <CircularProgress size={14} color="inherit" />
            ) : undefined
          }
        >
          确认修改
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── 账号头部（居中大头像） ───────────────────────────────────────────────────

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

  const initial = userInfo?.email?.[0]?.toUpperCase() ?? "?";
  const expiredAt = userInfo?.expiredAt ?? null;
  const expiryLabel =
    expiredAt === null
      ? t("account.dashboard.account.noExpiry")
      : dayjs(expiredAt * 1000).format("YYYY-MM-DD");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        py: 3,
        px: 2,
        borderRadius: 3,
        background: `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(theme.palette.secondary.main, 0.06)} 100%)`,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        position: "relative",
      }}
    >
      {/* 右上角操作区 */}
      <Box sx={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 0.5 }}>
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
                sx={{ animation: syncing ? "spin 1s linear infinite" : "none" }}
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
                  animation: loading || refreshing ? "spin 1s linear infinite" : "none",
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

      {/* 头像 */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
        }}
      >
        {loading ? (
          <CircularProgress size={28} sx={{ color: "white" }} />
        ) : (
          <Typography variant="h4" fontWeight="bold" sx={{ color: "white" }}>
            {initial}
          </Typography>
        )}
      </Box>

      {/* 邮箱 */}
      {loading ? (
        <Skeleton width={160} height={22} />
      ) : (
        <Typography variant="body1" fontWeight="bold" noWrap sx={{ maxWidth: 260 }}>
          {userInfo?.email ?? "—"}
        </Typography>
      )}

      {/* 套餐 + 到期 */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <WorkspacePremiumRounded sx={{ fontSize: 15, color: "primary.main" }} />
        {loading ? (
          <Skeleton width={120} height={18} />
        ) : (
          <>
            <Typography variant="body2" color="primary.main" fontWeight="medium">
              {userInfo?.planName ?? t("account.dashboard.account.noPlan")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              · {expiryLabel}
            </Typography>
          </>
        )}
      </Stack>
    </Box>
  );
}

// ─── 订阅详情卡 ───────────────────────────────────────────────────────────────

function SubscriptionCard({
  userInfo,
  loading,
}: {
  userInfo: UserInfo | null;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const usedBytes = (userInfo?.usedDownload ?? 0) + (userInfo?.usedUpload ?? 0);
  const totalBytes = userInfo?.transferEnable ?? 0;
  const isUnlimited = totalBytes === 0;
  const pct = calcTrafficPct(usedBytes, totalBytes);

  const [usedVal, usedUnit] = parseTraffic(usedBytes);
  const [totalVal, totalUnit] = parseTraffic(totalBytes);
  const [upVal, upUnit] = parseTraffic(userInfo?.usedUpload ?? 0);
  const [downVal, downUnit] = parseTraffic(userInfo?.usedDownload ?? 0);

  const barColor =
    pct >= 95
      ? theme.palette.error.main
      : pct >= 80
        ? theme.palette.warning.main
        : theme.palette.primary.main;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: alpha(theme.palette.background.paper, 0.7),
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      }}
    >
      <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ mb: 1.5 }}>
        {t("account.dashboard.traffic.title")}
      </Typography>

      {/* 进度条 */}
      {loading ? (
        <Skeleton height={8} sx={{ borderRadius: 1, mb: 1 }} />
      ) : (
        <Box sx={{ mb: 1 }}>
          {isUnlimited ? (
            <Box
              sx={{
                height: 8,
                borderRadius: 4,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              }}
            />
          ) : (
            <LinearProgress
              variant="determinate"
              value={pct}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: alpha(barColor, 0.12),
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
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
        </Box>
      )}

      {/* 已用 / 总计 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
        {loading ? (
          <>
            <Skeleton width={80} />
            <Skeleton width={60} />
          </>
        ) : isUnlimited ? (
          <Typography variant="body2" color="text.secondary">
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
              <Box component="span" fontWeight="bold" color="text.primary">
                {totalVal} {totalUnit}
              </Box>
              {" "}总计
            </Typography>
          </>
        )}
      </Box>

      {/* 上传 / 下载 */}
      <Stack direction="row" spacing={1}>
        {[
          {
            label: t("account.dashboard.traffic.upload"),
            val: `${upVal} ${upUnit}`,
            color: theme.palette.secondary.main,
          },
          {
            label: t("account.dashboard.traffic.download"),
            val: `${downVal} ${downUnit}`,
            color: theme.palette.primary.main,
          },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{
              flex: 1,
              p: 1,
              borderRadius: 1.5,
              textAlign: "center",
              bgcolor: alpha(item.color, 0.07),
              border: `1px solid ${alpha(item.color, 0.18)}`,
            }}
          >
            {loading ? (
              <Skeleton width="70%" sx={{ mx: "auto" }} />
            ) : (
              <Typography variant="body2" fontWeight="bold" color={item.color} noWrap>
                {item.val}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

// ─── 余额卡 ───────────────────────────────────────────────────────────────────

function BalanceCard({
  userInfo,
  loading,
}: {
  userInfo: UserInfo | null;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const unit = t("account.dashboard.wallet.unit");

  const items = [
    {
      label: t("account.dashboard.wallet.balance"),
      value: formatBalance(userInfo?.balance ?? 0, unit),
      color: theme.palette.warning.main,
    },
    {
      label: t("account.dashboard.wallet.commission"),
      value: formatBalance(userInfo?.commissionBalance ?? 0, unit),
      color: theme.palette.success.main,
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2.5,
        overflow: "hidden",
        border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      }}
    >
      <Stack direction="row" divider={<Divider orientation="vertical" flexItem />}>
        {items.map((item) => (
          <Box
            key={item.label}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              py: 1.75,
              px: 1,
            }}
          >
            <MonetizationOnRounded sx={{ fontSize: 18, color: item.color }} />
            {loading ? (
              <Skeleton width={60} height={24} />
            ) : (
              <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                {item.value}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

// ─── 菜单列表 ─────────────────────────────────────────────────────────────────

function MenuList({
  inviteInfo,
  loading,
  onLogout,
  loggingOut,
}: {
  inviteInfo: ReturnType<typeof useXBoardUserInfo>["inviteInfo"];
  loading: boolean;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [changePwdOpen, setChangePwdOpen] = useState(false);

  const handleCopyInvite = async () => {
    if (!inviteInfo?.inviteUrl) return;
    try {
      await writeText(inviteInfo.inviteUrl);
      showNotice.success(t("account.dashboard.invite.linkCopied"));
    } catch {
      showNotice.error("复制失败");
    }
  };

  const menuItems = [
    {
      icon: <KeyRounded fontSize="small" />,
      label: "修改密码",
      onClick: () => setChangePwdOpen(true),
      color: theme.palette.primary.main,
      chevron: true,
    },
    {
      icon: <AnnouncementRounded fontSize="small" />,
      label: t("account.notices.page.title"),
      onClick: () => navigate("/notices"),
      color: theme.palette.info.main,
      chevron: true,
    },
    {
      icon: <ListAltRounded fontSize="small" />,
      label: t("account.orders.page.title"),
      onClick: () => navigate("/orders"),
      color: theme.palette.warning.main,
      chevron: true,
    },
    {
      icon: <GroupRounded fontSize="small" />,
      label: t("account.dashboard.invite.title"),
      sublabel: loading
        ? undefined
        : inviteInfo?.referralCount
          ? `已邀请 ${inviteInfo.referralCount} 人`
          : undefined,
      onClick: handleCopyInvite,
      color: theme.palette.success.main,
      chevron: false,
      disabled: !inviteInfo?.inviteUrl,
    },
  ];

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          overflow: "hidden",
        }}
      >
        <List disablePadding>
          {menuItems.map((item, idx) => (
            <Box key={item.label}>
              {idx > 0 && <Divider sx={{ mx: 2 }} />}
              <ListItem
                onClick={item.disabled ? undefined : item.onClick}
                sx={{
                  cursor: item.disabled ? "default" : "pointer",
                  opacity: item.disabled ? 0.5 : 1,
                  py: 1.25,
                  "&:hover": item.disabled
                    ? {}
                    : {
                        bgcolor: alpha(item.color, 0.05),
                      },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1.5,
                      bgcolor: alpha(item.color, 0.12),
                      color: item.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.sublabel}
                  primaryTypographyProps={{ variant: "body2", fontWeight: "medium" }}
                  secondaryTypographyProps={{ variant: "caption" }}
                />
                {item.chevron && (
                  <ChevronRightRounded sx={{ fontSize: 18, color: "text.disabled" }} />
                )}
                {!item.chevron && item.label === t("account.dashboard.invite.title") && (
                  <Typography variant="caption" color="text.secondary">
                    复制链接
                  </Typography>
                )}
              </ListItem>
            </Box>
          ))}

          {/* 退出登录 */}
          <Divider sx={{ mx: 2 }} />
          <ListItem
            onClick={loggingOut ? undefined : onLogout}
            sx={{
              cursor: loggingOut ? "default" : "pointer",
              py: 1.25,
              "&:hover": { bgcolor: alpha(theme.palette.error.main, 0.05) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  bgcolor: alpha(theme.palette.error.main, 0.12),
                  color: theme.palette.error.main,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loggingOut ? (
                  <CircularProgress size={14} color="error" />
                ) : (
                  <LogoutRounded fontSize="small" />
                )}
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={t("account.session.logout")}
              primaryTypographyProps={{
                variant: "body2",
                fontWeight: "medium",
                color: "error.main",
              }}
            />
          </ListItem>
        </List>
      </Paper>

      <ChangePasswordDialog
        open={changePwdOpen}
        onClose={() => setChangePwdOpen(false)}
      />
    </>
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
    <Stack spacing={2}>
      {/* 头像 + 账号信息 */}
      <ProfileHeader
        userInfo={userInfo}
        loading={loading}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        syncing={syncing}
        onSync={handleSync}
        subscribeUrl={session?.subscribeUrl ?? ""}
      />

      {/* 订阅详情 */}
      <SubscriptionCard userInfo={userInfo} loading={loading} />

      {/* 余额 */}
      <BalanceCard userInfo={userInfo} loading={loading} />

      {/* 菜单列表 */}
      <MenuList
        inviteInfo={inviteInfo}
        loading={loading}
        onLogout={handleLogout}
        loggingOut={loggingOut}
      />

      {/* 错误提示 */}
      {error && !loading && (
        <Typography variant="caption" color="error" textAlign="center">
          {t("account.dashboard.loadFailed")}
        </Typography>
      )}
    </Stack>
  );
}
