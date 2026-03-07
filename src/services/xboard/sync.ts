/**
 * XBoard 订阅同步
 *
 * 职责：
 *  1. 检查是否已有匹配该订阅 URL 的 Profile
 *  2. 没有则通过 importProfile 导入，并开启自动更新（24h）
 *  3. 已有则调用 updateProfile 立即刷新
 *  4. 返回关联的 profile uid（持久化到 localStorage 供后续刷新用）
 *
 * 为什么不用 uid 而用 URL 查找？
 *  因为换设备或重装后 uid 会变，但 subscribeUrl 是稳定的。
 */

import { mutate } from "swr";

import {
  getProfiles,
  importProfile,
  patchProfilesConfig,
  updateProfile,
} from "@/services/cmds";

// ── 常量 ──────────────────────────────────────────────────────────────────────

const PROFILE_UID_KEY = "xboard_profile_uid";
const AUTO_UPDATE_INTERVAL_MINUTES = 1440; // 24 小时

// ── localStorage helpers ─────────────────────────────────────────────────────

export function loadProfileUid(): string | null {
  return localStorage.getItem(PROFILE_UID_KEY);
}

export function saveProfileUid(uid: string): void {
  localStorage.setItem(PROFILE_UID_KEY, uid);
}

export function clearProfileUid(): void {
  localStorage.removeItem(PROFILE_UID_KEY);
}

// ── 核心同步逻辑 ──────────────────────────────────────────────────────────────

export interface SyncResult {
  uid: string;
  /** true = 新导入；false = 已存在并刷新 */
  isNew: boolean;
}

/**
 * 同步 XBoard 订阅到 Profiles
 *
 * @param subscribeUrl  从 XBoard 获取的订阅链接
 * @param activate      是否将该 Profile 设为当前激活的配置（默认 true）
 */
export async function syncXBoardSubscription(
  subscribeUrl: string,
  activate = true,
): Promise<SyncResult> {
  if (!subscribeUrl?.trim()) {
    throw new Error("订阅链接为空，请重新登录以获取订阅地址");
  }

  // 1. 检查是否已有匹配的 Profile
  const profiles = await getProfiles();
  const existing = profiles.items?.find((p) => p.url === subscribeUrl && p.uid);

  let uid: string;
  let isNew: boolean;

  if (existing?.uid) {
    // 2a. 已有 → 立即刷新（不走代理，订阅 URL 直连即可）
    uid = existing.uid;
    isNew = false;
    await updateProfile(uid, { ...existing.option, with_proxy: false });
  } else {
    // 2b. 没有 → 导入，并开启每 24h 自动更新
    // with_proxy: false — 订阅 URL 是直连 HTTPS，不需要也不能走代理
    // （初次登录时没有激活的 Profile，走代理会直接失败）
    await importProfile(subscribeUrl, {
      with_proxy: false,
      allow_auto_update: true,
      update_interval: AUTO_UPDATE_INTERVAL_MINUTES,
    });

    // 导入后重新获取列表，找到刚创建的 item（URL 匹配）
    const updated = await getProfiles();
    const newItem = updated.items?.find((p) => p.url === subscribeUrl);
    if (!newItem?.uid) {
      throw new Error("导入订阅成功但找不到对应的 Profile，请刷新订阅页面");
    }
    uid = newItem.uid;
    isNew = true;
  }

  // 3. 持久化 uid
  saveProfileUid(uid);

  // 4. 可选：激活该 Profile
  if (activate) {
    await patchProfilesConfig({ current: uid });
  }

  // 5. 通知 SWR 刷新 Profiles
  await mutate("getProfiles");

  return { uid, isNew };
}

/**
 * 仅刷新已绑定的 XBoard Profile（不激活，不导入）
 * 用于仪表盘"立即同步"按钮
 */
export async function refreshXBoardProfile(): Promise<void> {
  const uid = loadProfileUid();
  if (!uid) {
    throw new Error("未找到绑定的订阅，请重新登录");
  }

  const profiles = await getProfiles();
  const item = profiles.items?.find((p) => p.uid === uid);
  if (!item) {
    throw new Error("绑定的订阅已被删除，请重新登录");
  }

  // with_proxy: false — 订阅 URL 直连，不走代理
  await updateProfile(uid, { ...item.option, with_proxy: false });
  await mutate("getProfiles");
}
