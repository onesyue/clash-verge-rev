import {
  alpha,
  Box,
  ButtonBase,
  Paper,
  ThemeProvider,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { Suspense, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { SWRConfig } from "swr";

import { BaseErrorBoundary } from "@/components/base";
import { NoticeManager } from "@/components/layout/notice-manager";
import { OnboardingOverlay } from "@/components/layout/onboarding-overlay";
import { WindowControls } from "@/components/layout/window-controller";
import { GeoDataUpdater } from "@/components/xboard/geodata-updater";
import { XBoardNoticeWatcher } from "@/components/xboard/notice-watcher";
import { useI18n } from "@/hooks/use-i18n";
import { useVerge } from "@/hooks/use-verge";
import { useWindowDecorations } from "@/hooks/use-window";
import { useThemeMode } from "@/services/states";
import { useXBoardSession } from "@/services/xboard/store";
import getSystem from "@/utils/get-system";

import {
  useAppInitialization,
  useCustomTheme,
  useLayoutEvents,
  useLoadingOverlay,
} from "./_layout/hooks";
import { handleNoticeMessage } from "./_layout/utils";
import { sidebarNavItems, sidebarBottomItems } from "./_routers";

import "dayjs/locale/ru";
import "dayjs/locale/zh-cn";

/**
 * When true, XBoard login is required to access the app.
 * Set to false to use the app without XBoard authentication.
 */
export const xboardAuthRequired = true;

export const portableFlag = false;

// Protected Outlet: redirect to account if not logged in (when xboardAuthRequired)
function ProtectedOutlet() {
  const session = useXBoardSession();
  const location = useLocation();

  if (xboardAuthRequired && !session && location.pathname !== "/account") {
    return <Navigate to="/account" replace />;
  }
  return (
    <Suspense fallback={null}>
      <Outlet />
    </Suspense>
  );
}

const OS = getSystem();

// Sidebar nav item component
function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={({ palette }) => ({
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 12px",
        borderRadius: "12px",
        textAlign: "left",
        justifyContent: "flex-start",
        transition: "all 0.15s ease",
        color: active ? palette.primary.main : palette.text.secondary,
        bgcolor: active ? alpha(palette.primary.main, 0.12) : "transparent",
        ...(active && {
          boxShadow: `0 0 12px ${alpha(palette.primary.main, 0.2)}`,
        }),
        "&:hover": {
          bgcolor: active
            ? alpha(palette.primary.main, 0.16)
            : alpha(palette.text.secondary, 0.08),
        },
        "& .MuiSvgIcon-root": {
          fontSize: 20,
        },
      })}
    >
      {icon}
      <Typography
        variant="body2"
        sx={{
          fontWeight: active ? 600 : 400,
          fontSize: "13px",
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    </ButtonBase>
  );
}

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
        console.error("[Notice] Failed:", error);
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

  // Current active nav path
  const currentNavPath = useMemo(() => {
    const path = location.pathname;
    const allItems = [...sidebarNavItems, ...sidebarBottomItems];
    const matched = allItems
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
          background: mode === "light" ? "#F1F5F9" : "#0F172A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  return (
    <>
      <XBoardNoticeWatcher />
      <GeoDataUpdater />
      <SWRConfig
        value={{
          errorRetryCount: 3,
          errorRetryInterval: 5000,
          onError: (error, key) => {
            // Silent keys: expected to fail sometimes during startup
            const silentKeys = [
              "getVersion",
              "getClashConfig",
              "getProxies",
              "getSystemState",
              "getRules",
              "getAutotemProxy",
            ];
            if (silentKeys.includes(key)) return;

            // XBoard auth errors are handled by handleAuthExpired in api.ts
            if (
              error &&
              typeof error === "object" &&
              "code" in error &&
              error.code === "AUTH_EXPIRED"
            ) {
              return;
            }

            console.error(`[SWR Error] Key: ${key}, Error:`, error);
          },
          dedupingInterval: 2000,
        }}
      >
        <ThemeProvider theme={theme}>
          <NoticeManager position={verge?.notice_position} />
          <OnboardingOverlay />
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
            {/* Custom titlebar (Win/Linux) */}
            {customTitlebar}

            {/* Sidebar + Content */}
            <div className="layout-body">
              {/* Sidebar */}
              <Box
                className="layout-sidebar"
                sx={({ palette }) => ({
                  bgcolor:
                    palette.mode === "dark"
                      ? "rgba(15, 23, 42, 0.8)"
                      : "rgba(255, 255, 255, 0.8)",
                })}
              >
                {/* Brand */}
                <div className="sidebar-brand" data-tauri-drag-region="true">
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "white",
                        fontSize: "14px",
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      悦
                    </Typography>
                  </Box>
                  <Typography
                    className="brand-name"
                    sx={({ palette }) => ({
                      color: palette.text.primary,
                      background:
                        palette.mode === "dark"
                          ? "linear-gradient(135deg, #6366F1, #8B5CF6)"
                          : "none",
                      WebkitBackgroundClip:
                        palette.mode === "dark" ? "text" : "unset",
                      WebkitTextFillColor:
                        palette.mode === "dark" ? "transparent" : "inherit",
                    })}
                  >
                    悦通
                  </Typography>
                </div>

                {/* Main nav items */}
                <nav className="sidebar-nav">
                  {sidebarNavItems.map((item) => (
                    <SidebarItem
                      key={item.path}
                      icon={item.icon}
                      label={t(item.label)}
                      active={currentNavPath === item.path}
                      onClick={() => navigate(item.path)}
                    />
                  ))}

                  {/* Spacer */}
                  <Box sx={{ flex: 1 }} />

                  {/* Bottom nav items */}
                  {sidebarBottomItems.map((item) => (
                    <SidebarItem
                      key={item.path}
                      icon={item.icon}
                      label={t(item.label)}
                      active={currentNavPath === item.path}
                      onClick={() => navigate(item.path)}
                    />
                  ))}
                </nav>
              </Box>

              {/* Main content */}
              <div className="layout-content">
                <BaseErrorBoundary resetKeys={[location.pathname]}>
                  <ProtectedOutlet />
                </BaseErrorBoundary>
              </div>
            </div>
          </Paper>
        </ThemeProvider>
      </SWRConfig>
    </>
  );
};

export default Layout;
