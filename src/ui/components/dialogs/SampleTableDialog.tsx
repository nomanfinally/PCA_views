import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { Sample } from "../../../core/models/dataset";
import { Modal } from "../../primitives/Modal";

export interface SampleTableDialogProps {
  samples: Sample[];
  x: number;
  y: number;
  selected: Sample | null;
  onSelect: (sample: Sample) => void;
  colors: Map<string, string>;
  onClose: () => void;
}

const PAGE_SIZE = 50;

export function SampleTableDialog({
  samples,
  x,
  y,
  selected,
  onSelect,
  colors,
  onClose,
}: SampleTableDialogProps) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return samples;
    return samples.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.population.toLowerCase().includes(q),
    );
  }, [samples, search]);

  useEffect(() => {
    setPage(0);
  }, [search, samples]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  return (
    <Modal
      isOpen={true}
      title="Sample Table"
      onClose={onClose}
      className="table-modal"
      width={760}
    >
      <div className="table-dialog-container">
        {/* Search header */}
        <div className="table-search-bar search-field">
          <Search size={14} aria-hidden="true" />
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search samples or populations…"
            aria-label="Search sample table"
          />
        </div>

        {/* Scrollable table container */}
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sample ID</th>
                <th>Population</th>
                <th className="numeric">PC{x + 1}</th>
                <th className="numeric">PC{y + 1}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((sample) => (
                <tr
                  key={sample.key}
                  className={selected?.key === sample.key ? "selected-row" : ""}
                >
                  <td>
                    <button
                      className="sample-link"
                      onClick={() => onSelect(sample)}
                    >
                      {sample.id}
                    </button>
                  </td>
                  <td>
                    <span
                      className="swatch"
                      style={{
                        background: colors.get(sample.population) ?? "#888",
                        display: "inline-block",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        marginRight: 6,
                        verticalAlign: "middle",
                      }}
                    />
                    {sample.population}
                  </td>
                  <td className="numeric">{sample.pcs[x]?.toFixed(4) ?? "–"}</td>
                  <td className="numeric">{sample.pcs[y]?.toFixed(4) ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {pageRows.length === 0 && (
            <div className="table-empty">
              No samples match your search criteria.
            </div>
          )}
        </div>

        {/* Pagination footer */}
        <div className="table-pagination">
          <span>
            {filtered.length.toLocaleString()} samples · {PAGE_SIZE} per page
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
