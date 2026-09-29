import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import type { Dataset, Sample } from "../../../core/models/dataset";
import type { ViewAction } from "../../../state/viewActions";
import type { ViewState } from "../../../state/viewState";
import {
  downloadText,
  samplesToCsv,
  samplesToEvec,
} from "../../../services/export/csvExport";
import { Modal } from "../../primitives/Modal";

export interface SampleTableDialogProps {
  dataset?: Dataset;
  samples?: Sample[];
  allSamples?: Sample[];
  x: number;
  y: number;
  selected: Sample | null;
  onSelect: (sample: Sample) => void;
  colors: Map<string, string>;
  state?: ViewState;
  dispatch?: React.Dispatch<ViewAction>;
  onClose: () => void;
}

const PAGE_SIZE = 50;

export function SampleTableDialog({
  dataset,
  samples,
  allSamples,
  x,
  y,
  selected,
  onSelect,
  colors,
  state,
  dispatch,
  onClose,
}: SampleTableDialogProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "plotted" | "excluded"
  >("all");
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [editPopValue, setEditPopValue] = useState("");

  const sampleList = useMemo(() => {
    return allSamples ?? dataset?.samples ?? samples ?? [];
  }, [allSamples, dataset, samples]);

  const excludedKeys = state?.excludedSamples ?? new Set<number>();
  const samplePops = state?.samplePopulations ?? new Map<number, string>();

  // Filtered samples by search query and plotted/excluded filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sampleList.filter((s) => {
      const isExcluded = excludedKeys.has(s.key);
      if (statusFilter === "plotted" && isExcluded) return false;
      if (statusFilter === "excluded" && !isExcluded) return false;

      if (!q) return true;
      const effectivePop = samplePops.get(s.key) ?? s.population;
      return (
        s.id.toLowerCase().includes(q) || effectivePop.toLowerCase().includes(q)
      );
    });
  }, [sampleList, search, statusFilter, excludedKeys, samplePops]);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, sampleList]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  const plottedCount = useMemo(() => {
    return sampleList.filter((s) => !excludedKeys.has(s.key)).length;
  }, [sampleList, excludedKeys]);

  const excludedCount = sampleList.length - plottedCount;

  // Export handlers
  const handleExportCsv = () => {
    const name = dataset?.name ?? "pca_samples";
    const pcCount = dataset?.pcCount ?? (sampleList[0]?.pcs.length || 2);
    const csv = samplesToCsv(sampleList, pcCount, {
      excludedKeys,
      samplePopulations: samplePops,
    });
    downloadText(csv, `${name.replace(/\.[^/.]+$/, "")}_modified.csv`);
  };

  const handleExportEvec = () => {
    const name = dataset?.name ?? "pca_samples";
    const eigenvalues = dataset?.eigenvalues ?? [];
    const evec = samplesToEvec(sampleList, eigenvalues, {
      excludedKeys,
      samplePopulations: samplePops,
    });
    downloadText(
      evec,
      `${name.replace(/\.[^/.]+$/, "")}_modified.evec`,
      "text/plain;charset=utf-8",
    );
  };

  const handleSavePop = (key: number) => {
    const trimmed = editPopValue.trim();
    if (trimmed && dispatch) {
      dispatch({
        type: "setSamplePopulation",
        key,
        population: trimmed,
      });
    }
    setEditingKey(null);
  };

  return (
    <Modal
      isOpen={true}
      title="Sample Table & Data Editor"
      onClose={onClose}
      className="table-modal"
      width={1160}
      maxWidth="min(96vw, 1180px)"
      noPadding={true}
    >
      <div className="table-dialog-container">
        {/* Header toolbar: Search, Status filters & Export buttons */}
        <div
          className="table-top-bar"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div
            className="table-search-bar search-field"
            style={{ flex: "1 1 220px" }}
          >
            <Search size={14} aria-hidden="true" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sample (IID) or group (FID)…"
              aria-label="Search sample table"
            />
          </div>

          <div
            className="table-filter-pills"
            style={{ display: "flex", gap: 4 }}
          >
            <button
              className={`button text-button ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
              style={{
                fontSize: 12,
                padding: "4px 8px",
                background: statusFilter === "all" ? "#e0e7ff" : "transparent",
                color: statusFilter === "all" ? "#3730a3" : "#4b5563",
                fontWeight: statusFilter === "all" ? 600 : 400,
                borderRadius: 6,
              }}
            >
              All ({sampleList.length})
            </button>
            <button
              className={`button text-button ${statusFilter === "plotted" ? "active" : ""}`}
              onClick={() => setStatusFilter("plotted")}
              style={{
                fontSize: 12,
                padding: "4px 8px",
                background:
                  statusFilter === "plotted" ? "#ecfdf5" : "transparent",
                color: statusFilter === "plotted" ? "#065f46" : "#4b5563",
                fontWeight: statusFilter === "plotted" ? 600 : 400,
                borderRadius: 6,
              }}
            >
              Plotted ({plottedCount})
            </button>
            <button
              className={`button text-button ${statusFilter === "excluded" ? "active" : ""}`}
              onClick={() => setStatusFilter("excluded")}
              style={{
                fontSize: 12,
                padding: "4px 8px",
                background:
                  statusFilter === "excluded" ? "#fef2f2" : "transparent",
                color: statusFilter === "excluded" ? "#991b1b" : "#4b5563",
                fontWeight: statusFilter === "excluded" ? 600 : 400,
                borderRadius: 6,
              }}
            >
              Excluded ({excludedCount})
            </button>
          </div>

          <div
            className="table-export-actions"
            style={{ display: "flex", gap: 6, marginLeft: "auto" }}
          >
            <button
              className="button"
              onClick={handleExportCsv}
              title="Export all samples with modified group IDs and _excluded suffixes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                padding: "4px 10px",
              }}
            >
              <Download size={13} /> Export CSV
            </button>
            <button
              className="button"
              onClick={handleExportEvec}
              title="Export in smartPCA .evec format with modified group IDs and _excluded suffixes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                padding: "4px 10px",
              }}
            >
              <Download size={13} /> Export .evec
            </button>
          </div>
        </div>

        {/* Scrollable table container */}
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Plot Status</th>
                <th>Sample ID (IID)</th>
                <th>Group ID (FID)</th>
                <th className="numeric">PC{x + 1}</th>
                <th className="numeric">PC{y + 1}</th>
                <th style={{ width: 80, textAlign: "center" }}>Mark</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((sample) => {
                const isExcluded = excludedKeys.has(sample.key);
                const currentPop =
                  samplePops.get(sample.key) ?? sample.population;
                const isCustomPop = samplePops.has(sample.key);
                const isEditing = editingKey === sample.key;
                const isMarked = Boolean(state?.points.get(sample.key)?.marked);

                return (
                  <tr
                    key={sample.key}
                    className={`${selected?.key === sample.key ? "selected-row" : ""} ${isExcluded ? "row-excluded" : ""}`}
                    style={
                      isExcluded ? { opacity: 0.65, background: "#fafafa" } : {}
                    }
                  >
                    {/* Plot Status & Toggle */}
                    <td>
                      <button
                        type="button"
                        className={`badge-toggle ${isExcluded ? "badge-excluded" : "badge-plotted"}`}
                        onClick={() => {
                          if (dispatch) {
                            dispatch({
                              type: "setSampleExcluded",
                              key: sample.key,
                              excluded: !isExcluded,
                            });
                          }
                        }}
                        aria-label={
                          isExcluded
                            ? `Plot ${sample.id}`
                            : `Unplot ${sample.id}`
                        }
                        title={
                          isExcluded
                            ? "Click to include in plot (recalculates convex hulls & centroids)"
                            : "Click to unplot (recalculates convex hulls & centroids)"
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 12,
                          border: `1px solid ${isExcluded ? "#fca5a5" : "#86efac"}`,
                          background: isExcluded ? "#fef2f2" : "#f0fdf4",
                          color: isExcluded ? "#991b1b" : "#166534",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        {isExcluded ? (
                          <>
                            <EyeOff size={11} /> Excluded
                          </>
                        ) : (
                          <>
                            <Eye size={11} /> Plotted
                          </>
                        )}
                      </button>
                    </td>

                    {/* Sample ID (IID) */}
                    <td>
                      <button
                        className="sample-link"
                        onClick={() => onSelect(sample)}
                        title="Click to inspect point on chart"
                        style={{ fontWeight: 600 }}
                      >
                        {sample.id}
                      </button>
                    </td>

                    {/* Group ID (FID) - Inline Editable */}
                    <td>
                      {isEditing ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="text"
                            value={editPopValue}
                            onChange={(e) => setEditPopValue(e.target.value)}
                            list="table-population-datalist"
                            placeholder="Group ID..."
                            autoFocus
                            aria-label={`Edit Group ID for ${sample.id}`}
                            style={{
                              fontSize: 12,
                              padding: "2px 6px",
                              borderRadius: 4,
                              border: "1px solid #6366f1",
                              width: 130,
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleSavePop(sample.key);
                              } else if (e.key === "Escape") {
                                setEditingKey(null);
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn-tiny"
                            onClick={() => handleSavePop(sample.key)}
                            title="Save Group ID"
                            style={{ padding: "2px 5px" }}
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn-tiny"
                            onClick={() => setEditingKey(null)}
                            title="Cancel"
                            style={{ padding: "2px 5px" }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            className="swatch"
                            style={{
                              background: colors.get(currentPop) ?? "#888",
                              display: "inline-block",
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              flexShrink: 0,
                            }}
                          />
                          <span
                            style={{
                              fontWeight: isCustomPop ? 600 : 400,
                              color: isCustomPop ? "#4338ca" : "inherit",
                            }}
                          >
                            {currentPop}
                          </span>
                          {isCustomPop && (
                            <span
                              style={{
                                fontSize: 10,
                                background: "#e0e7ff",
                                color: "#3730a3",
                                padding: "1px 4px",
                                borderRadius: 4,
                              }}
                            >
                              edited
                            </span>
                          )}
                          <button
                            type="button"
                            className="icon-button"
                            aria-label={`Edit population for ${sample.id}`}
                            title="Change group ID (FID)"
                            onClick={() => {
                              setEditPopValue(currentPop);
                              setEditingKey(sample.key);
                            }}
                            style={{
                              padding: 2,
                              marginLeft: 2,
                              height: 20,
                              width: 20,
                            }}
                          >
                            <Edit2 size={12} />
                          </button>
                          {isCustomPop && (
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Reset population for ${sample.id}`}
                              title={`Reset to original (${sample.population})`}
                              onClick={() => {
                                if (dispatch) {
                                  dispatch({
                                    type: "resetSamplePopulation",
                                    key: sample.key,
                                  });
                                }
                              }}
                              style={{ padding: 2, height: 20, width: 20 }}
                            >
                              <RotateCcw size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Principal Components */}
                    <td className="numeric">
                      {sample.pcs[x]?.toFixed(4) ?? "–"}
                    </td>
                    <td className="numeric">
                      {sample.pcs[y]?.toFixed(4) ?? "–"}
                    </td>

                    {/* Mark Red Boundary */}
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={isMarked}
                        aria-label={`Mark red boundary for ${sample.id}`}
                        title="Highlight sample with red boundary"
                        onChange={(e) => {
                          if (dispatch) {
                            dispatch({
                              type: "point",
                              key: sample.key,
                              patch: { marked: e.target.checked },
                            });
                          }
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pageRows.length === 0 && (
            <div className="table-empty">
              No samples match your search criteria.
            </div>
          )}
        </div>

        {/* Datalist for population auto-complete */}
        <datalist id="table-population-datalist">
          {(dataset?.populations ?? []).map((p) => (
            <option key={p.name} value={p.name} />
          ))}
          {(state?.populationNames ?? []).map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        {/* Pagination footer */}
        <div className="table-pagination">
          <span>
            {filtered.length.toLocaleString()} samples shown · {PAGE_SIZE} per
            page
          </span>
          <div className="pagination-controls">
            <button
              className="icon-button"
              aria-label="Previous page"
              disabled={currentPage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {currentPage + 1} / {totalPages}
            </span>
            <button
              className="icon-button"
              aria-label="Next page"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
