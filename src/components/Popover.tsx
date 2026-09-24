import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
export interface Anchor {
  x: number;
  y: number;
}
export function Popover({
  title,
  anchor,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  anchor: Anchor;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const [position, setPosition] = useState(anchor);
  useLayoutEffect(() => {
    const element = ref.current!;
    const reposition = () => {
      const box = element.getBoundingClientRect();
      const x = Math.max(
        8,
        Math.min(anchor.x, window.innerWidth - box.width - 8),
      );
      const y = Math.max(
        8,
        Math.min(anchor.y, window.innerHeight - box.height - 8),
      );
      setPosition((previous) =>
        previous.x === x && previous.y === y ? previous : { x, y },
      );
    };
    reposition();
    const observer = new ResizeObserver(reposition);
    observer.observe(element);
    window.addEventListener("resize", reposition);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reposition);
    };
  }, [anchor]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key === "Tab") {
        const focusable = [
          ...ref.current!.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
          ),
        ].filter((element) => element.getClientRects().length);
        const first = focusable[0],
          last = focusable.at(-1);
        if (!first) return;
        if (
          !ref.current!.contains(document.activeElement) ||
          (!event.shiftKey && document.activeElement === last)
        ) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  return createPortal(
    <>
      <div
        className="popover-dismiss"
        onPointerDown={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        className={`popover ${wide ? "wide" : ""}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ left: position.x, top: position.y }}
      >
        <div className="popover-header">
          <strong>{title}</strong>
          <button
            className="icon-button"
            aria-label={`Close ${title}`}
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </>,
    document.body,
  );
}
