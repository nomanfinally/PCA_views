import type React from "react";
import type { Dataset } from "../../../core/models/dataset";
import type { ViewAction } from "../../../state/viewActions";
import type { ViewState } from "../../../state/viewState";
export interface SettingsContext {
  dataset: Dataset;
  state: ViewState;
  dispatch: React.Dispatch<ViewAction>;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  spectrumError: string;
  setSpectrumError: React.Dispatch<React.SetStateAction<string>>;
}
