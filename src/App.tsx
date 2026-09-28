import React, { useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { useDataset } from "./hooks/useDataset";
import { AppHeader } from "./ui/components/header/AppHeader";
import { UploadDropzone } from "./ui/components/upload/UploadDropzone";
import { Workspace } from "./ui/components/workspace/Workspace";
import { HelpModal } from "./ui/components/dialogs/HelpModal";

export default function App() {
  const source = useDataset();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const openFilePicker = () => inputRef.current?.click();

  return (
    <div
      className="app-shell"
      onDragEnter={(e) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes("Files")) {
          dragDepthRef.current++;
          setIsDragging(true);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        if (--dragDepthRef.current <= 0) {
          dragDepthRef.current = 0;
          setIsDragging(false);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepthRef.current = 0;
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) source.load(file);
      }}
    >
      <input
        className="visually-hidden"
        ref={inputRef}
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
          key={`${source.revision}:${String(source.dataset.example)}`}
          dataset={source.dataset}
          onUpload={openFilePicker}
          onClear={source.clear}
          onHelp={() => setHelpOpen(true)}
        />
      ) : (
        <>
          <AppHeader
            onUpload={openFilePicker}
            onHelp={() => setHelpOpen(true)}
          />
          <main className="empty-surface">
            <UploadDropzone
              onUpload={openFilePicker}
              onExample={source.example}
              loading={source.loading}
            />
          </main>
          <footer className="statusbar" role="contentinfo">
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

      {isDragging && (
        <div className="drop-overlay">
          <FileUp size={36} />
          <h2>Drop your .evec file to explore</h2>
        </div>
      )}

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
