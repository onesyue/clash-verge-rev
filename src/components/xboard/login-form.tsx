/**
 * XBoard 登录 / 注册 / 找回密码 — iOS 26 Liquid Glass 风格
 *
 * 默认显示登录，底部文字链接切换注册，忘记密码为密码框下方小链接。
 */

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  alpha,
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

// ── Types ────────────────────────────────────────────────────────────────────

type View = "login" | "register" | "forgot";

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

// ── Shared styles ────────────────────────────────────────────────────────────

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    bgcolor: "var(--glass-bg)",
    backdropFilter: "saturate(180%) blur(12px)",
    WebkitBackdropFilter: "saturate(180%) blur(12px)",
    "& fieldset": {
      borderColor: "var(--glass-border)",
      borderWidth: "0.5px",
    },
    "&:hover fieldset": {
      borderColor: "var(--glass-border)",
    },
    "&.Mui-focused fieldset": {
      borderWidth: "1px",
    },
  },
  "& .MuiInputLabel-root": {
    fontSize: "14px",
  },
  "& .MuiOutlinedInput-input": {
    fontSize: "14px",
    padding: "14px 16px",
  },
} as const;

const primaryBtnSx = {
  borderRadius: "14px",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "15px",
  py: 1.5,
  bgcolor: "primary.main",
  "&:hover": {
    bgcolor: "primary.dark",
  },
  "&.Mui-disabled": {
    bgcolor: "primary.main",
    opacity: 0.5,
  },
} as const;

const linkBtnSx = {
  textTransform: "none",
  fontWeight: 500,
  fontSize: "13px",
  px: 0.5,
  minWidth: 0,
  "&:hover": { background: "transparent", textDecoration: "underline" },
} as const;

// ── LoginView ────────────────────────────────────────────────────────────────

