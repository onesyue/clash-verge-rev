/**
 * XBoard API 客户端
 *
 * 接口参考：https://github.com/cedar2025/Xboard
 * 官方服务地址：https://d7ccm19ki90mg.cloudfront.net
 *
 *   认证:  POST /api/v1/passport/auth/{login,register,forget}
 *          POST /api/v1/passport/comm/sendEmailVerify
 *   用户:  GET  /api/v1/user/{info,getSubscribe,invite/fetch}
 *          POST /api/v1/user/{changePassword}
 *   公告:  GET  /api/v1/user/notice/fetch?current=N  （每页 5 条，自动翻页）
 *   订单:  GET/POST /api/v1/user/order/{fetch,save,checkout,cancel,check,getPaymentMethod}
 *   套餐:  GET  /api/v1/guest/plan/fetch（公开，无需 auth）
 *   优惠:  POST /api/v1/user/coupon/check
 */

import { fetch } from "@tauri-apps/plugin-http";

import type {
  AuthResult,
  CheckoutResult,
  CouponInfo,
  InviteInfo,
  Notice,
  Order,
  PaymentMethod,
  Plan,
  UserInfo,
} from "./types";

// ────────────────────────────────────────────────────────────────────────────
// 服务器地址（单一官方服务）
// ────────────────────────────────────────────────────────────────────────────

export const BASE_URL = "https://d7ccm19ki90mg.cloudfront.net";

// ────────────────────────────────────────────────────────────────────────────
// Error
// ────────────────────────────────────────────────────────────────────────────

export class XBoardError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "XBoardError";
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Internal HTTP helpers
// ────────────────────────────────────────────────────────────────────────────

const TIMEOUT_MS = 15_000;

function buildUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

function authHeaders(authData: string): Record<string, string> {
  return {
    authorization: authData,
    Accept: "application/json",
  };
}

async function parseResponse(res: Response): Promise<any> {
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new XBoardError(`响应不是有效的 JSON（${res.status}）`, res.status);
  }
  if (!res.ok) {
    throw new XBoardError(
      json?.message ?? `请求失败（${res.status}）`,
      res.status,
    );
  }
  return json;
}

async function httpGet(path: string, authData: string): Promise<any> {
  const res = await fetch(buildUrl(path), {
    method: "GET",
    headers: authHeaders(authData),
    connectTimeout: TIMEOUT_MS,
  });
  return parseResponse(res);
}

async function httpGetGuest(path: string): Promise<any> {
  const res = await fetch(buildUrl(path), {
    method: "GET",
    headers: { Accept: "application/json" },
    connectTimeout: TIMEOUT_MS,
  });
  return parseResponse(res);
}

async function httpPost(
  path: string,
  body: Record<string, unknown>,
  authData?: string,
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (authData) headers.authorization = authData;

  const res = await fetch(buildUrl(path), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    connectTimeout: TIMEOUT_MS,
  });
  return parseResponse(res);
}

// ────────────────────────────────────────────────────────────────────────────
// Private helpers
// ────────────────────────────────────────────────────────────────────────────

async function fetchAuthData(
  path: string,
  body: Record<string, unknown>,
): Promise<string> {
  const root = await httpPost(path, body);
  const authData: string | undefined = root?.data?.auth_data;
  if (!authData) throw new XBoardError("服务器未返回 auth_data");
  return authData;
}

async function fetchSubscribeUrl(authData: string): Promise<string> {
  const root = await httpGet("/api/v1/user/getSubscribe", authData);
  const url: string | undefined = root?.data?.subscribe_url?.trim();
  if (!url) throw new XBoardError("服务器未返回订阅地址，请联系管理员");
  return url;
}

// ────────────────────────────────────────────────────────────────────────────
// 认证
// ────────────────────────────────────────────────────────────────────────────

/** 邮箱 + 密码登录 */
export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  const authData = await fetchAuthData("/api/v1/passport/auth/login", {
    email,
    password,
  });
  const subscribeUrl = await fetchSubscribeUrl(authData);
  return { subscribeUrl, authData };
}

/** 注册新账号 */
export async function register(
  email: string,
  password: string,
  inviteCode?: string,
  emailCode?: string,
): Promise<AuthResult> {
  const body: Record<string, string> = { email, password };
  if (inviteCode?.trim()) body.invite_code = inviteCode.trim();
  if (emailCode?.trim()) body.email_code = emailCode.trim();

  const authData = await fetchAuthData("/api/v1/passport/auth/register", body);
  const subscribeUrl = await fetchSubscribeUrl(authData);
  return { subscribeUrl, authData };
}

/**
 * 发送邮件验证码（注册或找回密码前调用）
 *
 * 对应 POST /api/v1/passport/comm/sendEmailVerify
 * 服务端有 60 秒发送频率限制。
 */
export async function sendEmailVerify(email: string): Promise<void> {
  await httpPost("/api/v1/passport/comm/sendEmailVerify", { email });
}

