import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Paper,
  ThemeProvider,
} from "@mui/material";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { SWRConfig } from "swr";

import { BaseErrorBoundary } from "@/components/base";
import { NoticeManager } from "@/components/layout/notice-manager";
import { WindowControls } from "@/components/layout/window-controller";
import { GeoDataUpdater } from "@/components/xboard/geodata-updater";
import { XBoardNoticeWatcher } from "@/components/xboard/notice-watcher";
import { useI18n } from "@/hooks/use-i18n";
import { useVerge } from "@/hooks/use-verge";
import { useWindowDecorations } from "@/hooks/use-window";
import { useThemeMode } from "@/services/states";
import {
  XBoardSessionProvider,
  XBoardUserInfoProvider,
  useXBoardSession,
} from "@/services/xboard/store";
import getSystem from "@/utils/get-system";

import {
  useAppInitialization,
  useCustomTheme,
  useLayoutEvents,
  useLoadingOverlay,
} from "./_layout/hooks";
import { handleNoticeMessage } from "./_layout/utils";
import { bottomNavItems } from "./_routers";

import "dayjs/locale/ru";
import "dayjs/locale/zh-cn";

// 受保护的 Outlet：未登录时直接渲染 Navigate，不渲染目标页（无闪屏）
function ProtectedOutlet() {
  const session = useXBoardSession();
  const location = useLocation();
  const isAccountPage = location.pathname === "/account";

  if (!session && !isAccountPage) {
    return <Navigate to="/account" replace />;
  }
  return <Outlet />;
}

export const portableFlag = false;

const OS = getSystem();

// 底部导航栏高度（px）
export const BOTTOM_NAV_HEIGHT = 56;

const Layout = () => {
  const mode = useThemeMode();
  const { t } = useTranslation();
  const { theme } = useCustomTheme();
  const { verge } = useVerge();
  const { language } = verge ?? {};
  const { switchLanguage } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const themeReady = useMemo(() => Boolean(theme), [theme]);

  const { decorated } = useWindowDecorations();

  const customTitlebar = useMemo(
    () =>
      !decorated ? (
        <div className="the_titlebar" data-tauri-drag-region="true">
          <WindowControls />
        </div>
      ) : null,
    [decorated],
  );

  useLoadingOverlay(themeReady);
  useAppInitialization();

  const handleNotice = useCallback(
    (payload: [string, string]) => {
      const [status, msg] = payload;
      try {
        handleNoticeMessage(status, msg, t, navigate);
      } catch (error) {
        console.error("[通知处理] 失败:", error);
      }
    },
    [t, navigate],
  );

  useLayoutEvents(handleNotice);

  useEffect(() => {
    if (language) {
      dayjs.locale(language === "zh" ? "zh-cn" : language);
      switchLanguage(language);
    }
  }, [language, switchLanguage]);

  // 当前底部导航选中项（匹配最长前缀）
  const currentNavValue = useMemo(() => {
    const path = location.pathname;
    // 精确匹配 "/" 防止所有路由都匹配到首页
    const matched = bottomNavItems
      .filter((item) =>
        item.path === "/" ? path === "/" : path.startsWith(item.path),
      )
      .sort((a, b) => b.path.length - a.path.length)[0];
    return matched?.path ?? "/";
  }, [location.pathname]);

  if (!themeReady) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: mode === "light" ? "#fff" : "#181a1b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  return (
    <XBoardSessionProvider>
      <XBoardUserInfoProvider>
        <XBoardNoticeWatcher />
        <GeoDataUpdater />
        <SWRConfig
          value={{
            errorRetryCount: 3,
            errorRetryInterval: 5000,
            onError: (error, key) => {
              if (key !== "getAutotemProxy") {
                console.error(`SWR Error for ${key}:`, error);
                return;
              }
              const silentKeys = [
                "getVersion",
                "getClashConfig",
                "getAutotemProxy",
              ];
              if (silentKeys.includes(key)) return;
              console.error(`[SWR Error] Key: ${key}, Error:`, error);
            },
            dedupingInterval: 2000,
          }}
        >
          <ThemeProvider theme={theme}>
            <NoticeManager position={verge?.notice_position} />
            <Paper
              square
              elevation={0}
              className={`${OS} layout`}
              sx={[
                ({ palette }) => ({ bgcolor: palette.background.paper }),
                OS === "linux"
                  ? { borderRadius: "8px", width: "100vw", height: "100vh" }
                  : {},
              ]}
            >
              {/* 自定义标题栏（仅 Win/Linux） */}
              {customTitlebar}

              {/* 主内容区 */}
              <div className="layout-content">
                <BaseErrorBoundary>
                  <ProtectedOutlet />
                </BaseErrorBoundary>
              </div>

              {/* 底部导航栏 */}
              <Box
                component="nav"
                sx={{
                  position: "relative",
                  zIndex: 10,
                  borderTop: ({ palette }) => `1px solid ${palette.divider}`,
                  bgcolor: "background.paper",
                }}
              >
                <BottomNavigation
                  value={currentNavValue}
                  onChange={(_, newValue) => navigate(newValue)}
                  showLabels
                  sx={{
                    height: BOTTOM_NAV_HEIGHT,
                    bgcolor: "transparent",
                    "& .MuiBottomNavigationAction-root": {
                      minWidth: 0,
                      padding: "6px 0 8px",
                      fontSize: "12px",
                      color: "text.secondary",
                      "&.Mui-selected": {
                        color: "primary.main",
                        fontSize: "12px",
                      },
                    },
                    "& .MuiBottomNavigationAction-label": {
                      fontSize: "11px",
                      fontWeight: 500,
                      "&.Mui-selected": { fontSize: "11px" },
                    },
                  }}
                >
                  {bottomNavItems.map((item) => (
                    <BottomNavigationAction
                      key={item.path}
                      label={t(item.label)}
                      value={item.path}
                      icon={item.icon}
                    />
                  ))}
                </BottomNavigation>
              </Box>
            </Paper>
          </ThemeProvider>
        </SWRConfig>
      </XBoardUserInfoProvider>
    </XBoardSessionProvider>
  );
};

export default Layout;