function LoginView({
  onSuccess,
  onSwitchView,
}: {
  onSuccess: (session: XBoardSession) => void;
  onSwitchView: (v: View) => void;
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
      syncXBoardSubscription(result.subscribeUrl)
        .then(() => showNotice.success(t("account.sync.feedback.success")))
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
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        placeholder={t("account.login.form.email")}
        type="email"
        fullWidth
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        sx={textFieldSx}
        {...reg("email", {
          required: t("account.validation.emailRequired"),
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: t("account.validation.emailInvalid"),
          },
        })}
      />
      <Box>
        <TextField
          placeholder={t("account.login.form.password")}
          type={showPwd ? "text" : "password"}
          fullWidth
          autoComplete="current-password"
          error={!!errors.password}
          helperText={errors.password?.message}
          sx={textFieldSx}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPwd((v) => !v)}
                    edge="end"
                    sx={{ color: "text.disabled" }}
                  >
                    {showPwd ? (
                      <VisibilityOff sx={{ fontSize: 18 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 18 }} />
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
        <Box sx={{ textAlign: "right", mt: 0.5 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => onSwitchView("forgot")}
            sx={{ ...linkBtnSx, color: "text.secondary" }}
          >
            {t("account.forgot.tab")}
          </Button>
        </Box>
      </Box>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        disableElevation
        sx={primaryBtnSx}
      >
        {loading ? (
          <CircularProgress size={20} sx={{ color: "white" }} />
        ) : (
          t("account.login.form.submit")
        )}
      </Button>

      <Box sx={{ textAlign: "center", mt: 0.5 }}>
        <Typography
          variant="body2"
          component="span"
          sx={{ color: "text.secondary", fontSize: "13px" }}
        >
          {t("account.login.noAccount")}{" "}
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={() => onSwitchView("register")}
          sx={linkBtnSx}
        >
          {t("account.register.tab")}
        </Button>
      </Box>
    </Box>
  );
}

// ── RegisterView ─────────────────────────────────────────────────────────────

function RegisterView({
  onSuccess,
  onSwitchView,
}: {
  onSuccess: (session: XBoardSession) => void;
  onSwitchView: (v: View) => void;
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
      syncXBoardSubscription(result.subscribeUrl)
        .then(() => showNotice.success(t("account.sync.feedback.success")))
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

  const pwdAdornment = (
    <InputAdornment position="end">
      <IconButton
        size="small"
        onClick={() => setShowPwd((v) => !v)}
        edge="end"
        sx={{ color: "text.disabled" }}
      >
        {showPwd ? (
          <VisibilityOff sx={{ fontSize: 18 }} />
        ) : (
          <Visibility sx={{ fontSize: 18 }} />
        )}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <TextField
        placeholder={t("account.register.form.email")}
        type="email"
        fullWidth
        autoComplete="email"
        error={!!errors.email}
        helperText={errors.email?.message}
        sx={textFieldSx}
        {...reg("email", {
          required: t("account.validation.emailRequired"),
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: t("account.validation.emailInvalid"),
          },
        })}
      />
      <TextField
        placeholder={t("account.register.form.password")}
        type={showPwd ? "text" : "password"}
        fullWidth
        autoComplete="new-password"
        error={!!errors.password}
        helperText={errors.password?.message}
        sx={textFieldSx}
        slotProps={{ input: { endAdornment: pwdAdornment } }}
        {...reg("password", {
          required: t("account.validation.passwordRequired"),
          minLength: {
            value: 6,
            message: t("account.validation.passwordMinLength"),
          },
        })}
      />
      <TextField
        placeholder={t("account.register.form.confirmPassword")}
        type={showPwd ? "text" : "password"}
        fullWidth
        autoComplete="new-password"
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword?.message}
        sx={textFieldSx}
        {...reg("confirmPassword", {
          required: t("account.validation.confirmPasswordRequired"),
          validate: (val) =>
            val === passwordValue ||
            t("account.register.feedback.passwordMismatch"),
        })}
      />
      <TextField
        placeholder={t("account.register.form.inviteCode")}
        fullWidth
        sx={textFieldSx}
        {...reg("inviteCode")}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading}
        disableElevation
        sx={primaryBtnSx}
      >
        {loading ? (
          <CircularProgress size={20} sx={{ color: "white" }} />
        ) : (
          t("account.register.form.submit")
        )}
      </Button>

      <Box sx={{ textAlign: "center", mt: 0.5 }}>
        <Typography
          variant="body2"
          component="span"
          sx={{ color: "text.secondary", fontSize: "13px" }}
        >
          {t("account.login.hasAccount")}{" "}
        </Typography>
        <Button
          variant="text"
          size="small"
          onClick={() => onSwitchView("login")}
          sx={linkBtnSx}
        >
          {t("account.login.tab")}
        </Button>
      </Box>
    </Box>
  );
}

// ── ForgotView ───────────────────────────────────────────────────────────────

const RESEND_COOLDOWN = 60;

