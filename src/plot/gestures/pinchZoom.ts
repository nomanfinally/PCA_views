import { anchorInPlot, type PlotBox } from "./plotBox";
/**
 * Two-Finger Pinch-to-Zoom Coordinator
 *
 * Recognizes multi-touch pinch gestures using standard DOM bounding boxes
 * and mathematical coordinate projections, without touching private vendor internals.
 */

export interface PinchZoomEvent {
  factor: number;
  anchorX: number; // Fractional position [0..1] along horizontal axis
  anchorY: number; // Fractional position [0..1] along vertical axis
}

export interface PinchZoomOptions {
  element: HTMLElement;
  getPlotBox?: () => PlotBox | null;
  onZoom: (event: PinchZoomEvent) => void;
  onPinchEnd?: () => void;
  margin?: { left: number; right: number; top: number; bottom: number };
}

export class PinchZoomCoordinator {
  private element: HTMLElement;
  private getPlotBox?: () => PlotBox | null;
  private onZoom: (event: PinchZoomEvent) => void;
  private onPinchEnd?: () => void;
  private margin: { left: number; right: number; top: number; bottom: number };

  private initialDistance = 0;
  private currentFactor = 1;
  private activeAnchor = { x: 0.5, y: 0.5 };
  private animationFrameId = 0;

  constructor(options: PinchZoomOptions) {
    this.element = options.element;
    this.getPlotBox = options.getPlotBox;
    this.onZoom = options.onZoom;
    this.onPinchEnd = options.onPinchEnd;
    this.margin = options.margin ?? {
      left: 60,
      right: 24,
      top: 40,
      bottom: 60,
    };
  }

  public handleTouchStart = (event: TouchEvent): void => {
    if (event.touches.length === 2) {
      const t0 = event.touches[0];
      const t1 = event.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      this.initialDistance = Math.max(10, dist);
      this.currentFactor = 1;
      this.activeAnchor = this.computeAnchor(
        (t0.clientX + t1.clientX) / 2,
        (t0.clientY + t1.clientY) / 2,
      );

      if (event.cancelable) event.preventDefault();
    }
  };

  public handleTouchMove = (event: TouchEvent): void => {
    if (event.touches.length === 2 && this.initialDistance > 0) {
      if (event.cancelable) event.preventDefault();

      const t0 = event.touches[0];
      const t1 = event.touches[1];
      const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
      if (dist < 10) return;

      // Fingers spread (dist > initialDistance) -> stepRatio < 1 -> zoom in
      // Fingers pinch together (dist < initialDistance) -> stepRatio > 1 -> zoom out
      const stepRatio = this.initialDistance / dist;
      this.initialDistance = dist;

      const clampedStep = Math.max(0.65, Math.min(1.5, stepRatio));
      this.currentFactor *= clampedStep;

      this.activeAnchor = this.computeAnchor(
        (t0.clientX + t1.clientX) / 2,
        (t0.clientY + t1.clientY) / 2,
      );

      if (!this.animationFrameId) {
        this.animationFrameId = requestAnimationFrame(() => {
          this.animationFrameId = 0;
          const factor = Math.max(0.1, Math.min(10, this.currentFactor));
          this.currentFactor = 1;

          this.onZoom({
            factor,
            anchorX: this.activeAnchor.x,
            anchorY: this.activeAnchor.y,
          });
        });
      }
    }
  };

  public handleTouchEnd = (event: TouchEvent): void => {
    if (event.touches.length < 2) {
      this.initialDistance = 0;
      this.currentFactor = 1;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = 0;
      }
      this.onPinchEnd?.();
    }
  };

  /**
   * Computes the normalized [0..1] plot domain anchor coordinate for screen client coordinates.
   * Utilizes Plotly's dynamic plot box if available, otherwise falls back to static margins.
   */
  public computeAnchor(
    clientX: number,
    clientY: number,
  ): { x: number; y: number } {
    const rect = this.element.getBoundingClientRect();
    const box = this.getPlotBox?.() ?? {
      left: rect.left + this.margin.left,
      top: rect.top + this.margin.top,
      width: rect.width - this.margin.left - this.margin.right,
      height: rect.height - this.margin.top - this.margin.bottom,
    };
    return anchorInPlot(box, clientX, clientY);
  }

  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }
}
