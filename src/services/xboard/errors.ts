/**
 * XBoard 错误码定义
 *
 * 用枚举代替中文字符串匹配，确保错误分支逻辑不依赖语言文本。
 */

export enum XBoardErrorCode {
  // ── 网络 / 通用 ──────────────────────────────────────────────────────
  NETWORK_ERROR = "NETWORK_ERROR",
  INVALID_RESPONSE = "INVALID_RESPONSE",

  // ── 认证 ─────────────────────────────────────────────────────────────
  AUTH_EXPIRED = "AUTH_EXPIRED",
  AUTH_MISSING = "AUTH_MISSING",

  // ── 订阅同步 ─────────────────────────────────────────────────────────
  SUBSCRIBE_URL_EMPTY = "SUBSCRIBE_URL_EMPTY",
  PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND",
  PROFILE_DELETED = "PROFILE_DELETED",
  PROFILE_IMPORT_FAILED = "PROFILE_IMPORT_FAILED",
  ACTIVATE_FAILED = "ACTIVATE_FAILED",

  // ── API ──────────────────────────────────────────────────────────────
  COUPON_INVALID = "COUPON_INVALID",
  ORDER_CREATE_FAILED = "ORDER_CREATE_FAILED",
  SUBSCRIBE_URL_MISSING = "SUBSCRIBE_URL_MISSING",
}

export class XBoardError extends Error {
  constructor(
    message: string,
    public readonly code: XBoardErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "XBoardError";
  }
}
