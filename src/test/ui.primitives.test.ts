import { describe, expect, it } from "vitest";
import { BREAKPOINTS } from "../ui/tokens/breakpoints";

describe("ui/tokens/breakpoints", () => {
  it("defines standard non-overlapping mobile, tablet, and desktop thresholds", () => {
    expect(BREAKPOINTS.mobileMax).toBe(640);
    expect(BREAKPOINTS.tabletMin).toBe(641);
    expect(BREAKPOINTS.tabletMax).toBe(1024);
    expect(BREAKPOINTS.desktopMin).toBe(1025);

    expect(BREAKPOINTS.tabletMin).toBe(BREAKPOINTS.mobileMax + 1);
    expect(BREAKPOINTS.desktopMin).toBe(BREAKPOINTS.tabletMax + 1);
  });
});
