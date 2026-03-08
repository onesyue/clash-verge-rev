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

// Helper: react-router lazy() expects { Component }, pages use default export
const lazyPage = (load: () => Promise<{ default: React.ComponentType }>) =>
  load().then((m) => ({ Component: m.default }));

// All routes — using react-router lazy() for code splitting
const allRoutes: RouteObject[] = [
  { path: "/", lazy: () => lazyPage(() => import("./home")) },
  { path: "/shop", lazy: () => lazyPage(() => import("./shop")) },
  { path: "/account", lazy: () => lazyPage(() => import("./account")) },
  { path: "/proxies", lazy: () => lazyPage(() => import("./proxies")) },
  { path: "/profile", lazy: () => lazyPage(() => import("./profiles")) },
  {
    path: "/connections",
    lazy: () => lazyPage(() => import("./connections")),
  },
  { path: "/rules", lazy: () => lazyPage(() => import("./rules")) },
  { path: "/logs", lazy: () => lazyPage(() => import("./logs")) },
  { path: "/unlock", lazy: () => lazyPage(() => import("./unlock")) },
  { path: "/orders", lazy: () => lazyPage(() => import("./orders")) },
  { path: "/notices", lazy: () => lazyPage(() => import("./notices")) },
  { path: "/settings", lazy: () => lazyPage(() => import("./settings")) },
];

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: allRoutes,
  },
]);
