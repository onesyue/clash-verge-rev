import { CheckCircleOutlineRounded } from "@mui/icons-material";
import {
  alpha,
  Box,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  SxProps,
  Theme,
} from "@mui/material";
import { useLockFn } from "ahooks";
import { useCallback, useEffect, useReducer } from "react";

import { BaseLoading } from "@/components/base";
import { useVerge } from "@/hooks/use-verge";
import delayManager, { DelayUpdate } from "@/services/delay";

interface Props {
  group: IProxyGroupItem;
  proxy: IProxyItem;
  selected: boolean;
  showType?: boolean;
  sx?: SxProps<Theme>;
  onClick?: (name: string) => void;
}

const Widget = styled(Box)(() => ({
  padding: "3px 6px",
  fontSize: 14,
  borderRadius: "4px",
}));

const TypeBox = styled("span")(({ theme }) => ({
  display: "inline-block",
  border: "1px solid",
  borderColor: alpha(theme.palette.text.secondary, 0.2),
  color: alpha(theme.palette.text.secondary, 0.5),
  borderRadius: 6,
  fontSize: 10,
  marginRight: "4px",
  padding: "1px 4px",
  lineHeight: 1.25,
}));

// Colored dot based on latency
function DelayDot({ delay, timeout }: { delay: number; timeout: number }) {
  let color = "#94A3B8"; // default grey
  if (delay > 0 && delay < timeout) {
    if (delay < 200)
      color = "#10B981"; // good - emerald
    else if (delay < 500)
      color = "#F59E0B"; // medium - amber
    else color = "#EF4444"; // slow - red
  } else if (delay >= timeout) {
    color = "#EF4444";
  }

  return (
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        bgcolor: color,
        flexShrink: 0,
        boxShadow: delay > 0 ? `0 0 6px ${alpha(color, 0.5)}` : "none",
      }}
    />
  );
}

export const ProxyItem = (props: Props) => {
  const { group, proxy, selected, showType = true, sx, onClick } = props;

  const presetList = ["DIRECT", "REJECT", "REJECT-DROP", "PASS", "COMPATIBLE"];
  const isPreset = presetList.includes(proxy.name);
  const [delayState, setDelayState] = useReducer(
    (_: DelayUpdate, next: DelayUpdate) => next,
    { delay: -1, updatedAt: 0 },
  );
  const { verge } = useVerge();
  const timeout = verge?.default_latency_timeout || 10000;

  useEffect(() => {
    if (isPreset) return;
    delayManager.setListener(proxy.name, group.name, setDelayState);

    return () => {
      delayManager.removeListener(proxy.name, group.name);
    };
  }, [proxy.name, group.name, isPreset]);

  const updateDelay = useCallback(() => {
    if (!proxy) return;
    const cachedUpdate = delayManager.getDelayUpdate(proxy.name, group.name);
    if (cachedUpdate) {
      setDelayState({ ...cachedUpdate });
      return;
    }

    const fallbackDelay = delayManager.getDelayFix(proxy, group.name);
    if (fallbackDelay === -1) {
      setDelayState({ delay: -1, updatedAt: 0 });
      return;
    }

    let updatedAt = 0;
    const history = proxy.history;
    if (history && history.length > 0) {
      const lastRecord = history[history.length - 1];
      const parsed = Date.parse(lastRecord.time);
      if (!Number.isNaN(parsed)) {
        updatedAt = parsed;
      }
    }

    setDelayState({
      delay: fallbackDelay,
      updatedAt,
    });
  }, [proxy, group.name]);

  useEffect(() => {
    updateDelay();
  }, [updateDelay]);

  const onDelay = useLockFn(async () => {
    setDelayState({ delay: -2, updatedAt: Date.now() });
    setDelayState(
      await delayManager.checkDelay(proxy.name, group.name, timeout),
    );
  });

  const delayValue = delayState.delay;

  return (
    <ListItem sx={sx}>
      <ListItemButton
        dense
        selected={selected}
        onClick={() => onClick?.(proxy.name)}
        sx={[
          { borderRadius: "12px" },
          ({ palette }) => {
            const { mode, primary, background, divider } = palette;
            const selectColor = mode === "light" ? primary.main : primary.light;
            const showDelay = delayValue > 0;

            return {
              "&:hover .the-check": { display: !showDelay ? "block" : "none" },
              "&:hover .the-delay": { display: showDelay ? "block" : "none" },
              "&:hover .the-icon": { display: "none" },
              "&.Mui-selected": {
                width: `calc(100% + 3px)`,
                marginLeft: `-3px`,
                borderLeft: `3px solid ${selectColor}`,
                bgcolor:
                  mode === "light"
                    ? alpha(primary.main, 0.1)
                    : alpha(primary.main, 0.15),
              },
              "&:hover": {
                bgcolor:
                  mode === "light"
                    ? alpha(primary.main, 0.04)
                    : alpha(primary.main, 0.08),
              },
              backgroundColor: background.paper,
              marginBottom: "6px",
              height: "44px",
              border: `1px solid ${alpha(divider, 0.5)}`,
              transition: "all 0.15s ease",
            };
          },
        ]}
      >
        <ListItemText
          title={proxy.name}
          secondary={
            <>
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  marginRight: "8px",
                  fontSize: "13px",
                  color: "text.primary",
                }}
              >
                {/* Delay dot */}
                {!isPreset && delayValue > 0 && (
                  <DelayDot delay={delayValue} timeout={timeout} />
                )}
                {proxy.name}
                {showType && proxy.now && ` - ${proxy.now}`}
              </Box>
              {showType && !!proxy.provider && (
                <TypeBox>{proxy.provider}</TypeBox>
              )}
              {showType && <TypeBox>{proxy.type}</TypeBox>}
              {showType && proxy.udp && <TypeBox>UDP</TypeBox>}
              {showType && proxy.xudp && <TypeBox>XUDP</TypeBox>}
              {showType && proxy.tfo && <TypeBox>TFO</TypeBox>}
              {showType && proxy.mptcp && <TypeBox>MPTCP</TypeBox>}
              {showType && proxy.smux && <TypeBox>SMUX</TypeBox>}
            </>
          }
        />

        <ListItemIcon
          sx={{
            justifyContent: "flex-end",
            color: "primary.main",
            display: isPreset ? "none" : "",
          }}
        >
          {delayValue === -2 && (
            <Widget>
              <BaseLoading />
            </Widget>
          )}

          {!proxy.provider && delayValue !== -2 && (
            <Widget
              className="the-check"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelay();
              }}
              sx={({ palette }) => ({
                display: "none",
                borderRadius: "8px",
                ":hover": { bgcolor: alpha(palette.primary.main, 0.1) },
              })}
            >
              Check
            </Widget>
          )}

          {delayValue > 0 && (
            <Widget
              className="the-delay"
              onClick={(e) => {
                if (proxy.provider) return;
                e.preventDefault();
                e.stopPropagation();
                onDelay();
              }}
              color={delayManager.formatDelayColor(delayValue, timeout)}
              sx={({ palette }) => ({
                fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
                fontSize: "12px",
                ...(!proxy.provider
                  ? {
                      borderRadius: "8px",
                      ":hover": {
                        bgcolor: alpha(palette.primary.main, 0.1),
                      },
                    }
                  : {}),
              })}
            >
              {delayManager.formatDelay(delayValue, timeout)}
            </Widget>
          )}

          {delayValue !== -2 && delayValue <= 0 && selected && (
            <CheckCircleOutlineRounded
              className="the-icon"
              sx={{ fontSize: 16 }}
            />
          )}
        </ListItemIcon>
      </ListItemButton>
    </ListItem>
  );
};
