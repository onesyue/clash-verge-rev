import { describe, expect, it } from "vitest";

import parseTraffic, { formatPercent } from "../utils/parse-traffic";

describe("parseTraffic", () => {
  it("returns NaN for undefined", () => {
    expect(parseTraffic(undefined)).toEqual(["NaN", ""]);
  });

  it("returns 0 B for zero", () => {
    const [val, unit] = parseTraffic(0);
    expect(unit).toBe("B");
    expect(Number(val)).toBe(0);
  });

  it("parses bytes correctly", () => {
    const [val, unit] = parseTraffic(512);
    expect(unit).toBe("B");
    expect(Number(val)).toBe(512);
  });

  it("parses kilobytes", () => {
    const [val, unit] = parseTraffic(1024);
    expect(unit).toBe("KB");
    expect(Number(val)).toBeCloseTo(1, 0);
  });

  it("parses megabytes", () => {
    const [val, unit] = parseTraffic(1024 * 1024 * 5.5);
    expect(unit).toBe("MB");
    expect(Number(val)).toBeCloseTo(5.5, 0);
  });

  it("parses gigabytes", () => {
    const [val, unit] = parseTraffic(1024 ** 3 * 2);
    expect(unit).toBe("GB");
    expect(Number(val)).toBeCloseTo(2, 0);
  });

  it("parses terabytes", () => {
    const [val, unit] = parseTraffic(1024 ** 4);
    expect(unit).toBe("TB");
    expect(Number(val)).toBeCloseTo(1, 0);
  });
});

describe("formatPercent", () => {
  it("returns 0% for zero", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it("returns <1% for tiny values", () => {
    expect(formatPercent(0.1)).toBe("<1%");
    expect(formatPercent(0.99)).toBe("<1%");
  });

  it("rounds to integer", () => {
    expect(formatPercent(42.7)).toBe("43%");
    expect(formatPercent(50)).toBe("50%");
  });

  it("caps at 100%", () => {
    expect(formatPercent(100)).toBe("100%");
    expect(formatPercent(150)).toBe("100%");
  });

  it("returns 0% for negative values", () => {
    expect(formatPercent(-5)).toBe("0%");
  });
});
