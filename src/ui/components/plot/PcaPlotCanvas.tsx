import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Dataset, Sample } from "../../../core/models/dataset";
import type { ViewState } from "../../../state/viewState";
import { paddedRange, zoomRange } from "../../../core/geometry/viewport";
import { buildPlotSpec } from "../../../plot/spec/buildPlotSpec";
import type { LabelOffset } from "../../../plot/spec/plotSpec";
import { PlotlyRenderer, type ViewportSnapshot } from "../../../plot/adapters/plotly/plotlyRenderer";
import { PinchZoomCoordinator } from "../../../plot/gestures/pinchZoom";
import { WheelZoomCoordinator } from "../../../plot/gestures/wheelZoom";
import { findClosestPoint } from "../../../plot/gestures/hitTest";
import type { ChartImage } from "../../../services/export/canvasComposer";

export interface PlotHandle {
  zoom: (factor: number) => void;
  reset: () => void;
  fit: () => void;
  capturePng: () => Promise<ChartImage>;
  snapshot: () => Promise<any>;
}

export interface PcaPlotCanvasProps {
  initialViewport?: {
    xRange?: number[];
    yRange?: number[];
    offsets?: [string, LabelOffset][];
  };
  dataset: Dataset;
  samples: Sample[];
  state: ViewState;
  onMark: (key: number) => void;
  onEdit: (key: number, anchor: { x: number; y: number }) => void;
  onSelect: (keys: number[]) => void;
  isMobile?: boolean;
  isTablet?: boolean;
}

