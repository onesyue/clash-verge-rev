/**
 * 套餐商店页面
 *
 * - 未登录：提示登录（套餐列表仍可公开加载，但购买需要登录）
 * - 已登录：加载套餐列表，点击价格触发结算对话框
 */

import { RefreshRounded, StoreRounded } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { BasePage } from "@/components/base";
import { CheckoutDialog } from "@/components/xboard/checkout-dialog";
import { PlanCard } from "@/components/xboard/plan-card";
import { getPlans } from "@/services/xboard/api";
import { useXBoardSession } from "@/services/xboard/store";
import type { Plan, PlanPeriod } from "@/services/xboard/types";

const ShopPage = () => {
  const { t } = useTranslation();
  const session = useXBoardSession();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PlanPeriod | null>(null);

  const loadPlans = useCallback(async () => {
    // 需要面板地址才能加载套餐；未登录时没有 baseUrl
    if (!session?.baseUrl) return;
    setLoading(true);
    setError(false);
    try {
      const list = await getPlans(session.baseUrl);
      setPlans(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [session?.baseUrl]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleBuy = (plan: Plan, period: PlanPeriod) => {
    setSelectedPlan(plan);
    setSelectedPeriod(period);
    setCheckoutOpen(true);
  };

  const handleCheckoutClose = () => {
    setCheckoutOpen(false);
    setSelectedPlan(null);
    setSelectedPeriod(null);
  };

  const handleCheckoutSuccess = () => {
    // 购买成功后刷新套餐列表（套餐可能因购买而变化）
    loadPlans();
  };

  return (
    <BasePage
      title={t("account.shop.page.title")}
      header={
        session && (
          <Tooltip title={t("account.dashboard.refresh")}>
            <span>
              <IconButton size="small" onClick={loadPlans} disabled={loading}>
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
      {/* 未登录提示 */}
      {!session && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            py: 8,
          }}
        >
          <StoreRounded sx={{ fontSize: 56, color: "text.disabled" }} />
          <Typography variant="body1" color="text.secondary">
            {t("account.shop.loginRequired")}
          </Typography>
        </Box>
      )}

      {/* 加载中 */}
      {session && loading && plans.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 加载失败 */}
      {session && error && !loading && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, py: 6 }}>
          <Alert severity="error" sx={{ width: "100%", maxWidth: 480 }}>
            {t("account.shop.loadFailed")}
          </Alert>
          <Button variant="outlined" onClick={loadPlans}>
            {t("account.shop.retry")}
          </Button>
        </Box>
      )}

      {/* 无套餐 */}
      {session && !loading && !error && plans.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            {t("account.shop.noPlans")}
          </Typography>
        </Box>
      )}

      {/* 套餐列表 */}
      {session && plans.length > 0 && (
        <Grid container spacing={2} columns={12}>
          {plans.map((plan) => (
            <Grid key={plan.id} size={6}>
              <PlanCard plan={plan} onBuy={handleBuy} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* 结算对话框 */}
      {session && (
        <CheckoutDialog
          open={checkoutOpen}
          plan={selectedPlan}
          period={selectedPeriod}
          baseUrl={session.baseUrl}
          authData={session.authData}
          onClose={handleCheckoutClose}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </BasePage>
  );
};

export default ShopPage;
