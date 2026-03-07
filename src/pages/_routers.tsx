import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import { createBrowserRouter, RouteObject } from "react-router";

import Layout from "./_layout";
import AccountPage from "./account";
import ConnectionsPage from "./connections";
import HomePage from "./home";
import LogsPage from "./logs";
import NoticesPage from "./notices";
import OrdersPage from "./orders";
import ProfilesPage from "./profiles";
import ProxiesPage from "./proxies";
import RulesPage from "./rules";
import SettingsPage from "./settings";
import ShopPage from "./shop";
import UnlockPage from "./unlock";

// 底部导航栏 — 仅显示 3 个主要入口
// label 使用 i18n key，由 Layout 组件调用 t() 翻译
export const bottomNavItems = [
  {
    label: "layout.components.navigation.tabs.home",
    path: "/",
    icon: <HomeRoundedIcon />,
  },
  {
    label: "layout.components.navigation.tabs.shop",
    path: "/shop",
    icon: <ShoppingCartRoundedIcon />,
  },
  {
    label: "layout.components.navigation.tabs.account",
    path: "/account",
    icon: <AccountCircleRoundedIcon />,
  },
];

// navItems — 供设置页"启动页"下拉选用（带 i18n label key）
export const navItems = [
  { label: "layout.components.navigation.tabs.home", path: "/" },
  { label: "layout.components.navigation.tabs.shop", path: "/shop" },
  { label: "layout.components.navigation.tabs.account", path: "/account" },
  { label: "layout.components.navigation.tabs.proxies", path: "/proxies" },
  { label: "layout.components.navigation.tabs.profiles", path: "/profile" },
  {
    label: "layout.components.navigation.tabs.connections",
    path: "/connections",
  },
  { label: "layout.components.navigation.tabs.rules", path: "/rules" },
  { label: "layout.components.navigation.tabs.logs", path: "/logs" },
  { label: "layout.components.navigation.tabs.settings", path: "/settings" },
];

// 全部路由注册（含内部跳转页，不在底部导航显示）
const allRoutes: RouteObject[] = [
  { path: "/", Component: HomePage },
  { path: "/shop", Component: ShopPage },
  { path: "/account", Component: AccountPage },
  { path: "/proxies", Component: ProxiesPage },
  { path: "/profile", Component: ProfilesPage },
  { path: "/connections", Component: ConnectionsPage },
  { path: "/rules", Component: RulesPage },
  { path: "/logs", Component: LogsPage },
  { path: "/unlock", Component: UnlockPage },
  { path: "/orders", Component: OrdersPage },
  { path: "/notices", Component: NoticesPage },
  { path: "/settings", Component: SettingsPage },
];

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: allRoutes,
  },
]);
