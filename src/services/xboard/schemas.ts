/**
 * Zod schemas for XBoard API response validation
 *
 * Each schema validates the raw JSON structure returned by the server,
 * catching unexpected shape changes at parse time instead of silent defaults.
 */

import { z } from "zod/v4";

// ── Auth ────────────────────────────────────────────────────────────────────

export const AuthResponseSchema = z.object({
  data: z.object({
    auth_data: z.string(),
  }),
});

// ── Subscribe ───────────────────────────────────────────────────────────────

export const SubscribeResponseSchema = z.object({
  data: z.object({
    subscribe_url: z.string(),
    email: z.string().optional(),
    u: z.number().optional(),
    d: z.number().optional(),
    transfer_enable: z.number().optional(),
    expired_at: z.number().nullable().optional(),
    uuid: z.string().optional(),
    plan: z
      .object({
        name: z.string().optional(),
      })
      .optional(),
  }),
});

// ── User Info ───────────────────────────────────────────────────────────────

export const UserInfoResponseSchema = z.object({
  data: z
    .object({
      email: z.string().optional(),
      balance: z.number().optional(),
      commission_balance: z.number().optional(),
      uuid: z.string().optional(),
    })
    .nullable()
    .optional(),
});

// ── Invite ──────────────────────────────────────────────────────────────────

export const InviteResponseSchema = z.object({
  data: z
    .object({
      codes: z.array(z.object({ code: z.string() })).optional(),
      stat: z.array(z.number()).optional(),
    })
    .nullable()
    .optional(),
});

// ── Notices ─────────────────────────────────────────────────────────────────

const RawNoticeSchema = z.object({
  id: z.number().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  created_at: z.number().optional(),
});

export const NoticesResponseSchema = z.object({
  data: z.array(RawNoticeSchema).optional(),
  total: z.number().optional(),
});

// ── Plans ───────────────────────────────────────────────────────────────────

const RawPlanSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  content: z.string().optional(),
  transfer_enable: z.number().optional(),
  month_price: z.number().nullable().optional(),
  quarter_price: z.number().nullable().optional(),
  half_year_price: z.number().nullable().optional(),
  year_price: z.number().nullable().optional(),
  onetime_price: z.number().nullable().optional(),
});

export const PlansResponseSchema = z.object({
  data: z.array(RawPlanSchema).optional(),
});

// ── Coupon ──────────────────────────────────────────────────────────────────

export const CouponResponseSchema = z.object({
  data: z
    .object({
      name: z.string().optional(),
      type: z.number().optional(),
      value: z.number().optional(),
    })
    .nullable()
    .optional(),
});

// ── Payment Methods ─────────────────────────────────────────────────────────

const RawPaymentMethodSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  payment: z.string().optional(),
});

export const PaymentMethodsResponseSchema = z.object({
  data: z.array(RawPaymentMethodSchema).optional(),
});

// ── Orders ──────────────────────────────────────────────────────────────────

const RawOrderSchema = z.object({
  trade_no: z.string().optional(),
  plan: z.object({ name: z.string().optional() }).optional(),
  plan_name: z.string().optional(),
  period: z.string().optional(),
  total_amount: z.number().optional(),
  status: z.number().optional(),
  created_at: z.number().optional(),
});

export const OrdersResponseSchema = z.object({
  data: z.array(RawOrderSchema).optional(),
});

// ── Create Order ────────────────────────────────────────────────────────────

export const CreateOrderResponseSchema = z.object({
  data: z.string().optional(),
});

// ── Checkout ────────────────────────────────────────────────────────────────

export const CheckoutResponseSchema = z.object({
  type: z.number().optional(),
  data: z
    .union([z.string(), z.boolean(), z.object({}).passthrough()])
    .optional(),
});

// ── Check Order Status ──────────────────────────────────────────────────────

export const CheckOrderStatusResponseSchema = z.object({
  data: z.number().optional(),
});