/**
 * 重置密码（找回密码第二步）
 *
 * 对应 POST /api/v1/passport/auth/forget
 * 需先调用 sendEmailVerify 获取 6 位验证码。
 */
export async function forgotPassword(
  email: string,
  emailCode: string,
  password: string,
): Promise<void> {
  await httpPost("/api/v1/passport/auth/forget", {
    email,
    email_code: emailCode,
    password,
  });
}

/** 修改密码 */
export async function changePassword(
  authData: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await httpPost(
    "/api/v1/user/changePassword",
    { old_password: oldPassword, new_password: newPassword },
    authData,
  );
}

/**
 * WebView 登录后，直接用页面存储的 auth_data 同步订阅
 */
export async function syncFromSession(authData: string): Promise<AuthResult> {
  const subscribeUrl = await fetchSubscribeUrl(authData);
  return { subscribeUrl, authData };
}

/** 退出登录（仅本地清除，服务端无对应接口） */
export async function logout(_authData: string): Promise<void> {
  // XBoard 没有 /user/logout 端点，session 清除由调用方在本地完成
}

// ────────────────────────────────────────────────────────────────────────────
// 用户信息
// ────────────────────────────────────────────────────────────────────────────

/**
 * 获取用户信息
 *
 * 流量数据唯一来源：/api/v1/user/getSubscribe（u、d、transfer_enable，单位字节）
 * 余额 / uuid：/api/v1/user/info（可选，失败不影响流量显示）
 *
 * 根据 cedar2025/Xboard 源码确认：
 *   - /api/v1/user/info 不含 u/d 字段
 *   - /api/v1/user/getSubscribe 是 u/d/transfer_enable 的唯一来源
 * 若 getSubscribe 失败，整体返回 null（由调用方判断 error 状态）。
 */
export async function getUserInfo(authData: string): Promise<UserInfo | null> {
  try {
    // ── 主调用：getSubscribe 必须成功，否则无法获取流量 ──────────────────────
    const subRoot = await httpGet("/api/v1/user/getSubscribe", authData);
    const sub = subRoot?.data;
    if (!sub) return null;

    // ── 可选调用：info 仅补充 balance / commission_balance / uuid ────────────
    let info: any = null;
    try {
      const infoRoot = await httpGet("/api/v1/user/info", authData);
      info = infoRoot?.data ?? null;
    } catch {
      // 失败不影响流量数据，降级处理
    }

    return {
      email: sub.email || info?.email || "",
      balance: info?.balance ?? 0,
      commissionBalance: info?.commission_balance ?? 0,
      expiredAt:
        sub.expired_at == null || sub.expired_at === 0
          ? null
          : Number(sub.expired_at),
      // u / d / transfer_enable 来自 getSubscribe，单位字节
      transferEnable: sub.transfer_enable ?? 0,
      usedDownload: sub.d ?? 0,
      usedUpload: sub.u ?? 0,
      uuid: info?.uuid || sub.uuid || "",
      planName: sub.plan?.name?.trim() || null,
    };
  } catch {
    return null;
  }
}

/** 获取邀请信息 */
export async function getInviteInfo(
  authData: string,
): Promise<InviteInfo | null> {
  try {
    // 正确路径：/api/v1/user/invite/fetch（非 /invite）
    const root = await httpGet("/api/v1/user/invite/fetch", authData);
    const data = root?.data;
    if (!data) return null;

    const codes: any[] = data.codes ?? [];
    const code: string = codes[0]?.code ?? "";
    const inviteUrl = code ? `${BASE_URL}/#/register?code=${code}` : "";
    const stat: number[] = data.stat ?? [];
    return { inviteUrl, referralCount: stat[0] ?? 0 };
  } catch {
    return null;
  }
}

/**
 * 获取公告列表（自动翻页，获取全部）
 *
 * XBoard 每页固定返回 5 条，通过 current 参数翻页。
 * 响应结构：{ data: [...], total: N }（非 success 包装）
 */
