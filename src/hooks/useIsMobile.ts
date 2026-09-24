import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };
    update(mql);
    if (mql.addEventListener) {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    } else {
      mql.addListener(update);
      return () => mql.removeListener(update);
    }
  }, [breakpoint]);

  return isMobile;
}

export function useIsTablet(minBreakpoint = 641, maxBreakpoint = 1024): boolean {
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth >= minBreakpoint && window.innerWidth <= maxBreakpoint
    );
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(
      `(min-width: ${minBreakpoint}px) and (max-width: ${maxBreakpoint}px)`,
    );
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsTablet(e.matches);
    };
    update(mql);
    if (mql.addEventListener) {
      mql.addEventListener("change", update);
      return () => mql.removeEventListener("change", update);
    } else {
      mql.addListener(update);
      return () => mql.removeListener(update);
    }
  }, [minBreakpoint, maxBreakpoint]);

  return isTablet;
}
