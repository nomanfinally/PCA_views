import { RotateCcw, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import type { Dataset } from "../../../core/models/dataset";
import type { ViewAction } from "../../../state/viewActions";
import type { ViewState } from "../../../state/viewState";
import { Modal } from "../../primitives/Modal";
import { ChartSettings } from "./ChartSettings";
import { GeometrySettings } from "./GeometrySettings";
import { HoverSettings } from "./HoverSettings";
import { LabelsSettings } from "./LabelsSettings";
import { LegendSettings } from "./LegendSettings";
import { MarkersSettings } from "./MarkersSettings";
import { VarianceSettings } from "./VarianceSettings";

export const settingsTabs = [
  "Chart",
  "Markers",
  "Labels",
  "Legend",
  "Hover",
  "Geometry",
  "Variance",
] as const;

export type SettingsTab = (typeof settingsTabs)[number];

export interface SettingsDialogProps {
  dataset: Dataset;
  state: ViewState;
  dispatch: React.Dispatch<ViewAction>;
  initialTab?: SettingsTab;
  focusTitle?: boolean;
  onClose: (lastTab?: SettingsTab) => void;
  onTabChange?: (tab: SettingsTab) => void;
  onReset: () => void;
}

export function SettingsDialog({
  dataset,
  state,
  dispatch,
  initialTab = "Chart",
  focusTitle,
  onClose,
  onTabChange,
  onReset,
}: SettingsDialogProps) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [spectrumError, setSpectrumError] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  const selectTab = (nextTab: SettingsTab) => {
    setTab(nextTab);
    onTabChange?.(nextTab);
  };

  useEffect(() => {
    if (focusTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    } else {
      document.getElementById(`settings-tab-${tab}`)?.focus();
    }
  }, [tab, focusTitle]);

  return (
    <Modal
      isOpen={true}
      title="Plot settings"
      onClose={() => onClose(tab)}
      className="settings-modal settings-dialog"
      width={880}
      maxWidth="min(95vw, 920px)"
      noPadding={true}
      closeLabel="Close settings"
    >
      <div className="settings-layout settings-container">
        {/* Tab Navigation List */}
        <div
          className="settings-tabs"
          role="tablist"
          aria-label="Settings sections"
          aria-orientation="vertical"
        >
          {settingsTabs.map((name, index) => (
            <button
              key={name}
              id={`settings-tab-${name}`}
              role="tab"
              aria-selected={tab === name}
              aria-controls={`settings-panel-${name}`}
              tabIndex={tab === name ? 0 : -1}
              className={`settings-tab-btn ${tab === name ? "active" : ""}`}
              onClick={(e) => {
                selectTab(name);
                e.currentTarget.focus();
              }}
              onKeyDown={(e) => {
                let next: number;
                if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  next = (index + 1) % settingsTabs.length;
                } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  next =
                    (index + settingsTabs.length - 1) % settingsTabs.length;
                } else if (e.key === "Home") {
                  next = 0;
                } else if (e.key === "End") {
                  next = settingsTabs.length - 1;
                } else {
                  return;
                }
                e.preventDefault();
                document
                  .getElementById(`settings-tab-${settingsTabs[next]}`)
                  ?.focus();
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        <div
          className="settings-panel display-tools"
          role="tabpanel"
          id={`settings-panel-${tab}`}
          aria-labelledby={`settings-tab-${tab}`}
          aria-label={tab}
        >
          {tab === "Chart" && (
            <ChartSettings
              context={{
                dataset,
                state,
                dispatch,
                titleInputRef,
                spectrumError,
                setSpectrumError,
              }}
            />
          )}

          {tab === "Markers" && (
            <MarkersSettings
              context={{
                dataset,
                state,
                dispatch,
                titleInputRef,
                spectrumError,
                setSpectrumError,
              }}
            />
          )}

          {tab === "Labels" && (
            <LabelsSettings
              context={{
                dataset,
                state,
                dispatch,
                titleInputRef,
                spectrumError,
                setSpectrumError,
              }}
            />
          )}

          {tab === "Legend" && (
            <LegendSettings
              context={{
                dataset,
                state,
                dispatch,
                titleInputRef,
                spectrumError,
                setSpectrumError,
              }}
            />
          )}

          {tab === "Hover" && (
            <HoverSettings
              context={{
                dataset,
                state,
                dispatch,
                titleInputRef,
                spectrumError,
                setSpectrumError,
              }}
            />
          )}

          {tab === "Geometry" && (
            <GeometrySettings
              context={{
                dataset,
                state,
                dispatch,
                titleInputRef,
                spectrumError,
                setSpectrumError,
              }}
            />
          )}

          {tab === "Variance" && (
            <VarianceSettings
              context={{
                dataset,
                state,
                dispatch,
                titleInputRef,
                spectrumError,
                setSpectrumError,
              }}
            />
          )}
        </div>
      </div>

      <div className="settings-footer modal-footer">
        <button
          className="button"
          onClick={() => dispatch({ type: "clearMarks" })}
        >
          <X size={13} /> Clear marks
        </button>
        <button
          className="button"
          onClick={() => dispatch({ type: "resetAppearance" })}
        >
          <RotateCcw size={13} /> Reset styles
        </button>
        <button
          className="button"
          title="Restore default styles, visibility, axes, zoom and label positions"
          onClick={onReset}
        >
          Reset to defaults
        </button>
        <button className="button settings-done" onClick={() => onClose(tab)}>
          Done
        </button>
      </div>
    </Modal>
  );
}