export async function getNotices(authData: string): Promise<Notice[]> {
  try {
    const all: any[] = [];
    let current = 1;
    while (true) {
      const root = await httpGet(
        `/api/v1/user/notice/fetch?current=${current}`,
        authData,
      );
      const page: any[] = root?.data ?? [];
      const total: number = root?.total ?? 0;
      all.push(...page);
      if (all.length >= total || page.length === 0) break;
      current++;
    }
    return all.map((item) => ({
      id: item.id ?? 0,
      title: item.title ?? "",
      content: item.content ?? "",
      createdAt: item.created_at ?? 0,
    }));
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 套餐
// ────────────────────────────────────────────────────────────────────────────

/** 获取套餐列表（公开接口，无需认证） */
export async function getPlans(): Promise<Plan[]> {
  try {
    const root = await httpGetGuest("/api/v1/guest/plan/fetch");
    const arr: any[] = root?.data ?? [];
    return arr.map((item) => {
      const transferBytes: number = item.transfer_enable ?? 0;
      return {
        id: item.id ?? 0,
        name: item.name ?? "",
        content: item.content ?? "",
        transferGb:
          transferBytes > 0
            ? Math.round(transferBytes / (1024 * 1024 * 1024))
            : 0,
        monthPrice: item.month_price ?? null,
        quarterPrice: item.quarter_price ?? null,
        halfYearPrice: item.half_year_price ?? null,
        yearPrice: item.year_price ?? null,
        onetimePrice: item.onetime_price ?? null,
      };
    });
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 优惠码
// ────────────────────────────────────────────────────────────────────────────

/**
 * 验证优惠码
 *
 * 对应 POST /api/v1/user/coupon/check
 * 返回优惠信息（名称、折扣类型、折扣值），验证失败时抛出 XBoardError。
 */
export async function checkCoupon(
  authData: string,
  couponCode: string,
  planId?: number,
): Promise<CouponInfo> {
  const body: Record<string, unknown> = { code: couponCode };
  if (planId != null) body.plan_id = planId;
  const root = await httpPost("/api/v1/user/coupon/check", body, authData);
  const data = root?.data;
  if (!data) throw new XBoardError("优惠码无效");
  return {
    code: couponCode,
    name: data.name ?? "",
    /** 1=按金额减免（分），2=按比例折扣（百分比） */
    type: data.type ?? 1,
    value: data.value ?? 0,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 订单
// ────────────────────────────────────────────────────────────────────────────

/** 获取支付方式列表 */
export async function getPaymentMethods(
  authData: string,
): Promise<PaymentMethod[]> {
  try {
    const root = await httpGet("/api/v1/user/order/getPaymentMethod", authData);
    const arr: any[] = root?.data ?? [];
    return arr.map((item) => ({
      id: item.id ?? 0,
      name: item.name ?? "",
      payment: item.payment ?? "",
    }));
  } catch {
    return [];
  }
}

/**
 * 创建订单，返回 trade_no
 *
 * @param couponCode 可选优惠码
 */
export async function createOrder(
  authData: string,
  planId: number,
  period: string,
  couponCode?: string,
): Promise<string> {
  const body: Record<string, unknown> = { plan_id: planId, period };
  if (couponCode?.trim()) body.coupon_code = couponCode.trim();

  const root = await httpPost("/api/v1/user/order/save", body, authData);
  const tradeNo: string | undefined = root?.data;
  if (!tradeNo) throw new XBoardError("创建订单失败：未返回 trade_no");
  return tradeNo;
}

/**
 * 结算订单
 * 返回 CheckoutResult：type=-1 免费成功，type=0 跳转 URL，type=1 HTML 内嵌
 *
 * XBoard OrderController::checkout 使用 response() 直接返回，不经过 success() 包装。
 * 响应结构：{ type: -1|0|1, data: string|true }
 */
export async function checkoutOrder(
  authData: string,
  tradeNo: string,
  methodId: number,
): Promise<CheckoutResult> {
  const root = await httpPost(
    "/api/v1/user/order/checkout",
    { trade_no: tradeNo, method: methodId },
    authData,
  );
  // checkout 直接返回 { type, data }，不经过 success() 包装
  const payload = root;
  const rawType: number = typeof payload?.type === "number" ? payload.type : 0;
  const type = rawType as -1 | 0 | 1;
  const rawData = payload?.data;
  const data =
    typeof rawData === "string"
      ? rawData
      : typeof rawData === "boolean"
        ? ""
        : typeof rawData === "object" && rawData !== null
          ? String(rawData.data ?? "")
          : "";
  return { type, data };
}

/**
 * 查询订单支付状态
 *
 * 对应 GET /api/v1/user/order/check?trade_no=xxx
 * 用于外部支付后轮询确认结果。
 * 返回状态码：0=待支付 1=处理中 2=已取消 3=已完成 4=已折扣
 */
export async function checkOrderStatus(
  authData: string,
  tradeNo: string,
): Promise<Order["status"]> {
  const root = await httpGet(
    `/api/v1/user/order/check?trade_no=${encodeURIComponent(tradeNo)}`,
    authData,
  );
  return (root?.data ?? 0) as Order["status"];
}

/** 取消订单（仅 status=0 待支付订单可取消） */
export async function cancelOrder(
  authData: string,
  tradeNo: string,
): Promise<void> {
  await httpPost("/api/v1/user/order/cancel", { trade_no: tradeNo }, authData);
}

/** 获取订单列表 */
export async function getOrders(authData: string): Promise<Order[]> {
  try {
    const root = await httpGet("/api/v1/user/order/fetch", authData);
    const arr: any[] = root?.data ?? [];
    return arr.map((item) => ({
      tradeNo: item.trade_no ?? "",
      planName: item.plan?.name ?? item.plan_name ?? "",
      period: item.period ?? "",
      totalAmount: item.total_amount ?? 0,
      status: (item.status ?? 0) as Order["status"],
      createdAt: item.created_at ?? 0,
    }));
  } catch {
    return [];
  }
}
