import type { ViewState } from "../domain/viewState";
import { axisTitle } from "../domain/metadata";
import { useState } from "react";
import { ChartScatter, CircleHelp, FileUp, Info, X } from "lucide-react";
import type { Dataset } from "../domain/types";
import { Popover, type Anchor } from "./Popover";
export function AppHeader({
  dataset,
  onUpload,
  onHelp,
  onClear,
  axes = [0, 1],
  state,
}: {
  dataset?: Dataset | null;
  onUpload: () => void;
  onHelp: () => void;
  onClear?: () => void;
  axes?: [number, number];
  state?: ViewState;
}) {
  const [details, setDetails] = useState<Anchor | null>(null);
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-icon">
          <ChartScatter size={17} />
        </span>
        <h1>PCA Views</h1>
      </div>
      {dataset ? (
        <div className="dataset-meta">
          <span className="header-divider" />
          <strong className="dataset-name" title={dataset.name}>
            {dataset.name}
          </strong>
          {dataset.example && <span className="example-badge">EXAMPLE</span>}
          <span className="meta-stat">
            {dataset.samples.length.toLocaleString()} samples
          </span>
          <span className="meta-stat">
            {dataset.populations.length} populations
          </span>
          <span className="meta-stat">{dataset.pcCount} PCs</span>
          {dataset.eigenvalues.length > 0 && (
            <span
              className="header-eigenvalues"
              title="Raw eigenvalues, not explained-variance percentages"
            >
              λ{axes[0] + 1} {dataset.eigenvalues[axes[0]]} <span>·</span> λ
              {axes[1] + 1} {dataset.eigenvalues[axes[1]]}
            </span>
          )}
          <button
            className={`icon-button ${dataset.warnings.length ? "has-warning" : ""}`}
            aria-label="Dataset information"
            title="Dataset information and eigenvalues"
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setDetails({ x: r.left, y: r.bottom + 8 });
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
        <button className="button open-file" onClick={onUpload}>
          <FileUp size={14} />
          Open .evec
        </button>
        {dataset && (
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
      {details && dataset && (
        <Popover
          title="Dataset information"
          anchor={details}
          onClose={() => setDetails(null)}
        >
          <div className="popover-body dataset-details">
            <strong>{dataset.name}</strong>
            <p>
              {dataset.samples.length} samples · {dataset.populations.length}{" "}
              populations · {dataset.pcCount} PCs
            </p>
            {dataset.example && <p>Synthetic demonstration data.</p>}
            <h3>Eigenvalues</h3>
            {dataset.eigenvalues.length ? (
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
                  {axisTitle(dataset, state, axes[0])} ·{" "}
                  {axisTitle(dataset, state, axes[1])}
                </span>
              )}
            </p>
            {state?.spectrumName && <p>Eigenvalues: {state.spectrumName}</p>}
            {dataset.warnings.map((w) => (
              <p className="data-warning" key={w}>
                {w}
              </p>
            ))}
            <p className="field-note">
              Processed in your browser. Source file remains unchanged.
            </p>
          </div>
        </Popover>
      )}
    </header>
  );
}