export const PcaPlotCanvas = forwardRef<PlotHandle, PcaPlotCanvasProps>(
  function PcaPlotCanvas(props, ref) {
    const { dataset, samples, state, onMark, onEdit, onSelect } = props;
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<PlotlyRenderer | null>(null);
    const offsetsRef = useRef<Map<string, LabelOffset>>(
      new Map(props.initialViewport?.offsets ?? []),
    );
    const [isReady, setIsReady] = useState(false);
    const [renderError, setRenderError] = useState<string | null>(null);

    // Keep latest props and spec in refs for event handlers
    const latestProps = useRef(props);
    latestProps.current = props;

    // Build abstract plot specification
    const spec = useMemo(
      () => buildPlotSpec(dataset, samples, state, offsetsRef.current),
      [
        dataset,
        samples,
        state.x,
        state.y,
        state.settings,
        state.populations,
        state.points,
        state.selected,
        state.spectrum,
        state.mode,
      ],
    );

    const latestSpec = useRef(spec);
    latestSpec.current = spec;

    // Initialize PlotlyRenderer and gesture coordinators
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const renderer = new PlotlyRenderer({
        onSelect: (keys) => latestProps.current.onSelect(keys),
        onAnnotationOffsetChange: (id, offset) => {
          offsetsRef.current.set(id, offset);
        },
        onError: (err) => {
          setRenderError(err.message);
        },
      });
      rendererRef.current = renderer;

      let isMounted = true;
      void renderer
        .mount(container, spec, dataset.samples.length)
        .then(() => {
          if (isMounted) setIsReady(true);
        })
        .catch((err) => {
          if (isMounted) setRenderError(String(err.message ?? err));
        });

      // Gesture coordinators
      const pinchCoordinator = new PinchZoomCoordinator({
        element: container,
        margin: {
          left: spec.layout.margin.l,
          right: spec.layout.margin.r,
          top: spec.layout.margin.t,
          bottom: spec.layout.margin.b,
        },
        onZoom: ({ factor, anchorX, anchorY }) => {
          if (!rendererRef.current) return;
          const snapshot = rendererRef.current.getViewportSnapshot();
          if (!snapshot) return;
          const newX = zoomRange(snapshot.xRange, factor, anchorX);
          const newY = zoomRange(snapshot.yRange, factor, anchorY);
          void rendererRef.current.relayout({
            "xaxis.range": newX as any,
            "yaxis.range": newY as any,
            "xaxis.autorange": false,
            "yaxis.autorange": false,
          });
        },
      });

      const wheelCoordinator = new WheelZoomCoordinator({
        element: container,
        margin: {
          left: spec.layout.margin.l,
          right: spec.layout.margin.r,
          top: spec.layout.margin.t,
          bottom: spec.layout.margin.b,
        },
        onZoom: ({ factor, anchorX, anchorY }) => {
          if (!rendererRef.current) return;
          const snapshot = rendererRef.current.getViewportSnapshot();
          if (!snapshot) return;
          const newX = zoomRange(snapshot.xRange, factor, anchorX);
          const newY = zoomRange(snapshot.yRange, factor, anchorY);
          void rendererRef.current.relayout({
            "xaxis.range": newX as any,
            "yaxis.range": newY as any,
            "xaxis.autorange": false,
            "yaxis.autorange": false,
          });
        },
      });

      const handleWheel = (e: WheelEvent) => {
        wheelCoordinator.handleWheel(e);
      };

      const handleTouchStart = (e: TouchEvent) => {
        pinchCoordinator.handleTouchStart(e);
      };

      const handleTouchMove = (e: TouchEvent) => {
        pinchCoordinator.handleTouchMove(e);
      };

      const handleTouchEnd = (e: TouchEvent) => {
        pinchCoordinator.handleTouchEnd(e);
      };

      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("touchstart", handleTouchStart, { passive: true });
      container.addEventListener("touchmove", handleTouchMove, { passive: false });
      container.addEventListener("touchend", handleTouchEnd, { passive: true });
      container.addEventListener("touchcancel", handleTouchEnd, { passive: true });

      // Hit testing helper
      const hitTestPoint = (clientX: number, clientY: number): number | null => {
        const chart = container as any;
        const full = chart._fullLayout;
        const rect = container.getBoundingClientRect();
        const currentSpec = latestSpec.current;
        const allPoints = currentSpec.traces.flatMap((t) => t.points);

        if (full?.xaxis && full?.yaxis && typeof full.xaxis.l2p === "function") {
          const px = clientX - rect.left - full.xaxis._offset;
          const py = clientY - rect.top - full.yaxis._offset;
          if (px < 0 || py < 0 || px > full.xaxis._length || py > full.yaxis._length) {
            return null;
          }

          let bestKey: number | null = null;
          let minDistance = 22;
          for (const p of allPoints) {
            const sx = full.xaxis.l2p(p.x);
            const sy = full.yaxis.l2p(p.y);
            const d = Math.hypot(sx - px, sy - py);
            if (d <= minDistance) {
              minDistance = d;
              bestKey = p.key;
            }
          }
          return bestKey;
        }

        const snapshot = renderer.getViewportSnapshot();
        if (!snapshot) return null;
        const margin = currentSpec.layout.margin;
        const plotWidth = rect.width - margin.l - margin.r;
        const plotHeight = rect.height - margin.t - margin.b;
        if (plotWidth <= 0 || plotHeight <= 0) return null;

        const px = clientX - rect.left - margin.l;
        const py = clientY - rect.top - margin.t;
        if (px < 0 || px > plotWidth || py < 0 || py > plotHeight) return null;

        let bestKey: number | null = null;
        let minDistance = 22;
        for (const p of allPoints) {
          const sx =
            ((p.x - snapshot.xRange[0]) / (snapshot.xRange[1] - snapshot.xRange[0])) *
            plotWidth;
          const sy =
            (1 - (p.y - snapshot.yRange[0]) / (snapshot.yRange[1] - snapshot.yRange[0])) *
            plotHeight;
          const d = Math.hypot(sx - px, sy - py);
          if (d <= minDistance) {
            minDistance = d;
            bestKey = p.key;
          }
        }
        return bestKey;
      };

      const handleCaptureClick = (e: MouseEvent) => {
        if (e.button !== 0) return;
        const hitKey = hitTestPoint(e.clientX, e.clientY);
        if (hitKey !== null) {
          latestProps.current.onMark(hitKey);
        }
      };

      const handleCaptureContextMenu = (e: MouseEvent) => {
        const hitKey = hitTestPoint(e.clientX, e.clientY);
        if (hitKey !== null) {
          e.preventDefault();
          e.stopPropagation();
          latestProps.current.onEdit(hitKey, { x: e.clientX + 8, y: e.clientY + 8 });
        }
      };

      container.addEventListener("click", handleCaptureClick, true);
      container.addEventListener("contextmenu", handleCaptureContextMenu, true);

      // Resize observer
      const resizeObserver = new ResizeObserver(() => {
        if (rendererRef.current) {
          void rendererRef.current.resize();
        }
      });
      resizeObserver.observe(container);

      return () => {
        isMounted = false;
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
        container.removeEventListener("touchend", handleTouchEnd);
        container.removeEventListener("touchcancel", handleTouchEnd);
        container.removeEventListener("click", handleCaptureClick, true);
        container.removeEventListener("contextmenu", handleCaptureContextMenu, true);
        resizeObserver.disconnect();
        pinchCoordinator.destroy();
        wheelCoordinator.destroy();
        renderer.purge();
        rendererRef.current = null;
      };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Update plot on spec changes
    useEffect(() => {
      if (!isReady || !rendererRef.current) return;
      void rendererRef.current.update(spec);
    }, [spec, isReady]);

    // Imperative handle
    useImperativeHandle(
      ref,
      () => ({
        zoom(factor: number) {
          const renderer = rendererRef.current;
          if (!renderer) return;
          const snapshot = renderer.getViewportSnapshot();
          if (!snapshot) return;

          const newX = zoomRange(snapshot.xRange, factor, 0.5);
          const newY = zoomRange(snapshot.yRange, factor, 0.5);
          void renderer.relayout({
            "xaxis.range": newX as any,
            "yaxis.range": newY as any,
          });
        },

        reset() {
          const renderer = rendererRef.current;
          if (!renderer) return;
          const allX = dataset.samples.map((s) => s.pcs[state.x] ?? 0);
          const allY = dataset.samples.map((s) => s.pcs[state.y] ?? 0);
          void renderer.relayout({
            "xaxis.range": paddedRange(allX) as any,
            "yaxis.range": paddedRange(allY) as any,
            "xaxis.autorange": false,
            "yaxis.autorange": false,
          });
        },

        fit() {
          const renderer = rendererRef.current;
          if (!renderer) return;
          const activeSamples = samples.length ? samples : dataset.samples;
          const activeX = activeSamples.map((s) => s.pcs[state.x] ?? 0);
          const activeY = activeSamples.map((s) => s.pcs[state.y] ?? 0);
          void renderer.relayout({
            "xaxis.range": paddedRange(activeX) as any,
            "yaxis.range": paddedRange(activeY) as any,
            "xaxis.autorange": false,
            "yaxis.autorange": false,
          });
        },

        async capturePng(): Promise<ChartImage> {
          const renderer = rendererRef.current;
          if (!renderer) throw new Error("Plot renderer is not ready.");

          const container = containerRef.current!;
          const width = container.clientWidth || 800;
          const height = container.clientHeight || 600;
          const url = await renderer.toImage({
            format: "png",
            width,
            height,
            scale: 2,
          });

          const margin = spec.layout.margin;
          return {
            url,
            width,
            height,
            plotBox: {
              x: margin.l,
              y: margin.t,
              width: width - margin.l - margin.r,
              height: height - margin.t - margin.b,
            },
            axisBounds: {
              x: margin.l,
              y: margin.t,
              width: width - margin.l - margin.r,
              height: height - margin.t - margin.b,
            },
          };
        },

        async snapshot(): Promise<any> {
          const renderer = rendererRef.current;
          if (!renderer) return null;
          const snap = renderer.getViewportSnapshot();
          if (!snap) return null;
          return {
            xRange: snap.xRange,
            yRange: snap.yRange,
            offsets: Array.from(offsetsRef.current.entries()),
            width: snap.width,
            height: snap.height,
          };
        },
      }),
      [dataset.samples, samples, state.x, state.y, spec.layout.margin],
    );

    return (
      <div
        className="pca-plot-container plot"
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          touchAction: "none",
        }}
      >
        {renderError && (
          <div className="plot-error alert" role="alert">
            <span>Unable to render plot: {renderError}</span>
          </div>
        )}
        {!samples.length && (
          <div className="plot-message">
            No visible samples. Show populations in the legend or clear your search.
          </div>
        )}
      </div>
    );
  },
);
