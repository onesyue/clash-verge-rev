/**
 * 账户页面
 *
 * - 未登录：显示 LoginForm（登录/注册/找回密码）
 * - 已登录：显示 UserDashboard（账户信息 / 流量 / 钱包 / 邀请）
 */

import { useTranslation } from "react-i18next";

import { BasePage } from "@/components/base";
import { LoginForm } from "@/components/xboard/login-form";
import { UserDashboard } from "@/components/xboard/user-dashboard";
import { useSetXBoardSession, useXBoardSession } from "@/services/xboard/store";
import type { XBoardSession } from "@/services/xboard/types";

const AccountPage = () => {
  const { t } = useTranslation();
  const session = useXBoardSession();
  const setSession = useSetXBoardSession();

  const handleLoginSuccess = (newSession: XBoardSession) => {
    setSession(newSession);
  };

  return (
    <BasePage
      title={session ? undefined : t("account.page.title")}
      contentStyle={session ? { padding: "12px 16px" } : undefined}
    >
      {session ? (
        <UserDashboard />
      ) : (
        <LoginForm onSuccess={handleLoginSuccess} />
      )}
    </BasePage>
  );
};

export default AccountPage;
