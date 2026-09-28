import { useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { useDataset } from "./hooks/useDataset";
import { UploadPanel } from "./components/UploadPanel";
import { Workspace } from "./components/Workspace";
import { AppHeader } from "./components/AppHeader";
export default function App() {
  const source = useDataset();
  const input = useRef<HTMLInputElement>(null),
    depth = useRef(0);
  const [dragging, setDragging] = useState(false),
    [help, setHelp] = useState(false);
  const open = () => input.current?.click();
  return (
    <div
      className="app-shell"
      onDragEnter={(e) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes("Files")) {
          depth.current++;
          setDragging(true);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        if (--depth.current <= 0) {
          depth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        if (e.dataTransfer.files[0]) source.load(e.dataTransfer.files[0]);
      }}
    >
      <input
        className="visually-hidden"
        ref={input}
        data-testid="file-input"
        type="file"
        accept=".evec"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) source.load(file);
          e.target.value = "";
        }}
      />
      {source.dataset ? (
        <Workspace
          key={source.revision + ":" + String(source.dataset.example)}
          dataset={source.dataset}
          onUpload={open}
          onClear={source.clear}
          onHelp={() => setHelp(true)}
        />
      ) : (
        <>
          <AppHeader onUpload={open} onHelp={() => setHelp(true)} />
          <main className="empty-surface">
            <UploadPanel
              onUpload={open}
              onExample={source.example}
              loading={source.loading}
            />
          </main>
          <footer className="statusbar">
            <span>smartPCA / EIGENSOFT</span>
            <span>Files stay on your device</span>
          </footer>
        </>
      )}
      {source.error && (
        <div className="file-notice alert" role="alert">
          <span>{source.error}</span>
          <button
            className="icon-button"
            aria-label="Dismiss error"
            onClick={source.dismissError}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {source.loading && (
        <div className="file-notice" role="status">
          Reading eigenvectors…
        </div>
      )}
      {dragging && (
        <div className="drop-overlay">
          <FileUp size={36} />
          <h2>Drop your .evec file to explore</h2>
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <section
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Working with PCA Views"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setHelp(false);
            }}
          >
            <div className="modal-header">
              <h2>Working with PCA Views</h2>
              <button
                autoFocus
                className="icon-button"
                aria-label="Close help"
                onClick={() => setHelp(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="help-body">
              <p>
                Open a smartPCA <code>.evec</code> file, then choose any pair of
                PCs in the top toolbar.
              </p>
              <pre>
                {
                  "#eigvals: 12.4 8.6 4.2\nSample_01  0.012 -0.034 0.006 Group_A\nSample_02  0.025 -0.019 0.011 Group_B"
                }
              </pre>
              <p>
                The optional header contains eigenvalues. Each row has an ID, at
                least two coordinates, and a population label, separated by
                spaces or tabs. Files up to 50 MB are supported.
              </p>
              <ul>
                <li>
                  <strong>Navigate:</strong> mouse wheel zooms at the cursor.
                  Drag to pan, or choose box zoom. Fit visible samples
                  autoscales filtered points; Reset axes fits the whole dataset.
                </li>
                <li>
                  <strong>Legend:</strong> click a population to hide or show
                  it. Hidden entries stay in the legend. Right-click, or use the
                  three-dot button, to edit its color, marker, convex hull,
                  regression, and label. Toggle the legend beside sample search;
                  its settings button opens the Legend tab for position and
                  columns.
                </li>
                <li>
                  <strong>Points:</strong> click a dot to toggle its red
                  boundary. Right-click to edit its shape, size, fill, and
                  boundary without changing its mark. Sample changes apply only
                  to that row, including duplicate IDs.
                </li>
                <li>
                  <strong>Select:</strong> use box or lasso selection, then mark
                  the selection or export its coordinates. Selection does not
                  hide other points.
                </li>
                <li>
                  <strong>Plot settings:</strong> use the tabs for markers,
                  labels, hover, chart layout, legend, geometry, and variance.
                  Settings apply immediately. Drag population labels by their
                  text.
                </li>
                <li>
                  <strong>Hover:</strong> IID is the sample ID; FID is the
                  population/group label from the same .evec file. Choose
                  either, both, PC coordinates, or a custom combination in the
                  Hover tab.
                </li>
                <li>
                  <strong>Export:</strong> arrange headings and the legend
                  around an unchanged chart in the live PNG preview. Download
                  filtered samples as CSV, or save one interactive HTML file
                  with all data, styles, and zoom for offline sharing.
                </li>
              </ul>
              <p className="field-note">
                Hull and regression overlays follow the current filters and
                axes. Hulls require at least three non-collinear points; two
                distinct points get a connecting line. Y-on-x regression
                requires variation in x. Data and styling stay in this browser
                session and clear on reload. The example is synthetic.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
