import { ArrowUpRight, FileUp, LockKeyhole } from "lucide-react";
interface Props {
  onUpload: () => void;
  onExample: () => void;
  loading: boolean;
}
export function UploadPanel({ onUpload, onExample, loading }: Props) {
  return (
    <div className="empty-workspace">
      <div className="empty-grid" aria-hidden="true">
        <div className="ghost-axis-x" />
        <div className="ghost-axis-y" />
      </div>
      <div className="upload-card">
        <div className="upload-icon">
          <FileUp size={25} strokeWidth={1.5} />
        </div>
        <span className="eyebrow">YOUR DATA, IN PERSPECTIVE</span>
        <h2>Explore your principal components</h2>
        <p>
          Drop a smartPCA <code>.evec</code> file here to see
          <br className="desktop-break" /> your samples in a new dimension.
        </p>
        <button className="primary large" onClick={onUpload} disabled={loading}>
          <FileUp size={16} />
          {loading ? "Reading file…" : "Open .evec file"}
        </button>
        <button className="text-button example-link" onClick={onExample}>
          Try an example dataset <ArrowUpRight size={14} />
        </button>
        <div className="privacy-note">
          <LockKeyhole size={12} /> Files stay on your device · Up to 50 MB
        </div>
      </div>
      <div className="empty-caption">
        <span>01 &nbsp; Upload eigenvectors</span>
        <span>02 &nbsp; Choose your axes</span>
        <span>03 &nbsp; Explore each sample</span>
      </div>
    </div>
  );
}