function ForgotView({ onSwitchView }: { onSwitchView: (v: View) => void }) {
  const { t } = useTranslation();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [confirmedEmail, setConfirmedEmail] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const {
    register: reg1,
    handleSubmit: submit1,
    getValues: getValues1,
    formState: { errors: errors1 },
  } = useForm<ForgotStep1Fields>();

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
      setStep("email");
      setConfirmedEmail("");
      setCooldown(0);
      reset2();
      onSwitchView("login");
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
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontSize: "13px", mb: 0.5 }}
        >
          {t("account.forgot.description")}
        </Typography>
        <TextField
          placeholder={t("account.forgot.form.email")}
          type="email"
          fullWidth
          autoComplete="email"
          error={!!errors1.email}
          helperText={errors1.email?.message}
          sx={textFieldSx}
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
          disableElevation
          sx={primaryBtnSx}
        >
          {sendingCode ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            t("account.forgot.form.sendCode")
          )}
        </Button>
        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="text"
            size="small"
            onClick={() => onSwitchView("login")}
            sx={linkBtnSx}
          >
            {t("account.forgot.backToLogin")}
          </Button>
        </Box>
      </Box>
    );
  }

  // step === "reset"
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={({ palette }) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.5,
          py: 1,
          borderRadius: "12px",
          bgcolor: alpha(palette.primary.main, 0.06),
          border: `0.5px solid ${alpha(palette.primary.main, 0.12)}`,
        })}
      >
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ flex: 1, fontSize: "12px" }}
        >
          {t("account.forgot.emailHint", { email: confirmedEmail })}
        </Typography>
        <Button
          size="small"
          variant="text"
          disabled={cooldown > 0 || sendingCode}
          onClick={handleResend}
          sx={{ ...linkBtnSx, flexShrink: 0 }}
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
          placeholder={t("account.forgot.form.emailCode")}
          fullWidth
          autoComplete="one-time-code"
          inputProps={{ maxLength: 6 }}
          error={!!errors2.emailCode}
          helperText={errors2.emailCode?.message}
          sx={textFieldSx}
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
          placeholder={t("account.forgot.form.newPassword")}
          type={showPwd ? "text" : "password"}
          fullWidth
          autoComplete="new-password"
          error={!!errors2.password}
          helperText={errors2.password?.message}
          sx={textFieldSx}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPwd((v) => !v)}
                    edge="end"
                    sx={{ color: "text.disabled" }}
                  >
                    {showPwd ? (
                      <VisibilityOff sx={{ fontSize: 18 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 18 }} />
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
          placeholder={t("account.forgot.form.confirmNewPassword")}
          type={showPwd ? "text" : "password"}
          fullWidth
          autoComplete="new-password"
          error={!!errors2.confirmPassword}
          helperText={errors2.confirmPassword?.message}
          sx={textFieldSx}
          {...reg2("confirmPassword", {
            required: t("account.validation.confirmPasswordRequired"),
            validate: (val) =>
              val === passwordValue ||
              t("account.register.feedback.passwordMismatch"),
          })}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={resetting}
          disableElevation
          sx={primaryBtnSx}
        >
          {resetting ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            t("account.forgot.form.submit")
          )}
        </Button>

        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="text"
            size="small"
            onClick={() => {
              setStep("email");
              onSwitchView("login");
            }}
            sx={linkBtnSx}
          >
            {t("account.forgot.backToLogin")}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

// ── LoginForm (root export) ──────────────────────────────────────────────────

export function LoginForm({ onSuccess }: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>("login");

  const heading =
    view === "login"
      ? t("account.login.tab")
      : view === "register"
        ? t("account.register.tab")
        : t("account.forgot.tab");

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: "auto",
        mt: 6,
        px: 3,
      }}
    >
      {/* Brand logo */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "16px",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
          }}
        >
          <Typography
            sx={{
              color: "white",
              fontSize: "24px",
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            悦
          </Typography>
        </Box>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "text.primary",
            letterSpacing: "-0.02em",
          }}
        >
          {heading}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", mt: 0.5, fontSize: "13px" }}
        >
          {t("account.brand.tagline")}
        </Typography>
      </Box>

      {/* Glass card */}
      <Box
        sx={{
          borderRadius: "var(--glass-radius)",
          background: "var(--glass-bg)",
          backdropFilter: "saturate(180%) blur(var(--glass-blur))",
          WebkitBackdropFilter: "saturate(180%) blur(var(--glass-blur))",
          border: "0.5px solid var(--glass-border)",
          p: 3,
        }}
      >
        {view === "login" && (
          <LoginView onSuccess={onSuccess} onSwitchView={setView} />
        )}
        {view === "register" && (
          <RegisterView onSuccess={onSuccess} onSwitchView={setView} />
        )}
        {view === "forgot" && <ForgotView onSwitchView={setView} />}
      </Box>
    </Box>
  );
}
