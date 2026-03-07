/**
 * 订单管理页面
 *
 * - 列出全部历史订单，按创建时间倒序
 * - 状态 0（待支付）可 "立即支付" 或 "取消订单"
 * - 支持手动刷新
 */

import {
  CancelRounded,
  PaymentRounded,
  ReceiptLongRounded,
  RefreshRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { BasePage } from "@/components/base";
import { PayNowDialog } from "@/components/xboard/pay-now-dialog";
import { cancelOrder, getOrders } from "@/services/xboard/api";
import { useXBoardSession } from "@/services/xboard/store";
import { showNotice } from "@/services/notice-service";
import type { Order } from "@/services/xboard/types";

// 订单状态色 / 标签配置
type ChipColor = "default" | "warning" | "info" | "error" | "success" | "secondary";

const STATUS_COLOR: Record<Order["status"], ChipColor> = {
  0: "warning",
  1: "info",
  2: "default",
  3: "success",
  4: "secondary",
};

// 周期 key → i18n key 映射（与 shop 共用）
const PERIOD_I18N: Record<string, string> = {
  month_price: "account.shop.plan.period.month_price",
  quarter_price: "account.shop.plan.period.quarter_price",
  half_year_price: "account.shop.plan.period.half_year_price",
  year_price: "account.shop.plan.period.year_price",
  onetime_price: "account.shop.plan.period.onetime_price",
};

const OrdersPage = () => {
  const { t } = useTranslation();
  const session = useXBoardSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // 取消中的订单号集合
  const [cancellingSet, setCancellingSet] = useState<Set<string>>(new Set());

  // 立即支付对话框
  const [payNowTradeNo, setPayNowTradeNo] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(false);
    try {
      const list = await getOrders(session.baseUrl, session.authData);
      // 按创建时间倒序
      list.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancel = async (tradeNo: string) => {
    if (!session) return;
    setCancellingSet((prev) => new Set(prev).add(tradeNo));
    try {
      await cancelOrder(session.baseUrl, session.authData, tradeNo);
      showNotice.success(t("account.orders.actions.cancelSuccess"));
      // 本地更新状态为已取消，避免重新加载整个列表
      setOrders((prev) =>
        prev.map((o) => (o.tradeNo === tradeNo ? { ...o, status: 2 } : o)),
      );
    } catch (err: any) {
      showNotice.error(
        t("account.orders.actions.cancelFailed"),
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      setCancellingSet((prev) => {
        const next = new Set(prev);
        next.delete(tradeNo);
        return next;
      });
    }
  };

  return (
    <BasePage
      title={t("account.orders.page.title")}
      header={
        session && (
          <Tooltip title={t("account.dashboard.refresh")}>
            <span>
              <IconButton size="small" onClick={loadOrders} disabled={loading}>
                <RefreshRounded
                  fontSize="small"
                  sx={{
                    animation: loading ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                      from: { transform: "rotate(0deg)" },
                      to: { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        )
      }
    >
      {/* 未登录 */}
      {!session && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 8,
          }}
        >
          <ReceiptLongRounded sx={{ fontSize: 56, color: "text.disabled" }} />
          <Typography variant="body1" color="text.secondary">
            {t("account.orders.loginRequired")}
          </Typography>
        </Box>
      )}

      {/* 加载中 */}
      {session && loading && orders.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 加载失败 */}
      {session && error && !loading && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 6,
          }}
        >
          <Alert severity="error" sx={{ width: "100%", maxWidth: 480 }}>
            {t("account.orders.loadFailed")}
          </Alert>
          <Button variant="outlined" onClick={loadOrders}>
            {t("account.orders.retry")}
          </Button>
        </Box>
      )}

      {/* 无订单 */}
      {session && !loading && !error && orders.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            {t("account.orders.noOrders")}
          </Typography>
        </Box>
      )}

      {/* 订单列表 */}
      {session && orders.length > 0 && (
        <Stack
          divider={<Divider />}
          sx={{
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
            backgroundColor: "background.paper",
          }}
        >
          {orders.map((order) => (
            <OrderRow
              key={order.tradeNo}
              order={order}
              cancelling={cancellingSet.has(order.tradeNo)}
              onCancel={() => handleCancel(order.tradeNo)}
              onPayNow={() => setPayNowTradeNo(order.tradeNo)}
            />
          ))}
        </Stack>
      )}

      {/* 立即支付对话框 */}
      {session && (
        <PayNowDialog
          open={payNowTradeNo != null}
          tradeNo={payNowTradeNo ?? ""}
          baseUrl={session.baseUrl}
          authData={session.authData}
          onClose={() => setPayNowTradeNo(null)}
          onSuccess={() => {
            setPayNowTradeNo(null);
            loadOrders();
          }}
        />
      )}
    </BasePage>
  );
};

// ── OrderRow ──────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  cancelling,
  onCancel,
  onPayNow,
}: {
  order: Order;
  cancelling: boolean;
  onCancel: () => void;
  onPayNow: () => void;
}) {
  const { t } = useTranslation();

  const periodLabel =
    PERIOD_I18N[order.period] ? t(PERIOD_I18N[order.period]) : order.period;

  const amountLabel = `¥${(order.totalAmount / 100).toFixed(2)}`;

  const dateLabel = dayjs(order.createdAt * 1000).format("YYYY-MM-DD HH:mm");

  const isPending = order.status === 0;

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      {/* 第一行：套餐名 + 状态 + 操作 */}
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          variant="body2"
          fontWeight="medium"
          sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {order.planName || "—"}
        </Typography>

        <Chip
          label={t(`account.orders.status.${order.status}`)}
          color={STATUS_COLOR[order.status]}
          size="small"
          variant="outlined"
          sx={{ flexShrink: 0 }}
        />

        {isPending && (
          <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<PaymentRounded sx={{ fontSize: 14 }} />}
              onClick={onPayNow}
              sx={{ borderRadius: 1.5, minWidth: 0, px: 1 }}
            >
              {t("account.orders.actions.payNow")}
            </Button>
            <Tooltip title={t("account.orders.actions.cancel")}>
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={onCancel}
                  disabled={cancelling}
                >
                  {cancelling ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <CancelRounded sx={{ fontSize: 16 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}
      </Stack>

      {/* 第二行：周期 / 金额 / 时间 / 订单号 */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ mt: 0.5, flexWrap: "wrap" }}
      >
        <MetaItem label={t("account.orders.columns.period")} value={periodLabel} />
        <MetaItem label={t("account.orders.columns.amount")} value={amountLabel} highlight />
        <MetaItem label={t("account.orders.columns.time")} value={dateLabel} />
        <MetaItem
          label={t("account.orders.columns.tradeNo")}
          value={order.tradeNo}
          mono
        />
      </Stack>
    </Box>
  );
}

function MetaItem({
  label,
  value,
  highlight,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="baseline">
      <Typography variant="caption" color="text.disabled">
        {label}
      </Typography>
      <Typography
        variant="caption"
        fontWeight={highlight ? "bold" : "normal"}
        color={highlight ? "primary" : "text.secondary"}
        sx={mono ? { fontFamily: "monospace", fontSize: 11 } : undefined}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default OrdersPage;
