import { describe, expect, it } from "vitest";
import { formatAmount, formatPercent } from "./index";

describe("formatAmount", () => {
  it("rounds by unit only at display time", () => {
    expect(formatAmount(206.4, "kcal")).toBe("206 kcal");
    expect(formatAmount(38.04, "g")).toBe("38 g");
    expect(formatAmount(2.55, "mg")).toBe("2.6 mg");
    expect(formatAmount(384.2, "mg")).toBe("384 mg");
    expect(formatAmount(149.4, "mcg DFE")).toBe("149 mcg DFE");
  });
  it("missing renders as em dash, never zero", () => {
    expect(formatAmount(null, "mg")).toBe("—");
  });
});

describe("formatPercent", () => {
  it("rounds to whole percent; null => em dash (never 0%)", () => {
    expect(formatPercent(126.6)).toBe("127%");
    expect(formatPercent(null)).toBe("—");
  });
});
