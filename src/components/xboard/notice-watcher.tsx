/**
 * XBoard 公告监听器
 *
 * 在后台静默拉取公告，若有未读则通过 toast info 提示用户。
 * 该组件不渲染任何 UI，只需挂载在 Layout 内即可。
 */

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useXBoardNotices } from "@/hooks/use-xboard-notices";
import { showNotice } from "@/services/notice-service";
import { useXBoardSession } from "@/services/xboard/store";

export function XBoardNoticeWatcher() {
  const { t } = useTranslation();
  const session = useXBoardSession();
  const { unreadCount } = useXBoardNotices();
  const notifiedRef = useRef(false);

  useEffect(() => {
    // 仅在登录后且未通知过的情况下提示一次
    if (!session || notifiedRef.current) return;
    if (unreadCount > 0) {
      notifiedRef.current = true;
      showNotice.info(t("account.notices.newNoticeHint", { count: unreadCount }));
    }
  }, [session, unreadCount, t]);

  // session 变化（登出后重新登录）时重置通知状态
  useEffect(() => {
    notifiedRef.current = false;
  }, [session?.authData]);

  return null;
}
