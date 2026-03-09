/**
 * XBoard 结算对话框
 *
 * 流程：
 *   select 步骤：加载支付方式 → 用户填写优惠码（可预验证）→ 选择支付方式 → createOrder → checkoutOrder
 *     type=-1: 免费/余额抵扣，直接成功关闭
 *     type=0/1: 打开外部支付链接，切换到 waiting 步骤
 *   waiting 步骤：用户完成浏览器支付后点击"已完成支付"→ checkOrderStatus 确认
 */

import {
  CheckCircleOutlineRounded,
  OpenInNewRounded,
  PaymentRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog } from "@/components/base/base-dialog";
import { showNotice } from "@/services/notice-service";
import {
  checkCoupon,
  checkOrderStatus,
  checkoutOrder,
  createOrder,
  getPaymentMethods,
} from "@/services/xboard/api";
import type {
  CouponInfo,
  PaymentMethod,
  Plan,
  PlanPeriod,
} from "@/services/xboard/types";
import { extractUrlFromHtml } from "@/services/xboard/utils";

interface Props {
  open: boolean;
  plan: Plan | null;
  period: PlanPeriod | null;
  authData: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "select" | "waiting";

export function CheckoutDialog({
  open,
  plan,
  period,
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
  const [methodsError, setMethodsError] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState<CouponInfo | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // waiting 步骤状态
  const [verifying, setVerifying] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);

  // 防抖 ref
  const couponDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载支付方式
  useEffect(() => {
    if (!open || !authData) return;
    let cancelled = false;
    const load = async () => {
      try {
        const list = await getPaymentMethods(authData);
        if (cancelled) return;
        setMethods(list);
        setMethodsError(false);
        if (list.length > 0) setSelectedMethod(list[0].id);
      } catch {
        if (cancelled) return;
        setMethods([]);
        setMethodsError(true);
      } finally {
        if (!cancelled) setLoadingMethods(false);
      }
    };
    queueMicrotask(() => {
      if (!cancelled) setLoadingMethods(true);
    });
    load();
    return () => {
      cancelled = true;
    };
  }, [open, authData]);

  const resetState = () => {
    if (couponDebounceRef.current) {
      clearTimeout(couponDebounceRef.current);
      couponDebounceRef.current = null;
    }
    setStep("select");
    setTradeNo("");
    setMethods([]);
    setMethodsError(false);
    setSelectedMethod(null);
    setCouponCode("");
    setCouponInfo(null);
    setCouponError("");
    setCheckingCoupon(false);
    setSubmitting(false);
    setVerifying(false);
    setPaymentPending(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ── 优惠码验证（防抖 500ms）───────────────────────────────────────────────

  const handleCouponChange = (val: string) => {
    setCouponCode(val);
    setCouponInfo(null);
    setCouponError("");
    if (couponDebounceRef.current) clearTimeout(couponDebounceRef.current);
    if (!val.trim()) return;

    couponDebounceRef.current = setTimeout(async () => {
      setCheckingCoupon(true);
      try {
        const info = await checkCoupon(authData, val.trim(), plan?.id);
        setCouponInfo(info);
        setCouponError("");
      } catch (err: any) {
        setCouponInfo(null);
        setCouponError(
          err?.message ?? t("account.shop.checkout.couponInvalid"),
        );
      } finally {
        setCheckingCoupon(false);
      }
    }, 500);
  };

  // ── select 步骤：创建订单并结算 ──────────────────────────────────────────

  const handleConfirm = async () => {
    if (!plan || !period) return;
    setSubmitting(true);
    try {
      const tn = await createOrder(
        authData,
        plan.id,
        period,
        couponInfo ? couponCode : undefined,
      );
      setTradeNo(tn);

      const result = await checkoutOrder(authData, tn, selectedMethod ?? 0);

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
      const status = await checkOrderStatus(authData, tradeNo);
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

  // Map snake_case PlanPeriod to camelCase Plan field
  const periodToPriceKey: Record<string, keyof Plan> = {
    month_price: "monthPrice",
    quarter_price: "quarterPrice",
    half_year_price: "halfYearPrice",
    year_price: "yearPrice",
    onetime_price: "onetimePrice",
  };
  const priceField = period ? periodToPriceKey[period] : undefined;
  const priceVal =
    plan && priceField ? (plan[priceField] as number | null) : null;

  // 计算折扣后价格
  let finalPrice = priceVal ?? 0;
  if (couponInfo && priceVal != null) {
    if (couponInfo.type === 1) {
      finalPrice = Math.max(0, priceVal - couponInfo.value);
    } else {
      finalPrice = Math.round((priceVal * couponInfo.value) / 100);
    }
  }
  const amount = priceVal != null ? `¥${(finalPrice / 100).toFixed(2)}` : "—";
  const originalAmount =
    couponInfo && priceVal != null ? `¥${(priceVal / 100).toFixed(2)}` : null;

  // ── 对话框属性随步骤变化 ──────────────────────────────────────────────────

  const dialogProps =
    step === "select"
      ? {
          title: t("account.shop.checkout.title"),
          okBtn: t("account.shop.checkout.confirm"),
          cancelBtn: t("account.shop.checkout.cancel"),
          loading: submitting,
          disableOk:
            loadingMethods ||
            methodsError ||
            methods.length === 0 ||
            submitting ||
            checkingCoupon,
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
              <Row
                label={t("account.shop.checkout.plan")}
                value={plan?.name ?? "—"}
              />
              <Row
                label={t("account.shop.checkout.period")}
                value={periodLabel}
              />
              <Row
                label={t("account.shop.checkout.amount")}
                value={
                  <Stack direction="row" spacing={1} alignItems="center">
                    {originalAmount && (
                      <Typography
                        variant="caption"
                        sx={{
                          textDecoration: "line-through",
                          color: "text.disabled",
                        }}
                      >
                        {originalAmount}
                      </Typography>
                    )}
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="primary"
                    >
                      {amount}
                    </Typography>
                  </Stack>
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
            onChange={(e) => handleCouponChange(e.target.value)}
            placeholder={t("account.shop.checkout.couponCodePlaceholder")}
            error={!!couponError}
            helperText={
              couponError ||
              (couponInfo
                ? couponInfo.type === 1
                  ? t("account.shop.checkout.couponDiscount", {
                      value: `¥${(couponInfo.value / 100).toFixed(2)}`,
                    })
                  : t("account.shop.checkout.couponPercent", {
                      value: couponInfo.value,
                      off: 100 - couponInfo.value,
                    })
                : undefined)
            }
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    {checkingCoupon ? (
                      <CircularProgress size={16} />
                    ) : couponInfo ? (
                      <CheckCircleOutlineRounded
                        fontSize="small"
                        color="success"
                      />
                    ) : null}
                  </InputAdornment>
                ),
              },
              formHelperText: {
                sx: couponInfo ? { color: "success.main" } : undefined,
              },
            }}
          />

          {/* 支付方式 */}
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {t("account.shop.checkout.paymentMethod")}
            </Typography>
            {loadingMethods ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ py: 1 }}
              >
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  {t("account.shop.checkout.paymentMethodLoading")}
                </Typography>
              </Stack>
            ) : methodsError ? (
              <Typography variant="body2" color="error">
                {t("account.shop.checkout.paymentMethodError")}
              </Typography>
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
                        <PaymentRounded
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
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
          <OpenInNewRounded
            sx={{ fontSize: 48, color: "text.secondary", mt: 1 }}
          />
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
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
