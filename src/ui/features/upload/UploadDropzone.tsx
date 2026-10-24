import { ArrowUpRight, FileUp, Loader2, LockKeyhole } from "lucide-react";
import { createExample } from "../../../core/parsers/example";

export interface UploadDropzoneProps {
  onUpload: () => void;
  onExample: () => void;
  loading: boolean;
}
const example = createExample();

function ExamplePreview() {
  const ticks = [-0.06, -0.03, 0, 0.03, 0.06];
  const x = (value: number) => 48 + ((value + 0.09) / 0.18) * 430;
  const y = (value: number) => 270 - ((value + 0.07) / 0.14) * 240;
  const colors = new Map(example.populations.map((p) => [p.name, p.color]));
  return (
    <figure className="example-preview">
      <figcaption>
        <strong>A clearer view of your population structure</strong>
        <span>Synthetic example · 360 samples · 6 populations</span>
      </figcaption>
      <svg
        viewBox="0 0 520 310"
        role="img"
        aria-label="Scatter plot of the synthetic example dataset"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1="48" x2="478" y1={y(t)} y2={y(t)} stroke="#e1e8e1" />
            <text
              x="37"
              y={y(t) + 4}
              textAnchor="end"
              fill="#57685b"
              fontSize="10"
            >
              {t.toFixed(2)}
            </text>
            <line x1={x(t)} x2={x(t)} y1="30" y2="270" stroke="#e1e8e1" />
            <text
              x={x(t)}
              y="288"
              textAnchor="middle"
              fill="#57685b"
              fontSize="10"
            >
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        <path d="M48 30V270H478" fill="none" stroke="#6a7a6d" />
        {example.samples.map((s) => (
          <circle
            key={s.key}
            cx={x(s.pcs[0])}
            cy={y(s.pcs[1])}
            r="2.5"
            fill={colors.get(s.population)}
            opacity=".8"
          />
        ))}
        <text x="260" y="307" textAnchor="middle" fontSize="11" fill="#445b4b">
          PC1
        </text>
      </svg>
      <div className="example-key">
        {example.populations.map((p) => (
          <span key={p.name}>
            <i style={{ background: p.color }} />
            {p.name}
          </span>
        ))}
      </div>
    </figure>
  );
}

export function UploadDropzone({
  onUpload,
  onExample,
  loading,
}: UploadDropzoneProps) {
  return (
    <div className="empty-workspace">
      <section className="upload-intro">
        <h2>Explore your principal components</h2>
        <p>
          Bring your smartPCA results into focus. Inspect samples, refine your
          population styles, and prepare a figure you can share.
        </p>
        <div className="upload-drop-target">
          <FileUp size={28} strokeWidth={1.5} aria-hidden="true" />
          <strong>Drop your .evec file here</strong>
          <span>smartPCA / EIGENSOFT · up to 50 MB</span>
          <button className="primary" onClick={onUpload} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                Reading file…
              </>
            ) : (
              <>
                <FileUp size={16} />
                Open .evec file
              </>
            )}
          </button>
        </div>
        <button
          className="text-button example-link"
          onClick={onExample}
          disabled={loading}
        >
          Try an example dataset <ArrowUpRight size={16} />
        </button>
        <p className="privacy-note">
          <LockKeyhole size={14} aria-hidden="true" /> Files stay on your
          device. No account or upload required.
        </p>
      </section>
      <ExamplePreview />
    </div>
  );
}
