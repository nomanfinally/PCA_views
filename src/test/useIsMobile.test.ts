import { describe, expect, it } from "vitest";
import { useIsMobile, useIsTablet } from "../hooks/useIsMobile";

describe("useIsMobile hook", () => {
  it("is defined and exports a callable function", () => {
    expect(typeof useIsMobile).toBe("function");
    expect(typeof useIsTablet).toBe("function");
  });
});
