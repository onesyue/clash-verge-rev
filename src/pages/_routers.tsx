import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import AnnouncementRoundedIcon from "@mui/icons-material/AnnouncementRounded";
import DnsRoundedIcon from "@mui/icons-material/DnsRounded";
import ForkRightRoundedIcon from "@mui/icons-material/ForkRightRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import SubjectRoundedIcon from "@mui/icons-material/SubjectRounded";
import WifiRoundedIcon from "@mui/icons-material/WifiRounded";
import { createBrowserRouter, RouteObject } from "react-router";

import ConnectionsSvg from "@/assets/image/itemicon/connections.svg?react";
import HomeSvg from "@/assets/image/itemicon/home.svg?react";
import LogsSvg from "@/assets/image/itemicon/logs.svg?react";
import ProfilesSvg from "@/assets/image/itemicon/profiles.svg?react";
import ProxiesSvg from "@/assets/image/itemicon/proxies.svg?react";
import RulesSvg from "@/assets/image/itemicon/rules.svg?react";
import SettingsSvg from "@/assets/image/itemicon/settings.svg?react";
import UnlockSvg from "@/assets/image/itemicon/unlock.svg?react";

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

export const navItems = [
  {
    label: "layout.components.navigation.tabs.home",
    path: "/",
    icon: [<HomeRoundedIcon key="mui" />, <HomeSvg key="svg" />],
    Component: HomePage,
  },
  {
    label: "layout.components.navigation.tabs.proxies",
    path: "/proxies",
    icon: [<WifiRoundedIcon key="mui" />, <ProxiesSvg key="svg" />],
    Component: ProxiesPage,
  },
  {
    label: "layout.components.navigation.tabs.profiles",
    path: "/profile",
    icon: [<DnsRoundedIcon key="mui" />, <ProfilesSvg key="svg" />],
    Component: ProfilesPage,
  },
  {
    label: "layout.components.navigation.tabs.connections",
    path: "/connections",
    icon: [<LanguageRoundedIcon key="mui" />, <ConnectionsSvg key="svg" />],
    Component: ConnectionsPage,
  },
  {
    label: "layout.components.navigation.tabs.rules",
    path: "/rules",
    icon: [<ForkRightRoundedIcon key="mui" />, <RulesSvg key="svg" />],
    Component: RulesPage,
  },
  {
    label: "layout.components.navigation.tabs.logs",
    path: "/logs",
    icon: [<SubjectRoundedIcon key="mui" />, <LogsSvg key="svg" />],
    Component: LogsPage,
  },
  {
    label: "layout.components.navigation.tabs.unlock",
    path: "/unlock",
    icon: [<LockOpenRoundedIcon key="mui" />, <UnlockSvg key="svg" />],
    Component: UnlockPage,
  },
  {
    label: "layout.components.navigation.tabs.account",
    path: "/account",
    icon: [
      <AccountCircleRoundedIcon key="mui" />,
      <AccountCircleRoundedIcon key="svg" />,
    ],
    Component: AccountPage,
  },
  {
    label: "layout.components.navigation.tabs.shop",
    path: "/shop",
    icon: [
      <ShoppingCartRoundedIcon key="mui" />,
      <ShoppingCartRoundedIcon key="svg" />,
    ],
    Component: ShopPage,
  },
  {
    label: "layout.components.navigation.tabs.orders",
    path: "/orders",
    icon: [
      <ReceiptLongRoundedIcon key="mui" />,
      <ReceiptLongRoundedIcon key="svg" />,
    ],
    Component: OrdersPage,
  },
  {
    label: "layout.components.navigation.tabs.notices",
    path: "/notices",
    icon: [
      <AnnouncementRoundedIcon key="mui" />,
      <AnnouncementRoundedIcon key="svg" />,
    ],
    Component: NoticesPage,
  },
  {
    label: "layout.components.navigation.tabs.settings",
    path: "/settings",
    icon: [<SettingsRoundedIcon key="mui" />, <SettingsSvg key="svg" />],
    Component: SettingsPage,
  },
];

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: navItems.map(
      (item) =>
        ({
          path: item.path,
          Component: item.Component,
        }) as RouteObject,
    ),
  },
]);
