/**
 * XBoard 结算对话框
 *
 * 流程：
 *   select 步骤：加载支付方式 → 用户填写优惠码 → 选择支付方式 → createOrder → checkoutOrder
 *     type=-1: 免费/余额抵扣，直接成功关闭
 *     type=0/1: 打开外部支付链接，切换到 waiting 步骤
 *   waiting 步骤：用户完成浏览器支付后点击"已完成支付"→ checkOrderStatus 确认
 */

import {
  OpenInNewRounded,
  PaymentRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog } from "@/components/base/base-dialog";
import { showNotice } from "@/services/notice-service";
import {
  checkOrderStatus,
  checkoutOrder,
  createOrder,
  getPaymentMethods,
} from "@/services/xboard/api";
import type { PaymentMethod, Plan, PlanPeriod } from "@/services/xboard/types";

interface Props {
  open: boolean;
  plan: Plan | null;
  period: PlanPeriod | null;
  baseUrl: string;
  authData: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "select" | "waiting";

export function CheckoutDialog({
  open,
  plan,
  period,
  baseUrl,
  authData,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  // 步骤状态
  const [step, setStep] = useState<Step>("select");
  const [tradeNo, setTradeNo] = useState("");

  // select 步骤状态
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // waiting 步骤状态
  const [verifying, setVerifying] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);

  // 加载支付方式
  useEffect(() => {
    if (!open || !baseUrl || !authData) return;
    setLoadingMethods(true);
    getPaymentMethods(baseUrl, authData)
      .then((list) => {
        setMethods(list);
        if (list.length > 0) setSelectedMethod(list[0].id);
      })
      .catch(() => setMethods([]))
      .finally(() => setLoadingMethods(false));
  }, [open, baseUrl, authData]);

  const resetState = () => {
    setStep("select");
    setTradeNo("");
    setMethods([]);
    setSelectedMethod(null);
    setCouponCode("");
    setSubmitting(false);
    setVerifying(false);
    setPaymentPending(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ── select 步骤：创建订单并结算 ──────────────────────────────────────────

  const handleConfirm = async () => {
    if (!plan || !period) return;
    setSubmitting(true);
    try {
      const tn = await createOrder(
        baseUrl,
        authData,
        plan.id,
        period,
        couponCode || undefined,
      );
      setTradeNo(tn);

      const result = await checkoutOrder(
        baseUrl,
        authData,
        tn,
        selectedMethod ?? 0,
      );

      if (result.type === -1) {
        // 免费 / 余额支付，直接成功
        showNotice.success(t("account.shop.checkout.freeSuccess"));
        resetState();
        onClose();
        onSuccess();
      } else {
        // 外部支付链接，打开后切换到等待确认步骤
        const url =
          result.type === 0 ? result.data : extractUrlFromHtml(result.data);
        if (url) {
          await openUrl(url);
        }
        setStep("waiting");
      }
    } catch (err: any) {
      showNotice.error(
        t("account.shop.checkout.failed"),
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── waiting 步骤：查询支付状态 ───────────────────────────────────────────

  const handleVerify = async () => {
    setVerifying(true);
    setPaymentPending(false);
    try {
      const status = await checkOrderStatus(baseUrl, authData, tradeNo);
      if (status === 3 || status === 1) {
        // 已完成或处理中，均视为支付成功
        showNotice.success(t("account.shop.checkout.paymentVerified"));
        resetState();
        onClose();
        onSuccess();
      } else {
        setPaymentPending(true);
      }
    } catch {
      setPaymentPending(true);
    } finally {
      setVerifying(false);
    }
  };

  // ── 派生变量 ──────────────────────────────────────────────────────────────

  const periodLabel = period ? t(`account.shop.plan.period.${period}`) : "";
  const priceField = period as keyof Plan;
  const priceVal = plan ? (plan[priceField] as number | null) : null;
  const amount = priceVal != null ? `¥${(priceVal / 100).toFixed(2)}` : "—";

  // ── 对话框属性随步骤变化 ──────────────────────────────────────────────────

  const dialogProps =
    step === "select"
      ? {
          title: t("account.shop.checkout.title"),
          okBtn: t("account.shop.checkout.confirm"),
          cancelBtn: t("account.shop.checkout.cancel"),
          loading: submitting,
          disableOk: loadingMethods || methods.length === 0 || submitting,
          onOk: handleConfirm,
          onCancel: handleClose,
        }
      : {
          title: t("account.shop.checkout.waitingTitle"),
          okBtn: t("account.shop.checkout.verifyPayment"),
          cancelBtn: t("account.shop.checkout.close"),
          loading: verifying,
          disableOk: verifying,
          onOk: handleVerify,
          onCancel: handleClose,
        };

  return (
    <BaseDialog
      open={open}
      {...dialogProps}
      onClose={handleClose}
      contentSx={{ minWidth: 320 }}
    >
      {step === "select" ? (
        <Stack spacing={2} sx={{ pt: 1 }}>
          {/* 订单摘要 */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.06),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            }}
          >
            <Stack spacing={0.5}>
              <Row label={t("account.shop.checkout.plan")} value={plan?.name ?? "—"} />
              <Row label={t("account.shop.checkout.period")} value={periodLabel} />
              <Row
                label={t("account.shop.checkout.amount")}
                value={
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {amount}
                  </Typography>
                }
              />
            </Stack>
          </Box>

          {/* 优惠码 */}
          <TextField
            label={t("account.shop.checkout.couponCode")}
            size="small"
            fullWidth
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder={t("account.shop.checkout.couponCodePlaceholder")}
          />

          {/* 支付方式 */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("account.shop.checkout.paymentMethod")}
            </Typography>
            {loadingMethods ? (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  {t("account.shop.checkout.paymentMethodLoading")}
                </Typography>
              </Stack>
            ) : methods.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("account.shop.checkout.noPaymentMethods")}
              </Typography>
            ) : (
              <RadioGroup
                value={selectedMethod}
                onChange={(_, v) => setSelectedMethod(Number(v))}
              >
                {methods.map((m) => (
                  <FormControlLabel
                    key={m.id}
                    value={m.id}
                    control={<Radio size="small" />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <PaymentRounded sx={{ fontSize: 16, color: "text.secondary" }} />
                        <Typography variant="body2">{m.name}</Typography>
                      </Stack>
                    }
                  />
                ))}
              </RadioGroup>
            )}
          </Box>
        </Stack>
      ) : (
        // waiting 步骤
        <Stack spacing={2} sx={{ pt: 1, pb: 1 }} alignItems="center">
          <OpenInNewRounded sx={{ fontSize: 48, color: "text.secondary", mt: 1 }} />
          <Typography variant="body1" textAlign="center" color="text.primary">
            {t("account.shop.checkout.waitingPayment")}
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary">
            {t("account.shop.checkout.waitingPaymentHint")}
          </Typography>
          {paymentPending && (
            <Alert severity="warning" sx={{ width: "100%" }}>
              {t("account.shop.checkout.paymentPending")}
            </Alert>
          )}
        </Stack>
      )}
    </BaseDialog>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {typeof value === "string" ? (
        <Typography variant="body2" fontWeight="medium">
          {value}
        </Typography>
      ) : (
        value
      )}
    </Stack>
  );
}

/** 从 HTML 字符串中提取第一个 href URL（收银台降级用） */
function extractUrlFromHtml(html: string): string {
  const match = html.match(/href=["']([^"']+)["']/i);
  return match?.[1] ?? "";
}
