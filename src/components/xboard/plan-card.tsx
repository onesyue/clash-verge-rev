/**
 * XBoard 套餐卡片
 *
 * 展示套餐名称、流量、Markdown 描述，以及各周期价格按钮。
 * 点击价格按钮后触发 onBuy(plan, period)。
 */

import { CloudRounded, DataUsageRounded } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";

import type { Plan, PlanPeriod } from "@/services/xboard/types";
import parseTraffic from "@/utils/parse-traffic";

const PERIODS: Array<{ key: PlanPeriod; suffix: string }> = [
  { key: "month_price", suffix: "account.shop.plan.perMonth" },
  { key: "quarter_price", suffix: "account.shop.plan.perQuarter" },
  { key: "half_year_price", suffix: "account.shop.plan.perHalfYear" },
  { key: "year_price", suffix: "account.shop.plan.perYear" },
  { key: "onetime_price", suffix: "account.shop.plan.onetime" },
];

interface Props {
  plan: Plan;
  onBuy: (plan: Plan, period: PlanPeriod) => void;
}

export function PlanCard({ plan, onBuy }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  const availablePeriods = PERIODS.filter(
    ({ key }) => plan[key as keyof Plan] != null,
  );

  const [trafficVal, trafficUnit] = parseTraffic(plan.transferGb * 1024 * 1024 * 1024);
  const isUnlimited = plan.transferGb === 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
        transition: "box-shadow 0.2s, border-color 0.2s",
        "&:hover": {
          boxShadow: theme.shadows[4],
          borderColor: alpha(theme.palette.primary.main, 0.4),
        },
      }}
    >
      {/* 卡片头部 */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          backgroundColor: alpha(theme.palette.primary.main, 0.06),
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">
            {plan.name}
          </Typography>
          <Chip
            icon={<DataUsageRounded sx={{ fontSize: 14 }} />}
            label={
              isUnlimited
                ? t("account.shop.plan.unlimited")
                : `${trafficVal} ${trafficUnit}`
            }
            size="small"
            color={isUnlimited ? "success" : "primary"}
            variant="outlined"
          />
        </Stack>
      </Box>

      {/* Markdown 描述 */}
      {plan.content ? (
        <Box
          sx={{
            flex: 1,
            px: 2.5,
            py: 1.5,
            overflow: "hidden",
            "& p": { margin: 0, fontSize: 13, color: theme.palette.text.secondary },
            "& ul, & ol": {
              margin: 0,
              paddingLeft: 2,
              fontSize: 13,
              color: theme.palette.text.secondary,
            },
            "& li": { marginBottom: 2 },
            "& strong": { color: theme.palette.text.primary },
          }}
        >
          <Markdown>{plan.content}</Markdown>
        </Box>
      ) : (
        <Box sx={{ flex: 1 }} />
      )}

      <Divider />

      {/* 价格按钮区 */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack spacing={1}>
          {availablePeriods.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center">
              —
            </Typography>
          ) : (
            availablePeriods.map(({ key }) => {
              const priceVal = plan[key as keyof Plan] as number;
              return (
                <Button
                  key={key}
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => onBuy(plan, key)}
                  sx={{ justifyContent: "space-between", borderRadius: 1.5, px: 2 }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {t(`account.shop.plan.period.${key}`)}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    ¥{(priceVal / 100).toFixed(2)}
                  </Typography>
                </Button>
              );
            })
          )}
        </Stack>
      </Box>
    </Box>
  );
}
