/**
 * Responsive Viewport Hook
 * 
 * Tracks window viewport dimensions and resolves mobile/tablet/desktop categories.
 */

import { useEffect, useState } from "react";
import { BREAKPOINTS, type BreakpointDevice } from "../tokens/breakpoints";

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isCompact: boolean;
  device: BreakpointDevice;
  width: number;
  height: number;
}

function getResponsiveState(width: number, height: number): ResponsiveState {
  const isMobile = width <= BREAKPOINTS.mobileMax;
  const isTablet = width >= BREAKPOINTS.tabletMin && width <= BREAKPOINTS.tabletMax;
  const isDesktop = width >= BREAKPOINTS.desktopMin;
  const isCompact = isMobile || isTablet;

  const device: BreakpointDevice = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

  return {
    isMobile,
    isTablet,
    isDesktop,
    isCompact,
    device,
    width,
    height,
  };
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === "undefined") {
      return getResponsiveState(1200, 800);
    }
    return getResponsiveState(window.innerWidth, window.innerHeight);
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timeoutId = 0;
    const handleResize = () => {
      // Coalesce rapid resize events
      if (timeoutId) cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(() => {
        setState(getResponsiveState(window.innerWidth, window.innerHeight));
      });
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutId) cancelAnimationFrame(timeoutId);
    };
  }, []);

  return state;
}
