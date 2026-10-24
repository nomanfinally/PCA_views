/**
 * Accessible Modal Keyboard Focus Trap & Escape Handler
 */

import { useEffect, useRef } from "react";
const activeTraps: HTMLElement[] = [];
const layer = (element: HTMLElement) => {
  let value = 0;
  for (
    let node: HTMLElement | null = element;
    node;
    node = node.parentElement
  ) {
    const z = Number.parseInt(getComputedStyle(node).zIndex, 10);
    if (Number.isFinite(z)) value = Math.max(value, z);
  }
  return value;
};
const topTrap = () =>
  activeTraps.reduce<HTMLElement | null>(
    (top, element) => (!top || layer(element) >= layer(top) ? element : top),
    null,
  );

export interface KeyboardTrapOptions {
  active: boolean;
  onEscape?: () => void;
}

export function useKeyboardTrap<T extends HTMLElement = HTMLDivElement>(
  options: KeyboardTrapOptions,
) {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const wasActive = useRef(false);
  // Capture before React's autoFocus runs during commit. An effect alone sees
  // the new dialog input and loses the control that opened the overlay.
  if (options.active && !wasActive.current && typeof document !== "undefined") {
    previousActiveElement.current =
      document.activeElement as HTMLElement | null;
  }
  wasActive.current = options.active;
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
    activeTraps.push(container);

    // Focus active tab, first focusable, or container ONLY if focus is currently outside
    if (
      topTrap() === container &&
      !container.contains(document.activeElement)
    ) {
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
      if (topTrap() !== container || event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
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
      const index = activeTraps.lastIndexOf(container);
      if (index >= 0) activeTraps.splice(index, 1);
      if (previousActiveElement.current?.isConnected)
        previousActiveElement.current.focus();
    };
  }, [options.active]);

  return containerRef;
}
