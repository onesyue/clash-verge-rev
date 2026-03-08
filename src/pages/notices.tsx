/**
 * XBoard 面板公告页
 *
 * - 登录后从 /api/v1/user/notice/fetch 拉取公告列表
 * - 按创建时间倒序展示，未读公告标绿色 NEW 徽章
 * - 支持展开 / 折叠 Markdown 全文
 * - 进入页面时自动标记全部已读
 */

import {
  AnnouncementRounded,
  ExpandLessRounded,
  ExpandMoreRounded,
  RefreshRounded,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Markdown from "react-markdown";

import { BasePage } from "@/components/base";
import { useXBoardNotices } from "@/hooks/use-xboard-notices";
import { useXBoardSession } from "@/services/xboard/store";
import type { Notice } from "@/services/xboard/types";

// 超过多少字符时折叠（按 Markdown 原文长度估算）
const COLLAPSE_THRESHOLD = 300;

const NoticesPage = () => {
  const { t } = useTranslation();
  const session = useXBoardSession();
  const { notices, loading, error, lastReadAt, markAllRead, refresh } =
    useXBoardNotices();

  // 进入页面后标记全部已读
  useEffect(() => {
    if (!session) return;
    if (notices.length > 0) markAllRead();
  }, [session, notices.length, markAllRead]);

  return (
    <BasePage
      title={t("account.notices.page.title")}
      header={
        session && (
          <Tooltip title={t("account.dashboard.refresh")}>
            <span>
              <IconButton
                size="small"
                onClick={() => refresh()}
                disabled={loading}
              >
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
          <AnnouncementRounded sx={{ fontSize: 56, color: "text.disabled" }} />
          <Typography variant="body1" color="text.secondary">
            {t("account.notices.loginRequired")}
          </Typography>
        </Box>
      )}

      {/* 加载中 */}
      {session && loading && notices.length === 0 && (
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
            {t("account.notices.loadFailed")}
          </Alert>
          <Button variant="outlined" onClick={() => refresh()}>
            {t("account.notices.retry")}
          </Button>
        </Box>
      )}

      {/* 无公告 */}
      {session && !loading && !error && notices.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            {t("account.notices.noNotices")}
          </Typography>
        </Box>
      )}

      {/* 公告列表 */}
      {session && notices.length > 0 && (
        <Stack
          divider={<Divider />}
          sx={{
            borderRadius: 2,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            overflow: "hidden",
            backgroundColor: "background.paper",
          }}
        >
          {[...notices]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((notice) => (
              <NoticeItem
                key={notice.id}
                notice={notice}
                isUnread={notice.createdAt > lastReadAt}
              />
            ))}
        </Stack>
      )}
    </BasePage>
  );
};

// ── NoticeItem ────────────────────────────────────────────────────────────────

function NoticeItem({
  notice,
  isUnread,
}: {
  notice: Notice;
  isUnread: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isLong = (notice.content ?? "").length > COLLAPSE_THRESHOLD;
  const [expanded, setExpanded] = useState(!isLong);

  const dateLabel = dayjs(notice.createdAt * 1000).format("YYYY-MM-DD HH:mm");

  return (
    <Box
      sx={{
        px: 2.5,
        py: 2,
        backgroundColor: isUnread
          ? alpha(theme.palette.success.main, 0.04)
          : "transparent",
        transition: "background-color 0.3s",
      }}
    >
      {/* 标题行 */}
      <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mb: 1 }}>
        <AnnouncementRounded
          sx={{ fontSize: 18, color: "text.secondary", mt: 0.3, flexShrink: 0 }}
        />
        <Typography
          variant="body1"
          fontWeight="bold"
          sx={{ flex: 1, wordBreak: "break-word" }}
        >
          {notice.title}
        </Typography>
        {isUnread && (
          <Chip
            label={t("account.notices.new")}
            color="success"
            size="small"
            sx={{ height: 18, fontSize: 10, flexShrink: 0 }}
          />
        )}
        <Typography
          variant="caption"
          color="text.disabled"
          sx={{ flexShrink: 0, mt: 0.3 }}
        >
          {dateLabel}
        </Typography>
      </Stack>

      {/* Markdown 内容 */}
      {notice.content && (
        <>
          <Collapse in={expanded} collapsedSize={isLong ? 80 : undefined}>
            <Box
              sx={{
                pl: 3.5,
                "& p": {
                  margin: 0,
                  marginBottom: "4px",
                  fontSize: 13,
                  color: theme.palette.text.secondary,
                  lineHeight: 1.6,
                },
                "& ul, & ol": {
                  margin: 0,
                  paddingLeft: "20px",
                  fontSize: 13,
                  color: theme.palette.text.secondary,
                },
                "& li": { marginBottom: 2 },
                "& strong": { color: theme.palette.text.primary },
                "& a": { color: theme.palette.primary.main },
                "& h1, & h2, & h3": {
                  margin: "4px 0",
                  fontSize: 14,
                  color: theme.palette.text.primary,
                },
                "& code": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  borderRadius: 1,
                  px: 0.5,
                  fontSize: 12,
                  fontFamily: "monospace",
                },
              }}
            >
              <Markdown>{notice.content}</Markdown>
            </Box>
          </Collapse>

          {/* 展开/折叠按钮 */}
          {isLong && (
            <Box sx={{ pl: 3.5, mt: 0.5 }}>
              <Button
                size="small"
                variant="text"
                onClick={() => setExpanded((v) => !v)}
                endIcon={
                  expanded ? (
                    <ExpandLessRounded fontSize="small" />
                  ) : (
                    <ExpandMoreRounded fontSize="small" />
                  )
                }
                sx={{ fontSize: 12, color: "text.secondary", px: 0 }}
              >
                {expanded
                  ? t("account.notices.collapse")
                  : t("account.notices.expand")}
              </Button>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

export default NoticesPage;
