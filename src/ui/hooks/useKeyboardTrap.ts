/**
 * Accessible Modal Keyboard Focus Trap & Escape Handler
 */

import { useEffect, useRef } from "react";

export interface KeyboardTrapOptions {
  active: boolean;
  onEscape?: () => void;
}

export function useKeyboardTrap<T extends HTMLElement = HTMLDivElement>(
  options: KeyboardTrapOptions,
) {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(options.onEscape);
  onEscapeRef.current = options.onEscape;

  useEffect(() => {
    if (!options.active) return;

    if (
      typeof document !== "undefined" &&
      (!containerRef.current ||
        !containerRef.current.contains(document.activeElement))
    ) {
      previousActiveElement.current =
        document.activeElement as HTMLElement | null;
    }

    const container = containerRef.current;
    if (!container) return;

    // Focus active tab, first focusable, or container ONLY if focus is currently outside
    if (!container.contains(document.activeElement)) {
      const activeTab = container.querySelector<HTMLElement>(
        '[role="tab"][aria-selected="true"]',
      );
      const firstFocusable = container.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (activeTab) {
        activeTab.focus();
      } else if (firstFocusable) {
        firstFocusable.focus();
      } else {
        container.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscapeRef.current?.();
        return;
      }

      if (event.key === "Tab") {
        const focusable = Array.from(
          container.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter(
          (el) => el.offsetParent !== null || el.getClientRects().length > 0,
        );

        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey) {
          if (
            document.activeElement === first ||
            !container.contains(document.activeElement)
          ) {
            last.focus();
            event.preventDefault();
          }
        } else {
          if (
            document.activeElement === last ||
            !container.contains(document.activeElement)
          ) {
            first.focus();
            event.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, [options.active]);

  return containerRef;
}
