import { describe, expect, it } from "vitest";

import { XBoardError, XBoardErrorCode } from "../services/xboard/errors";

describe("XBoardError", () => {
  it("creates error with code", () => {
    const err = new XBoardError(
      "test message",
      XBoardErrorCode.AUTH_EXPIRED,
      401,
    );
    expect(err.message).toBe("test message");
    expect(err.code).toBe(XBoardErrorCode.AUTH_EXPIRED);
    expect(err.status).toBe(401);
    expect(err.name).toBe("XBoardError");
    expect(err instanceof Error).toBe(true);
  });

  it("works without status", () => {
    const err = new XBoardError("no status", XBoardErrorCode.PROFILE_NOT_FOUND);
    expect(err.status).toBeUndefined();
    expect(err.code).toBe("PROFILE_NOT_FOUND");
  });

  it("can be matched by code in catch blocks", () => {
    try {
      throw new XBoardError("expired", XBoardErrorCode.AUTH_EXPIRED, 401);
    } catch (e) {
      expect(e).toBeInstanceOf(XBoardError);
      if (e instanceof XBoardError) {
        expect(e.code).toBe(XBoardErrorCode.AUTH_EXPIRED);
      }
    }
  });

  it("all error codes are unique strings", () => {
    const codes = Object.values(XBoardErrorCode);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });
});
