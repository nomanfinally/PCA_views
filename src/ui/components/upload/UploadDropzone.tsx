import React from "react";
import { ArrowUpRight, FileUp, Loader2, LockKeyhole } from "lucide-react";

export interface UploadDropzoneProps {
  onUpload: () => void;
  onExample: () => void;
  loading: boolean;
}

export function UploadDropzone({
  onUpload,
  onExample,
  loading,
}: UploadDropzoneProps) {
  return (
    <div className="empty-workspace">
      {/* Decorative background grid */}
      <div className="empty-grid" aria-hidden="true">
        <div className="ghost-axis-x" />
        <div className="ghost-axis-y" />
      </div>

      <div className="upload-card">
        <div className="upload-icon" aria-hidden="true">
          <FileUp size={28} strokeWidth={1.5} />
        </div>

        <span className="eyebrow">YOUR DATA, IN PERSPECTIVE</span>
        <h2>Explore your principal components</h2>
        <p>
          Drop a smartPCA <code>.evec</code> file here to see
          <br className="desktop-break" /> your samples in a new dimension.
        </p>

        <button
          className="btn-primary primary large"
          onClick={onUpload}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="spin" /> Reading file…
            </>
          ) : (
            <>
              <FileUp size={16} /> Open .evec file
            </>
          )}
        </button>

        <button
          className="text-button example-link"
          onClick={onExample}
          disabled={loading}
        >
          Try an example dataset <ArrowUpRight size={14} />
        </button>

        <div className="privacy-note">
          <LockKeyhole size={12} aria-hidden="true" />
          <span>Files stay on your device · Up to 50 MB</span>
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
