import { describe, expect, it } from "vitest";
import { findClosestPoint, findPointsInRect } from "../plot/gestures/hitTest";
import { PinchZoomCoordinator } from "../plot/gestures/pinchZoom";
import { WheelZoomCoordinator } from "../plot/gestures/wheelZoom";
import type { PlotPoint } from "../plot/spec/plotSpec";

const mockPoints: PlotPoint[] = [
  {
    x: 0,
    y: 0,
    key: 0,
    sampleId: "S0",
    population: "P0",
    style: {
      color: "#000",
      symbol: "circle",
      size: 7,
      fillOpacity: 1,
      outlineOpacity: 1,
      line: { color: "#000", width: 1 },
      isHollow: false,
    },
    hoverText: "S0",
  },
  {
    x: 10,
    y: 10,
    key: 1,
    sampleId: "S1",
    population: "P0",
    style: {
      color: "#000",
      symbol: "circle",
      size: 7,
      fillOpacity: 1,
      outlineOpacity: 1,
      line: { color: "#000", width: 1 },
      isHollow: false,
    },
    hoverText: "S1",
  },
];

describe("plot/gestures/hitTest", () => {
  it("finds the closest point within tolerance distance", () => {
    const hit = findClosestPoint(1, 1, mockPoints, 5);
    expect(hit).not.toBeNull();
    expect(hit?.point.key).toBe(0);
    expect(hit?.distance).toBeCloseTo(Math.hypot(1, 1));

    const miss = findClosestPoint(50, 50, mockPoints, 5);
    expect(miss).toBeNull();
  });

  it("filters points inside a rectangular box", () => {
    const inside = findPointsInRect(-1, -1, 5, 5, mockPoints);
    expect(inside).toHaveLength(1);
    expect(inside[0].key).toBe(0);

    const all = findPointsInRect(-5, -5, 15, 15, mockPoints);
    expect(all).toHaveLength(2);
  });
});

describe("plot/gestures/pinchZoom and wheelZoom coordinators", () => {
  it("computes normalized Cartesian domain anchors from client coordinates", () => {
    // Create mock DOM element
    const mockElement = {
      getBoundingClientRect: () => ({
        left: 100,
        top: 50,
        width: 500,
        height: 400,
        right: 600,
        bottom: 450,
      }),
    } as unknown as HTMLElement;

    const margin = { left: 50, right: 50, top: 50, bottom: 50 };
    // Plot area width = 500 - 100 = 400. Plot area height = 400 - 100 = 300.
    const pinch = new PinchZoomCoordinator({
      element: mockElement,
      onZoom: () => {},
      margin,
    });

    // Center client coords: x = 100 + 50 + 200 = 350. y = 50 + 50 + 150 = 250.
    const anchor = pinch.computeAnchor(350, 250);
    expect(anchor.x).toBeCloseTo(0.5);
    expect(anchor.y).toBeCloseTo(0.5);

    const wheel = new WheelZoomCoordinator({
      element: mockElement,
      onZoom: () => {},
      margin,
    });
    const wheelAnchor = wheel.computeAnchor(350, 250);
    expect(wheelAnchor.x).toBeCloseTo(0.5);
    expect(wheelAnchor.y).toBeCloseTo(0.5);
  });

  it("computes anchor accurately using _fullLayout dynamic plot box when available", () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
      }),
      _fullLayout: {
        xaxis: { _offset: 80, _length: 640 },
        yaxis: { _offset: 40, _length: 480 },
      },
    } as unknown as HTMLElement;

    const pinch = new PinchZoomCoordinator({
      element: mockElement,
      onZoom: () => {},
    });

    // Center of plot box: x = 80 + 320 = 400. y = 40 + 240 = 280.
    const center = pinch.computeAnchor(400, 280);
    expect(center.x).toBeCloseTo(0.5);
    expect(center.y).toBeCloseTo(0.5);

    // Top-left of plot box: x = 80, y = 40. In Cartesian space, top is y=1, left is x=0.
    const topLeft = pinch.computeAnchor(80, 40);
    expect(topLeft.x).toBeCloseTo(0.0);
    expect(topLeft.y).toBeCloseTo(1.0);

    // Bottom-right of plot box: x = 720, y = 520. In Cartesian space, bottom is y=0, right is x=1.
    const bottomRight = pinch.computeAnchor(720, 520);
    expect(bottomRight.x).toBeCloseTo(1.0);
    expect(bottomRight.y).toBeCloseTo(0.0);
  });

  it("calls onPinchEnd callback when touches drop below 2", () => {
    let pinchEnded = false;
    const mockElement = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 400 }),
    } as unknown as HTMLElement;

    const pinch = new PinchZoomCoordinator({
      element: mockElement,
      onZoom: () => {},
      onPinchEnd: () => {
        pinchEnded = true;
      },
    });

    // Simulate 2 fingers start
    pinch.handleTouchStart({
      touches: [{ clientX: 100, clientY: 100 }, { clientX: 200, clientY: 200 }],
      cancelable: true,
      preventDefault: () => {},
    } as unknown as TouchEvent);

    // Simulate 1 finger left (touch end)
    pinch.handleTouchEnd({
      touches: [{ clientX: 100, clientY: 100 }],
    } as unknown as TouchEvent);

    expect(pinchEnded).toBe(true);
  });
});
