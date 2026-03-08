import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import CellTowerRounded from "@mui/icons-material/CellTowerRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ListAltRounded from "@mui/icons-material/ListAltRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ShoppingCartRounded from "@mui/icons-material/ShoppingCartRounded";
import StorageRounded from "@mui/icons-material/StorageRounded";
import SwapHorizRounded from "@mui/icons-material/SwapHorizRounded";
import TextSnippetRounded from "@mui/icons-material/TextSnippetRounded";
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

// Sidebar navigation items — main section
export const sidebarNavItems = [
  {
    label: "layout.components.navigation.tabs.home",
    path: "/",
    icon: <HomeRoundedIcon />,
  },
  {
    label: "layout.components.navigation.tabs.proxies",
    path: "/proxies",
    icon: <CellTowerRounded />,
  },
  {
    label: "layout.components.navigation.tabs.profiles",
    path: "/profile",
    icon: <StorageRounded />,
  },
  {
    label: "layout.components.navigation.tabs.connections",
    path: "/connections",
    icon: <SwapHorizRounded />,
  },
  {
    label: "layout.components.navigation.tabs.rules",
    path: "/rules",
    icon: <ListAltRounded />,
  },
  {
    label: "layout.components.navigation.tabs.logs",
    path: "/logs",
    icon: <TextSnippetRounded />,
  },
];

// Sidebar bottom items
export const sidebarBottomItems = [
  {
    label: "layout.components.navigation.tabs.shop",
    path: "/shop",
    icon: <ShoppingCartRounded />,
  },
  {
    label: "layout.components.navigation.tabs.account",
    path: "/account",
    icon: <AccountCircleRoundedIcon />,
  },
  {
    label: "layout.components.navigation.tabs.settings",
    path: "/settings",
    icon: <SettingsRoundedIcon />,
  },
];

// navItems — for settings "start page" dropdown (with i18n label key)
export const navItems = [
  { label: "layout.components.navigation.tabs.home", path: "/" },
  { label: "layout.components.navigation.tabs.proxies", path: "/proxies" },
  { label: "layout.components.navigation.tabs.profiles", path: "/profile" },
  {
    label: "layout.components.navigation.tabs.connections",
    path: "/connections",
  },
  { label: "layout.components.navigation.tabs.rules", path: "/rules" },
  { label: "layout.components.navigation.tabs.logs", path: "/logs" },
  { label: "layout.components.navigation.tabs.shop", path: "/shop" },
  { label: "layout.components.navigation.tabs.account", path: "/account" },
  { label: "layout.components.navigation.tabs.settings", path: "/settings" },
];

// All routes
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
