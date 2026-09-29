import React from "react";
import { Modal } from "../../primitives/Modal";

export interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title="Working with PCA Views"
      onClose={onClose}
      className="help-modal"
      width={680}
    >
      <div className="help-body">
        <p>
          Open a smartPCA <code>.evec</code> file, then choose any pair of
          principal components in the top toolbar to explore your population
          structure.
        </p>

        <pre>
          {`#eigvals: 12.4 8.6 4.2
Sample_01  0.012 -0.034 0.006 Group_A
Sample_02  0.025 -0.019 0.011 Group_B`}
        </pre>

        <p>
          The optional header line specifies eigenvalues. Each following row
          contains a sample ID, at least two PC coordinates, and a population
          label, separated by spaces or tabs.
        </p>

        <ul>
          <li>
            <strong>Navigate:</strong> Mouse wheel zooms centered at your
            cursor. Two-finger pinch-to-zoom is supported on trackpads and
            touchscreens. Click and drag to pan, or switch to box zoom mode in
            the toolbar. Click <em>Fit visible samples</em> to autoscale to
            filtered points, or <em>Reset axes</em> to fit the entire dataset.
          </li>
          <li>
            <strong>Legend:</strong> Click any population name to toggle its
            visibility. Right-click or use the three-dot button to customize its
            color, marker symbol, convex hull overlay, regression line, and
            centroid label.
          </li>
          <li>
            <strong>Points:</strong> Click any dot to toggle its red highlight
            boundary. Right-click to open the point inspector and customize its
            shape, size, color, or outline independently without modifying the
            underlying population style.
          </li>
          <li>
            <strong>Select:</strong> Use box or lasso selection modes to select
            multiple samples. Selected points can be marked simultaneously or
            exported to CSV.
          </li>
          <li>
            <strong>Plot Settings:</strong> Use the settings dialog to configure
            palettes, marker treatments (filled, hollow, mixed), label font
            sizes, aspect ratios, and explained variance calculations. Settings
            apply immediately and persist across tabs.
          </li>
          <li>
            <strong>Export:</strong> Export publication-ready high-resolution
            PNG images with customizable titles and legend positioning. Export
            filtered samples as formula-safe CSV, or download a single-file
            interactive HTML archive for offline sharing.
          </li>
        </ul>

        <p className="field-note">
          All data processing and rendering occurs securely inside your browser
          session. Files never leave your device.
        </p>
      </div>

      <div className="modal-footer">
        <button className="btn-done btn-primary" onClick={onClose}>
          Got it
        </button>
      </div>
    </Modal>
  );
}
