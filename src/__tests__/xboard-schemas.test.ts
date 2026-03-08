import { describe, expect, it } from "vitest";

import {
  AuthResponseSchema,
  CheckOrderStatusResponseSchema,
  CheckoutResponseSchema,
  CouponResponseSchema,
  CreateOrderResponseSchema,
  InviteResponseSchema,
  NoticesResponseSchema,
  OrdersResponseSchema,
  PaymentMethodsResponseSchema,
  PlansResponseSchema,
  SubscribeResponseSchema,
  UserInfoResponseSchema,
} from "../services/xboard/schemas";

describe("AuthResponseSchema", () => {
  it("parses valid auth response", () => {
    const raw = { data: { auth_data: "token123" } };
    const result = AuthResponseSchema.parse(raw);
    expect(result.data.auth_data).toBe("token123");
  });

  it("rejects missing auth_data", () => {
    expect(() => AuthResponseSchema.parse({ data: {} })).toThrow();
  });

  it("rejects missing data", () => {
    expect(() => AuthResponseSchema.parse({})).toThrow();
  });
});

describe("SubscribeResponseSchema", () => {
  it("parses full subscribe response", () => {
    const raw = {
      data: {
        subscribe_url: "https://sub.url",
        email: "test@example.com",
        u: 1024,
        d: 2048,
        transfer_enable: 10737418240,
        expired_at: 1700000000,
        uuid: "uuid-123",
        plan: { name: "Premium" },
      },
    };
    const result = SubscribeResponseSchema.parse(raw);
    expect(result.data.subscribe_url).toBe("https://sub.url");
    expect(result.data.u).toBe(1024);
    expect(result.data.plan?.name).toBe("Premium");
  });

  it("parses minimal subscribe response", () => {
    const raw = { data: { subscribe_url: "https://sub.url" } };
    const result = SubscribeResponseSchema.parse(raw);
    expect(result.data.subscribe_url).toBe("https://sub.url");
    expect(result.data.u).toBeUndefined();
  });
});

describe("NoticesResponseSchema", () => {
  it("parses paginated notices", () => {
    const raw = {
      data: [
        { id: 1, title: "Title", content: "Body", created_at: 1700000000 },
        { id: 2, title: "Title2" },
      ],
      total: 10,
    };
    const result = NoticesResponseSchema.parse(raw);
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(10);
  });

  it("parses empty notices", () => {
    const raw = { data: [], total: 0 };
    const result = NoticesResponseSchema.parse(raw);
    expect(result.data).toHaveLength(0);
  });
});

describe("PlansResponseSchema", () => {
  it("parses plan with all prices", () => {
    const raw = {
      data: [
        {
          id: 1,
          name: "Basic",
          content: "description",
          transfer_enable: 107374182400,
          month_price: 999,
          quarter_price: 2499,
          half_year_price: null,
          year_price: 8999,
          onetime_price: null,
        },
      ],
    };
    const result = PlansResponseSchema.parse(raw);
    expect(result.data?.[0]?.name).toBe("Basic");
    expect(result.data?.[0]?.month_price).toBe(999);
    expect(result.data?.[0]?.half_year_price).toBeNull();
  });
});

describe("CouponResponseSchema", () => {
  it("parses valid coupon", () => {
    const raw = { data: { name: "SAVE20", type: 2, value: 80 } };
    const result = CouponResponseSchema.parse(raw);
    expect(result.data?.name).toBe("SAVE20");
    expect(result.data?.type).toBe(2);
  });

  it("handles null data (invalid coupon)", () => {
    const raw = { data: null };
    const result = CouponResponseSchema.parse(raw);
    expect(result.data).toBeNull();
  });
});

describe("OrdersResponseSchema", () => {
  it("parses order list", () => {
    const raw = {
      data: [
        {
          trade_no: "TN001",
          plan: { name: "Premium" },
          period: "month_price",
          total_amount: 999,
          status: 3,
          created_at: 1700000000,
        },
      ],
    };
    const result = OrdersResponseSchema.parse(raw);
    expect(result.data?.[0]?.trade_no).toBe("TN001");
    expect(result.data?.[0]?.plan?.name).toBe("Premium");
  });
});

describe("CheckoutResponseSchema", () => {
  it("parses free checkout (type -1)", () => {
    const raw = { type: -1, data: true };
    const result = CheckoutResponseSchema.parse(raw);
    expect(result.type).toBe(-1);
  });

  it("parses URL redirect (type 0)", () => {
    const raw = { type: 0, data: "https://pay.example.com" };
    const result = CheckoutResponseSchema.parse(raw);
    expect(result.data).toBe("https://pay.example.com");
  });

  it("parses embedded HTML (type 1)", () => {
    const raw = { type: 1, data: "<html>...</html>" };
    const result = CheckoutResponseSchema.parse(raw);
    expect(result.data).toBe("<html>...</html>");
  });
});

describe("Other schemas", () => {
  it("UserInfoResponseSchema parses optional data", () => {
    const raw = {
      data: { balance: 1000, commission_balance: 200, uuid: "u1" },
    };
    const result = UserInfoResponseSchema.parse(raw);
    expect(result.data?.balance).toBe(1000);
  });

  it("InviteResponseSchema parses codes", () => {
    const raw = { data: { codes: [{ code: "ABC123" }], stat: [5] } };
    const result = InviteResponseSchema.parse(raw);
    expect(result.data?.codes?.[0]?.code).toBe("ABC123");
    expect(result.data?.stat?.[0]).toBe(5);
  });

  it("PaymentMethodsResponseSchema parses methods", () => {
    const raw = {
      data: [{ id: 1, name: "Alipay", payment: "AlipayF2F" }],
    };
    const result = PaymentMethodsResponseSchema.parse(raw);
    expect(result.data?.[0]?.payment).toBe("AlipayF2F");
  });

  it("CreateOrderResponseSchema parses trade_no", () => {
    const raw = { data: "TN123456" };
    const result = CreateOrderResponseSchema.parse(raw);
    expect(result.data).toBe("TN123456");
  });

  it("CheckOrderStatusResponseSchema parses status", () => {
    const raw = { data: 3 };
    const result = CheckOrderStatusResponseSchema.parse(raw);
    expect(result.data).toBe(3);
  });
});
