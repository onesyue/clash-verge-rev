/**
 * XBoard 登录 / 注册 / 找回密码 表单
 *
 * 三个 Tab 共用固定服务器地址（BASE_URL），切换 Tab 时保留已输入内容。
 * 成功后通过 onSuccess 回调通知父组件更新 session。
 */

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Tab,
  Tabs,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { showNotice } from "@/services/notice-service";
import {
  forgotPassword,
  login,
  register,
  sendEmailVerify,
} from "@/services/xboard/api";
import { persistAuthResult } from "@/services/xboard/store";
import { syncXBoardSubscription } from "@/services/xboard/sync";
import type { XBoardSession } from "@/services/xboard/types";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

type TabKey = "login" | "register" | "forgot";

interface LoginFields {
  email: string;
  password: string;
}

interface RegisterFields {
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode: string;
}

interface ForgotStep1Fields {
  email: string;
}

interface ForgotStep2Fields {
  emailCode: string;
  password: string;
  confirmPassword: string;
}

interface Props {
  onSuccess: (session: XBoardSession) => void;
}

// ────────────────────────────────────────────────────────────────────────────
// LoginTab
// ────────────────────────────────────────────────────────────────────────────

function LoginTab({
  onSuccess,
}: {
  onSuccess: (session: XBoardSession) => void;
}) {
  const { t } = useTranslation();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register: reg,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>();

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      const session = persistAuthResult(result);
      showNotice.success(t("account.login.feedback.success"));
      onSuccess(session);
      // 后台同步订阅，完成后通知用户
      syncXBoardSubscription(result.subscribeUrl)
        .then(() => {
          showNotice.success(t("account.sync.feedback.success"));
        })
        .catch((err) => {
          console.warn("[XBoard] 订阅同步失败:", err);
          showNotice.error(t("account.sync.feedback.failed"));
        });
    } catch (err: any) {
      showNotice.error(
        t("account.login.feedback.failed"),
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      setLoading(false);
    }
  });

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
    >
      <TextField
        label={t("account.login.form.email")}
        type="email"
        size="small"
        fullWidth
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        {...reg("email", {
          required: t("account.validation.emailRequired"),
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: t("account.validation.emailInvalid"),
          },
        })}
      />
      <TextField
        label={t("account.login.form.password")}
        type={showPwd ? "text" : "password"}
        size="small"
        fullWidth
        autoComplete="current-password"
        error={!!errors.password}
        helperText={errors.password?.message}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowPwd((v) => !v)}
                  edge="end"
                >
                  {showPwd ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        {...reg("password", {
          required: t("account.validation.passwordRequired"),
          minLength: {
            value: 6,
            message: t("account.validation.passwordMinLength"),
          },
        })}
      />
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        startIcon={
          loading ? <CircularProgress size={16} color="inherit" /> : undefined
        }
      >
        {t("account.login.form.submit")}
      </Button>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// RegisterTab
// ────────────────────────────────────────────────────────────────────────────

function RegisterTab({
  onSuccess,
}: {
  onSuccess: (session: XBoardSession) => void;
}) {
  const { t } = useTranslation();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register: reg,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFields>();

  const passwordValue = watch("password");

  const onSubmit = handleSubmit(async ({ email, password, inviteCode }) => {
    setLoading(true);
    try {
      const result = await register(
        email.trim(),
        password,
        inviteCode || undefined,
      );
      const session = persistAuthResult(result);
      showNotice.success(t("account.register.feedback.success"));
      onSuccess(session);
      // 后台同步订阅，完成后通知用户
      syncXBoardSubscription(result.subscribeUrl)
        .then(() => {
          showNotice.success(t("account.sync.feedback.success"));
        })
        .catch((err) => {
          console.warn("[XBoard] 注册后订阅同步失败:", err);
          showNotice.error(t("account.sync.feedback.failed"));
        });
    } catch (err: any) {
      showNotice.error(
        t("account.register.feedback.failed"),
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      setLoading(false);
    }
  });

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
    >
      <TextField
        label={t("account.register.form.email")}
        type="email"
        size="small"
        fullWidth
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        {...reg("email", {
          required: t("account.validation.emailRequired"),
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: t("account.validation.emailInvalid"),
          },
        })}
      />
      <TextField
        label={t("account.register.form.password")}
        type={showPwd ? "text" : "password"}
        size="small"
        fullWidth
        autoComplete="new-password"
        error={!!errors.password}
        helperText={errors.password?.message}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setShowPwd((v) => !v)}
                  edge="end"
                >
                  {showPwd ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        {...reg("password", {
          required: t("account.validation.passwordRequired"),
          minLength: {
            value: 6,
            message: t("account.validation.passwordMinLength"),
          },
        })}
      />
      <TextField
        label={t("account.register.form.confirmPassword")}
        type={showPwd ? "text" : "password"}
        size="small"
        fullWidth
        autoComplete="new-password"
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
        {...reg("confirmPassword", {
          required: t("account.validation.confirmPasswordRequired"),
          validate: (val) =>
            val === passwordValue ||
            t("account.register.feedback.passwordMismatch"),
        })}
      />
      <TextField
        label={t("account.register.form.inviteCode")}
        size="small"
        fullWidth
        {...reg("inviteCode")}
      />
      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        startIcon={
          loading ? <CircularProgress size={16} color="inherit" /> : undefined
        }
      >
        {t("account.register.form.submit")}
      </Button>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ForgotTab — 两步流程：发送验证码 → 重置密码
// ────────────────────────────────────────────────────────────────────────────

const RESEND_COOLDOWN = 60; // 秒，与服务端限制一致

function ForgotTab() {
  const { t } = useTranslation();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPwd, setShowPwd] = useState(false);

  // 60 秒倒计时
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // 第一步表单
  const {
    register: reg1,
    handleSubmit: submit1,
    getValues: getValues1,
    formState: { errors: errors1 },
  } = useForm<ForgotStep1Fields>();

  // 第二步表单
  const {
    register: reg2,
    handleSubmit: submit2,
    watch: watch2,
    reset: reset2,
    formState: { errors: errors2 },
  } = useForm<ForgotStep2Fields>();

  const passwordValue = watch2("password");

  const handleSendCode = submit1(async ({ email }) => {
    setSendingCode(true);
    try {
      await sendEmailVerify(email.trim());
      setConfirmedEmail(email.trim());
      setStep("reset");
      setCooldown(RESEND_COOLDOWN);
      showNotice.success(t("account.forgot.feedback.codeSent"));
    } catch (err: any) {
      showNotice.error(
        t("account.forgot.feedback.sendFailed"),
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      setSendingCode(false);
    }
  });

  const handleResend = async () => {
    if (cooldown > 0) return;
    const email = confirmedEmail || getValues1("email");
    if (!email) return;
    setSendingCode(true);
    try {
      await sendEmailVerify(email);
      setCooldown(RESEND_COOLDOWN);
      showNotice.success(t("account.forgot.feedback.codeSent"));
    } catch (err: any) {
      showNotice.error(
        t("account.forgot.feedback.sendFailed"),
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      setSendingCode(false);
    }
  };

  const handleReset = submit2(async ({ emailCode, password }) => {
    setResetting(true);
    try {
      await forgotPassword(confirmedEmail, emailCode.trim(), password);
      showNotice.success(t("account.forgot.feedback.success"));
      // 重置到第一步
      setStep("email");
      setConfirmedEmail("");
      setCooldown(0);
      reset2();
    } catch (err: any) {
      showNotice.error(
        t("account.forgot.feedback.failed"),
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      setResetting(false);
    }
  });

  if (step === "email") {
    return (
      <Box
        component="form"
        onSubmit={handleSendCode}
        sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
      >
        <TextField
          label={t("account.forgot.form.email")}
          type="email"
          size="small"
          fullWidth
          autoComplete="email"
          error={!!errors1.email}
          helperText={errors1.email?.message}
          {...reg1("email", {
            required: t("account.validation.emailRequired"),
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: t("account.validation.emailInvalid"),
            },
          })}
        />
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={sendingCode}
          startIcon={
            sendingCode ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
        >
          {t("account.forgot.form.sendCode")}
        </Button>
      </Box>
    );
  }

  // step === "reset"
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
      {/* 提示当前邮箱 + 重新发送 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1,
          py: 0.75,
          borderRadius: 1.5,
          bgcolor: "action.hover",
        }}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ flex: 1 }}
        >
          {t("account.forgot.emailHint", { email: confirmedEmail })}
        </Typography>
        <Button
          size="small"
          variant="text"
          disabled={cooldown > 0 || sendingCode}
          onClick={handleResend}
          sx={{ flexShrink: 0, fontSize: 12 }}
        >
          {cooldown > 0
            ? t("account.forgot.form.resendCode", { s: cooldown })
            : t("account.forgot.form.resendCodeAction")}
        </Button>
      </Box>

      <Box
        component="form"
        onSubmit={handleReset}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label={t("account.forgot.form.emailCode")}
          size="small"
          fullWidth
          autoComplete="one-time-code"
          inputProps={{ maxLength: 6 }}
          error={!!errors2.emailCode}
          helperText={errors2.emailCode?.message}
          {...reg2("emailCode", {
            required: t("account.validation.emailCodeRequired"),
            minLength: {
              value: 6,
              message: t("account.validation.emailCodeInvalid"),
            },
            maxLength: {
              value: 6,
              message: t("account.validation.emailCodeInvalid"),
            },
          })}
        />
        <TextField
          label={t("account.forgot.form.newPassword")}
          type={showPwd ? "text" : "password"}
          size="small"
          fullWidth
          autoComplete="new-password"
          error={!!errors2.password}
          helperText={errors2.password?.message}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPwd((v) => !v)}
                    edge="end"
                  >
                    {showPwd ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          {...reg2("password", {
            required: t("account.validation.passwordRequired"),
            minLength: {
              value: 6,
              message: t("account.validation.passwordMinLength"),
            },
          })}
        />
        <TextField
          label={t("account.forgot.form.confirmNewPassword")}
          type={showPwd ? "text" : "password"}
          size="small"
          fullWidth
          autoComplete="new-password"
          error={!!errors2.confirmPassword}
          helperText={errors2.confirmPassword?.message}
          {...reg2("confirmPassword", {
            required: t("account.validation.confirmPasswordRequired"),
            validate: (val) =>
              val === passwordValue ||
              t("account.register.feedback.passwordMismatch"),
          })}
        />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            sx={{ flex: 1 }}
            onClick={() => setStep("email")}
            disabled={resetting}
          >
            {t("account.forgot.form.back")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ flex: 2 }}
            disabled={resetting}
            startIcon={
              resetting ? (
                <CircularProgress size={16} color="inherit" />
              ) : undefined
            }
          >
            {t("account.forgot.form.submit")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// LoginForm (root export)
// ────────────────────────────────────────────────────────────────────────────

export function LoginForm({ onSuccess }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [tab, setTab] = useState<TabKey>("login");

  return (
    <Box
      sx={{
        maxWidth: 420,
        mx: "auto",
        mt: 4,
        p: 3,
        borderRadius: 3,
        backgroundColor: isDark ? "#282a36" : "#ffffff",
        boxShadow: isDark
          ? "0 4px 24px rgba(0,0,0,0.4)"
          : "0 4px 24px rgba(0,0,0,0.08)",
      }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        mb={2}
        sx={{ color: "text.primary" }}
      >
        悦通
      </Typography>

      {/* Tab 切换 */}
      <Tabs
        value={tab}
        onChange={(_, v: TabKey) => setTab(v)}
        sx={{
          minHeight: 36,
          "& .MuiTab-root": { minHeight: 36, py: 0.5, fontSize: 13 },
          "& .MuiTabs-indicator": {
            backgroundColor: alpha(theme.palette.primary.main, 0.8),
          },
        }}
      >
        <Tab label={t("account.login.tab")} value="login" />
        <Tab label={t("account.register.tab")} value="register" />
        <Tab label={t("account.forgot.tab")} value="forgot" />
      </Tabs>

      {/* Tab 内容 */}
      {tab === "login" && <LoginTab onSuccess={onSuccess} />}
      {tab === "register" && <RegisterTab onSuccess={onSuccess} />}
      {tab === "forgot" && <ForgotTab />}
    </Box>
  );
}
