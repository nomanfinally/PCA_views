import React, { useState } from "react";
import { ChartScatter, CircleHelp, FileUp, Info, X } from "lucide-react";
import type { Dataset } from "../../../core/models/dataset";
import type { ViewState } from "../../../state/viewState";
import { selectAxisVariance } from "../../../state/viewSelectors";
import { Popover, type Anchor } from "../../primitives/Popover";

export interface AppHeaderProps {
  dataset?: Dataset | null;
  onUpload: () => void;
  onHelp: () => void;
  onClear?: () => void;
  axes?: [number, number];
  state?: ViewState;
}

export function AppHeader({
  dataset,
  onUpload,
  onHelp,
  onClear,
  axes = [0, 1],
  state,
}: AppHeaderProps) {
  const [detailsAnchor, setDetailsAnchor] = useState<Anchor | null>(null);

  const getAxisLabel = (pcIndex: number) => {
    if (!dataset || !state) return `PC${pcIndex + 1}`;
    const variance = selectAxisVariance(dataset, state, pcIndex);
    return variance != null
      ? `PC${pcIndex + 1} (${variance.toFixed(1)}%)`
      : `PC${pcIndex + 1}`;
  };

  return (
    <header className="topbar" role="banner">
      <div className="brand">
        <span className="brand-icon" aria-hidden="true">
          <ChartScatter size={17} />
        </span>
        <h1>PCA Views</h1>
      </div>

      {dataset ? (
        <div className="dataset-meta">
          <span className="header-divider" aria-hidden="true" />
          <strong className="dataset-name" title={dataset.name}>
            {dataset.name}
          </strong>
          {dataset.example && <span className="example-badge">EXAMPLE</span>}
          <span className="meta-stat meta-samples">
            {dataset.samples.length.toLocaleString()} samples
          </span>
          <span className="meta-stat meta-secondary">
            {dataset.populations.length} populations
          </span>
          <span className="meta-stat meta-secondary">
            {dataset.pcCount} PCs
          </span>
          {dataset.eigenvalues.length > 0 && (
            <span
              className="header-eigenvalues"
              title="Raw eigenvalues from .evec header"
            >
              λ{axes[0] + 1} {dataset.eigenvalues[axes[0]] ?? "–"}{" "}
              <span aria-hidden="true">·</span> λ{axes[1] + 1}{" "}
              {dataset.eigenvalues[axes[1]] ?? "–"}
            </span>
          )}
          <button
            className={`icon-button ${dataset.warnings.length ? "has-warning" : ""}`}
            aria-label="Dataset information"
            title="Dataset information and eigenvalues"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setDetailsAnchor({ x: r.left, y: r.bottom + 8 });
            }}
          >
            <Info size={14} />
          </button>
        </div>
      ) : (
        <span className="empty-header-label">
          smartPCA eigenvector explorer
        </span>
      )}

      <div className="header-actions">
        <button
          className="button open-file"
          onClick={onUpload}
          title="Open smartPCA .evec file"
        >
          <FileUp size={14} />
          <span className="open-label-full">Open .evec</span>
          <span className="open-label-short">Open</span>
        </button>
        {dataset && onClear && (
          <button
            className="icon-button"
            aria-label="Remove dataset"
            title="Remove dataset"
            onClick={onClear}
          >
            <X size={15} />
          </button>
        )}
        <button
          className="icon-button"
          aria-label="How to use PCA Views"
          title="Help"
          onClick={onHelp}
        >
          <CircleHelp size={16} />
        </button>
      </div>

      {detailsAnchor && dataset && (
        <Popover
          title="Dataset information"
          anchor={detailsAnchor}
          onClose={() => setDetailsAnchor(null)}
        >
          <div className="popover-body dataset-details">
            <strong>{dataset.name}</strong>
            <p>
              {dataset.samples.length.toLocaleString()} samples ·{" "}
              {dataset.populations.length} populations · {dataset.pcCount} PCs
            </p>
            {dataset.example && <p>Synthetic demonstration data.</p>}

            <h3>Eigenvalues</h3>
            {dataset.eigenvalues.length > 0 ? (
              <div className="eigenvalue-list">
                {dataset.eigenvalues.map((v, i) => (
                  <div key={i}>
                    <span>PC{i + 1}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No eigenvalue header in this file.</p>
            )}

            <p className="field-note">
              Axis percentages use the loaded eigenvalues unless you supply a
              total variance in Plot settings → Variance.
              {state && (
                <span>
                  {" "}
                  Current: {getAxisLabel(axes[0])} · {getAxisLabel(axes[1])}
                </span>
              )}
            </p>

            {state?.spectrumName && (
              <p>Custom eigenvalues loaded: {state.spectrumName}</p>
            )}

            {dataset.warnings.map((w, idx) => (
              <p className="data-warning" key={idx}>
                {w}
              </p>
            ))}

            <p className="field-note">
              Processed locally in your browser. Source file remains unchanged.
            </p>
          </div>
        </Popover>
      )}
    </header>
  );
}
