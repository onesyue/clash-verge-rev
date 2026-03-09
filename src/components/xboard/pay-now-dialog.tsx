/**
 * 对已有待支付订单进行付款的对话框
 *
 * 与 CheckoutDialog 的区别：tradeNo 已知，直接跳到支付方式选择。
 * 流程：
 *   select 步骤：加载支付方式 → checkoutOrder
 *     type=-1: 直接成功
 *     type=0/1: 打开外部支付链接，切换到 waiting 步骤
 *   waiting 步骤：点击"已完成支付" → checkOrderStatus 确认
 */

import { OpenInNewRounded, PaymentRounded } from "@mui/icons-material";
import {
  Alert,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseDialog } from "@/components/base/base-dialog";
import { showNotice } from "@/services/notice-service";
import {
  checkOrderStatus,
  checkoutOrder,
  getPaymentMethods,
} from "@/services/xboard/api";
import type { PaymentMethod } from "@/services/xboard/types";
import { extractUrlFromHtml } from "@/services/xboard/utils";

interface Props {
  open: boolean;
  tradeNo: string;
  authData: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "select" | "waiting";

export function PayNowDialog({
  open,
  tradeNo,
  authData,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation();

  const [step, setStep] = useState<Step>("select");

  // select 步骤状态
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [methodsError, setMethodsError] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // waiting 步骤状态
  const [verifying, setVerifying] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);

  useEffect(() => {
    if (!open) return;
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
    setStep("select");
    setMethods([]);
    setMethodsError(false);
    setSelectedMethod(null);
    setSubmitting(false);
    setVerifying(false);
    setPaymentPending(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // ── select 步骤 ───────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!tradeNo || selectedMethod == null) return;
    setSubmitting(true);
    try {
      const result = await checkoutOrder(authData, tradeNo, selectedMethod);
      if (result.type === -1) {
        showNotice.success(t("account.orders.payNow.freeSuccess"));
        resetState();
        onClose();
        onSuccess();
      } else {
        const url =
          result.type === 0 ? result.data : extractUrlFromHtml(result.data);
        if (url) {
          await openUrl(url);
        }
        setStep("waiting");
      }
    } catch (err: any) {
      showNotice.error(
        t("account.orders.payNow.failed"),
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── waiting 步骤 ──────────────────────────────────────────────────────────

  const handleVerify = async () => {
    setVerifying(true);
    setPaymentPending(false);
    try {
      const status = await checkOrderStatus(authData, tradeNo);
      if (status === 3 || status === 1) {
        showNotice.success(t("account.orders.payNow.paymentVerified"));
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

  // ── 对话框属性随步骤变化 ──────────────────────────────────────────────────

  const dialogProps =
    step === "select"
      ? {
          title: t("account.orders.payNow.title"),
          okBtn: t("account.orders.payNow.confirm"),
          cancelBtn: t("account.orders.payNow.cancel"),
          loading: submitting,
          disableOk:
            loadingMethods ||
            methodsError ||
            methods.length === 0 ||
            submitting,
          onOk: handleConfirm,
          onCancel: handleClose,
        }
      : {
          title: t("account.orders.payNow.waitingTitle"),
          okBtn: t("account.orders.payNow.verifyPayment"),
          cancelBtn: t("account.orders.payNow.close"),
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
      contentSx={{ minWidth: 300 }}
    >
      {step === "select" ? (
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {t("account.orders.payNow.paymentMethod")}
          </Typography>
          {loadingMethods ? (
            <Stack direction="row" alignItems="center" spacing={1}>
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
              {t("account.orders.payNow.noPaymentMethods")}
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
        </Stack>
      ) : (
        // waiting 步骤
        <Stack spacing={2} sx={{ pt: 1, pb: 1 }} alignItems="center">
          <OpenInNewRounded
            sx={{ fontSize: 48, color: "text.secondary", mt: 1 }}
          />
          <Typography variant="body1" textAlign="center" color="text.primary">
            {t("account.orders.payNow.waitingPayment")}
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary">
            {t("account.orders.payNow.waitingPaymentHint")}
          </Typography>
          {paymentPending && (
            <Alert severity="warning" sx={{ width: "100%" }}>
              {t("account.orders.payNow.paymentPending")}
            </Alert>
          )}
        </Stack>
      )}
    </BaseDialog>
  );
}
