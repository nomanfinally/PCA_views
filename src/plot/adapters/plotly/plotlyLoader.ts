/**
 * Dynamic Plotly Chunk Loader
 * 
 * Conditionally loads either the lightweight basic 2D distribution (SVG)
 * or the high-performance WebGL (gl2d) distribution for large datasets (>5,000 samples).
 */

export type PlotlyApi = typeof import("plotly.js");

let basicPlotlyPromise: Promise<PlotlyApi> | null = null;
let gl2dPlotlyPromise: Promise<PlotlyApi> | null = null;

export async function loadPlotly(sampleCount = 0): Promise<PlotlyApi> {
  const useGl2d = sampleCount > 5000;

  if (useGl2d) {
    if (!gl2dPlotlyPromise) {
      gl2dPlotlyPromise = import("plotly.js-gl2d-dist-min").then(
        (m) => (m.default || m) as unknown as PlotlyApi,
      );
    }
    return gl2dPlotlyPromise;
  }

  if (!basicPlotlyPromise) {
    basicPlotlyPromise = import("plotly.js-basic-dist-min").then(
      (m) => (m.default || m) as unknown as PlotlyApi,
    );
  }
  return basicPlotlyPromise;
}
