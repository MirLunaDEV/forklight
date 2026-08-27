import { describe, expect, it } from "vitest";
import { isQaEnabled } from "../ui/qaMode";

describe("QA mode", () => {
  it("is disabled by default and for unrelated query values", () => {
    expect(isQaEnabled("")).toBe(false);
    expect(isQaEnabled("?qa=0")).toBe(false);
    expect(isQaEnabled("?mode=qa")).toBe(false);
  });

  it("is enabled only by the explicit qa=1 query switch", () => {
    expect(isQaEnabled("?qa=1")).toBe(true);
    expect(isQaEnabled("?view=main&qa=1")).toBe(true);
  });
});
