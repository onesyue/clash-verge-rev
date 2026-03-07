/**
 * 获取 XBoard 用户信息的 SWR hook
 *
 * - 只有在已登录（session 不为 null）时才发起请求
 * - 5 分钟自动刷新一次，与 Android 版轮询策略对齐
 */

import useSWR from "swr";

import { SWR_DEFAULTS } from "@/services/config";
import { getInviteInfo, getUserInfo } from "@/services/xboard/api";
import { useXBoardSession } from "@/services/xboard/store";
import type { InviteInfo, UserInfo } from "@/services/xboard/types";

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 min

export function useXBoardUserInfo() {
  const session = useXBoardSession();

  const {
    data: userInfo,
    error: userInfoError,
    isLoading: userInfoLoading,
    mutate: refreshUserInfo,
  } = useSWR<UserInfo | null>(
    session ? ["xboard-user-info", session.baseUrl, session.authData] : null,
    () => getUserInfo(session!.baseUrl, session!.authData),
    {
      ...SWR_DEFAULTS,
      refreshInterval: REFRESH_INTERVAL,
      onError: (err) => {
        console.error("[XBoard] getUserInfo failed:", err);
      },
    },
  );

  const {
    data: inviteInfo,
    error: inviteInfoError,
    isLoading: inviteInfoLoading,
    mutate: refreshInviteInfo,
  } = useSWR<InviteInfo | null>(
    session ? ["xboard-invite-info", session.baseUrl, session.authData] : null,
    () => getInviteInfo(session!.baseUrl, session!.authData),
    {
      ...SWR_DEFAULTS,
      refreshInterval: REFRESH_INTERVAL,
    },
  );

  const refresh = async () => {
    await Promise.all([refreshUserInfo(), refreshInviteInfo()]);
  };

  return {
    userInfo: userInfo ?? null,
    inviteInfo: inviteInfo ?? null,
    loading: userInfoLoading || inviteInfoLoading,
    error: userInfoError || inviteInfoError || null,
    refresh,
  };
}
