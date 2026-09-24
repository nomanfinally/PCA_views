import { describe, expect, it } from "vitest";
import { useIsMobile } from "../hooks/useIsMobile";

describe("useIsMobile hook", () => {
  it("is defined and exports a callable function", () => {
    expect(typeof useIsMobile).toBe("function");
  });
});
