/**
 * XBoard 订阅同步
 *
 * 职责：
 *  1. 检查是否已有匹配该订阅 URL 的 Profile
 *  2. 没有则通过 importProfile 导入，并开启自动更新（24h）
 *  3. 已有则直接激活（跳过重新下载，避免 1-2 分钟等待）
 *  4. 返回关联的 profile uid（持久化到 localStorage 供后续刷新用）
 *
 * 为什么不用 uid 而用 URL 查找？
 *  因为换设备或重装后 uid 会变，但 subscribeUrl 是稳定的。
 */

import { mutate } from "swr";

import {
  getProfiles,
  importProfile,
  patchProfile,
  patchProfilesConfig,
  patchVergeConfig,
  updateProfile,
} from "@/services/cmds";
import { XBoardError, XBoardErrorCode } from "@/services/xboard/errors";

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

// ── helpers ───────────────────────────────────────────────────────────────────

/**
 * 激活指定 uid 的 Profile 为当前配置，带一次重试。
 * patchProfilesConfig 在并发切换时会返回 false（不抛出），重试一次兜底。
 */
async function activateProfile(uid: string): Promise<boolean> {
  let ok = await patchProfilesConfig({ current: uid });
  if (!ok) {
    // 并发切换保护释放后重试
    await new Promise((r) => setTimeout(r, 800));
    ok = await patchProfilesConfig({ current: uid });
  }
  return ok;
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
/**
 * 确保订阅 URL 包含 flag=meta 参数，强制 XBoard 返回 Clash Meta (mihomo) YAML 格式。
 *
 * 为什么用 meta 而不是 clash？
 *  - flag=clash → XBoard 只转换原版 Clash 支持的协议 (ss/vmess/trojan)
 *  - flag=meta  → XBoard 会输出 Clash Meta 支持的所有协议 (含 hysteria2/vless/tuic 等)
 *  - mihomo 就是 Clash Meta，所以必须用 flag=meta 才能拿到完整节点列表
 */
function ensureMetaFlag(url: string): string {
  try {
    const u = new URL(url);
    // 移除旧的 flag=clash，统一用 flag=meta
    u.searchParams.set("flag", "meta");
    return u.toString();
  } catch {
    // URL 解析失败，直接拼接
    const base = url.replace(/([?&])flag=[^&]*/g, "");
    const cleaned = base.replace(/\?$/, "");
    return cleaned + (cleaned.includes("?") ? "&" : "?") + "flag=meta";
  }
}

export async function syncXBoardSubscription(
  subscribeUrl: string,
  activate = true,
): Promise<SyncResult> {
  if (!subscribeUrl?.trim()) {
    throw new XBoardError(
      "订阅链接为空，请重新登录以获取订阅地址",
      XBoardErrorCode.SUBSCRIBE_URL_EMPTY,
    );
  }

  // 强制 Clash Meta (mihomo) YAML 格式
  const metaUrl = ensureMetaFlag(subscribeUrl);

  // 1. 检查是否已有匹配的 Profile（用原始 URL 或任何 flag 变体匹配）
  const profiles = await getProfiles();
  const baseUrl = subscribeUrl.replace(/([?&])flag=[^&]*/g, "");
  const existing = profiles.items?.find(
    (p) =>
      p.uid &&
      (p.url === subscribeUrl ||
        p.url === metaUrl ||
        p.url?.replace(/([?&])flag=[^&]*/g, "") === baseUrl),
  );

  let uid: string;
  let isNew: boolean;

  if (existing?.uid) {
    // 2a. 已有 → 确保 URL 带 flag=meta，然后强制重新下载
    uid = existing.uid;
    isNew = false;

    // 更新 URL 为 flag=meta（旧的可能是 flag=clash 或无 flag）
    if (existing.url !== metaUrl) {
      await patchProfile(uid, { url: metaUrl });
    }

    // 强制重新下载内容（旧内容可能是 base64 或用 flag=clash 下载的空 proxies）
    await updateProfile(uid, {
      ...existing.option,
      with_proxy: false,
    });
  } else {
    // 2b. 没有 → 导入，并开启每 24h 自动更新
    // with_proxy: false — 订阅 URL 是直连 HTTPS，不需要也不能走代理
    await importProfile(metaUrl, {
      with_proxy: false,
      allow_auto_update: true,
      update_interval: AUTO_UPDATE_INTERVAL_MINUTES,
    });

    // 导入后重新获取列表，找到刚创建的 item（URL 匹配）
    const updated = await getProfiles();
    const newItem = updated.items?.find(
      (p) => p.url === metaUrl || p.url === subscribeUrl,
    );
    if (!newItem?.uid) {
      throw new XBoardError(
        "导入订阅成功但找不到对应的 Profile，请刷新订阅页面",
        XBoardErrorCode.PROFILE_IMPORT_FAILED,
      );
    }
    uid = newItem.uid;
    isNew = true;
  }

  // 3. 持久化 uid
  saveProfileUid(uid);

  // 4. 可选：激活该 Profile（带重试：并发切换时 patchProfilesConfig 返回 false）
  if (activate) {
    const activated = await activateProfile(uid);
    if (!activated) {
      throw new XBoardError(
        "配置激活失败，请手动在订阅页面点击该配置以选中",
        XBoardErrorCode.ACTIVATE_FAILED,
      );
    }
    // 5. 仅首次导入时自动开启系统代理，避免每次同步都强制覆盖用户设置
    if (isNew) {
      await patchVergeConfig({ enable_system_proxy: true }).catch(() => {
        /* 开启系统代理失败不影响订阅同步 */
      });
    }
  }

  // 6. 通知 SWR 刷新 Profiles + 代理数据
  await mutate("getProfiles");
  await mutate("getProxies");
  await mutate("getClashConfig");

  return { uid, isNew };
}

/**
 * 刷新已绑定的 XBoard Profile 并确保它是当前激活配置。
 * 用于仪表盘"立即同步"按钮。
 */
export async function refreshXBoardProfile(): Promise<void> {
  const uid = loadProfileUid();
  if (!uid) {
    throw new XBoardError(
      "未找到绑定的订阅，请重新登录",
      XBoardErrorCode.PROFILE_NOT_FOUND,
    );
  }

  const profiles = await getProfiles();
  const item = profiles.items?.find((p) => p.uid === uid);
  if (!item) {
    throw new XBoardError(
      "绑定的订阅已被删除，请重新登录",
      XBoardErrorCode.PROFILE_DELETED,
    );
  }

  // 刷新订阅内容（with_proxy: false — 直连，不走代理）
  await updateProfile(uid, { ...item.option, with_proxy: false });

  // 确保该 Profile 是当前激活的配置（若之前被取消选中，则重新选中）
  if (profiles.current !== uid) {
    const activated = await activateProfile(uid);
    if (!activated) {
      throw new XBoardError(
        "订阅内容已更新，但配置激活失败，请手动在订阅页面点击选中",
        XBoardErrorCode.ACTIVATE_FAILED,
      );
    }
  }

  await mutate("getProfiles");
  await mutate("getProxies");
  await mutate("getClashConfig");
}
