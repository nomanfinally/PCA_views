export interface PlotBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function anchorInPlot(box: PlotBox, clientX: number, clientY: number) {
  return {
    x: Math.max(0, Math.min(1, (clientX - box.left) / Math.max(1, box.width))),
    y: Math.max(
      0,
      Math.min(1, 1 - (clientY - box.top) / Math.max(1, box.height)),
    ),
  };
}
