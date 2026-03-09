import {
  ExpandLessRounded,
  ExpandMoreRounded,
  InboxRounded,
} from "@mui/icons-material";
import { Box, ListItemButton, Typography, alpha, styled } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useIconCache } from "@/hooks/use-icon-cache";
import { useVerge } from "@/hooks/use-verge";

import { ProxyHead } from "./proxy-head";
import { ProxyItem } from "./proxy-item";
import { ProxyItemMini } from "./proxy-item-mini";
import { HeadState } from "./use-head-state";
import type { IRenderItem } from "./use-render-list";

interface RenderProps {
  item: IRenderItem;
  indent: boolean;
  isChainMode?: boolean;
  onLocation: (group: IRenderItem["group"]) => void;
  onCheckAll: (groupName: string) => void;
  onHeadState: (groupName: string, patch: Partial<HeadState>) => void;
  onChangeProxy: (
    group: IRenderItem["group"],
    proxy: IRenderItem["proxy"] & { name: string },
  ) => void;
}

export const ProxyRender = (props: RenderProps) => {
  const {
    indent,
    item,
    onLocation,
    onCheckAll,
    onHeadState,
    onChangeProxy,
    isChainMode: _ = false,
  } = props;
  const { type, group, headState, proxy, proxyCol } = item;
  const { t } = useTranslation();
  const { verge } = useVerge();
  const enable_group_icon = verge?.enable_group_icon ?? true;
  const iconCachePath = useIconCache({
    icon: group.icon,
    cacheKey: group.name.replaceAll(" ", ""),
    enabled: enable_group_icon,
  });

  const proxyColItemsMemo = useMemo(() => {
    if (type !== 4 || !proxyCol) {
      return null;
    }

    return proxyCol.map((proxyItem) => (
      <ProxyItemMini
        key={`${item.key}-${proxyItem?.name ?? "unknown"}`}
        group={group}
        proxy={proxyItem!}
        selected={group.now === proxyItem?.name}
        showType={headState?.showType}
        onClick={() => onChangeProxy(group, proxyItem!)}
      />
    ));
  }, [type, proxyCol, item.key, group, headState, onChangeProxy]);

  if (type === 0) {
    return (
      <ListItemButton
        dense
        sx={({ palette }) => ({
          mx: 1,
          my: 0.5,
          px: 2,
          py: 1.5,
          borderRadius: "16px",
          bgcolor: palette.background.paper,
          border: `1px solid ${alpha(palette.divider, 0.5)}`,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          transition: "all 0.15s ease",
          "&:hover": {
            bgcolor:
              palette.mode === "dark"
                ? alpha(palette.primary.main, 0.08)
                : alpha(palette.primary.main, 0.04),
          },
        })}
        onClick={() => onHeadState(group.name, { open: !headState?.open })}
      >
        {/* 可选图标 */}
        {enable_group_icon && group.icon && (
          <img
            src={
              group.icon.trim().startsWith("<svg")
                ? `data:image/svg+xml;base64,${btoa(group.icon)}`
                : iconCachePath !== ""
                  ? iconCachePath
                  : group.icon
            }
            width="28px"
            style={{ borderRadius: 6, flexShrink: 0 }}
          />
        )}

        {/* 文本区 */}
        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <StyledPrimary>{group.name}</StyledPrimary>
          {group.now && (
            <StyledSubtitle
              sx={{ display: "block", color: "text.secondary", mt: 0.25 }}
            >
              {group.now}
            </StyledSubtitle>
          )}
        </Box>

        {/* 展开/收起箭头 */}
        {headState?.open ? (
          <ExpandLessRounded sx={{ color: "text.disabled", fontSize: 20 }} />
        ) : (
          <ExpandMoreRounded sx={{ color: "text.disabled", fontSize: 20 }} />
        )}
      </ListItemButton>
    );
  }

  if (type === 1) {
    return (
      <ProxyHead
        sx={{ pl: 2, pr: 3, mt: indent ? 1 : 0.5, mb: 1 }}
        url={group.testUrl}
        groupName={group.name}
        headState={headState!}
        onLocation={() => onLocation(group)}
        onCheckDelay={() => onCheckAll(group.name)}
        onHeadState={(p) => onHeadState(group.name, p)}
      />
    );
  }

  if (type === 2) {
    return (
      <ProxyItem
        group={group}
        proxy={proxy!}
        selected={group.now === proxy?.name}
        showType={headState?.showType}
        sx={{ py: 0, pl: 2 }}
        onClick={() => onChangeProxy(group, proxy!)}
      />
    );
  }

  if (type === 3) {
    return (
      <Box
        sx={{
          py: 2,
          pl: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <InboxRounded sx={{ fontSize: "2.5em", color: "inherit" }} />
        <Typography sx={{ color: "inherit" }}>
          {t("proxies.page.labels.noProxies")}
        </Typography>
      </Box>
    );
  }

  if (type === 4) {
    return (
      <Box
        sx={{
          minHeight: 56,
          display: "grid",
          gap: 1,
          pl: 2,
          pr: 2,
          pb: 1,
          gridTemplateColumns: `repeat(auto-fit, minmax(160px, 1fr))`,
        }}
      >
        {proxyColItemsMemo}
      </Box>
    );
  }

  return null;
};

const StyledPrimary = styled("span")`
  font-size: 16px;
  font-weight: 700;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const StyledSubtitle = styled("span")`
  font-size: 13px;
  overflow: hidden;
  color: text.secondary;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
