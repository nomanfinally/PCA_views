/**
 * Coalesced Mouse Wheel Zoom Handler
 * 
 * Smooth, cursor-anchored zoom handling across various mouse/trackpad delta modes.
 */

import { wheelPixels } from "../../core/geometry/viewport";

export interface WheelZoomEvent {
  factor: number;
  anchorX: number;
  anchorY: number;
}

export interface WheelZoomOptions {
  element: HTMLElement;
  onZoom: (event: WheelZoomEvent) => void;
  margin?: { left: number; right: number; top: number; bottom: number };
}

export class WheelZoomCoordinator {
  private element: HTMLElement;
  private onZoom: (event: WheelZoomEvent) => void;
  private margin: { left: number; right: number; top: number; bottom: number };

  private accumulatedDelta = 0;
  private activeAnchor = { x: 0.5, y: 0.5 };
  private animationFrameId = 0;

  constructor(options: WheelZoomOptions) {
    this.element = options.element;
    this.onZoom = options.onZoom;
    this.margin = options.margin ?? { left: 60, right: 24, top: 40, bottom: 60 };
  }

  public handleWheel = (event: WheelEvent): void => {
    // Only capture wheel events intended for chart zooming
    if (event.ctrlKey || event.metaKey || !event.shiftKey) {
      if (event.cancelable) event.preventDefault();

      const pixels = wheelPixels(event.deltaY, event.deltaMode, this.element.clientHeight);
      this.accumulatedDelta += pixels;

      this.activeAnchor = this.computeAnchor(event.clientX, event.clientY);

      if (!this.animationFrameId) {
        this.animationFrameId = requestAnimationFrame(() => {
          this.animationFrameId = 0;
          if (this.accumulatedDelta === 0) return;

          // Standard exponential zoom mapping: delta > 0 -> zoom out (factor > 1); delta < 0 -> zoom in (factor < 1)
          const factor = Math.exp(Math.max(-0.8, Math.min(0.8, this.accumulatedDelta * 0.0015)));
          this.accumulatedDelta = 0;

          this.onZoom({
            factor,
            anchorX: this.activeAnchor.x,
            anchorY: this.activeAnchor.y,
          });
        });
      }
    }
  };

  public computeAnchor(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.element.getBoundingClientRect();
    const plotWidth = Math.max(1, rect.width - this.margin.left - this.margin.right);
    const plotHeight = Math.max(1, rect.height - this.margin.top - this.margin.bottom);

    const relX = clientX - rect.left - this.margin.left;
    const relY = clientY - rect.top - this.margin.top;

    const x = Math.max(0, Math.min(1, relX / plotWidth));
    const y = Math.max(0, Math.min(1, 1 - relY / plotHeight));

    return { x, y };
  }

  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }
}
