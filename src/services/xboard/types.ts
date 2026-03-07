// XBoard API 数据类型定义
// 对应 ClashMetaForAndroid 中的 XBoardApi.kt 数据类

/**
 * 登录/注册成功后返回的认证结果
 */
export interface AuthResult {
  /** XBoard 订阅链接 */
  subscribeUrl: string;
  /** 认证 token（即 auth_data），后续请求携带于 Authorization 请求头 */
  authData: string;
}

/**
 * 用户账户信息
 * 流量字段来自 /api/v1/user/getSubscribe，余额/uuid 来自 /api/v1/user/info
 */
export interface UserInfo {
  email: string;
  /** 账户余额，单位：分（÷100 得元） */
  balance: number;
  /** 佣金余额，单位：分 */
  commissionBalance: number;
  /** 套餐到期时间（Unix 秒时间戳），null 表示永久 */
  expiredAt: number | null;
  /** 套餐总流量，单位：字节 */
  transferEnable: number;
  /** 已用下载流量，单位：字节 */
  usedDownload: number;
  /** 已用上传流量，单位：字节 */
  usedUpload: number;
  uuid: string;
  /** 当前套餐名称 */
  planName: string | null;
}

/**
 * 邀请信息
 */
export interface InviteInfo {
  /** 邀请注册链接 */
  inviteUrl: string;
  /** 已注册的邀请用户数 */
  referralCount: number;
}

/**
 * 支付方式
 */
export interface PaymentMethod {
  id: number;
  name: string;
  /** 网关类型，如 "AlipayF2F" */
  payment: string;
}

/**
 * 订单结算结果
 */
export interface CheckoutResult {
  /**
   * -1 = 免费/余额支付直接成功
   *  0 = 返回支付跳转 URL
   *  1 = 返回 HTML 内容（内嵌收银台）
   */
  type: -1 | 0 | 1;
  /** URL 或 HTML 字符串，type=-1 时为空 */
  data: string;
}

/**
 * 套餐信息
 */
export interface Plan {
  id: number;
  name: string;
  /** Markdown 格式的套餐描述 */
  content: string;
  /** 套餐流量，单位：GB，0 表示不限流量 */
  transferGb: number;
  /** 各周期价格，单位：分，null 表示该周期不可购买 */
  monthPrice: number | null;
  quarterPrice: number | null;
  halfYearPrice: number | null;
  yearPrice: number | null;
  onetimePrice: number | null;
}

/**
 * 面板公告
 */
export interface Notice {
  id: number;
  title: string;
  /** Markdown 格式内容 */
  content: string;
  /** 创建时间（Unix 秒时间戳） */
  createdAt: number;
}

/**
 * 订单记录
 */
export interface Order {
  tradeNo: string;
  planName: string;
  period: string;
  /** 订单金额，单位：分 */
  totalAmount: number;
  /**
   * 订单状态
   * 0 = 待支付
   * 1 = 处理中
   * 2 = 已取消
   * 3 = 已完成
   * 4 = 已折扣
   */
  status: 0 | 1 | 2 | 3 | 4;
  /** 创建时间（Unix 秒时间戳） */
  createdAt: number;
}

/**
 * 套餐周期枚举
 */
export type PlanPeriod =
  | "month_price"
  | "quarter_price"
  | "half_year_price"
  | "year_price"
  | "onetime_price";

/**
 * XBoard 会话信息（本地持久化）
 */
export interface XBoardSession {
  /** 面板域名，如 https://example.com */
  baseUrl: string;
  /** 认证 token */
  authData: string;
  /** 订阅链接 */
  subscribeUrl: string;
}
