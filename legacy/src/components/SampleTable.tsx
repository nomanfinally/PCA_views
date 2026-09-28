import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { Sample } from "../domain/types";
interface Props {
  samples: Sample[];
  x: number;
  y: number;
  selected: Sample | null;
  onSelect: (sample: Sample) => void;
  colors: Map<string, string>;
}
export function SampleTable({
  samples,
  x,
  y,
  selected,
  onSelect,
  colors,
}: Props) {
  const [page, setPage] = useState(0);
  useEffect(() => setPage(0), [samples]);
  const pages = Math.max(1, Math.ceil(samples.length / 50));
  const current = Math.min(page, pages - 1);
  return (
    <div className="table-view">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Sample ID</th>
              <th>Population</th>
              <th className="numeric">PC{x + 1}</th>
              <th className="numeric">PC{y + 1}</th>
            </tr>
          </thead>
          <tbody>
            {samples.slice(current * 50, current * 50 + 50).map((sample) => (
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
                    style={{ background: colors.get(sample.population) }}
                  />
                  {sample.population}
                </td>
                <td className="numeric">{sample.pcs[x]}</td>
                <td className="numeric">{sample.pcs[y]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!samples.length && (
          <div className="table-empty">
            No matching samples. Adjust your filters.
          </div>
        )}
      </div>
      <div className="pagination">
        <span>{samples.length.toLocaleString()} samples · 50 per page</span>
        <div>
          <button
            className="icon-button"
            aria-label="Previous page"
            disabled={!current}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            {current + 1} / {pages}
          </span>
          <button
            className="icon-button"
            aria-label="Next page"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
